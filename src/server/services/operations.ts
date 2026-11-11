import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import type { TenantContext } from "@/server/api/context";
import { operationsListSchema } from "@/server/api/schemas";
import { tenantTransaction } from "./transaction";
import { addCalendarDays, asDbDate, endOfWeek, localToday } from "./dates";
import { decodeCursor, page } from "./pagination";
import { loanDto } from "./presentation";

export async function listOperations(ctx: TenantContext, input: z.infer<typeof operationsListSchema>) {
  if (ctx.role !== "operacoes") throw new TRPCError({ code: "FORBIDDEN" });
  return tenantTransaction(ctx, async (tx) => {
    const today = localToday();
    const cursor = decodeCursor(input.cursor);
    const where: Prisma.LoanWhereInput = {
      tenantId: ctx.tenantId,
      returnedAt: null,
      AND: [
        ...(input.filter === "late" ? [{ dueDate: { lt: asDbDate(today) } }] : []),
        ...(input.filter === "soon"
          ? [{ dueDate: { gte: asDbDate(today), lte: asDbDate(endOfWeek(today)) } }]
          : []),
        ...(input.category ? [{ equipment: { tenantId: ctx.tenantId, categoria: input.category } }] : []),
        ...(input.search
          ? [
              {
                OR: [
                  {
                    equipment: {
                      tenantId: ctx.tenantId,
                      nome: { contains: input.search, mode: "insensitive" as const },
                    },
                  },
                  {
                    equipment: {
                      tenantId: ctx.tenantId,
                      patrimonio: { contains: input.search, mode: "insensitive" as const },
                    },
                  },
                  {
                    borrower: {
                      tenantId: ctx.tenantId,
                      displayName: { contains: input.search, mode: "insensitive" as const },
                    },
                  },
                ],
              },
            ]
          : []),
        ...(cursor
          ? [{ OR: [{ requestedAt: { lt: cursor.at } }, { requestedAt: cursor.at, id: { lt: cursor.id } }] }]
          : []),
      ],
    };
    const rows = await tx.loan.findMany({
      where,
      include: { equipment: true, borrower: { select: { userId: true, displayName: true } } },
      orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
      take: input.limit + 1,
    });
    const result = page(rows, input.limit, (loan) => loan.requestedAt);
    return {
      items: result.items.map((loan) => ({
        ...loanDto(loan, today),
        borrower: {
          id: loan.borrower.userId,
          name: loan.borrower.displayName,
          displayName: loan.borrower.displayName,
        },
      })),
      nextCursor: result.nextCursor,
    };
  });
}
export async function operationsStats(ctx: TenantContext) {
  if (ctx.role !== "operacoes") throw new TRPCError({ code: "FORBIDDEN" });
  return tenantTransaction(ctx, async (tx) => {
    const today = localToday();
    const base = { tenantId: ctx.tenantId, returnedAt: null };
    const [open, late, dueSoon, maintenance] = await Promise.all([
      tx.loan.count({ where: base }),
      tx.loan.count({ where: { ...base, dueDate: { lt: asDbDate(today) } } }),
      tx.loan.count({
        where: { ...base, dueDate: { gte: asDbDate(today), lte: asDbDate(addCalendarDays(today, 3)) } },
      }),
      tx.equipment.count({ where: { tenantId: ctx.tenantId, situacao: "manutencao" } }),
    ]);
    return { open, late, dueSoon, maintenance };
  });
}
