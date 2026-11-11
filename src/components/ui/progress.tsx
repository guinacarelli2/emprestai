import { cn } from "@/lib/utils";

/** Segmentos de limite (layout.md §5.10): três divs de 5px. */
export function LimitSegments({ used, max = 3, className }: { used: number; max?: number; className?: string }) {
  return (
    <div role="img" aria-label={`${used} de ${max} itens`} className={cn("flex gap-[5px]", className)}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          data-on={i < used}
          className={cn(
            "h-[5px] flex-1 rounded-full transition-colors duration-[240ms] ease-out",
            i < used ? "bg-accent-500" : "bg-frame",
          )}
        />
      ))}
    </div>
  );
}

/* Classes literais: o Tailwind só gera o que encontra escrito (sem style inline por causa da CSP). */
const WIDTHS = [
  "w-[0%]",
  "w-[7%]",
  "w-[14%]",
  "w-[21%]",
  "w-[29%]",
  "w-[36%]",
  "w-[43%]",
  "w-[50%]",
  "w-[57%]",
  "w-[64%]",
  "w-[71%]",
  "w-[79%]",
  "w-[86%]",
  "w-[93%]",
  "w-full",
];

/** Barra de prazo: dias decorridos / 14. */
export function DeadlineBar({ elapsedDays, overdue }: { elapsedDays: number; overdue?: boolean }) {
  const idx = Math.max(0, Math.min(14, Math.round(elapsedDays)));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={14}
      aria-valuenow={idx}
      aria-label="Dias decorridos do prazo"
      className="h-1 overflow-hidden rounded-full bg-frame"
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-[240ms] ease-out",
          WIDTHS[idx],
          overdue ? "bg-late-label" : "bg-accent-500",
        )}
      />
    </div>
  );
}
