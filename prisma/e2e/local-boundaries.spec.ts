import { expect, test } from "@playwright/test";

// E2E real do servidor local sem credenciais; não comprova login Supabase nem seed remoto.
test("test_ca_10_spec005_login_desktop_mobile_sem_overflow_e_rotulo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Quem está com o quê" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await expect(page.getByRole("navigation", { name: "Principal" })).toHaveCount(0);
});

test("test_ca_01_spec004_anonimo_nao_abre_catalogo_protegido", async ({ page }) => {
  await page.goto("/catalogo");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
});

test("test_ca_10_spec004_csp_nonce_sem_unsafe_inline_sem_erros_de_script", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/login");
  const csp = response?.headers()["content-security-policy"] ?? "";
  expect(csp).toContain("'nonce-");
  expect(csp).not.toContain("unsafe-inline");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  await page.getByLabel("E-mail").fill("test@example.org");
  await page.getByLabel("Senha").fill("fixture-local-only");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});
