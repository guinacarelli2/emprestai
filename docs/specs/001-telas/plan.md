# Plano 001 — Telas da v1

Restringido por: `docs/adr/001-stack.md`, `docs/specs/001-telas/spec.md`, `layout.md`.

## ADRs que valem aqui

- Next.js App Router, TypeScript `strict`, Client Components nas telas.
- Tailwind CSS + shadcn/ui (não HTML solto, não estilo inline: CSP sem `unsafe-inline`).
- Sem Server Actions.
- Formulários: React Hook Form + `zodResolver` (tela 06 e login).
- Estado de tela: `useState` / Context; sem store.
- Vitest + Testing Library nos componentes de critério; Playwright só quando o app já sobe (tarefa de verificação visual, se o scaffold já existir).
- Ícones: Phosphor, pacote React (spec; layout pedia CSS unpkg, bloqueado pela CSP do ADR).

## O que este plano não faz

Não instala Prisma, tRPC, Supabase Auth, Sentry, CI. O front lê `src` mock. Scaffold mínimo de Next só o suficiente para rotas e Tailwind.

## Ordem

1. Scaffold Next + Tailwind + tokens + fonte (CA-01).
2. Peças de UI (botão, pill, chip, input, tabela, diálogo) alinhadas ao `layout.md` §5 (CA-01, CA-12).
3. Shell sidebar/header (CA-03).
4. Login (CA-02).
5. Mock + catálogo (CA-04, CA-11).
6. Detalhe + diálogo (CA-05, CA-10).
7. Meus empréstimos (CA-06, CA-10).
8. Operações em aberto (CA-07).
9. Cadastro + prévia (CA-08).
10. Ligar fluxos, bell inerte, labels de tela (CA-09, CA-13).

Uma tarefa por vez. Cada uma cabe num commit. Depois de cada: `rules/checks.md` no que já existir (Vitest quando houver testes; `next build` a partir da tarefa 1).

## Risco

`layout.md` nota 10 pede estilo inline e `_ds/nocturne`. Esta spec + ADR vencem: tokens no CSS do tema Tailwind.
