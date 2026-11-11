"use client";
import { Info } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { AppShell, HeaderTail, PageTitle, SearchBox } from "@/components/app-shell";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { EquipmentPhoto, PhotoCredit } from "@/components/ui/equipment-photo";
import { Pill } from "@/components/ui/pill";
import { QueryState } from "@/components/ui/query-state";
import { api } from "@/lib/trpc";
import { categories, categoryLabel, displayState } from "@/lib/types";
export function CatalogoScreen(_props: { userId?: string } = {}) {
  void _props;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number] | undefined>();
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const session = api.auth.me.useQuery();
  const list = api.equipment.list.useInfiniteQuery(
    { search: search || undefined, category, onlyAvailable, limit: 12 },
    { enabled: !!session.data, getNextPageParam: (page) => page.nextCursor ?? undefined },
  );
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const counts = list.data?.pages[0];
  return (
    <AppShell
      screen="02 Catálogo"
      header={
        <>
          <SearchBox placeholder="Buscar equipamento" value={search} onChange={setSearch} />
          <HeaderTail counter />
        </>
      }
    >
      <PageTitle
        title="Catálogo"
        sub={counts ? `${counts.total} equipamentos · ${counts.available} disponíveis agora` : undefined}
      />
      <div className="flex items-start gap-3 rounded-[10px] border border-accent-700 bg-[linear-gradient(90deg,#0E1530,#0B1128)] px-4 py-[13px]">
        <Info size={17} className="shrink-0 text-accent-400" aria-hidden />
        <div className="flex flex-col gap-1">
          <h2 className="text-[13px] font-semibold">Regras de empréstimo</h2>
          <p className="text-xs text-ink-400">
            Até 3 itens por pessoa. Prazo padrão 14 dias corridos. Atraso impede novo pedido. Item em
            manutenção não aparece como disponível.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Chip active={!category} onClick={() => setCategory(undefined)}>
            Todos
          </Chip>
          {categories.map((value) => (
            <Chip key={value} active={category === value} onClick={() => setCategory(value)}>
              {categoryLabel[value]}
            </Chip>
          ))}
        </div>
        <Chip active={onlyAvailable} onClick={() => setOnlyAvailable((value) => !value)}>
          Só disponíveis
        </Chip>
      </div>
      <QueryState
        pending={list.isPending}
        error={list.error}
        retry={() => void list.refetch()}
        empty={
          !list.isPending && !list.error && !items.length
            ? "Nenhum equipamento encontrado para estes filtros."
            : undefined
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex flex-col gap-3 rounded-xl border border-cardline bg-surface p-4"
          >
            <EquipmentPhoto key={item.imageUrl} item={item} />
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[15px] font-semibold">{item.nome}</h2>
              <Pill state={displayState(item)} />
            </div>
            <p className="text-xs text-muted">
              {categoryLabel[item.categoria]} · {item.patrimonio}
            </p>
            <Link href={`/catalogo/${encodeURIComponent(item.patrimonio)}`}>
              {displayState(item) === "available" ? "Ver e solicitar →" : "Ver detalhes →"}
            </Link>
          </article>
        ))}
      </div>
      {list.hasNextPage && (
        <Button disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
          {list.isFetchingNextPage ? "Carregando…" : "Carregar mais equipamentos"}
        </Button>
      )}
      <PhotoCredit />
    </AppShell>
  );
}
