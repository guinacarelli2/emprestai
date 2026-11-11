"use client";
import { useState } from "react";
import { AppShell, Breadcrumb, HeaderTail } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EquipmentPhoto, PhotoCredit } from "@/components/ui/equipment-photo";
import { Pill } from "@/components/ui/pill";
import { LimitSegments } from "@/components/ui/progress";
import { QueryState } from "@/components/ui/query-state";
import { api } from "@/lib/trpc";
import { categoryLabel, civilDate, displayState, instantDate } from "@/lib/types";
export function DetalheScreen({ patrimonio }: { patrimonio: string; userId?: string }) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const session = api.auth.me.useQuery();
  const detail = api.equipment.get.useQuery({ patrimonio }, { enabled: !!session.data });
  const utils = api.useUtils();
  const request = api.loans.request.useMutation({
    onSuccess: (result) => {
      setSuccess(`Empréstimo confirmado. Devolver até ${civilDate(result.dueDate)}.`);
      setOpen(false);
      void utils.invalidate();
    },
    onError: () => {
      void utils.invalidate();
    },
  });
  const item = detail.data;
  const count = session.data?.openCount ?? 0;
  const overdue = session.data?.overdue;
  const state = item ? displayState(item) : undefined;
  const reason = overdue
    ? "Bloqueado por atraso. Devolva os itens vencidos antes de solicitar outro."
    : count >= 3
      ? "Limite de 3 itens atingido."
      : state === "maintenance"
        ? "Em manutenção. Não disponível para empréstimo."
        : state === "retired"
          ? "Fora de uso. Não disponível para empréstimo."
          : state === "loaned"
            ? "Equipamento já emprestado. Não disponível agora."
            : "";
  const history = item?.history ?? [];
  return (
    <AppShell
      screen="03 Detalhe do item"
      header={
        <>
          <Breadcrumb
            items={[{ label: "Catálogo", href: "/catalogo" }, { label: item?.nome ?? patrimonio }]}
          />
          <HeaderTail counter />
        </>
      }
    >
      <QueryState pending={detail.isPending} error={detail.error} retry={() => void detail.refetch()} />
      {item && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_356px]">
          <div className="flex min-w-0 flex-col gap-[22px]">
            <EquipmentPhoto key={item.imageUrl} item={item} />
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-semibold">{item.nome}</h1>
              <Pill state={displayState(item)} />
            </div>
            <p className="max-w-[60ch] text-sm text-muted">
              {item.observacoes || "Sem observações adicionais."}
            </p>
            <dl className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {[
                ["Categoria", categoryLabel[item.categoria]],
                ["Patrimônio", item.patrimonio],
                ["Local de retirada", item.local],
                ["Número de série", item.numeroSerie || "Não informado"],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="break-words text-sm">{value}</dd>
                </div>
              ))}
            </dl>
            <section className="flex flex-col gap-3">
              <h2 className="text-[17px] font-semibold">Seu histórico com este item</h2>
              <QueryState
                empty={!history.length ? "Nenhum empréstimo seu encontrado para este item." : undefined}
              />
              {history.map((loan) => (
                <div
                  key={loan.id}
                  className="flex flex-wrap justify-between gap-3 rounded-lg border border-soft p-4"
                >
                  <span>Retirado {instantDate(loan.requestedAt)}</span>
                  <span>
                    {loan.returnedAt
                      ? `Devolvido ${instantDate(loan.returnedAt)}`
                      : `Em aberto · vence ${civilDate(loan.dueDate)}`}
                  </span>
                </div>
              ))}
            </section>
            <PhotoCredit />
          </div>
          <aside className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 rounded-xl border border-cardline bg-surface p-5">
              <h2 className="text-[15px] font-semibold">Solicitar empréstimo</h2>
              <p className="text-sm text-muted">Retirada: {item.local}</p>
              <p className="text-sm text-muted">Prazo padrão: 14 dias corridos</p>
              {session.data?.dueDate && (
                <p>
                  Devolver até <strong className="text-accent-300">{civilDate(session.data.dueDate)}</strong>
                </p>
              )}
              <Button
                size="form"
                disabled={!!reason || request.isPending || !session.data?.dueDate}
                onClick={() => {
                  request.reset();
                  setSuccess(null);
                  void session.refetch();
                  setOpen(true);
                }}
              >
                Solicitar empréstimo
              </Button>
              <p className="text-xs text-muted">{reason || "Retirada no balcão de Operações."}</p>
              {success && (
                <p role="status" className="text-ok">
                  {success}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-cardline bg-surface p-5">
              <h2 className="text-[15px] font-semibold">Seus itens</h2>
              <p>{count} de 3 itens</p>
              <LimitSegments used={count} />
              <p className="text-xs text-muted">
                {overdue ? "Há item em atraso. Novo empréstimo bloqueado." : "Nenhum item em atraso."}
              </p>
            </div>
          </aside>
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!request.isPending) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogTitle>Confirmar empréstimo</DialogTitle>
          <DialogDescription>
            O prazo começa na confirmação. Devolver até{" "}
            {session.data?.dueDate ? civilDate(session.data.dueDate) : "—"}.
          </DialogDescription>
          <p className="rounded-lg border border-soft bg-sunken p-3">
            Este pedido leva a {count + 1} de 3 itens.
          </p>
          {request.error && (
            <p role="alert" className="text-sm text-late">
              {request.error.message}
            </p>
          )}
          {reason && (
            <p role="alert" className="text-late">
              {reason}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" disabled={request.isPending} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="confirm"
              disabled={request.isPending || !!reason || !item || session.isFetching}
              onClick={() => item && request.mutate({ equipmentId: item.id })}
            >
              {request.isPending ? "Confirmando…" : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
