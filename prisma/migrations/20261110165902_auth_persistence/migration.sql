-- CreateEnum
CREATE TYPE "Role" AS ENUM ('colaborador', 'operacoes');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('notebook', 'monitor', 'cabo', 'camera', 'projetor');

-- CreateEnum
CREATE TYPE "EquipmentState" AS ENUM ('disponivel', 'manutencao', 'fora_de_uso');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'colaborador',
    "display_name" TEXT NOT NULL DEFAULT 'Colaborador',

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("tenant_id","user_id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "patrimonio" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "Category" NOT NULL,
    "situacao" "EquipmentState" NOT NULL DEFAULT 'disponivel',
    "local" TEXT NOT NULL,
    "numero_serie" TEXT,
    "observacoes" TEXT,
    "image_path" TEXT,
    "photo_source" TEXT,
    "photo_id" TEXT,
    "photo_page" TEXT,
    "photographer" TEXT,
    "photographer_url" TEXT,
    "license_name" TEXT,
    "license_url" TEXT,
    "image_hash" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "borrower_id" UUID NOT NULL,
    "requested_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE NOT NULL,
    "returned_at" TIMESTAMPTZ(3),
    "returned_by" UUID,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "resource_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_counters" (
    "tenant_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rate_limit_counters_pkey" PRIMARY KEY ("tenant_id","key","window_start")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "equipment_tenant_id_created_at_id_idx" ON "equipment"("tenant_id", "created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tenant_id_patrimonio_key" ON "equipment"("tenant_id", "patrimonio");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tenant_id_id_key" ON "equipment"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tenant_id_photo_id_key" ON "equipment"("tenant_id", "photo_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tenant_id_image_hash_key" ON "equipment"("tenant_id", "image_hash");

-- CreateIndex
CREATE INDEX "loans_tenant_id_borrower_id_returned_at_due_date_idx" ON "loans"("tenant_id", "borrower_id", "returned_at", "due_date");

-- CreateIndex
CREATE INDEX "loans_tenant_id_returned_at_requested_at_id_idx" ON "loans"("tenant_id", "returned_at", "requested_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "loans_tenant_id_id_key" ON "loans"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "audit_events_tenant_id_created_at_idx" ON "audit_events"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_equipment_id_fkey" FOREIGN KEY ("tenant_id", "equipment_id") REFERENCES "equipment"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_borrower_id_fkey" FOREIGN KEY ("tenant_id", "borrower_id") REFERENCES "memberships"("tenant_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_actor_id_fkey" FOREIGN KEY ("tenant_id", "actor_id") REFERENCES "memberships"("tenant_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_limit_counters" ADD CONSTRAINT "rate_limit_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Approved raw SQL extends this unpublished Prisma-generated migration.
CREATE UNIQUE INDEX loans_one_open_per_equipment ON loans (tenant_id, equipment_id) WHERE returned_at IS NULL;
ALTER TABLE loans ADD CONSTRAINT loans_returned_by_membership_fkey FOREIGN KEY (tenant_id, returned_by) REFERENCES memberships (tenant_id, user_id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE loans ADD CONSTRAINT loans_dates_check CHECK (due_date >= (requested_at AT TIME ZONE 'America/Sao_Paulo')::date AND (returned_at IS NULL OR returned_at >= requested_at));
ALTER TABLE loans ADD CONSTRAINT loans_return_pair_check CHECK ((returned_at IS NULL) = (returned_by IS NULL));
ALTER TABLE tenants ADD CONSTRAINT tenants_slug_not_empty CHECK (btrim(slug) <> '');
ALTER TABLE memberships ADD CONSTRAINT memberships_name_not_empty CHECK (btrim(display_name) <> '');
ALTER TABLE equipment ADD CONSTRAINT equipment_required_fields CHECK (btrim(nome) <> '' AND btrim(local) <> '' AND patrimonio ~ '^TI-[0-9]{4}$');
ALTER TABLE equipment ADD CONSTRAINT equipment_pixabay_credit CHECK (
  (image_path IS NULL AND photo_source IS NULL AND photo_id IS NULL AND photo_page IS NULL AND photographer IS NULL AND photographer_url IS NULL AND license_name IS NULL AND license_url IS NULL AND image_hash IS NULL)
  OR (image_path IS NOT NULL AND image_path ~ '^[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*\.(jpg|jpeg|png|webp)$'
      AND photo_source IS NOT NULL AND lower(photo_source) = 'pixabay'
      AND photo_id IS NOT NULL AND photo_id ~ '^[0-9]+$'
      AND photo_page IS NOT NULL AND photo_page ~ '^https://(www\.)?pixabay\.com/'
      AND (photographer IS NULL OR btrim(photographer) <> '')
      AND (photographer_url IS NULL OR photographer_url ~ '^https://(www\.)?pixabay\.com/')
      AND license_name IS NOT NULL AND btrim(license_name) <> ''
      AND license_url IS NOT NULL AND license_url ~ '^https://(www\.)?pixabay\.com/'
      AND image_hash IS NOT NULL AND image_hash ~ '^[a-f0-9]{64}$')
);
ALTER TABLE audit_events ADD CONSTRAINT audit_action_not_empty CHECK (btrim(action) <> '');
ALTER TABLE rate_limit_counters ADD CONSTRAINT counters_valid CHECK (btrim(key) <> '' AND count >= 0);

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'emprestai_app') THEN
    CREATE ROLE emprestai_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'emprestai_app' AND (rolsuper OR rolbypassrls OR rolcanlogin OR rolcreatedb OR rolcreaterole)) THEN
    RAISE EXCEPTION 'emprestai_app already exists with unsafe privileges';
  END IF;
  EXECUTE format('GRANT emprestai_app TO %I', current_user);
END
$roles$;
GRANT USAGE ON SCHEMA public TO emprestai_app;
REVOKE ALL ON tenants, memberships, equipment, loans, audit_events, rate_limit_counters FROM PUBLIC, emprestai_app;
GRANT SELECT ON tenants, memberships, equipment, loans, audit_events, rate_limit_counters TO emprestai_app;
GRANT INSERT ON equipment, loans, audit_events, rate_limit_counters TO emprestai_app;
-- PostgreSQL row locking requires UPDATE privilege; immutable-column triggers forbid writes.
GRANT UPDATE(user_id) ON memberships TO emprestai_app;
GRANT UPDATE(id) ON equipment TO emprestai_app;
GRANT UPDATE(returned_at, returned_by) ON loans TO emprestai_app;
GRANT UPDATE(count) ON rate_limit_counters TO emprestai_app;

CREATE FUNCTION app_tenant() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.tenant_id', true), '')::uuid $$;
CREATE FUNCTION app_user() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;
-- Validate role against provisioned membership, not the mutable session setting alone.
CREATE FUNCTION app_member(operations_only boolean DEFAULT false) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT EXISTS (SELECT FROM public.memberships m
    WHERE m.tenant_id = public.app_tenant() AND m.user_id = public.app_user()
      AND m.role::text = current_setting('app.role', true)
      AND (NOT operations_only OR m.role::text = 'operacoes'))
$$;
REVOKE ALL ON FUNCTION app_tenant(), app_user(), app_member(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_tenant(), app_user(), app_member(boolean) TO emprestai_app;

-- Availability exposes only occupancy; it never exposes a different borrower's loan/name.
CREATE FUNCTION equipment_has_open_loan(item_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
 SELECT public.app_member(false) AND EXISTS (SELECT FROM public.loans l WHERE l.tenant_id = public.app_tenant() AND l.equipment_id = item_id AND l.returned_at IS NULL)
$$;
REVOKE ALL ON FUNCTION equipment_has_open_loan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION equipment_has_open_loan(uuid) TO emprestai_app;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenants_read ON tenants FOR SELECT TO emprestai_app USING (id = app_tenant());
CREATE POLICY memberships_read ON memberships FOR SELECT TO emprestai_app USING (tenant_id = app_tenant() AND app_member() AND (user_id = app_user() OR app_member(true)));
CREATE POLICY memberships_lock ON memberships FOR UPDATE TO emprestai_app USING (tenant_id = app_tenant() AND app_member() AND (user_id = app_user() OR app_member(true))) WITH CHECK (false);
CREATE POLICY equipment_read ON equipment FOR SELECT TO emprestai_app USING (tenant_id = app_tenant() AND app_member());
CREATE POLICY equipment_insert ON equipment FOR INSERT TO emprestai_app WITH CHECK (tenant_id = app_tenant() AND app_member(true));
CREATE POLICY equipment_lock ON equipment FOR UPDATE TO emprestai_app USING (tenant_id = app_tenant() AND app_member()) WITH CHECK (false);
CREATE POLICY loans_read ON loans FOR SELECT TO emprestai_app USING (tenant_id = app_tenant() AND app_member() AND (borrower_id = app_user() OR app_member(true)));
CREATE POLICY loans_insert ON loans FOR INSERT TO emprestai_app WITH CHECK (tenant_id = app_tenant() AND app_member() AND borrower_id = app_user() AND returned_at IS NULL AND returned_by IS NULL);
CREATE POLICY loans_return ON loans FOR UPDATE TO emprestai_app USING (tenant_id = app_tenant() AND app_member() AND (borrower_id = app_user() OR app_member(true))) WITH CHECK (tenant_id = app_tenant() AND app_member() AND (borrower_id = app_user() OR app_member(true)) AND returned_by = app_user() AND returned_at IS NOT NULL);
CREATE POLICY audit_read ON audit_events FOR SELECT TO emprestai_app USING (tenant_id = app_tenant() AND app_member() AND (actor_id = app_user() OR app_member(true)));
CREATE POLICY audit_insert ON audit_events FOR INSERT TO emprestai_app WITH CHECK (tenant_id = app_tenant() AND app_member() AND actor_id = app_user());
-- Pre-auth throttle deliberately needs no membership; tenant is institutional server context.
CREATE POLICY counters_read ON rate_limit_counters FOR SELECT TO emprestai_app USING (tenant_id = app_tenant());
CREATE POLICY counters_insert ON rate_limit_counters FOR INSERT TO emprestai_app WITH CHECK (tenant_id = app_tenant());
CREATE POLICY counters_update ON rate_limit_counters FOR UPDATE TO emprestai_app USING (tenant_id = app_tenant()) WITH CHECK (tenant_id = app_tenant());

CREATE FUNCTION deny_audit_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Audit events are append-only' USING ERRCODE = '42501'; END $$;
REVOKE ALL ON FUNCTION deny_audit_mutation() FROM PUBLIC;
CREATE TRIGGER audit_events_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_events FOR EACH STATEMENT EXECUTE FUNCTION deny_audit_mutation();
CREATE FUNCTION deny_lock_only_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN IF current_user = 'emprestai_app' THEN RAISE EXCEPTION 'Lock-only grant forbids mutation' USING ERRCODE = '42501'; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION deny_lock_only_mutation() FROM PUBLIC;
CREATE TRIGGER memberships_lock_only BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION deny_lock_only_mutation();
CREATE TRIGGER equipment_lock_only BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION deny_lock_only_mutation();
CREATE FUNCTION protect_loan_return() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  IF OLD.returned_at IS NOT NULL AND (NEW.returned_at IS DISTINCT FROM OLD.returned_at OR NEW.returned_by IS DISTINCT FROM OLD.returned_by) THEN
    RAISE EXCEPTION 'A return is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION protect_loan_return() FROM PUBLIC;
CREATE TRIGGER loans_return_immutable BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION protect_loan_return();
