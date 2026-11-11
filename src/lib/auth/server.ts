import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnv } from "@/env";

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};
export async function createAuthClient() {
  const env = getServerEnv();
  const store = await cookies();
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values)
          store.set(name, value, { ...options, ...authCookieOptions });
      },
    },
  });
}
export async function clearAuthCookies() {
  const store = await cookies();
  for (const { name } of store.getAll()) {
    if (name.startsWith("sb-") && (name.includes("-auth-token") || name.endsWith("-code-verifier"))) {
      store.set(name, "", { ...authCookieOptions, maxAge: 0 });
    }
  }
}
