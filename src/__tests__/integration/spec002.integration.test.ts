import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, test } from "vitest";
import { seedInventory } from "../../../prisma/seed";
import { db } from "./fixtures";

afterAll(() => db.$disconnect());
describe("002 dados iniciais — seed real local", () => {
  test("test_ca_01_ca_02_ca_03_ca_04_ca_08_seed_exact_idempotent_preserves_legitimate_data", async () => {
    const identities = { teacher: randomUUID(), operations: randomUUID(), test: randomUUID() };
    const first = await seedInventory(db, identities);
    expect(first).toMatchObject({ equipment: 12, professorLoans: 0 });
    const tenant = await db.tenant.findUniqueOrThrow({ where: { slug: "suporte_ti" } });
    const rows = await db.equipment.findMany({ where: { tenantId: tenant.id }, orderBy: { patrimonio: "asc" } });
    expect(rows.map((item) => item.patrimonio)).toEqual(Array.from({ length: 12 }, (_, i) => `TI-${String(i + 1).padStart(4, "0")}`));
    expect(rows.filter((item) => item.situacao === "manutencao").map((item) => item.patrimonio)).toEqual(["TI-0004", "TI-0007", "TI-0010"]);
    expect(rows.filter((item) => item.situacao === "disponivel")).toHaveLength(9);
    expect(await db.loan.count({ where: { tenantId: tenant.id } })).toBe(0);
    expect(await db.membership.findUnique({ where: { tenantId_userId: { tenantId: tenant.id, userId: identities.teacher } } })).toMatchObject({ role: "colaborador" });
    const extra = await db.equipment.create({ data: { tenantId: tenant.id, patrimonio: "TI-9000", nome: "Legitimate addition", categoria: "projetor", local: "TI" } });
    const loan = await db.loan.create({ data: { tenantId: tenant.id, borrowerId: identities.test, equipmentId: rows[0].id, requestedAt: new Date("2026-01-01T12:00:00Z"), dueDate: new Date("2026-01-15") } });
    const auditBefore = await db.auditEvent.count({ where: { tenantId: tenant.id } });
    await seedInventory(db, identities);
    expect(await db.tenant.count({ where: { slug: "suporte_ti" } })).toBe(1);
    expect(await db.membership.count({ where: { tenantId: tenant.id } })).toBe(3);
    expect(await db.equipment.count({ where: { tenantId: tenant.id } })).toBe(13);
    expect(await db.equipment.findUnique({ where: { id: extra.id } })).not.toBeNull();
    expect(await db.loan.findUnique({ where: { id: loan.id } })).toMatchObject({ returnedAt: null });
    expect(await db.auditEvent.count({ where: { tenantId: tenant.id } })).toBe(auditBefore);
    expect(await db.loan.count({ where: { tenantId: tenant.id, borrowerId: identities.teacher } })).toBe(0);
  });
});
