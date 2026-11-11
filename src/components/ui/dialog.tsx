import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;

/** Diálogo do layout.md §5.9: 432px, padding 24, raio 14, shadow-lg. */
export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[rgba(4,6,14,0.68)] data-[state=closed]:animate-[backdrop-out_120ms_ease-in] data-[state=open]:animate-[backdrop-in_180ms_cubic-bezier(.2,.8,.2,1)]" />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <DialogPrimitive.Content
          className={cn(
            "pointer-events-auto flex max-h-[calc(100dvh-32px)] w-[432px] max-w-[calc(100vw-32px)] flex-col overflow-y-auto gap-4 rounded-[14px] bg-surface p-6 shadow-lg data-[state=closed]:animate-[dialog-out_120ms_ease-in] data-[state=open]:animate-[dialog-in_180ms_cubic-bezier(.2,.8,.2,1)]",
            className,
          )}
          {...props}
        >
          {children}
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-[19px] font-semibold tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-[13.5px] text-muted", className)} {...props} />;
}

export const DialogClose = DialogPrimitive.Close;
