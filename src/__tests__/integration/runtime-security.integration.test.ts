import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { db, runtimeDb, fixture, restricted } from "./fixtures";
import { validateRuntimeDatabase } from "@/server/db";
import { resolveIdentity } from "@/server/api/context";
import { consumeLoginLimit } from "@/server/services/rate-limit";

afterAll(async () => {
  await db.$disconnect();
  await runtimeDb.$disconnect();
});

describe("004 runtime least privilege — real PostgreSQL login", () => {
  test("test_ca_05_runtime_login_select_denied_and_owner_failclosed", async () => {
    await validateRuntimeDatabase(runtimeDb);
    await expect(validateRuntimeDatabase(db)).rejects.toThrow("Conexão runtime recusada");

    const [role] = await runtimeDb.$queryRaw<
      Array<{ current_user: string; session_user: string }>
    >`SELECT current_user, session_user`;

    expect(role).toEqual({
      current_user: "emprestai_runtime",
      session_user: "emprestai_runtime",
    });

    for (const query of [
      () => runtimeDb.tenant.findMany(),
      () => runtimeDb.membership.findMany(),
      () => runtimeDb.equipment.findMany(),
      () => runtimeDb.loan.findMany(),
      () => runtimeDb.auditEvent.findMany(),
      () => runtimeDb.rateLimitCounter.findMany(),
    ])
      await expect(query()).rejects.toThrow();

    const [password] = await db.$queryRaw<
      Array<{ unset: boolean }>
    >`SELECT rolpassword IS NULL AS unset FROM pg_catalog.pg_authid WHERE rolname='emprestai_runtime'`;

    // Standalone loopback fixture uses trust; no runtime password provisioned by the agent.
    if (process.env.TEST_DATABASE_URL) expect(password.unset).toBe(true);
  });

  test("test_ca_05_runtime_set_role_works_and_cannot_escalate_or_leave_settings", async () => {
    const f = await fixture();

    await restricted(f.tenant.id, f.user, "colaborador", async (tx) => {
      expect(await tx.equipment.findMany()).toHaveLength(7);
      const [role] = await tx.$queryRaw<Array<{ name: string }>>`SELECT current_user AS name`;
      expect(role.name).toBe("emprestai_app");
    });

    await expect(runtimeDb.$executeRaw`SET ROLE emprestai_migrator`).rejects.toThrow();
    await expect(runtimeDb.$executeRaw`ALTER ROLE emprestai_runtime SUPERUSER`).rejects.toThrow();
    await expect(runtimeDb.$executeRaw`CREATE ROLE forbidden_runtime_escalation`).rejects.toThrow();
    await expect(
      runtimeDb.$executeRaw`GRANT emprestai_app TO emprestai_runtime WITH ADMIN OPTION`,
    ).rejects.toThrow();

    await expect(
      restricted(f.tenant.id, f.user, "colaborador", async () => {
        throw new Error("rollback");
      }),
    ).rejects.toThrow("rollback");

    const [clean] = await runtimeDb.$queryRaw<
      Array<{ tenant: string | null; user: string | null; role: string | null; effective: string }>
    >`SELECT nullif(current_setting('app.tenant_id', true),'') AS tenant, nullif(current_setting('app.user_id', true),'') AS "user", nullif(current_setting('app.role', true),'') AS role, current_user AS effective`;

    expect(clean).toEqual({
      tenant: null,
      user: null,
      role: null,
      effective: "emprestai_runtime",
    });
  });

  test("test_ca_05_failclosed_on_direct_table_column_grants_role_config_and_owner_reach", async () => {
    await db.$executeRaw`GRANT SELECT ON public.equipment TO emprestai_runtime`;
    try {
      await expect(validateRuntimeDatabase(runtimeDb)).rejects.toThrow("Conexão runtime recusada");
    } finally {
      await db.$executeRaw`REVOKE SELECT ON public.equipment FROM emprestai_runtime`;
    }

    await db.$executeRaw`GRANT SELECT(nome) ON public.equipment TO emprestai_runtime`;
    try {
      await expect(validateRuntimeDatabase(runtimeDb)).rejects.toThrow("Conexão runtime recusada");
    } finally {
      await db.$executeRaw`REVOKE SELECT(nome) ON public.equipment FROM emprestai_runtime`;
    }

    await db.$executeRaw`ALTER ROLE emprestai_runtime SET app.role = 'operacoes'`;
    try {
      await expect(validateRuntimeDatabase(runtimeDb)).rejects.toThrow("Conexão runtime recusada");
    } finally {
      await db.$executeRaw`ALTER ROLE emprestai_runtime RESET app.role`;
    }

    await db.$executeRaw`REVOKE emprestai_app FROM emprestai_migrator`;
    try {
      await db.$executeRaw`GRANT emprestai_migrator TO emprestai_app`;
      await expect(validateRuntimeDatabase(runtimeDb)).rejects.toThrow("Conexão runtime recusada");
    } finally {
      await db.$executeRaw`REVOKE emprestai_migrator FROM emprestai_app`;
      await db.$executeRaw`GRANT emprestai_app TO emprestai_migrator`;
    }

    await validateRuntimeDatabase(runtimeDb);
  });

  test("test_ca_01_ca_05_helpers_fixed_tenant_validated_identity_and_preauth", async () => {
    const tenant = await db.tenant.upsert({
      where: { slug: "suporte_ti" },
      update: {},
      create: { slug: "suporte_ti" },
    });

    const f = await fixture();
    await db.membership.create({
      data: {
        tenantId: tenant.id,
        userId: f.user,
        role: "colaborador",
        displayName: "Verified",
      },
    });

    const auth = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: f.user,
              email: "verified@example.test",
              user_metadata: { role: "operacoes", tenantId: f.otherTenant.id },
            },
          },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    expect(await resolveIdentity(auth, runtimeDb)).toEqual({
      user: { id: f.user, email: "verified@example.test", name: "Verified" },
      tenantId: tenant.id,
      role: "colaborador",
    });

    expect(
      await runtimeDb.$queryRaw`SELECT * FROM public.runtime_membership(${f.outsider}::uuid)`,
    ).toEqual([]);

    expect(
      await runtimeDb.$queryRaw`SELECT * FROM public.runtime_membership(${randomUUID()}::uuid)`,
    ).toEqual([]);

    await expect(
      restricted(
        tenant.id,
        f.user,
        "colaborador",
        (tx) => tx.$queryRaw`SELECT * FROM public.runtime_membership(${f.user}::uuid)`,
      ),
    ).rejects.toThrow();

    await consumeLoginLimit(
      { ...f.context(), db: runtimeDb, user: null, tenantId: null, role: null },
      "anonymous@example.test",
    );

    expect(
      await db.rateLimitCounter.count({ where: { tenantId: tenant.id } }),
    ).toBeGreaterThanOrEqual(2);

    const helpers = await db.$queryRaw<
      Array<{ proname: string; prosecdef: boolean; proconfig: string[]; public_execute: boolean }>
    >`SELECT p.proname, p.prosecdef, p.proconfig, EXISTS (SELECT FROM aclexplode(p.proacl) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') AS public_execute FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('runtime_membership','runtime_preauth_tenant')`;

    await db.membership.delete({
      where: { tenantId_userId: { tenantId: tenant.id, userId: f.user } },
    });

    expect(helpers).toHaveLength(2);
    for (const helper of helpers) {
      expect(helper.prosecdef).toBe(true);
      expect(helper.proconfig).toEqual(["search_path=pg_catalog"]);
      expect(helper.public_execute).toBe(false);
    }
  });
});