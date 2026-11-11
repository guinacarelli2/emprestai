"use client";
import Link from "next/link";
import { useState } from "react";
import { AppShell, HeaderTail, PageTitle, SearchBox } from "@/components/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field, Select } from "@/components/ui/input";
import { QueryState } from "@/components/ui/query-state";
import { ReturnLoan } from "@/components/ui/return-loan";
import { api } from "@/lib/trpc";
import { categories, categoryLabel, civilDate, instantDate } from "@/lib/types";
import { cn } from "@/lib/utils";
const filters = [
  { value: "all", label: "Todos" },
  { value: "late", label: "Em atraso" },
  { value: "soon", label: "Vencem esta semana" },
] as const;
export function OperacoesScreen(_props: { userId?: string } = {}) {
  void _props;
  const session = api.auth.me.useQuery();
  const allowed = session.data?.role === "operacoes";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [category, setCategory] = useState<(typeof categories)[number] | "">("");
  const list = api.operations.list.useInfiniteQuery(
    { search: search || undefined, filter, category: category || undefined, limit: 20 },
    { enabled: allowed, getNextPageParam: (page) => page.nextCursor ?? undefined },
  );
  const stats = api.operations.stats.useQuery(undefined, { enabled: allowed });
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <AppShell
      screen="05 Empréstimos em aberto"
      operationsOnly
      header={
        allowed ? (
          <>
            <SearchBox
              wide
              placeholder="Buscar colaborador, patrimônio ou equipamento"
              value={search}
              onChange={setSearch}
            />
            <HeaderTail>
              <Link href="/operacoes/equipamentos/novo" className={buttonVariants({ size: "header" })}>
                Cadastrar equipamento
              </Link>
            </HeaderTail>
          </>
        ) : null
      }
    >
      <PageTitle title="Empréstimos em aberto" />
      <p className="text-xs text-muted">Indicadores do tenant inteiro, independentes dos filtros abaixo.</p>
      <QueryState pending={stats.isPending} error={stats.error} retry={() => void stats.refetch()} />
      {stats.data && (
        <div className="grid grid-cols-2 gap-[14px] xl:grid-cols-4">
          {[
            { label: "Em aberto", value: stats.data.open },
            { label: "Vencem em 3 dias", value: stats.data.dueSoon },
            { label: "Em atraso", value: stats.data.late, late: true },
            { label: "Em manutenção", value: stats.data.maintenance },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col gap-1 rounded-[11px] border bg-surface p-4",
                stat.late ? "border-late-line" : "border-cardline",
              )}
            >
              <span className="text-xs text-ink-400">{stat.label}</span>
              <strong className={cn("text-[26px] font-semibold", stat.late && "text-late")}>
                {stat.value}
              </strong>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {filters.map((option) => (
          <Chip key={option.value} active={filter === option.value} onClick={() => setFilter(option.value)}>
            {option.label}
          </Chip>
        ))}
      </div>
      <Field label="Categoria" htmlFor="operations-category">
        <Select
          id="operations-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as typeof category)}
        >
          <option value="">Todas as categorias</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {categoryLabel[value]}
            </option>
          ))}
        </Select>
      </Field>
      <QueryState
        pending={list.isPending}
        error={list.error}
        retry={() => void list.refetch()}
        empty={
          !list.isPending && !list.error && !items.length
            ? "Nenhum empréstimo encontrado para estes filtros."
            : undefined
        }
      />
      <div
        role="region"
        aria-label="Tabela de empréstimos, rolagem horizontal"
        tabIndex={0}
        className="overflow-x-auto rounded-xl border border-soft"
      >
        <table className="w-full min-w-[780px] text-left text-[13px]">
          <thead className="bg-sunken text-xs text-muted">
            <tr>
              {["Colaborador", "Item", "Retirada", "Prazo", "Situação", "Ação"].map((label) => (
                <th key={label} className="px-4 py-3 font-normal">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((loan) => (
              <tr key={loan.id} className={cn("border-t border-rowline", loan.overdue && "bg-late-bg")}>
                <td className="px-4 py-3">{loan.borrower.displayName}</td>
                <td className="px-4 py-3">
                  {loan.equipment.nome}
                  <p className="text-xs text-muted">{loan.equipment.patrimonio}</p>
                </td>
                <td className="px-4 py-3 text-muted">{instantDate(loan.requestedAt)}</td>
                <td className="px-4 py-3">{civilDate(loan.dueDate)}</td>
                <td className={cn("px-4 py-3", loan.overdue ? "text-late" : "text-ok")}>
                  {loan.overdue ? "Em atraso" : "No prazo"}
                </td>
                <td className="px-4 py-3">
                  <ReturnLoan loanId={loan.id} name={loan.equipment.nome} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">{items.length} empréstimos carregados com os filtros atuais</p>
      {list.hasNextPage && (
        <Button disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
          {list.isFetchingNextPage ? "Carregando…" : "Carregar mais empréstimos"}
        </Button>
      )}
    </AppShell>
  );
}
