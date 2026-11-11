-- Additive privilege correction; no domain table, policy or historical migration changes.
BEGIN;
CREATE ROLE emprestai_runtime LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
GRANT emprestai_app TO emprestai_runtime;
GRANT USAGE ON SCHEMA public TO emprestai_runtime;

DO $guard$
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname IN ('tenants','memberships','equipment','loans','audit_events','rate_limit_counters')
        AND c.relowner = (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = current_user)) <> 6 THEN
    RAISE EXCEPTION 'Migration must run as the existing domain table owner';
  END IF;
  IF EXISTS (
    WITH RECURSIVE reachable(oid) AS (
      SELECT oid FROM pg_catalog.pg_roles WHERE rolname IN ('emprestai_runtime','emprestai_app')
      UNION SELECT m.roleid FROM reachable r JOIN pg_catalog.pg_auth_members m ON m.member = r.oid
    )
    SELECT FROM reachable r JOIN pg_catalog.pg_roles p ON p.oid = r.oid
      WHERE p.rolsuper OR p.rolbypassrls OR p.rolcreatedb OR p.rolcreaterole OR p.rolreplication
        OR (p.rolcanlogin AND p.rolname <> 'emprestai_runtime')
        OR p.rolname = current_user
        OR EXISTS (SELECT FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relowner = r.oid)
  ) THEN RAISE EXCEPTION 'Runtime/app must not reach a privileged role or table owner'; END IF;
END
$guard$;

CREATE FUNCTION public.runtime_membership(identity_id uuid)
RETURNS TABLE (tenant_id uuid, role public."Role", display_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT m.tenant_id, m.role, m.display_name
  FROM public.memberships m JOIN public.tenants t ON t.id = m.tenant_id
  WHERE m.user_id = identity_id AND t.slug = 'suporte_ti'
$$;

CREATE FUNCTION public.runtime_preauth_tenant() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT t.id FROM public.tenants t WHERE t.slug = 'suporte_ti'
$$;

REVOKE ALL ON FUNCTION public.runtime_membership(uuid), public.runtime_preauth_tenant() FROM PUBLIC;

DO $auth_roles$
DECLARE auth_role text;
BEGIN
  FOREACH auth_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = auth_role) THEN
      EXECUTE pg_catalog.format('REVOKE ALL ON FUNCTION public.runtime_membership(uuid), public.runtime_preauth_tenant() FROM %I', auth_role);
    END IF;
  END LOOP;
END
$auth_roles$;

GRANT EXECUTE ON FUNCTION public.runtime_membership(uuid), public.runtime_preauth_tenant() TO emprestai_runtime;
COMMIT;