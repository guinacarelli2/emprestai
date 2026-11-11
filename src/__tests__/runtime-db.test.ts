// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { validateRuntimeDatabase } from "@/server/db";

function connection(safe: boolean, role = "emprestai_app") {
  const query = vi
    .fn()
    .mockResolvedValueOnce([{ safe }])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ name: role }]);
  const execute = vi.fn().mockResolvedValue(0);
  const db = {
    $transaction: (work: (tx: object) => Promise<void>) =>
      work({ $queryRaw: query, $executeRaw: execute }),
  } as unknown as PrismaClient;
  return { db, query, execute };
}

describe("004 runtime validation — pure mocks, not real role evidence", () => {
  it("test_ca_05_invalid_catalog_state_fails_before_set_role", async () => {
    const f = connection(false);
    await expect(validateRuntimeDatabase(f.db)).rejects.toThrow(
      "Conexão runtime recusada",
    );
    expect(f.execute).not.toHaveBeenCalled();
  });

  it("test_ca_05_role_switch_must_be_effective_and_driver_errors_are_sanitized", async () => {
    await expect(
      validateRuntimeDatabase(connection(true, "owner").db),
    ).rejects.toThrow("Conexão runtime recusada");

    const f = connection(true);
    f.query
      .mockReset()
      .mockRejectedValue(
        new Error("postgresql://private:secret@host SQL details"),
      );
    await expect(validateRuntimeDatabase(f.db)).rejects.toThrow(
      /^Conexão runtime recusada:/,
    );
  });

  it("test_ca_05_valid_state_switches_role_and_clears_local_settings", async () => {
    const f = connection(true);
    await validateRuntimeDatabase(f.db);
    expect(f.execute).toHaveBeenCalledWith(
      expect.arrayContaining(["SET LOCAL ROLE emprestai_app"]),
    );
    expect(f.query.mock.calls[1][0].join("")).toContain(
      "set_config('app.tenant_id', '', true)",
    );
    expect(f.query.mock.calls[1][0].join("")).toContain(
      "set_config('app.user_id', '', true)",
    );
    expect(f.query.mock.calls[1][0].join("")).toContain(
      "set_config('app.role', '', true)",
    );
  });
});