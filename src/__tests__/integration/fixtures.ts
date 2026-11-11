import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext, Role } from "@/server/api/context";
import { appRouter } from "@/server/api/root";
import { getDb } from "@/server/db";

export const db = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL! } } });
export const runtimeDb = await getDb();
export async function fixture() {
  const tenant = await db.tenant.create({ data: { slug: `integration_${randomUUID()}` } });
  const otherTenant = await db.tenant.create({ data: { slug: `integration_${randomUUID()}` } });
  const user = randomUUID(), otherUser = randomUUID(), ops = randomUUID(), outsider = randomUUID();
  await db.membership.createMany({ data: [
    { tenantId: tenant.id, userId: user, role: "colaborador", displayName: "Own user" },
    { tenantId: tenant.id, userId: otherUser, role: "colaborador", displayName: "Private other name" },
    { tenantId: tenant.id, userId: ops, role: "operacoes", displayName: "Operations" },
    { tenantId: otherTenant.id, userId: outsider, role: "operacoes", displayName: "Outside tenant" },
  ] });
  const equipment = await Promise.all(Array.from({ length: 7 }, (_, i) => db.equipment.create({ data: {
    tenantId: tenant.id, patrimonio: `TI-${String(i + 1).padStart(4, "0")}`, nome: `Notebook ${i}`, categoria: "notebook", local: "Local TI", situacao: "disponivel",
  } })));
  const outsideEquipment = await db.equipment.create({ data: { tenantId: otherTenant.id, patrimonio: "TI-0001", nome: "Outside item", categoria: "monitor", local: "Other TI" } });
  function context(userId = user, role: Role = "colaborador", tenantId = tenant.id): TenantContext {
    return { db: runtimeDb, auth: {} as SupabaseClient, user: { id: userId, email: "local@example.test", name: "Fixture" }, tenantId, role, requestId: randomUUID(), ip: randomUUID() };
  }
  function caller(userId = user, role: Role = "colaborador", tenantId = tenant.id) { return appRouter.createCaller(context(userId, role, tenantId)); }
  return { tenant, otherTenant, user, otherUser, ops, outsider, equipment, outsideEquipment, context, caller };
}
export async function restricted<T>(tenantId: string | null, userId: string | null, role: string | null, work: (tx: Prisma.TransactionClient) => Promise<T>) {
  return runtimeDb.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL ROLE emprestai_app`;
    await tx.$queryRaw`SELECT set_config('app.tenant_id', ${tenantId ?? ""}, true), set_config('app.user_id', ${userId ?? ""}, true), set_config('app.role', ${role ?? ""}, true)`;
    return work(tx);
  });
}
export const futureDue = () => new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 14 * 86400000))}T00:00:00.000Z`);
