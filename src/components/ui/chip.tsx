import * as React from "react";
import { cn } from "@/lib/utils";

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean };

export function Chip({ active, className, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-[6px] rounded-full border px-3 py-[6px] text-[12px] transition-[background-color,border-color,color] duration-[140ms] ease-out",
        active
          ? "border-accent-700 bg-accent-800 text-accent-200"
          : "border-frame bg-transparent text-ink-400 hover:text-text",
        className,
      )}
      {...props}
    />
  );
}
