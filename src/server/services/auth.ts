import { TRPCError } from "@trpc/server";
import type { Context, TenantContext } from "@/server/api/context";
import { resolveIdentity } from "@/server/api/context";
import { clearAuthCookies } from "@/lib/auth/server";
import { consumeLoginLimit } from "./rate-limit";
import { tenantTransaction } from "./transaction";
import { addCalendarDays, isOverdue, localToday } from "./dates";

export async function me(ctx: TenantContext) {
  return tenantTransaction(ctx, async (tx) => {
    const loans = await tx.loan.findMany({
      where: { tenantId: ctx.tenantId, borrowerId: ctx.user.id, returnedAt: null },
      select: { dueDate: true, returnedAt: true },
    });
    const today = localToday();
    return {
      user: ctx.user,
      role: ctx.role,
      tenantId: ctx.tenantId,
      openCount: loans.length,
      overdue: loans.some((loan) => isOverdue(loan.dueDate, loan.returnedAt, today)),
      dueDate: addCalendarDays(today, 14),
    };
  });
}
export async function login(ctx: Context, input: { email: string; password: string }) {
  await consumeLoginLimit(ctx, input.email);
  try {
    const result = await ctx.auth.auth.signInWithPassword(input);
    if (result.error) throw new Error("Authentication failed");
    const identity = await resolveIdentity(ctx.auth, ctx.db);
    if (!identity.user || !identity.tenantId || !identity.role) throw new Error("Authentication failed");
    return await me({ ...ctx, user: identity.user, tenantId: identity.tenantId, role: identity.role });
  } catch {
    await ctx.auth.auth.signOut({ scope: "local" }).catch(() => undefined);
    await clearAuthCookies();
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Não foi possível entrar. Verifique suas credenciais",
    });
  }
}
export async function logout(ctx: Context) {
  try {
    await ctx.auth.auth.signOut({ scope: "local" });
  } finally {
    await clearAuthCookies();
  }
  return { success: true as const };
}
