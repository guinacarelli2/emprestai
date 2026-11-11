import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import type { TenantContext } from "@/server/api/context";
import { loansMineSchema } from "@/server/api/schemas";
import { audit, lockEquipment, lockMembership, tenantTransaction } from "./transaction";
import { addCalendarDays, asDbDate, isOverdue, localToday } from "./dates";
import { decodeCursor, page } from "./pagination";
import { loanDto } from "./presentation";
import { equipmentOccupancy } from "./occupancy";

export function validateEligibility(
  open: Array<{ dueDate: Date; returnedAt: Date | null }>,
  situation: string,
  occupied: boolean,
  today: string,
) {
  if (open.some((loan) => isOverdue(loan.dueDate, loan.returnedAt, today)))
    throw new TRPCError({ code: "FORBIDDEN", message: "Você tem empréstimo em atraso" });
  if (open.length >= 3)
    throw new TRPCError({ code: "FORBIDDEN", message: "Limite de três empréstimos atingido" });
  if (situation === "manutencao")
    throw new TRPCError({ code: "CONFLICT", message: "Equipamento em manutenção" });
  if (situation === "fora_de_uso")
    throw new TRPCError({ code: "CONFLICT", message: "Equipamento fora de uso" });
  if (situation !== "disponivel" || occupied)
    throw new TRPCError({ code: "CONFLICT", message: "Equipamento já emprestado" });
}
export async function mine(ctx: TenantContext, input: z.infer<typeof loansMineSchema>) {
  return tenantTransaction(ctx, async (tx) => {
    const cursor = decodeCursor(input.cursor);
    const where: Prisma.LoanWhereInput = {
      tenantId: ctx.tenantId,
      borrowerId: ctx.user.id,
      returnedAt: input.history ? { not: null } : null,
      ...(cursor
        ? { OR: [{ requestedAt: { lt: cursor.at } }, { requestedAt: cursor.at, id: { lt: cursor.id } }] }
        : {}),
    };
    const rows = await tx.loan.findMany({
      where,
      include: { equipment: true },
      orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
      take: input.limit + 1,
    });
    const result = page(rows, input.limit, (loan) => loan.requestedAt);
    const today = localToday();
    return { items: result.items.map((loan) => loanDto(loan, today)), nextCursor: result.nextCursor };
  });
}
export async function requestLoan(ctx: TenantContext, equipmentId: string) {
  return tenantTransaction(ctx, async (tx) => {
    await lockMembership(tx, ctx.tenantId, ctx.user.id);
    await lockEquipment(tx, ctx.tenantId, equipmentId);
    const [equipment, open, occupied] = await Promise.all([
      tx.equipment.findUnique({ where: { tenantId_id: { tenantId: ctx.tenantId, id: equipmentId } } }),
      tx.loan.findMany({ where: { tenantId: ctx.tenantId, borrowerId: ctx.user.id, returnedAt: null } }),
      equipmentOccupancy(tx, ctx.tenantId, [equipmentId]),
    ]);
    if (!equipment) throw new TRPCError({ code: "NOT_FOUND" });
    const now = new Date();
    const today = localToday(now);
    validateEligibility(open, equipment.situacao, occupied.get(equipmentId) === true, today);
    const loan = await tx.loan.create({
      data: {
        tenantId: ctx.tenantId,
        equipmentId,
        borrowerId: ctx.user.id,
        requestedAt: now,
        dueDate: asDbDate(addCalendarDays(today, 14)),
      },
      include: { equipment: true },
    });
    await audit(tx, ctx, "loans.request", loan.id);
    return loanDto(loan, today);
  });
}
export async function returnLoan(ctx: TenantContext, loanId: string) {
  return tenantTransaction(ctx, async (tx) => {
    const where: Prisma.LoanWhereInput = {
      tenantId: ctx.tenantId,
      id: loanId,
      ...(ctx.role !== "operacoes" ? { borrowerId: ctx.user.id } : {}),
    };
    const initial = await tx.loan.findFirst({ where });
    if (!initial) throw new TRPCError({ code: "NOT_FOUND" });
    await lockMembership(tx, ctx.tenantId, initial.borrowerId);
    await lockEquipment(tx, ctx.tenantId, initial.equipmentId);
    const current = await tx.loan.findFirst({ where, include: { equipment: true } });
    if (!current) throw new TRPCError({ code: "NOT_FOUND" });
    if (current.returnedAt) return { ...loanDto(current), alreadyReturned: true };
    const loan = await tx.loan.update({
      where: { tenantId_id: { tenantId: ctx.tenantId, id: loanId } },
      data: { returnedAt: new Date(), returnedBy: ctx.user.id },
      include: { equipment: true },
    });
    await audit(tx, ctx, "loans.return", loan.id);
    return { ...loanDto(loan), alreadyReturned: false };
  });
}
