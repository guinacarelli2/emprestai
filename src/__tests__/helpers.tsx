import { vi } from "vitest";

export const push = vi.fn();
export const pathname = { current: "/catalogo" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => pathname.current,
  redirect: vi.fn(),
  notFound: vi.fn(),
}));
