import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Variantes do layout.md §5.1. Primário é sempre contornado, nunca sólido. */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[7px] rounded-[8px] border text-[13px] whitespace-nowrap transition-[background-color,border-color,color,transform] duration-[140ms] ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "border-accent-500 bg-transparent font-semibold text-accent-300 hover:bg-[rgba(91,127,224,0.12)] hover:text-accent-100",
        confirm:
          "border-accent-500 bg-[rgba(91,127,224,0.12)] font-semibold text-accent-200 hover:bg-[rgba(91,127,224,0.2)] hover:text-accent-200",
        secondary: "border-strong bg-transparent text-ink-400 hover:border-ink-700 hover:text-text",
        row: "border-strong bg-transparent font-semibold text-accent-200 hover:border-accent-500 hover:bg-[rgba(91,127,224,0.1)] hover:text-accent-200",
        rowLate:
          "border-accent-500 bg-[rgba(91,127,224,0.14)] font-semibold text-accent-200 hover:bg-[rgba(91,127,224,0.24)] hover:text-accent-200",
      },
      size: {
        form: "h-[44px] px-5 text-[14px]",
        dialog: "h-[38px] px-4",
        list: "h-9 px-4",
        header: "h-[34px] px-[14px]",
        table: "h-[30px] rounded-[7px] px-3 text-[12px]",
      },
    },
    defaultVariants: { variant: "primary", size: "list" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
