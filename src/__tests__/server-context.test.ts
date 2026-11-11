// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveIdentity } from "@/server/api/context";
import { equipmentDto, loanDto, storageImageUrl } from "@/server/services/presentation";
import type { Equipment, Loan } from "@prisma/client";

function dependencies(
  user: { id: string; email: string; user_metadata?: object } | null,
  membership: object | null,
  error: object | null = null,
) {
  const getUser = vi.fn().mockResolvedValue({ data: { user }, error });
  const getSession = vi.fn();
  const queryRaw = vi.fn().mockResolvedValue(membership ? [membership] : []);
  return {
    auth: { auth: { getUser, getSession } } as unknown as SupabaseClient,
    db: { $queryRaw: queryRaw } as unknown as PrismaClient,
    getUser,
    getSession,
    queryRaw,
  };
}
describe("Verified server identity and public DTOs — pure mocks, not Auth integration", () => {
  it("test_ca_01_spec004_identity_only_uses_verified_getUser_not_session", async () => {
    const deps = dependencies(
      { id: "user-real", email: "own@example.com" },
      { tenantId: "tenant-a", role: "colaborador", displayName: "Nome real" },
    );
    expect(await resolveIdentity(deps.auth, deps.db)).toEqual({
      user: { id: "user-real", email: "own@example.com", name: "Nome real" },
      tenantId: "tenant-a",
      role: "colaborador",
    });
    expect(deps.getSession).not.toHaveBeenCalled();
    expect(deps.queryRaw).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining("public.runtime_membership(")]),
      "user-real",
    );
  });
  it("test_ca_02_spec004_metadata_cannot_promote_role_and_no_membership_is_not_tenant", async () => {
    const deps = dependencies(
      { id: "user-real", email: "own@example.com", user_metadata: { role: "operacoes", tenantId: "evil" } },
      null,
    );
    expect(await resolveIdentity(deps.auth, deps.db)).toEqual({
      user: { id: "user-real", email: "own@example.com", name: "Colaborador" },
      tenantId: null,
      role: null,
    });
    const failed = dependencies({ id: "bad", email: "own@example.com" }, {}, { message: "invalid token" });
    expect(await resolveIdentity(failed.auth, failed.db)).toEqual({ user: null, tenantId: null, role: null });
    expect(failed.queryRaw).not.toHaveBeenCalled();
  });
  it("test_ca_06_spec004_equipment_and_loan_dto_never_return_borrower_tokens_or_tenant", () => {
    const item = {
      id: "item",
      tenantId: "tenant",
      patrimonio: "TI-0001",
      nome: "Notebook",
      categoria: "notebook",
      situacao: "disponivel",
      local: "Balcão",
      numeroSerie: null,
      observacoes: null,
      imagePath: null,
      photoSource: null,
      photoPage: null,
      photographer: null,
      photographerUrl: null,
      licenseName: null,
      licenseUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageHash: null,
      photoId: null,
    } as Equipment;
    const dto = equipmentDto(item, true);
    expect(dto.situacao).toBe("emprestado");
    expect(dto.imageUrl).toBeNull();
    expect(dto).not.toHaveProperty("tenantId");
    const loan = {
      id: "loan",
      tenantId: "tenant",
      borrowerId: "private",
      equipmentId: "item",
      equipment: item,
      requestedAt: new Date(),
      dueDate: new Date("2026-11-10T00:00:00Z"),
      returnedAt: null,
      returnedBy: null,
    } as Loan & { equipment: Equipment };
    const body = loanDto(loan, "2026-11-10");
    expect(body.dueDate).toBe("2026-11-10");
    expect(body.overdue).toBe(false);
    expect(body).not.toHaveProperty("borrowerId");
    expect(body).not.toHaveProperty("tenantId");
  });
  it("test_ca_08_spec005_image_url_rejects_arbitrary_host_and_path_before_env", () => {
    for (const path of [
      null,
      "https://evil.invalid/a.jpg",
      "../a.jpg",
      "a//a.jpg",
      "a/a.svg",
      "a/%2e%2e/a.jpg",
      "a/../../a.jpg",
    ])
      expect(storageImageUrl(path)).toBeNull();
  });
});
