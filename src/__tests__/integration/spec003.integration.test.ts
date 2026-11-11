import { afterAll, describe, expect, test } from "vitest";
import { appRouter } from "@/server/api/root";
import { addCalendarDays, localToday } from "@/server/services/dates";
import { db, fixture, futureDue } from "./fixtures";

afterAll(() => db.$disconnect());
describe("003 solicitar empréstimo — createCaller/PostgreSQL real", () => {
  test("test_ca_02_anonymous_idor_own_loans_and_privacy", async () => {
    const f = await fixture();
    const anonymous = appRouter.createCaller({ ...f.context(), user: null, tenantId: null, role: null });
    await expect(anonymous.loans.mine({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymous.loans.request({ equipmentId: f.equipment[0].id })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(f.caller().loans.request({ equipmentId: f.outsideEquipment.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const loan = await f.caller(f.otherUser).loans.request({ equipmentId: f.equipment[0].id });
    expect(loan).toMatchObject({ equipmentId: f.equipment[0].id, returnedAt: null });
    const mine = await f.caller().loans.mine({});
    expect(mine.items).toEqual([]);
    expect(JSON.stringify(mine)).not.toContain("Private other name");
    expect((await f.caller(f.otherUser).loans.mine({})).items[0].id).toBe(loan.id);
  });
  test("test_ca_01_catalog_occupancy_of_other_borrower_and_cross_tenant_procedures", async () => {
    const f = await fixture();
    await f.caller(f.otherUser).loans.request({ equipmentId: f.equipment[0].id });
    const detail = await f.caller().equipment.get({ patrimonio: f.equipment[0].patrimonio });
    expect(detail.situacao).toBe("emprestado");
    expect(detail.history).toEqual([]);
    expect(JSON.stringify(detail)).not.toContain("Private other name");
    const list = await f.caller().equipment.list({ onlyAvailable: true });
    expect(list.items.map((item) => item.id)).not.toContain(f.equipment[0].id);
    expect(list.items.map((item) => item.id)).not.toContain(f.outsideEquipment.id);
    expect(list.available).toBe(6);
    expect((await f.caller(f.outsider, "operacoes", f.otherTenant.id).equipment.get({ patrimonio: "TI-0001" })).id).toBe(f.outsideEquipment.id);
  });
  test("test_ca_03_eligibility_maintenance_out_of_use_limit_and_overdue", async () => {
    const f = await fixture();
    await db.equipment.update({ where: { id: f.equipment[0].id }, data: { situacao: "manutencao" } });
    await db.equipment.update({ where: { id: f.equipment[1].id }, data: { situacao: "fora_de_uso" } });
    for (const i of [0, 1]) await expect(f.caller().loans.request({ equipmentId: f.equipment[i].id })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await db.loan.count({ where: { tenantId: f.tenant.id } })).toBe(0);
    await db.loan.create({ data: { tenantId: f.tenant.id, borrowerId: f.user, equipmentId: f.equipment[2].id, requestedAt: new Date("2020-01-01T12:00:00Z"), dueDate: new Date("2020-01-15") } });
    await expect(f.caller().loans.request({ equipmentId: f.equipment[3].id })).rejects.toMatchObject({ code: "FORBIDDEN", message: "Você tem empréstimo em atraso" });
  });
  test("test_ca_04_persists_civil_date_and_atomic_audit", async () => {
    const f = await fixture();
    const loan = await f.caller().loans.request({ equipmentId: f.equipment[0].id });
    expect(loan.dueDate).toBe(addCalendarDays(localToday(), 14));
    expect(loan.requestedAt).toBeInstanceOf(Date);
    const [stored] = await db.$queryRaw<Array<{ due: string; type: string }>>`SELECT due_date::text AS due, pg_typeof(due_date)::text AS type FROM loans WHERE id=${loan.id}::uuid`;
    expect(stored).toEqual({ due: loan.dueDate, type: "date" });
    expect(await db.auditEvent.findMany({ where: { resourceId: loan.id } })).toMatchObject([{ tenantId: f.tenant.id, actorId: f.user, action: "loans.request" }]);
  });
  test("test_ca_05_two_parallel_requests_with_two_existing_loans_exactly_one_success", async () => {
    const f = await fixture();
    await db.loan.createMany({ data: [0, 1].map((i) => ({ tenantId: f.tenant.id, borrowerId: f.user, equipmentId: f.equipment[i].id, dueDate: futureDue() })) });
    const results = await Promise.allSettled([2, 3].map((i) => f.caller().loans.request({ equipmentId: f.equipment[i].id })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const denied = results.find((r) => r.status === "rejected");
    expect(denied && denied.status === "rejected" && denied.reason).toMatchObject({ code: "FORBIDDEN" });
    expect(await db.loan.count({ where: { tenantId: f.tenant.id, borrowerId: f.user, returnedAt: null } })).toBe(3);
    expect(await db.auditEvent.count({ where: { tenantId: f.tenant.id, action: "loans.request" } })).toBe(1);
  });
  test("test_ca_06_two_users_one_item_exactly_one_success", async () => {
    const f = await fixture();
    const results = await Promise.allSettled([f.user, f.otherUser].map((user) => f.caller(user).loans.request({ equipmentId: f.equipment[0].id })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const denied = results.find((r) => r.status === "rejected");
    expect(denied && denied.status === "rejected" && denied.reason).toMatchObject({ code: "CONFLICT" });
    expect(await db.loan.count({ where: { tenantId: f.tenant.id, equipmentId: f.equipment[0].id, returnedAt: null } })).toBe(1);
    expect(await db.auditEvent.count({ where: { tenantId: f.tenant.id, action: "loans.request" } })).toBe(1);
  });
});
