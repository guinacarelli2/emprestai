"use client";
import {
  CaretRight,
  HandArrowDown,
  ListChecks,
  MagnifyingGlass,
  Package,
  PlusSquare,
  SquaresFour,
  type Icon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { QueryState } from "./ui/query-state";

type NavItem = { href: string; label: string; icon: Icon; badge?: boolean };
const collaborator: NavItem[] = [
  { href: "/catalogo", label: "Catálogo", icon: SquaresFour },
  { href: "/meus-emprestimos", label: "Meus empréstimos", icon: HandArrowDown, badge: true },
];
const operations: NavItem[] = [
  { href: "/operacoes/emprestimos", label: "Empréstimos em aberto", icon: ListChecks },
  { href: "/operacoes/equipamentos/novo", label: "Cadastrar equipamento", icon: PlusSquare },
];
export function Sidebar() {
  const path = usePathname() ?? "";
  const router = useRouter();
  const session = api.auth.me.useQuery();
  const cache = useQueryClient();
  const logout = api.auth.logout.useMutation({
    onSuccess: () => {
      cache.clear();
      router.replace("/login");
      router.refresh();
    },
  });
  const isOps = session.data?.role === "operacoes";
  const name = session.data?.user.name || session.data?.user.email || "";
  return (
    <aside className="flex w-full flex-col gap-5 border-b border-soft bg-sidebar p-[14px] md:sticky md:top-0 md:h-screen md:w-[236px] md:border-r md:border-b-0 md:py-[22px]">
      <Link href="/catalogo" className="flex items-center gap-[10px] px-2 text-sm font-semibold text-text">
        <span className="flex size-7 items-center justify-center rounded-[7px] bg-accent-900 shadow-[0_0_0_1px_#25408F]">
          <Package size={15} aria-hidden />
        </span>
        EmpresTI
      </Link>
      <nav aria-label="Principal" className="flex flex-col gap-4">
        {[
          { label: "Colaborador", items: collaborator },
          ...(isOps ? [{ label: "Operações", items: operations }] : []),
        ].map((group) => (
          <div key={group.label} className="flex flex-col gap-[3px]">
            <span className="px-2 text-[10px] uppercase tracking-widest text-muted">{group.label}</span>
            <div className="flex flex-wrap gap-1 md:flex-col">
              {group.items.map((item) => {
                const active = path.startsWith(item.href);
                const Glyph = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-[10px] rounded-lg px-[10px] py-[9px] text-[13px]",
                      active
                        ? "bg-surface text-text shadow-[inset_2px_0_0_#5B7FE0]"
                        : "text-ink-400 hover:bg-sunken",
                    )}
                  >
                    <Glyph size={16} weight={active ? "fill" : "regular"} aria-hidden />
                    {item.label}
                    {item.badge && (
                      <span className="rounded-full bg-accent-800 px-2 text-xs text-accent-300">
                        {session.data?.openCount ?? "—"}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="flex flex-col gap-3 rounded-[10px] border border-soft bg-sunken p-3 md:mt-auto">
        <span className="break-words text-[13px] font-semibold">{name}</span>
        <span className="text-xs text-muted">{isOps ? "Operações" : "Colaborador"}</span>
        <Button size="table" variant="secondary" disabled={logout.isPending} onClick={() => logout.mutate()}>
          {logout.isPending ? "Saindo…" : "Sair"}
        </Button>
        {logout.error && (
          <p role="alert" className="text-xs text-late">
            {logout.error.message}
          </p>
        )}
      </div>
    </aside>
  );
}
export function AppHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-soft px-4 py-3 md:px-7">
      {children}
    </header>
  );
}
export function SearchBox({
  placeholder,
  wide,
  value,
  onChange,
}: {
  placeholder: string;
  wide?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-lg border border-frame bg-sunken px-3 text-muted",
        wide ? "max-w-[520px]" : "max-w-[420px]",
      )}
    >
      <MagnifyingGlass size={17} aria-hidden />
      <input
        aria-label="Buscar"
        maxLength={120}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 w-full bg-transparent text-[13px] text-text placeholder:text-muted"
      />
    </label>
  );
}
export function HeaderTail({
  counter,
  children,
}: {
  counter?: boolean;
  userId?: string;
  children?: React.ReactNode;
}) {
  const session = api.auth.me.useQuery();
  return (
    <div className="flex flex-wrap items-center gap-3 md:ml-auto">
      {counter && (
        <span className="text-xs text-muted">{session.data?.openCount ?? "—"} de 3 itens com você</span>
      )}
      {children}
    </div>
  );
}
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Trilha" className="flex min-w-0 flex-wrap items-center gap-[6px] text-[13px]">
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && <CaretRight size={12} aria-hidden />}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span className="break-words text-text">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
export function AppShell({
  screen,
  header,
  children,
  operationsOnly = false,
}: {
  screen: string;
  header: React.ReactNode;
  children: React.ReactNode;
  userId?: string;
  operationsOnly?: boolean;
}) {
  const session = api.auth.me.useQuery();
  const router = useRouter();
  React.useEffect(() => {
    if (session.error?.data?.code === "UNAUTHORIZED") router.replace("/login");
  }, [session.error, router]);
  if (session.isPending || session.error)
    return (
      <main className="min-h-screen p-6">
        <QueryState pending={session.isPending} error={session.error} retry={() => void session.refetch()} />
      </main>
    );
  if (!session.data) return null;
  return (
    <div data-screen-label={screen} className="grid min-h-screen grid-cols-1 bg-bg md:grid-cols-[236px_1fr]">
      <Sidebar />
      <main className="flex min-w-0 flex-col">
        <AppHeader>{header}</AppHeader>
        <section className="flex flex-col gap-[22px] px-4 py-[26px] md:px-7">
          {operationsOnly && session.data.role !== "operacoes" ? (
            <p role="alert">Acesso restrito a Operações.</p>
          ) : (
            children
          )}
        </section>
      </main>
    </div>
  );
}
export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-[-0.01em]">{title}</h1>
      {sub && <p className="text-[13px] text-muted">{sub}</p>}
    </div>
  );
}
