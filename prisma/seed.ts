import { PrismaClient, type Category, type EquipmentState } from "@prisma/client";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const seedItem = z.object({
  patrimonio: z.string().regex(/^TI-\d{4}$/),
  nome: z.string().min(2),
  categoria: z.enum(["notebook", "monitor", "cabo", "camera"]),
  situacao: z.enum(["disponivel", "manutencao"]),
  busca: z.string().min(1),
}).strict();
export type SeedImage = {
  patrimonio: string;
  imagePath: string;
  photoId: string;
  photoPage: string;
  photographer: string;
  photographerUrl: string;
  licenseName: string;
  licenseUrl: string;
  imageHash: string;
};

export async function seedInventory(
  db: PrismaClient,
  identities: { teacher: string; operations: string; test: string },
  images: SeedImage[] = [],
) {
  const ids = z.object({ teacher: z.string().uuid(), operations: z.string().uuid(), test: z.string().uuid() }).parse(identities);
  if (new Set(Object.values(ids)).size !== 3) throw new Error("Professor, Operações e testes precisam de identidades distintas.");
  const list = z.array(seedItem).length(12).parse(JSON.parse(await readFile(resolve("assets/equipment-list.json"), "utf8")));
  const expected = Array.from({ length: 12 }, (_, i) => `TI-${String(i + 1).padStart(4, "0")}`);
  if (list.some((item, i) => item.patrimonio !== expected[i])) throw new Error("Lista de patrimônios divergente do enunciado.");
  const maintenance = new Set(["TI-0004", "TI-0007", "TI-0010"]);
  if (list.some((item) => (item.situacao === "manutencao") !== maintenance.has(item.patrimonio))) throw new Error("Estados do inventário divergentes da decisão registrada.");
  if (images.length && (images.length !== 12 || new Set(images.map((i) => i.photoId)).size !== 12 || new Set(images.map((i) => i.imageHash)).size !== 12)) throw new Error("As doze fotos devem ter IDs e hashes distintos.");

  return db.$transaction(async (tx) => {
    const tenant = await tx.tenant.upsert({ where: { slug: "suporte_ti" }, update: {}, create: { slug: "suporte_ti" } });
    const professorLoans = await tx.loan.count({ where: { tenantId: tenant.id, borrowerId: ids.teacher } });
    if (professorLoans) throw new Error("A conta do professor já tem empréstimos. Nada foi apagado; revise antes de entregar.");
    for (const identity of [
      { userId: ids.teacher, role: "colaborador" as const, displayName: "Professor" },
      { userId: ids.operations, role: "operacoes" as const, displayName: "Operações" },
      { userId: ids.test, role: "colaborador" as const, displayName: "Conta de testes" },
    ]) {
      const existing = await tx.membership.findUnique({ where: { tenantId_userId: { tenantId: tenant.id, userId: identity.userId } } });
      if (existing && existing.role !== identity.role) throw new Error("Um vínculo existente tem papel diferente do planejado. Não foi sobrescrito.");
      await tx.membership.upsert({ where: { tenantId_userId: { tenantId: tenant.id, userId: identity.userId } }, update: {}, create: { tenantId: tenant.id, ...identity } });
    }
    for (const item of list) {
      const image = images.find((entry) => entry.patrimonio === item.patrimonio);
      const photo = image ? {
        imagePath: image.imagePath, photoSource: "Pixabay", photoId: image.photoId, photoPage: image.photoPage,
        photographer: image.photographer, photographerUrl: image.photographerUrl, licenseName: image.licenseName,
        licenseUrl: image.licenseUrl, imageHash: image.imageHash,
      } : {};
      await tx.equipment.upsert({
        where: { tenantId_patrimonio: { tenantId: tenant.id, patrimonio: item.patrimonio } },
        update: photo,
        create: { tenantId: tenant.id, patrimonio: item.patrimonio, nome: item.nome, categoria: item.categoria as Category, situacao: item.situacao as EquipmentState, local: "Balcão 2º andar", ...photo },
      });
    }
    return { equipment: list.length, images: images.length, professorLoans: 0 };
  }, { maxWait: 10000, timeout: 60000 });
}

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("Este seed direto só executa no banco local. Produção exige o roteiro humano.");
  if (!/^emprestai_(?:local|disposable|test)/.test(url.pathname.slice(1))) throw new Error("Use banco local dedicado emprestai_local/test/disposable.");
  const db = new PrismaClient();
  try {
    const result = await seedInventory(db, { teacher: process.env.TEACHER_AUTH_USER_ID ?? "", operations: process.env.OPERATIONS_AUTH_USER_ID ?? "", test: process.env.TEST_AUTH_USER_ID ?? "" });
    console.log(JSON.stringify({ action: "local_seed", ...result, note: "Sem fotos ainda; executar pipeline e associação verificada antes de entregar." }));
  } finally { await db.$disconnect(); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => { console.error("Seed não concluído. Verifique banco local dedicado, identidades, lista e papéis; nenhum segredo foi exibido."); process.exitCode = 1; });
}
