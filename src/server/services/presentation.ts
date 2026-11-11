import type { Equipment, Loan } from "@prisma/client";
import { getServerEnv } from "@/env";
import { civilDate, isOverdue, localToday } from "./dates";

export function storageImageUrl(path: string | null): string | null {
  if (
    !path ||
    !/^[a-zA-Z0-9_/-]+\.(?:jpg|jpeg|png|webp)$/.test(path) ||
    path.split("/").some((segment) => !segment || segment === "." || segment === "..")
  )
    return null;
  const env = getServerEnv();
  return `${new URL(env.SUPABASE_URL).origin}/storage/v1/object/public/${encodeURIComponent(env.SUPABASE_STORAGE_BUCKET)}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
function safePixabayUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      ["pixabay.com", "www.pixabay.com"].includes(url.hostname) &&
      !url.username &&
      !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
export function equipmentDto(equipment: Equipment, hasOpenLoan = false) {
  return {
    id: equipment.id,
    patrimonio: equipment.patrimonio,
    nome: equipment.nome,
    categoria: equipment.categoria,
    situacao:
      equipment.situacao === "disponivel" && hasOpenLoan ? ("emprestado" as const) : equipment.situacao,
    local: equipment.local,
    numeroSerie: equipment.numeroSerie,
    observacoes: equipment.observacoes,
    imageUrl: storageImageUrl(equipment.imagePath),
    photoSource:
      equipment.photoSource === "Pixabay" || equipment.photoSource === "pixabay" ? "Pixabay" : null,
    photoPage: safePixabayUrl(equipment.photoPage),
    photographer: equipment.photographer,
    photographerUrl: safePixabayUrl(equipment.photographerUrl),
    licenseName: equipment.licenseName,
    licenseUrl: safePixabayUrl(equipment.licenseUrl),
    createdAt: equipment.createdAt,
  };
}
export function loanDto(loan: Loan & { equipment: Equipment }, today = localToday()) {
  return {
    id: loan.id,
    equipmentId: loan.equipmentId,
    equipment: equipmentDto(loan.equipment, loan.returnedAt === null),
    requestedAt: loan.requestedAt,
    dueDate: civilDate(loan.dueDate),
    returnedAt: loan.returnedAt,
    overdue: isOverdue(loan.dueDate, loan.returnedAt, today),
  };
}
