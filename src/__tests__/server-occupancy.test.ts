// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { equipmentOccupancy } from "@/server/services/occupancy";

// These are SQL construction tests, not proof of RLS or real database behavior.
describe("Occupancy helper — explicit transaction mock", () => {
  it("test_ca_privacy_occupancy_returns_only_item_booleans_and_parameterizes_tenant_ids", async () => {
    const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const tenant = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const query = vi.fn().mockResolvedValue([{ id, occupied: true }]);
    const tx = { $queryRaw: query } as unknown as Prisma.TransactionClient;
    expect(await equipmentOccupancy(tx, tenant, [id])).toEqual(new Map([[id, true]]));
    const sql = query.mock.calls[0][0] as Prisma.Sql;
    expect(sql.sql).toContain("public.equipment_has_open_loan(e.id)");
    expect(sql.sql).not.toContain("FROM public.loans");
    expect(sql.sql).not.toContain(tenant);
    expect(sql.sql).not.toContain(id);
    expect(sql.values).toEqual([tenant, id]);
  });
  it("test_ca_privacy_empty_batch_never_executes_sql", async () => {
    const query = vi.fn();
    expect(
      await equipmentOccupancy({ $queryRaw: query } as unknown as Prisma.TransactionClient, "tenant", []),
    ).toEqual(new Map());
    expect(query).not.toHaveBeenCalled();
  });
});
