import { cn } from "@/lib/utils";
import type { EquipmentState } from "@/lib/types";

export type PillState = EquipmentState | "retired";

const styles: Record<PillState, string> = {
  available: "border-ok-line bg-ok-bg text-ok",
  loaned: "border-strong bg-soft text-ink-400",
  maintenance: "border-warn-line bg-warn-bg text-warn",
  retired: "border-strong bg-soft text-ink-400",
};

export const pillLabel: Record<PillState, string> = {
  available: "Disponível",
  loaned: "Emprestado",
  maintenance: "Manutenção",
  retired: "Fora de uso",
};

export function Pill({ state, className }: { state: PillState; className?: string }) {
  return (
    <span
      data-state={state}
      className={cn("inline-flex rounded-full border px-[9px] py-[3px] text-[11px] font-semibold", styles[state], className)}
    >
      {pillLabel[state]}
    </span>
  );
}
