import { afterAll, describe, expect, test } from "vitest";
import { db, fixture, futureDue, restricted } from "./fixtures";
import { validateLocalDatabase } from "../../../scripts/local-migrate";

afterAll(() => db.$disconnect());
describe("004 auth/persistência — PostgreSQL real", () => {
  test("test_ca_04_local_launcher_refuses_remote_and_unsafe_databases", () => {
    for (const url of ["postgresql://u@db.example.test/test", "postgresql://u@127.0.0.1/production", "postgresql://u@127.0.0.1/test?host=remote", "postgresql://u@127.0.0.1/test?schema=private"]) expect(() => validateLocalDatabase(url)).toThrow();
    expect(validateLocalDatabase("postgresql://u@127.0.0.1:54917/emprestai_local_integration")).toContain("127.0.0.1");
  });
  test("test_ca_04_catalog_has_six_rls_tables_and_partial_unique_index", async () => {
    const rows = await db.$queryRaw<Array<{ relname: string; relrowsecurity: boolean; policies: bigint }>>`SELECT c.relname, c.relrowsecurity, (SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid) AS policies FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('tenants','memberships','equipment','loans','audit_events','rate_limit_counters')`;
    expect(rows).toHaveLength(6);
    for (const row of rows) { expect(row.relrowsecurity).toBe(true); expect(Number(row.policies)).toBeGreaterThan(0); }
    const indexes = await db.$queryRaw<Array<{ indexdef: string }>>`SELECT indexdef FROM pg_indexes WHERE indexname='loans_one_open_per_equipment'`;
    expect(indexes[0].indexdef).toMatch(/UNIQUE.*tenant_id, equipment_id.*returned_at IS NULL/);
  });
  test("test_ca_04_cross_tenant_equipment_borrower_return_actor_and_audit_fks_reject", async () => {
    const f = await fixture();
    const base = { tenantId: f.tenant.id, equipmentId: f.equipment[0].id, borrowerId: f.user, dueDate: futureDue() };
    await expect(db.loan.create({ data: { ...base, equipmentId: f.outsideEquipment.id } })).rejects.toMatchObject({ code: "P2003" });
    await expect(db.loan.create({ data: { ...base, borrowerId: f.outsider } })).rejects.toMatchObject({ code: "P2003" });
    await expect(db.loan.create({ data: { ...base, returnedAt: new Date(), returnedBy: f.outsider } })).rejects.toThrow();
    await expect(db.auditEvent.create({ data: { tenantId: f.tenant.id, actorId: f.outsider, action: "test", resourceId: f.equipment[0].id } })).rejects.toMatchObject({ code: "P2003" });
  });
  test("test_ca_04_unique_open_constraint_dates_required_fields_and_credit", async () => {
    const f = await fixture();
    const base = { tenantId: f.tenant.id, equipmentId: f.equipment[0].id, borrowerId: f.user, dueDate: futureDue() };
    await db.loan.create({ data: base });
    await expect(db.loan.create({ data: { ...base, borrowerId: f.otherUser } })).rejects.toMatchObject({ code: "P2002" });
    await expect(db.loan.create({ data: { ...base, equipmentId: f.equipment[1].id, dueDate: new Date("2000-01-01") } })).rejects.toThrow();
    await expect(db.equipment.create({ data: { tenantId: f.tenant.id, patrimonio: "TI0013", nome: "Good name", categoria: "monitor", local: "Local" } })).rejects.toThrow();
    await expect(db.equipment.create({ data: { tenantId: f.tenant.id, patrimonio: "TI-0013", nome: " ", categoria: "monitor", local: "Local" } })).rejects.toThrow();
    await expect(db.equipment.update({ where: { id: f.equipment[0].id }, data: { imagePath: "image.jpg" } })).rejects.toThrow();
  });
  test("test_ca_05_every_table_isolates_tenants_under_real_restricted_role", async () => {
    const f = await fixture();
    const loan = await db.loan.create({ data: { tenantId: f.otherTenant.id, equipmentId: f.outsideEquipment.id, borrowerId: f.outsider, dueDate: futureDue() } });
    await db.auditEvent.create({ data: { tenantId: f.otherTenant.id, actorId: f.outsider, action: "test", resourceId: loan.id } });
    await db.rateLimitCounter.create({ data: { tenantId: f.otherTenant.id, key: "outside", windowStart: new Date(), count: 1 } });
    await restricted(f.tenant.id, f.user, "colaborador", async (tx) => {
      const [role] = await tx.$queryRaw<Array<{ current_user: string; rolsuper: boolean; rolbypassrls: boolean }>>`SELECT current_user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname=current_user`;
      expect(role).toEqual({ current_user: "emprestai_app", rolsuper: false, rolbypassrls: false });
      expect(await tx.tenant.findMany({ where: { id: f.otherTenant.id } })).toEqual([]);
      expect(await tx.membership.findMany({ where: { tenantId: f.otherTenant.id } })).toEqual([]);
      expect(await tx.equipment.findMany({ where: { tenantId: f.otherTenant.id } })).toEqual([]);
      expect(await tx.loan.findMany({ where: { tenantId: f.otherTenant.id } })).toEqual([]);
      expect(await tx.auditEvent.findMany({ where: { tenantId: f.otherTenant.id } })).toEqual([]);
      expect(await tx.rateLimitCounter.findMany({ where: { tenantId: f.otherTenant.id } })).toEqual([]);
      expect(await tx.membership.findMany()).toHaveLength(1);
    });
    await restricted(null, null, null, async (tx) => {
      expect(await tx.equipment.findMany()).toEqual([]);
      expect(await tx.tenant.findMany()).toEqual([]);
      expect(await tx.loan.findMany()).toEqual([]);
      expect(await tx.membership.findMany()).toEqual([]);
      expect(await tx.auditEvent.findMany()).toEqual([]);
      expect(await tx.rateLimitCounter.findMany()).toEqual([]);
    });
    const [clean] = await db.$queryRaw<Array<{ tenant: string | null; user: string | null; effective_role: string }>>`SELECT nullif(current_setting('app.tenant_id',true),'') AS tenant, nullif(current_setting('app.user_id',true),'') AS "user", current_user AS effective_role`;
    expect(clean.tenant).toBeNull(); expect(clean.user).toBeNull(); expect(clean.effective_role).not.toBe("emprestai_app");
  });
  test("test_ca_05_own_loans_only_forged_role_denied_and_membership_locks_not_writes", async () => {
    const f = await fixture();
    await db.loan.create({ data: { tenantId: f.tenant.id, equipmentId: f.equipment[0].id, borrowerId: f.otherUser, dueDate: futureDue() } });
    await restricted(f.tenant.id, f.user, "colaborador", async (tx) => {
      expect(await tx.loan.findMany()).toEqual([]);
      expect(await tx.$queryRaw`SELECT user_id FROM memberships FOR UPDATE`).toHaveLength(1);
      expect(await tx.$queryRaw`SELECT id FROM equipment FOR UPDATE`).toHaveLength(7);
      const [occupied] = await tx.$queryRaw<Array<{ occupied: boolean; outside: boolean }>>`SELECT equipment_has_open_loan(${f.equipment[0].id}::uuid) AS occupied, equipment_has_open_loan(${f.outsideEquipment.id}::uuid) AS outside`;
      expect(occupied).toEqual({ occupied: true, outside: false });
    });
    await restricted(f.tenant.id, f.user, "operacoes", async (tx) => { expect(await tx.equipment.findMany()).toEqual([]); });
    await expect(restricted(f.tenant.id, f.user, "colaborador", (tx) => tx.$executeRaw`UPDATE memberships SET role='operacoes'`)).rejects.toThrow();
    await expect(restricted(f.tenant.id, f.user, "colaborador", (tx) => tx.$executeRaw`UPDATE memberships SET user_id=user_id`)).rejects.toThrow();
    await expect(restricted(f.tenant.id, f.user, "colaborador", (tx) => tx.$executeRaw`UPDATE equipment SET id=id`)).rejects.toThrow();
  });
  test("test_ca_07_preauth_counters_atomic_without_membership_and_tenant_scoped", async () => {
    const f = await fixture(), now = new Date();
    await Promise.all(Array.from({ length: 12 }, () => restricted(f.tenant.id, null, null, (tx) => tx.$queryRaw`INSERT INTO rate_limit_counters (tenant_id,key,window_start,count) VALUES (${f.tenant.id}::uuid,'preauth',${now},1) ON CONFLICT (tenant_id,key,window_start) DO UPDATE SET count=rate_limit_counters.count+1 RETURNING count`)));
    expect(await db.rateLimitCounter.findUnique({ where: { tenantId_key_windowStart: { tenantId: f.tenant.id, key: "preauth", windowStart: now } } })).toMatchObject({ count: 12 });
    await expect(restricted(f.tenant.id, null, null, (tx) => tx.rateLimitCounter.create({ data: { tenantId: f.otherTenant.id, key: "forged", windowStart: now, count: 1 } }))).rejects.toThrow();
  });
  test("test_ca_08_audit_append_only_for_runtime_and_owner_and_transaction_rollback", async () => {
    const f = await fixture();
    const event = await db.auditEvent.create({ data: { tenantId: f.tenant.id, actorId: f.user, action: "test", resourceId: f.equipment[0].id } });
    for (const mutation of [() => db.auditEvent.update({ where: { id: event.id }, data: { action: "tampered" } }), () => db.auditEvent.delete({ where: { id: event.id } }), () => restricted(f.tenant.id, f.user, "colaborador", (tx) => tx.auditEvent.update({ where: { id: event.id }, data: { action: "tampered" } })), () => restricted(f.tenant.id, f.user, "colaborador", (tx) => tx.auditEvent.delete({ where: { id: event.id } }))]) await expect(mutation()).rejects.toThrow();
    await expect(restricted(f.tenant.id, f.user, "colaborador", async (tx) => {
      const loan = await tx.loan.create({ data: { tenantId: f.tenant.id, equipmentId: f.equipment[0].id, borrowerId: f.user, dueDate: futureDue() } });
      await tx.auditEvent.create({ data: { tenantId: f.tenant.id, actorId: f.otherUser, action: "test", resourceId: loan.id } });
    })).rejects.toThrow();
    expect(await db.loan.count({ where: { tenantId: f.tenant.id } })).toBe(0);
    expect(await db.auditEvent.count({ where: { tenantId: f.tenant.id } })).toBe(1);
  });
});
