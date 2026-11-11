// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Context } from "@/server/api/context";

vi.mock("@/server/services/rate-limit", () => ({
  consumeMutationLimit: vi.fn(),
  consumeLoginLimit: vi.fn(),
}));
vi.mock("@/server/services/equipment", () => ({
  listEquipment: vi.fn(),
  getEquipment: vi.fn(),
  recentEquipment: vi.fn(),
  createEquipment: vi.fn(),
}));
vi.mock("@/server/services/loans", () => ({ mine: vi.fn(), requestLoan: vi.fn(), returnLoan: vi.fn() }));
vi.mock("@/server/services/operations", () => ({ listOperations: vi.fn(), operationsStats: vi.fn() }));
vi.mock("@/server/services/auth", () => ({ me: vi.fn(), login: vi.fn(), logout: vi.fn() }));
import { appRouter } from "@/server/api/root";
import * as equipment from "@/server/services/equipment";
import * as loans from "@/server/services/loans";
import * as operations from "@/server/services/operations";
import * as auth from "@/server/services/auth";

const tenantId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const itemId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
function context(overrides: Partial<Context> = {}): Context {
  return {
    db: {} as PrismaClient,
    auth: {} as SupabaseClient,
    user: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", email: "private@example.com", name: "Colaborador" },
    role: "colaborador",
    tenantId,
    requestId: "request-test",
    ip: "unavailable",
    ...overrides,
  };
}
describe("tRPC authorization with explicit service mocks — not RLS or integration proof", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("test_ca_03_spec004_anonymous_is_rejected_by_every_protected_procedure", async () => {
    const caller = appRouter.createCaller(context({ user: null, tenantId: null, role: null }));
    for (const action of [
      () => caller.auth.me(),
      () => caller.equipment.list({}),
      () => caller.equipment.get({ patrimonio: "TI0001" }),
      () => caller.equipment.recent(),
      () => caller.loans.mine({}),
      () => caller.loans.request({ equipmentId: itemId }),
      () => caller.loans.return({ loanId: itemId }),
      () => caller.operations.list({}),
      () => caller.operations.stats(),
    ]) {
      await expect(action()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
    expect(equipment.listEquipment).not.toHaveBeenCalled();
  });
  it("test_ca_02_spec004_missing_membership_is_forbidden_and_promotion_input_rejected", async () => {
    await expect(
      appRouter.createCaller(context({ tenantId: null, role: null })).equipment.list({}),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const caller = appRouter.createCaller(context());
    await expect(caller.equipment.list({ role: "operacoes" } as never)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      caller.loans.request({ equipmentId: itemId, tenantId: "other" } as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("test_ca_01_spec005_collaborator_cannot_access_operations_or_create_equipment", async () => {
    const caller = appRouter.createCaller(context());
    for (const action of [
      () => caller.operations.list({}),
      () => caller.operations.stats(),
      () => caller.equipment.recent(),
      () =>
        caller.equipment.create({
          nome: "Monitor",
          categoria: "monitor",
          patrimonio: "TI-0013",
          local: "Balcão",
          situacao: "disponivel",
        }),
    ])
      await expect(action()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(operations.operationsStats).not.toHaveBeenCalled();
    expect(equipment.createEquipment).not.toHaveBeenCalled();
  });
  it("test_ca_02_spec003_context_injected_and_response_body_preserved_without_tenant_input", async () => {
    const result = { items: [], total: 12, available: 9, nextCursor: null };
    vi.mocked(equipment.listEquipment).mockResolvedValue(result);
    const ctx = context();
    expect(await appRouter.createCaller(ctx).equipment.list({ search: "TI" })).toEqual(result);
    expect(equipment.listEquipment).toHaveBeenCalledWith(ctx, { search: "TI", limit: 24 });
    const loanResult = { items: [], nextCursor: null };
    vi.mocked(loans.mine).mockResolvedValue(loanResult);
    expect(await appRouter.createCaller(ctx).loans.mine({ history: true })).toEqual(loanResult);
    expect(loans.mine).toHaveBeenCalledWith(ctx, { history: true, limit: 24 });
  });
  it("test_ca_03_spec004_operations_role_reaches_service_with_own_tenant_and_body", async () => {
    const ctx = context({ role: "operacoes" });
    const result = { open: 2, late: 1, dueSoon: 0, maintenance: 3 };
    vi.mocked(operations.operationsStats).mockResolvedValue(result);
    expect(await appRouter.createCaller(ctx).operations.stats()).toEqual(result);
    expect(operations.operationsStats).toHaveBeenCalledWith(ctx);
    const meResult = {
      user: ctx.user!,
      tenantId,
      role: "operacoes" as const,
      openCount: 2,
      overdue: true,
      dueDate: "2026-11-24",
    };
    vi.mocked(auth.me).mockResolvedValue(meResult);
    expect(await appRouter.createCaller(ctx).auth.me()).toEqual(meResult);
  });
});

describe("HTTP adapter safety — mocked context/services", () => {
  it("test_ca_10_spec004_get_mutation_rejected_and_internal_errors_sanitized", async () => {
    const { fetchRequestHandler } = await import("@trpc/server/adapters/fetch");
    const { TRPCError } = await import("@trpc/server");
    const request = (path: string) => new Request(`https://app.example/api/trpc/${path}`);
    const mutation = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request("auth.login"),
      router: appRouter,
      createContext: () => context(),
      allowMethodOverride: false,
    });
    expect(mutation.status).toBe(405);
    vi.mocked(auth.me).mockRejectedValueOnce(
      new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "SQL private password secret@example.com",
        cause: new Error("private stack"),
      }),
    );
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request("auth.me"),
      router: appRouter,
      createContext: () => context(),
      allowMethodOverride: false,
    });
    const body = await response.text();
    expect(response.status).toBe(500);
    expect(body).toContain("Não foi possível concluir a operação");
    expect(body).not.toContain("private");
    expect(body).not.toContain("password");
    expect(body).not.toContain("stack");
  });
});
