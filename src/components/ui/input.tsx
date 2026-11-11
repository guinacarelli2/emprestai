import { CaretDown } from "@phosphor-icons/react";
import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "h-[42px] min-w-0 w-full rounded-[8px] border border-strong bg-sunken px-3 text-[14px] text-text placeholder:text-faint";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(field, className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea ref={ref} className={cn(field, "h-[88px] resize-none px-3 py-[10px]", className)} {...props} />
  );
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative flex items-center">
        <select ref={ref} className={cn(field, "appearance-none pr-9", className)} {...props}>
          {children}
        </select>
        <CaretDown size={13} className="pointer-events-none absolute right-3 text-faint" aria-hidden />
      </div>
    );
  },
);

export function Field({
  label,
  htmlFor,
  error,
  wide,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-[6px]", wide && "col-span-2")}>
      <label htmlFor={htmlFor} className="text-[12px] text-ink-400">
        {label}
      </label>
      {children}
      {error ? (
        <span role="alert" className="text-[11.5px] text-late-label">
          {error}
        </span>
      ) : null}
    </div>
  );
}
