"use client";
import Link from "next/link";
import { AppShell, Breadcrumb, HeaderTail, PageTitle } from "@/components/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { LimitSegments } from "@/components/ui/progress";
import { QueryState } from "@/components/ui/query-state";
import { ReturnLoan } from "@/components/ui/return-loan";
import { api } from "@/lib/trpc";
import { civilDate, instantDate } from "@/lib/types";
export function MeusEmprestimosScreen(_props: { userId?: string } = {}) {
  void _props;
  const session = api.auth.me.useQuery();
  const open = api.loans.mine.useInfiniteQuery(
    { history: false, limit: 20 },
    { enabled: !!session.data, getNextPageParam: (page) => page.nextCursor ?? undefined },
  );
  const history = api.loans.mine.useInfiniteQuery(
    { history: true, limit: 20 },
    { enabled: !!session.data, getNextPageParam: (page) => page.nextCursor ?? undefined },
  );
  const items = open.data?.pages.flatMap((page) => page.items) ?? [];
  const previous = history.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <AppShell
      screen="04 Meus empréstimos"
      header={
        <>
          <Breadcrumb items={[{ label: "Meus empréstimos" }]} />
          <HeaderTail>
            <Link href="/catalogo" className={buttonVariants({ size: "header" })}>
              Pegar emprestado
            </Link>
          </HeaderTail>
        </>
      }
    >
      <PageTitle title="Meus empréstimos" />
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[17px] font-semibold">Comigo agora</h2>
          <p className="text-sm text-muted">
            {session.data?.openCount ?? "—"} de 3 itens ·{" "}
            {session.data?.overdue ? "item em atraso" : "nenhum em atraso"}
          </p>
        </div>
        <LimitSegments used={session.data?.openCount ?? 0} className="w-[180px]" />
      </div>
      <QueryState
        pending={open.isPending}
        error={open.error}
        retry={() => void open.refetch()}
        empty={
          !open.isPending && !open.error && !items.length ? "Você não tem empréstimos em aberto." : undefined
        }
      />
      <div className="flex flex-col gap-3">
        {items.map((loan) => (
          <article
            key={loan.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cardline bg-surface p-5"
          >
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold">{loan.equipment.nome}</h3>
              <p className="text-xs text-muted">
                {loan.equipment.patrimonio} · Retirada {instantDate(loan.requestedAt)}
              </p>
            </div>
            <p className={loan.overdue ? "text-late" : "text-muted"}>
              {loan.overdue ? "Em atraso · " : "Devolver até "}
              {civilDate(loan.dueDate)}
            </p>
            <ReturnLoan loanId={loan.id} name={loan.equipment.nome} />
          </article>
        ))}
      </div>
      {open.hasNextPage && (
        <Button disabled={open.isFetchingNextPage} onClick={() => void open.fetchNextPage()}>
          Carregar mais empréstimos
        </Button>
      )}
      <section className="flex flex-col gap-3">
        <h2 className="text-[17px] font-semibold">Histórico</h2>
        <QueryState
          pending={history.isPending}
          error={history.error}
          retry={() => void history.refetch()}
          empty={
            !history.isPending && !history.error && !previous.length
              ? "Nenhum empréstimo devolvido."
              : undefined
          }
        />
        {previous.map((loan) => (
          <article
            key={loan.id}
            className="grid grid-cols-1 gap-3 rounded-xl border border-soft p-4 sm:grid-cols-3"
          >
            <span>
              {loan.equipment.nome} · {loan.equipment.patrimonio}
            </span>
            <span className="text-muted">Retirada {instantDate(loan.requestedAt)}</span>
            <span className="text-muted">Devolução {instantDate(loan.returnedAt)}</span>
          </article>
        ))}
        {history.hasNextPage && (
          <Button disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>
            Carregar mais histórico
          </Button>
        )}
      </section>
    </AppShell>
  );
}
