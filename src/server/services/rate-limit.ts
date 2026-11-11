import { TRPCError } from "@trpc/server";
import type { Context, TenantContext } from "@/server/api/context";
import { pseudonym } from "@/server/security";
import { tenantTransaction } from "./transaction";

async function consume(
  ctx: TenantContext,
  scope: string,
  identities: string[],
  maximum: number,
  windowMs: number,
) {
  const start = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const keys = identities.map((value) => pseudonym(scope, value)).sort();
  const exceeded = await tenantTransaction(ctx, async (tx) => {
    let blocked = false;
    for (const key of keys) {
      const rows = await tx.$queryRaw<Array<{ count: number }>>`
        INSERT INTO rate_limit_counters (tenant_id, key, window_start, count)
        VALUES (${ctx.tenantId}::uuid, ${key}, ${start}, 1)
        ON CONFLICT (tenant_id, key, window_start) DO UPDATE SET count = LEAST(rate_limit_counters.count + 1, ${maximum + 1})
        RETURNING count`;
      if (rows[0].count > maximum) blocked = true;
    }
    return blocked;
  });
  if (exceeded) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
}
export async function consumeLoginLimit(ctx: Context, email: string) {
  const [tenant] = await ctx.db.$queryRaw<
    Array<{ id: string | null }>
  >`SELECT public.runtime_preauth_tenant() AS id;`
  if (!tenant?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
  const preauth: TenantContext = {
    ...ctx,
    tenantId: tenant.id,
    role: "colaborador",
    user: { id: "00000000-0000-0000-0000-000000000000", name: "", email: "" },
  };
  await consume(preauth, "login", [`ip:${ctx.ip}`, `user:${email.toLowerCase()}`], 15, 15 * 60 * 1000);
}
export async function consumeMutationLimit(ctx: TenantContext) {
  await consume(ctx, "mutation", [`ip:${ctx.ip}`, `user:${ctx.user.id}`], 60, 60 * 1000);
}
