import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => /^postgres(?:ql)?:/.test(value)),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  APP_URL: z.string().url(),
  RATE_LIMIT_SECRET: z.string().min(32),
  SENTRY_DSN: z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional()),
});
export type ServerEnv = z.infer<typeof envSchema>;
let cached: ServerEnv | undefined;
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") throw new Error("Configuração exclusiva do servidor");
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) throw new Error("Configuração de servidor inválida ou incompleta");
  for (const value of [parsed.data.APP_URL, parsed.data.SUPABASE_URL]) {
    const url = new URL(value);
    if (
      url.username ||
      url.password ||
      (url.protocol !== "https:" &&
        !(
          process.env.NODE_ENV !== "production" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
          url.protocol === "http:"
        ))
    ) {
      throw new Error("Configuração de servidor inválida ou incompleta");
    }
  }
  cached = parsed.data;
  return cached;
}
