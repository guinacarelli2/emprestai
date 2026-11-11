# EmpresTI

Sistema de empréstimo de equipamentos para colaboradores e Operações. O projeto passou do mock da spec 001 para código de Auth Supabase SSR server-only, API tRPC, persistência Prisma/PostgreSQL, autorização por tenant, solicitação e devolução transacionais, auditoria e pipeline de imagens Pixabay.

**Estado: implementação funcional local em verificação; produção não pronta.** Código/configuração presentes não comprovam contas Auth provisionadas, banco remoto, fotos reais revisadas/publicadas, seed ou deploy. Resultados efetivamente obtidos e limitações devem ser consultados em [ENTREGA.md](ENTREGA.md), consolidado pelo responsável pela entrega; não inferir contagens de testes ou checks aprovados deste README.

## Rodar localmente

Toolchain: **Node 22.23.4 / npm 10.9.9**. Usar `.nvmrc`, versões exatas e lockfile:

```bash
npm ci
npm run build
npm run typecheck
npm run dev
```

Abre em `http://localhost:3000` → `/login`. Agora é necessário configurar o ambiente e ter serviços/identidades compatíveis; não existe login real sem provisionamento. O inventário de variáveis sem valores está em `.env.example`; o humano mantém `.env.local` somente na própria máquina, sem Git/ZIP/log. Não usar prefixo `NEXT_PUBLIC_` nem credenciais administrativas no navegador/Vercel.

Para checks e build:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run test:integration
npm run test:e2e
```

`npm run build` executa `prisma generate && next build --webpack`. Integração usa PostgreSQL local real por `TEST_DATABASE_URL` loopback em banco novo dedicado, ou Testcontainers com Docker funcional; configuração não é evidência de execução. E2E exige navegador e fixtures adequadas. Não executar testes contra Supabase remoto. Banco local dedicado/descartável e env do shell precisam ser preparados antes de scripts Prisma; eles não devem ser presumidos leitores de `.env.local`.

## Fluxos e contrato

| Rota                           | Fluxo                                          |
| ------------------------------ | ---------------------------------------------- |
| `/login`                       | Login Supabase, cadastro fechado               |
| `/catalogo`                    | Catálogo autenticado                           |
| `/catalogo/TI-0001`            | Detalhe de um patrimônio do inventário inicial |
| `/meus-emprestimos`            | Próprios empréstimos e devolução               |
| `/operacoes/emprestimos`       | Gestão de empréstimos do tenant por Operações  |
| `/operacoes/equipamentos/novo` | Cadastro por Operações                         |

Papéis: `colaborador` e `operacoes`; tenant atual `suporte_ti`. Inventário inicial literal **TI-0001…TI-0012**, nove disponíveis e três em manutenção (TI-0004, TI-0007, TI-0010). Até **três empréstimos abertos** por colaborador; prazo **14 dias civis corridos em America/Sao_Paulo** e atraso a partir do dia seguinte, bloqueando nova solicitação. Estado emprestado deriva do empréstimo aberto. Conta do professor é colaborador, sem empréstimos iniciais e sem senha no código; testes usam outra identidade.

Doze imagens distintas são preparadas pela API **Pixabay**, recortadas em **800×600** e revisadas nos originais e recortes, com manifesto/licença/hashes. Fotos são ilustrativas, não evidência da unidade física. O enunciado original exige Pexels: **Pixabay é desvio solicitado pelo usuário, com aprovação acadêmica PENDENTE**. Não usar outra fonte como fallback nem dizer que fotos reais já foram obtidas/verificadas.

## Publicação e segurança

Seguir [docs/PUBLICACAO-HUMANA.md](docs/PUBLICACAO-HUMANA.md): contas GitHub/Supabase/Vercel/Pixabay, checklist de env, revisão de imagens, Auth e ações remotas exclusivamente humanas em TTY. Migration, upload e seed são separados, confirmam projeto; seed usa manifesto revisado, `manifestToSeedImages`, recibo e hash dos bytes públicos, não o arquivo legado de fotos.

**Gate bloqueante antes de dados reais:** transações usam `SET LOCAL ROLE emprestai_app`, mas lookups de contexto/pré-auth ainda ocorrem na conexão Prisma original/owner fora do wrapper. Revisar privilégios efetivos, grant ao usuário runtime, BYPASSRLS e isolamento no pooler. Não existe migração pronta comprovada de runtime least privilege. O schema Prisma ainda referencia `DIRECT_URL`, mas `src/env.ts` não a exige mais no runtime. A geração Prisma foi comprovada localmente sem DATABASE_URL/DIRECT_URL em uma cópia do schema com saída descartável; instalação/build limpos na Vercel ainda exigem validação. Não enviar URL direta owner à Vercel. Consultar o roteiro para a pendência específica.

Bucket público é somente para fotos públicas revisadas, nunca documentos/dados pessoais internos e nunca escrita anon. CI faz checks/build e integração local, **não migration/seed/upload/deploy remoto**. Push em branch conectada à Vercel pode publicar automaticamente; revisar branch/PR/configuração antes. Commits, tag, convites e deploy dependem do humano e de autorização; nada disso é realizado por este README.

## Documentação e referências

- [ENTREGA.md](ENTREGA.md) — evidências efetivas, limitações e pacote final; consolidado pelo principal.
- [Publicação humana](docs/PUBLICACAO-HUMANA.md) — o que depende do responsável e gates de segurança/publicação.
- [PRD](docs/PRD.md) — regras de negócio.
- [ADRs](docs/adr/) — stack, layout e exceções/modelo aprovados em ADR-003/004.
- [Specs](docs/specs/) — spec 001 histórica e specs 002–005; ordem de execução 004 → 002 → 003 → 005.
- `prisma/` — schema, migrations Prisma e seed; `src/server/` — API, serviços e segurança.
- `scripts/equipment-images-cli.ts` — preparação/revisão local; `scripts/human-production.ts` — ações remotas humanas.
- `references/pratica-sdd.html` — enunciado preservado com senha redigida; `references/index.html` e `layout.md` — referência visual, não o app.
- `rules/` e `AGENTS.md` — convenções e limites do trabalho neste projeto.
