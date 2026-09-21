# EmpresTI

Sistema interno de empréstimo de equipamentos (notebooks, monitores, cabos, câmeras).
Serve a colaboradores (catálogo, pedido, devolução) e a Operações (cadastro e balcão).
Negócio em docs/PRD.md. Stack decidida em docs/adr/001-stack.md.

## Onde olhar

- docs/PRD.md — o que o negócio precisa. Não é spec.
- docs/adr/ — decisões técnicas já tomadas e o motivo delas.
- docs/specs/<NNN-funcionalidade>/ — spec, plano e tarefas de cada feature.
- rules/ — como se trabalha aqui. Leia rules/restrictions.md sempre.

## Comandos

- subir o banco local: ainda não há — nenhum comando de app foi rodado nesta máquina
- rodar o projeto: ainda não há — nenhum comando de app foi rodado nesta máquina
- rodar os testes: ainda não há — nenhum comando de app foi rodado nesta máquina
- buildar: ainda não há — nenhum comando de app foi rodado nesta máquina

Só entram comandos que eu já rodei nesta máquina.

## Ambiente

- Banco: Supabase. O desenvolvimento acontece no banco LOCAL.
- Deploy: Vercel, ligada ao repositório remoto. Push publica.
- Configuração vem de variável de ambiente. Ver .env.example.

## Precedência

Se dois artefatos discordarem sobre comportamento, a spec vence o código.
Se algo não estiver escrito em lugar nenhum, pergunte — não decida.

## Estado atual do projeto

Existe só documentação e um `.env` incompleto. Não existe código de aplicação (`package.json`, `src/`, Next, tRPC, Prisma), nem testes, nem migrations, nem `docs/specs/`, nem `rules/`, nem `.env.example` preenchido com banco local.

O que há hoje:

- `docs/PRD.md` — v1 do negócio
- `docs/adr/001-stack.md` — stack
- `layout.md` — telas e tokens
- `stacks.md` — rascunho que alimentou o ADR; se divergir, vence o ADR
- `.env` — URL do projeto Supabase `vmlnbyldrcfzvxgcrdrc`, chave publishable, e host/porta/user/database da conexão **direta** (5432). Sem senha, sem URL do pooler (6543), sem `DATABASE_URL` local, sem `service_role`

Falta: app, Prisma, seed `suporte_ti`, GitHub Actions, Sentry, pasta `rules/`, specs por feature.

## Procedimentos

