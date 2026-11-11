import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { getServerEnv } from "@/env";

export function trustedClientIp(headers: Headers): string {
  if (process.env.VERCEL === "1") {
    const value = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
    if (value && isIP(value)) return value;
  }
  return "unavailable";
}
export function pseudonym(scope: string, value: string): string {
  return createHmac("sha256", getServerEnv().RATE_LIMIT_SECRET).update(`${scope}:${value}`).digest("hex");
}
export function isAllowedMutation(req: Request, appUrl: string): boolean {
  if (req.method !== "POST" || !req.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return false;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(appUrl).origin && origin === new URL(origin).origin;
  } catch {
    return false;
  }
}
