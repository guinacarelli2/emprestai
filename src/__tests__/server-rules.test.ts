// @vitest-environment node
import { describe, expect, it } from "vitest";
import { addCalendarDays, asDbDate, endOfWeek, isOverdue, localToday } from "@/server/services/dates";
import { validateEligibility } from "@/server/services/loans";
import { decodeCursor, encodeCursor, page } from "@/server/services/pagination";
import {
  equipmentCreateSchema,
  equipmentListSchema,
  loanRequestSchema,
  loginSchema,
} from "@/server/api/schemas";
import { isAllowedMutation, trustedClientIp } from "@/server/security";

describe("Backend pure rules — not database integration", () => {
  it("test_ca_04_spec003_civil_date_midnight_and_calendar_boundaries", () => {
    expect(localToday(new Date("2026-01-01T02:59:59Z"))).toBe("2025-12-31");
    expect(localToday(new Date("2026-01-01T03:00:00Z"))).toBe("2026-01-01");
    expect(addCalendarDays("2024-02-20", 14)).toBe("2024-03-05");
    expect(addCalendarDays("2026-12-25", 14)).toBe("2027-01-08");
    expect(isOverdue(asDbDate("2026-11-10"), null, "2026-11-10")).toBe(false);
    expect(isOverdue(asDbDate("2026-11-10"), null, "2026-11-11")).toBe(true);
    expect(isOverdue(asDbDate("2026-11-10"), new Date(), "2026-11-11")).toBe(false);
  });
  it("test_ca_03_spec003_eligibility_is_rechecked_and_never_accepts_three_or_late", () => {
    const open = { dueDate: asDbDate("2026-11-10"), returnedAt: null };
    expect(() => validateEligibility([open, open], "disponivel", false, "2026-11-10")).not.toThrow();
    expect(() => validateEligibility([open, open, open], "disponivel", false, "2026-11-10")).toThrow(
      "Limite de três",
    );
    expect(() => validateEligibility([open], "disponivel", false, "2026-11-11")).toThrow("atraso");
    expect(() => validateEligibility([], "manutencao", false, "2026-11-10")).toThrow("manutenção");
    expect(() => validateEligibility([], "fora_de_uso", false, "2026-11-10")).toThrow("fora de uso");
    expect(() => validateEligibility([], "disponivel", true, "2026-11-10")).toThrow("já emprestado");
  });
  it("test_ca_06_spec005_create_validation_rejects_unknown_role_tenant_image_and_invalid_category", () => {
    const item = {
      nome: "Monitor TI-0013",
      categoria: "monitor",
      patrimonio: "TI-0013",
      local: "Balcão",
      situacao: "disponivel",
    };
    expect(equipmentCreateSchema.parse(item)).toEqual(item);
    for (const extra of [
      { tenantId: "other" },
      { role: "operacoes" },
      { imageUrl: "https://evil.invalid/a.jpg" },
    ])
      expect(equipmentCreateSchema.safeParse({ ...item, ...extra }).success).toBe(false);
    expect(equipmentCreateSchema.safeParse({ ...item, patrimonio: "PAT-0013" }).success).toBe(false);
    expect(equipmentCreateSchema.safeParse({ ...item, categoria: "outro" }).success).toBe(false);
    expect(equipmentCreateSchema.safeParse({ ...item, situacao: "emprestado" }).success).toBe(false);
    expect(equipmentCreateSchema.safeParse({ ...item, categoria: "projetor" }).success).toBe(true);
    expect(loanRequestSchema.safeParse({ equipmentId: "not-uuid" }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email: "a@example.com", password: "password", role: "operacoes" }).success,
    ).toBe(false);
    expect(equipmentListSchema.parse({}).limit).toBe(24);
  });
  it("test_ca_04_spec005_stable_cursor_uses_timestamp_and_id_and_rejects_bad_payload", () => {
    const date = new Date("2026-11-10T03:00:00Z");
    const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    expect(decodeCursor(encodeCursor(date, id))).toEqual({ at: date, id });
    expect(() => decodeCursor("invalid")).toThrow();
    expect(page([{ id }, { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }], 1, () => date).nextCursor).toBe(
      encodeCursor(date, id),
    );
    expect(page([{ id }], 1, () => date).nextCursor).toBeNull();
    expect(endOfWeek("2026-11-10")).toBe("2026-11-15");
    expect(endOfWeek("2026-11-15")).toBe("2026-11-15");
  });
  it("test_ca_10_spec004_csrf_rejects_missing_origin_cross_origin_and_non_json", () => {
    const request = (origin?: string, contentType = "application/json", method = "POST") =>
      new Request("https://app.example/api/trpc/auth.login", {
        method,
        headers: { "content-type": contentType, ...(origin ? { origin } : {}) },
      });
    expect(isAllowedMutation(request("https://app.example"), "https://app.example")).toBe(true);
    expect(isAllowedMutation(request("https://evil.example"), "https://app.example")).toBe(false);
    expect(isAllowedMutation(request(), "https://app.example")).toBe(false);
    expect(isAllowedMutation(request("https://app.example", "text/plain"), "https://app.example")).toBe(
      false,
    );
    expect(
      isAllowedMutation(request("https://app.example", "application/json", "GET"), "https://app.example"),
    ).toBe(false);
    expect(trustedClientIp(new Headers({ "x-forwarded-for": "1.2.3.4" }))).toBe("unavailable");
  });
});
