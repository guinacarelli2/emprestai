"use client";
import { useState } from "react";
import { api } from "@/lib/trpc";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
export function ReturnLoan({ loanId, name }: { loanId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const utils = api.useUtils();
  const mutation = api.loans.return.useMutation({
    onSuccess: () => {
      setDone(true);
      setOpen(false);
      void utils.invalidate();
    },
    onError: () => {
      void utils.invalidate();
    },
  });
  return (
    <>
      <Button
        variant="row"
        size="table"
        disabled={done || mutation.isPending}
        onClick={() => {
          mutation.reset();
          setOpen(true);
        }}
      >
        {done ? "Devolvido" : "Devolver"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!mutation.isPending) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogTitle>Confirmar devolução</DialogTitle>
          <DialogDescription>
            Registrar a devolução de {name}? Esta ação atualiza o empréstimo.
          </DialogDescription>
          {mutation.error && (
            <p role="alert" className="text-late">
              {mutation.error.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" disabled={mutation.isPending} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="confirm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ loanId })}
            >
              {mutation.isPending ? "Registrando…" : "Confirmar devolução"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
