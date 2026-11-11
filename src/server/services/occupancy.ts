import { Prisma } from "@prisma/client";

export async function equipmentOccupancy(
  tx: Prisma.TransactionClient,
  tenantId: string,
  ids: string[],
): Promise<Map<string, boolean>> {
  if (!ids.length) return new Map();
  const rows = await tx.$queryRaw<Array<{ id: string; occupied: boolean }>>(Prisma.sql`
    SELECT e.id, public.equipment_has_open_loan(e.id) AS occupied
    FROM public.equipment e
    WHERE e.tenant_id = ${tenantId}::uuid
      AND e.id IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))})`);
  return new Map(rows.map((row) => [row.id, row.occupied]));
}
