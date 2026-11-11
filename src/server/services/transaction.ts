import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { TenantContext } from "@/server/api/context";

export async function tenantTransaction<T>(
  ctx: TenantContext,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  try {
    return await ctx.db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL ROLE emprestai_app`;
        await tx.$queryRaw`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true), set_config('app.user_id', ${ctx.user.id}, true), set_config('app.role', ${ctx.role}, true)`;
        return work(tx);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5000, timeout: 10000 },
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code))
      throw new TRPCError({ code: "CONFLICT" });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  }
}
export async function lockMembership(tx: Prisma.TransactionClient, tenantId: string, userId: string) {
  const rows = await tx.$queryRaw<
    Array<{ user_id: string }>
  >`SELECT user_id FROM memberships WHERE tenant_id = ${tenantId}::uuid AND user_id = ${userId}::uuid FOR UPDATE`;
  if (!rows.length) throw new TRPCError({ code: "FORBIDDEN" });
}
export async function lockEquipment(tx: Prisma.TransactionClient, tenantId: string, id: string) {
  const rows = await tx.$queryRaw<
    Array<{ id: string }>
  >`SELECT id FROM equipment WHERE tenant_id = ${tenantId}::uuid AND id = ${id}::uuid FOR UPDATE`;
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
}
export async function audit(
  tx: Prisma.TransactionClient,
  ctx: TenantContext,
  action: string,
  resourceId: string,
) {
  await tx.auditEvent.create({ data: { tenantId: ctx.tenantId, actorId: ctx.user.id, action, resourceId } });
}
