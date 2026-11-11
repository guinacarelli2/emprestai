import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import type { TenantContext } from "@/server/api/context";
import { equipmentCreateSchema, equipmentListSchema } from "@/server/api/schemas";
import { audit, tenantTransaction } from "./transaction";
import { decodeCursor, page } from "./pagination";
import { equipmentDto, loanDto } from "./presentation";
import { addCalendarDays, localToday } from "./dates";
import { equipmentOccupancy } from "./occupancy";

export async function listEquipment(ctx: TenantContext, input: z.infer<typeof equipmentListSchema>) {
  return tenantTransaction(ctx, async (tx) => {
    const base = Prisma.sql`e.tenant_id = ${ctx.tenantId}::uuid
      ${input.category ? Prisma.sql`AND e.categoria::text = ${input.category}` : Prisma.empty}
      ${input.search ? Prisma.sql`AND (strpos(lower(e.nome), lower(${input.search})) > 0 OR strpos(lower(e.patrimonio), lower(${input.search})) > 0)` : Prisma.empty}`;
    const cursor = decodeCursor(input.cursor);
    const [selected, counts] = await Promise.all([
      tx.$queryRaw<Array<{ id: string; createdAt: Date; occupied: boolean }>>(Prisma.sql`
        SELECT e.id, e.created_at AS "createdAt", public.equipment_has_open_loan(e.id) AS occupied
        FROM public.equipment e WHERE ${base}
        ${input.onlyAvailable ? Prisma.sql`AND e.situacao = 'disponivel' AND NOT public.equipment_has_open_loan(e.id)` : Prisma.empty}
        ${cursor ? Prisma.sql`AND (e.created_at < ${cursor.at} OR (e.created_at = ${cursor.at} AND e.id < ${cursor.id}::uuid))` : Prisma.empty}
        ORDER BY e.created_at DESC, e.id DESC LIMIT ${input.limit + 1}`),
      tx.$queryRaw<Array<{ total: number; available: number }>>(Prisma.sql`
        SELECT count(*)::int AS total,
          count(*) FILTER (WHERE e.situacao = 'disponivel' AND NOT public.equipment_has_open_loan(e.id))::int AS available
        FROM public.equipment e WHERE ${base}`),
    ]);
    const result = page(selected, input.limit, (item) => item.createdAt);
    const rows = await tx.equipment.findMany({
      where: { tenantId: ctx.tenantId, id: { in: result.items.map((item) => item.id) } },
    });
    const byId = new Map(rows.map((item) => [item.id, item]));
    return {
      items: result.items.map((item) => {
        const equipment = byId.get(item.id);
        if (!equipment) throw new TRPCError({ code: "CONFLICT" });
        return equipmentDto(equipment, item.occupied);
      }),
      total: counts[0].total,
      available: counts[0].available,
      nextCursor: result.nextCursor,
    };
  });
}
export async function getEquipment(ctx: TenantContext, patrimonio: string) {
  return tenantTransaction(ctx, async (tx) => {
    const equipment = await tx.equipment.findUnique({
      where: { tenantId_patrimonio: { tenantId: ctx.tenantId, patrimonio } },
    });
    if (!equipment) throw new TRPCError({ code: "NOT_FOUND" });
    const occupied = await equipmentOccupancy(tx, ctx.tenantId, [equipment.id]);
    const history = await tx.loan.findMany({
      where: { tenantId: ctx.tenantId, equipmentId: equipment.id, borrowerId: ctx.user.id },
      include: { equipment: true },
      orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
      take: 3,
    });
    return {
      ...equipmentDto(equipment, occupied.get(equipment.id)),
      history: history.map((loan) => loanDto(loan)),
      dueDate: addCalendarDays(localToday(), 14),
    };
  });
}
export async function recentEquipment(ctx: TenantContext) {
  return tenantTransaction(ctx, async (tx) => {
    const rows = await tx.equipment.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 3,
    });
    const occupied = await equipmentOccupancy(
      tx,
      ctx.tenantId,
      rows.map((item) => item.id),
    );
    return rows.map((item) => equipmentDto(item, occupied.get(item.id)));
  });
}
export async function createEquipment(ctx: TenantContext, input: z.infer<typeof equipmentCreateSchema>) {
  if (ctx.role !== "operacoes") throw new TRPCError({ code: "FORBIDDEN" });
  try {
    return await tenantTransaction(ctx, async (tx) => {
      const item = await tx.equipment.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          numeroSerie: input.numeroSerie || null,
          observacoes: input.observacoes || null,
        },
      });
      await audit(tx, ctx, "equipment.create", item.id);
      return equipmentDto(item);
    });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "CONFLICT")
      throw new TRPCError({ code: "CONFLICT", message: "Patrimônio já cadastrado" });
    throw error;
  }
}
