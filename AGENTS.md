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

Todos rodados nesta máquina (Node 22, npm 10).

- instalar dependências: `npm install`
- rodar o projeto: `npx next build && npx next start -p 3000` (abre em `/login`)
- rodar os testes: `npx vitest run`
- buildar: `npx next build`
- checar tipos: `npx tsc --noEmit`
- subir o banco local: ainda não há — a spec 001 não usa banco

Só entram comandos que eu já rodei nesta máquina.

## Ambiente

- Banco: Supabase. O desenvolvimento acontece no banco LOCAL.
- Deploy: Vercel, ligada ao repositório remoto. Push publica.
- Configuração vem de variável de ambiente. A spec 001 não usa nenhuma; `.env.example` entra com a primeira spec que ligar o banco. `.env*` está no `.gitignore`: nunca versionar segredo.

## Precedência

Se dois artefatos discordarem sobre comportamento, a spec vence o código.
Se algo não estiver escrito em lugar nenhum, pergunte — não decida.

## Estado atual do projeto

Spec 001 (telas da v1) implementada como front com dados mock: T1 a T10 concluídas, CA-01 a CA-13 com teste `test_ca_xx_*` em `src/__tests__/`.

- `src/app/` — rotas (`/login`, `/catalogo`, `/catalogo/[patrimonio]`, `/meus-emprestimos`, `/operacoes/emprestimos`, `/operacoes/equipamentos/novo`; `/` redireciona para `/login`)
- `src/components/screens/` — uma tela por arquivo (Client Components)
- `src/components/ui/` — botão, pill, chip, input, diálogo, segmentos, barras, card
- `src/lib/mock.ts` — todos os dados; `currentUserId` troca a persona (`"camila"` mostra o estado de atraso)
- `src/app/globals.css` — tokens do `layout.md` no tema Tailwind
- `index.html` — protótipo estático anterior, só referência visual. Não é o app.

Histórico da spec001: Prisma/tRPC/Auth/migrations/seed não faziam parte do mock. Não interpretar esta nota histórica como estado atual; schema/backend agora presentes e mapeados em spec004. Sentry segue inativo/opcional conforme ADR003/004.

## Procedimentos

- Nova funcionalidade: `rules/spec-flow.md`.
- Mudança de schema: `rules/migration.md`.
- Variável de ambiente: `rules/secrets.md`.
- Fim de tarefa: `rules/checks.md`.
- Fim de sessão: `rules/handoff.md`.
- Verificação de spec pronta: agente `agents/verificador-spec.md`.


## Pacote funcional aprovado (registro atual)
Specs 002–005 disponíveis, execução local aprovada conforme ADR-003/004; ordem **004 → 002 → 003 → 005**. Status **IMPLEMENTAÇÃO/PENDENTE; produção não pronta**. O estado/mock e checks descritos acima são histórico da 001, não verificação atual. Esta etapa não rodou testes/build nem implementou banco/Auth. ADR-003/004 e anexos específicos nas regras substituem apenas os procedimentos explicitamente citados. Sem commit/push/tag, deploy/migrate/seed/upload remoto pelo agente; ações/scripts remotos só humano. ENTREGA.md será consolidada pelo principal no final.

### Correção de referências e contrato realizado
Anexos lidos em references/pratica-sdd.html (senha redigida) e references/index.html; transcrição literal TI-0001–TI-0012 e nomes em spec002. Schema aprovado já presente, mapeamento real em spec004/ADR004; não usar id fictício de membership/counter nem role ops. SET LOCAL ROLE emprestai_app/settings app.* realizado, lookup ctx owner mantém limite. Versões/audit em spec004: omit-dev zero, dev16moderate pendente. Sentry opcional/inativo, DSN não obrigatório. Registro documental não é veredito de implementação pronta.

## Estado consolidado desta execução
Código de specs002–005 implementado localmente; produção não pronta. README e ENTREGA.md são os índices atuais; notas anteriores sobre mock/documentação descrevem etapas históricas. Comandos efetivamente executados: `npm test` (58), `npm run typecheck`, `npm run lint`, `npm run build` (Prisma + webpack), `npm run test:e2e` (6 fronteiras anônimas); integração PostgreSQL real local (22). Não equivalem a Auth/Storage/Vercel reais. `node --test scripts/__tests__/verifier.test.mjs` passou 8 selftests; sandbox limita subprocessos, não todas as ferramentas de IA. Git não existe neste diretório. Variáveis em .env.example/local placeholders, Vercel pendente. Não reintroduzir senha do anexo, não usar Pexels/fotos fictícias, não executar ações remotas.
