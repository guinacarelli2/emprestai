import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAuthClient } from "@/lib/auth/server";
import { getDb } from "@/server/db";
import { trustedClientIp } from "@/server/security";

export type Identity = { id: string; email: string; name: string };
export type Role = "colaborador" | "operacoes";
export type Context = {
  db: PrismaClient;
  auth: SupabaseClient;
  user: Identity | null;
  tenantId: string | null;
  role: Role | null;
  requestId: string;
  ip: string;
};
export type TenantContext = Context & { user: Identity; tenantId: string; role: Role };
export async function resolveIdentity(auth: SupabaseClient, db: PrismaClient) {
  const { data, error } = await auth.auth.getUser();
  if (error || !data.user) return { user: null, tenantId: null, role: null };
  const [membership] = await db.$queryRaw<
    Array<{ tenantId: string; role: Role; displayName: string }>
  >`SELECT tenant_id AS "tenantId", role, display_name AS "displayName" FROM public.runtime_membership(${data.user.id}::uuid)`;
  const user = {
    id: data.user.id,
    email: data.user.email ?? "",
    name: membership?.displayName ?? "Colaborador",
  };
  if (!membership) return { user, tenantId: null, role: null };
  const role: Role = membership.role === "operacoes" ? "operacoes" : "colaborador";
  return { user, tenantId: membership.tenantId, role };
}
export async function createContext({ req }: { req: Request }): Promise<Context> {
  const auth = await createAuthClient();
  const db = await getDb();
  return {
    auth,
    db,
    ...(await resolveIdentity(auth, db)),
    requestId: randomUUID(),
    ip: trustedClientIp(req.headers),
  };
}
