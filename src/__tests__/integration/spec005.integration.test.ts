import { afterAll, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/api/root";
import { db, fixture, restricted } from "./fixtures";

afterAll(() => db.$disconnect());
describe("005 operações/devolução — createCaller/PostgreSQL real", () => {
  test("test_ca_01_return_own_or_operations_same_tenant_only", async () => {
    const f = await fixture();
    const loan = await f.caller().loans.request({ equipmentId: f.equipment[0].id });
    const anonymous = appRouter.createCaller({ ...f.context(), user: null, role: null, tenantId: null });
    await expect(anonymous.loans.return({ loanId: loan.id })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(f.caller(f.otherUser).loans.return({ loanId: loan.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      f.caller(f.outsider, "operacoes", f.otherTenant.id).loans.return({ loanId: loan.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const result = await f.caller(f.ops, "operacoes").loans.return({ loanId: loan.id });
    expect(result).toMatchObject({ id: loan.id, alreadyReturned: false });
    expect(result.returnedAt).toBeInstanceOf(Date);
    expect(await db.loan.findUnique({ where: { id: loan.id } })).toMatchObject({ returnedBy: f.ops });
  });
  test("test_ca_02_parallel_return_idempotent_timestamp_one_audit_and_maintenance_preserved", async () => {
    const f = await fixture();
    const loan = await f.caller().loans.request({ equipmentId: f.equipment[0].id });
    await db.equipment.update({ where: { id: f.equipment[0].id }, data: { situacao: "manutencao" } });
    const results = await Promise.all([
      f.caller().loans.return({ loanId: loan.id }),
      f.caller().loans.return({ loanId: loan.id }),
    ]);
    expect(results.filter((r) => !r.alreadyReturned)).toHaveLength(1);
    expect(results.filter((r) => r.alreadyReturned)).toHaveLength(1);
    expect(results[0].returnedAt).toEqual(results[1].returnedAt);
    const again = await f.caller().loans.return({ loanId: loan.id });
    expect(again.alreadyReturned).toBe(true);
    expect(again.returnedAt).toEqual(results[0].returnedAt);
    expect(await db.auditEvent.count({ where: { resourceId: loan.id, action: "loans.return" } })).toBe(1);
    expect(await db.equipment.findUnique({ where: { id: f.equipment[0].id } })).toMatchObject({
      situacao: "manutencao",
    });
    await expect(
      db.loan.update({ where: { id: loan.id }, data: { returnedAt: null, returnedBy: null } }),
    ).rejects.toThrow();
  });
  test("test_ca_02_failed_audit_rolls_back_return_in_real_transaction", async () => {
    const f = await fixture();
    const loan = await f.caller().loans.request({ equipmentId: f.equipment[0].id });
    await expect(
      restricted(f.tenant.id, f.user, "colaborador", async (tx) => {
        await tx.loan.update({
          where: { id: loan.id },
          data: { returnedAt: new Date(), returnedBy: f.user },
        });
        await tx.auditEvent.create({
          data: { tenantId: f.tenant.id, actorId: f.user, action: " ", resourceId: loan.id },
        });
      }),
    ).rejects.toThrow();
    expect(await db.loan.findUnique({ where: { id: loan.id } })).toMatchObject({
      returnedAt: null,
      returnedBy: null,
    });
    expect(await db.auditEvent.count({ where: { resourceId: loan.id, action: "loans.return" } })).toBe(0);
  });
  test("test_ca_04_ca_05_operations_list_stats_and_recent_isolate_other_tenant", async () => {
    const f = await fixture();
    const own = await f.caller().loans.request({ equipmentId: f.equipment[0].id });
    await f
      .caller(f.outsider, "operacoes", f.otherTenant.id)
      .loans.request({ equipmentId: f.outsideEquipment.id });
    await expect(f.caller().operations.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(f.caller().operations.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
    const operations = f.caller(f.ops, "operacoes");
    expect((await operations.operations.list({})).items.map((item) => item.id)).toEqual([own.id]);
    expect(await operations.operations.stats()).toEqual({ open: 1, late: 0, dueSoon: 0, maintenance: 0 });
    const recent = await operations.equipment.recent();
    expect(recent.map((item) => item.id)).not.toContain(f.outsideEquipment.id);
  });
  test("test_ca_06_ca_07_ca_08_equipment_create_authorized_atomic_unique_no_image", async () => {
    const f = await fixture();
    const input = {
      nome: "Projetor novo",
      categoria: "projetor" as const,
      patrimonio: "TI-0013",
      local: "Balcão TI",
      situacao: "disponivel" as const,
    };
    await expect(f.caller().equipment.create(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const item = await f.caller(f.ops, "operacoes").equipment.create(input);
    expect(item).toMatchObject({ patrimonio: input.patrimonio, categoria: "projetor", imageUrl: null });
    expect(
      await db.auditEvent.count({
        where: { resourceId: item.id, action: "equipment.create", actorId: f.ops },
      }),
    ).toBe(1);
    await expect(f.caller(f.ops, "operacoes").equipment.create(input)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(await db.equipment.count({ where: { tenantId: f.tenant.id, patrimonio: input.patrimonio } })).toBe(
      1,
    );
    const foreign = await f.caller(f.outsider, "operacoes", f.otherTenant.id).equipment.create(input);
    expect(await db.equipment.findUnique({ where: { id: foreign.id } })).toMatchObject({
      tenantId: f.otherTenant.id,
    });
    expect(await db.equipment.findUnique({ where: { id: item.id } })).toMatchObject({
      tenantId: f.tenant.id,
    });
  });
  test("test_ca_04_spec005_atraso_categoria_busca_cursor_e_tenant_combinados", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-14T02:30:00Z")); // Sexta-feira ainda em São Paulo.
    try {
      const f = await fixture();
      await db.equipment.update({
        where: { id: f.equipment[2].id },
        data: { categoria: "monitor", nome: "Monitor bancada" },
      });
      const requestedAt = new Date("2026-11-01T12:00:00Z");
      const loans = await Promise.all(
        f.equipment.slice(0, 4).map((equipment, index) =>
          db.loan.create({
            data: {
              tenantId: f.tenant.id,
              equipmentId: equipment.id,
              borrowerId: f.user,
              requestedAt,
              dueDate: new Date(index === 3 ? "2026-11-15T00:00:00Z" : "2026-11-12T00:00:00Z"),
            },
          }),
        ),
      );
      await db.loan.create({
        data: {
          tenantId: f.otherTenant.id,
          equipmentId: f.outsideEquipment.id,
          borrowerId: f.outsider,
          requestedAt,
          dueDate: new Date("2026-11-12T00:00:00Z"),
        },
      });
      const operations = f.caller(f.ops, "operacoes");
      const stats = await operations.operations.stats();
      expect(stats).toEqual({ open: 4, late: 3, dueSoon: 1, maintenance: 0 });
      const input = { filter: "late" as const, category: "notebook" as const, search: "Own user", limit: 1 };
      const first = await operations.operations.list(input);
      const expectedIds = loans
        .slice(0, 2)
        .map((loan) => loan.id)
        .sort()
        .reverse();
      expect(first.items.map((loan) => loan.id)).toEqual(expectedIds.slice(0, 1));
      expect(first.items[0]).toMatchObject({
        overdue: true,
        borrower: { displayName: "Own user" },
        equipment: { categoria: "notebook" },
      });
      expect(first.nextCursor).toEqual(expect.any(String));
      const second = await operations.operations.list({ ...input, cursor: first.nextCursor! });
      expect(second.items.map((loan) => loan.id)).toEqual(expectedIds.slice(1));
      expect(second.nextCursor).toBeNull();
      expect(new Set([...first.items, ...second.items].map((loan) => loan.id)).size).toBe(2);
      const monitor = await operations.operations.list({
        filter: "late",
        category: "monitor",
        search: "bancada",
      });
      expect(monitor.items.map((loan) => loan.id)).toEqual([loans[2].id]);
      expect(monitor.items[0]).toMatchObject({
        overdue: true,
        equipment: { categoria: "monitor", nome: "Monitor bancada" },
      });
      expect(
        (
          await operations.operations.list({ filter: "late", category: "monitor", search: "TI-0003" })
        ).items.map((loan) => loan.id),
      ).toEqual([loans[2].id]);
      expect(
        (await operations.operations.list({ filter: "late", category: "notebook", search: "bancada" })).items,
      ).toEqual([]);
      expect(
        (await operations.operations.list({ filter: "late", category: "monitor", search: "Outside" })).items,
      ).toEqual([]);
      expect(await operations.operations.stats()).toEqual(stats);
      await expect(f.caller().operations.list(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(operations.operations.list({ filter: "notebook" as "late" })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      await expect(operations.operations.list({ category: "invalid" as "notebook" })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    } finally {
      vi.useRealTimers();
    }
  });
  test("test_ca_04_spec005_semana_categoria_busca_limites_sao_paulo_sem_afetar_kpis", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-14T02:30:00Z"));
    try {
      const f = await fixture();
      await db.equipment.update({ where: { id: f.equipment[4].id }, data: { categoria: "monitor" } });
      const dueDates = ["2026-11-12", "2026-11-13", "2026-11-15", "2026-11-16", "2026-11-15", "2026-11-15"];
      const loans = await Promise.all(
        f.equipment.slice(0, 6).map((equipment, index) =>
          db.loan.create({
            data: {
              tenantId: f.tenant.id,
              equipmentId: equipment.id,
              borrowerId: f.user,
              requestedAt: new Date("2026-11-01T12:00:00Z"),
              dueDate: new Date(`${dueDates[index]}T00:00:00Z`),
              ...(index === 5 ? { returnedAt: new Date("2026-11-12T12:00:00Z"), returnedBy: f.user } : {}),
            },
          }),
        ),
      );
      await db.loan.create({
        data: {
          tenantId: f.otherTenant.id,
          equipmentId: f.outsideEquipment.id,
          borrowerId: f.outsider,
          requestedAt: new Date("2026-11-01T12:00:00Z"),
          dueDate: new Date("2026-11-15T00:00:00Z"),
        },
      });
      const operations = f.caller(f.ops, "operacoes");
      const stats = await operations.operations.stats();
      expect(stats).toEqual({ open: 5, late: 1, dueSoon: 4, maintenance: 0 });
      const notebooks = await operations.operations.list({
        filter: "soon",
        category: "notebook",
        search: "Own user",
      });
      expect(notebooks.items.map((loan) => loan.id).sort()).toEqual([loans[1].id, loans[2].id].sort());
      expect(notebooks.items.every((loan) => !loan.overdue && loan.equipment.categoria === "notebook")).toBe(
        true,
      );
      expect(
        (
          await operations.operations.list({ filter: "soon", category: "monitor", search: "TI-0005" })
        ).items.map((loan) => loan.id),
      ).toEqual([loans[4].id]);
      expect(
        (await operations.operations.list({ filter: "soon", category: "notebook", search: "TI-0004" })).items,
      ).toEqual([]);
      expect(
        (await operations.operations.list({ filter: "soon", search: "Own user" })).items
          .map((loan) => loan.id)
          .sort(),
      ).toEqual([loans[1].id, loans[2].id, loans[4].id].sort());
      expect(
        (
          await operations.operations.list({ filter: "all", category: "notebook", search: "TI-0004" })
        ).items.map((loan) => loan.id),
      ).toEqual([loans[3].id]);
      expect(await operations.operations.stats()).toEqual(stats);
    } finally {
      vi.useRealTimers();
    }
  });
});
