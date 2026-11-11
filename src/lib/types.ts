import type { RouterOutputs } from "./trpc";
export type Equipment = RouterOutputs["equipment"]["list"]["items"][number];
export type Category = "Notebooks" | "Monitores" | "Câmeras" | "Cabos" | "Projetores";
export type EquipmentState = "available" | "loaned" | "maintenance";
export const categories = ["notebook", "monitor", "cabo", "camera", "projetor"] as const;
export const categoryLabel = {
  notebook: "Notebooks",
  monitor: "Monitores",
  cabo: "Cabos",
  camera: "Câmeras",
  projetor: "Projetores",
} as const;
export function displayState(item: Pick<Equipment, "situacao">): EquipmentState | "retired" {
  if (item.situacao === "manutencao") return "maintenance";
  if (item.situacao === "fora_de_uso") return "retired";
  return item.situacao === "emprestado" ? "loaned" : "available";
}
export function civilDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return "—";
  return `${day}/${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(month) - 1]}`;
}
export function instantDate(value: Date | string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
