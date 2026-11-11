import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-fit overflow-hidden rounded-[8px] border border-strong">
      {options.map((option, i) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === value}
          onClick={() => onChange(option)}
          className={cn(
            "px-[18px] py-[9px] text-[13px] transition-colors duration-[140ms] ease-out",
            i > 0 && "border-l border-strong",
            option === value ? "bg-accent-800 font-semibold text-accent-200" : "text-ink-400 hover:text-text",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
