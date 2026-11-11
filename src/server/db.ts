import { PrismaClient } from "@prisma/client";
import { getServerEnv } from "@/env";

const globalDb = globalThis as unknown as { emprestaiDb?: PrismaClient };

export async function validateRuntimeDatabase(db: PrismaClient): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      const [state] = await tx.$queryRaw<Array<{ safe: boolean }>>`
        WITH RECURSIVE reachable(root, oid) AS (
          SELECT rolname, oid FROM pg_catalog.pg_roles WHERE rolname IN ('emprestai_runtime', 'emprestai_app')
          UNION
          SELECT r.root, m.roleid FROM reachable r JOIN pg_catalog.pg_auth_members m ON m.member = r.oid
        ), domain_tables AS (
          SELECT c.oid, c.relowner FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname IN ('tenants','memberships','equipment','loans','audit_events','rate_limit_counters')
        )
        SELECT (
          current_user = 'emprestai_runtime' AND session_user = 'emprestai_runtime'
          AND EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'emprestai_runtime' AND rolcanlogin AND rolconfig IS NULL
            AND NOT (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication OR rolinherit))
          AND EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'emprestai_app'
            AND NOT (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication OR rolinherit))
          AND EXISTS (SELECT FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles a ON a.oid = m.roleid
            JOIN pg_catalog.pg_roles r ON r.oid = m.member WHERE r.rolname = 'emprestai_runtime' AND a.rolname = 'emprestai_app'
            AND NOT m.admin_option AND COALESCE((to_jsonb(m)->>'inherit_option')::boolean, false) = false
            AND COALESCE((to_jsonb(m)->>'set_option')::boolean, true) = true)
          AND NOT EXISTS (SELECT FROM reachable r JOIN pg_catalog.pg_roles p ON p.oid = r.oid
            WHERE p.rolsuper OR p.rolbypassrls OR p.rolcreatedb OR p.rolcreaterole OR p.rolreplication
              OR (p.rolcanlogin AND p.rolname <> 'emprestai_runtime'))
          AND (SELECT count(*) FROM domain_tables) = 6
          AND NOT EXISTS (SELECT FROM domain_tables t JOIN reachable r ON r.oid = t.relowner)
          AND NOT EXISTS (SELECT FROM pg_catalog.pg_namespace n JOIN reachable r ON r.oid = n.nspowner WHERE n.nspname = 'public')
          AND NOT EXISTS (SELECT FROM pg_catalog.pg_db_role_setting s
            WHERE s.setrole IN (0, (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'emprestai_runtime'),
              (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'emprestai_app'))
              AND s.setdatabase IN (0, (SELECT oid FROM pg_catalog.pg_database WHERE datname = current_database()))
              AND EXISTS (SELECT FROM unnest(s.setconfig) setting
                WHERE setting LIKE 'role=%' OR setting LIKE 'session_authorization=%' OR setting LIKE 'app.%'))
          AND NOT pg_catalog.has_schema_privilege('emprestai_runtime', 'public', 'CREATE')
          AND NOT pg_catalog.has_schema_privilege('emprestai_app', 'public', 'CREATE')
          AND NOT EXISTS (
            SELECT FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','f')
              AND (pg_catalog.has_table_privilege('emprestai_runtime', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
                OR pg_catalog.has_any_column_privilege('emprestai_runtime', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES'))
          )
          AND (SELECT count(*) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.oid IN (to_regprocedure('public.runtime_membership(uuid)'), to_regprocedure('public.runtime_preauth_tenant()'))
              AND p.prosecdef AND p.proconfig = ARRAY['search_path=pg_catalog']
              AND NOT EXISTS (SELECT FROM reachable r WHERE r.oid = p.proowner)
              AND pg_catalog.has_function_privilege('emprestai_runtime', p.oid, 'EXECUTE')) = 2
          AND nullif(current_setting('app.tenant_id', true), '') IS NULL
          AND nullif(current_setting('app.user_id', true), '') IS NULL
          AND nullif(current_setting('app.role', true), '') IS NULL
        ) AS safe`;
      if (!state?.safe) throw new Error("Unsafe runtime");
      await tx.$executeRaw`SET LOCAL ROLE emprestai_app`;
      await tx.$queryRaw`SELECT set_config('app.tenant_id', '', true), set_config('app.user_id', '', true), set_config('app.role', '', true)`;
      const [role] = await tx.$queryRaw<Array<{ name: string }>>`SELECT current_user AS name`;
      if (role?.name !== "emprestai_app") throw new Error("Unsafe runtime");
    });
  } catch {
    throw new Error(
      "Conexão runtime recusada: revise role restrita, grants, helpers e contexto limpo. Não use a credencial administrativa no app.",
    );
  }
}

export async function getDb(): Promise<PrismaClient> {
  if (!globalDb.emprestaiDb) {
    const env = getServerEnv();
    globalDb.emprestaiDb = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  }
  await validateRuntimeDatabase(globalDb.emprestaiDb);
  return globalDb.emprestaiDb;
}