# EmpresTI — entrega local da prática SDD

**Resultado: pacote de código local implementado e testado; produção e aceite integral da prática NÃO PRONTOS.**

Arquivo de entrega: `emprestai-pixabay-entrega-local-2026-11-10.zip`, na pasta acima do projeto. Relatório de integridade/CRC/SHA-256 e gate em `docs/verificacao/delivery/` e arquivo `.sha256` junto ao ZIP.

O projeto deixou de depender de dados mock nos fluxos ativos. Mantém Next App Router + tRPC + Prisma + Supabase Auth SSR, visual escuro/Open Sans e publicação prevista na Vercel. Foram conectados catálogo, detalhe, solicitação, empréstimos/devolução, painel e cadastro de Operações. O login real depende de um Auth provisionado: configuração/código não substituem a criação das contas.

**Pixabay é a única fonte implementada para fotos. Nenhuma foto real foi obtida, revisada ou publicada nesta execução.** A ausência aparece explicitamente no catálogo. O pedido do usuário autoriza a troca local; não comprova aceite do professor ao desvio do enunciado.

## Evidências locais e limites

Execução em 10/11/2026, Node **22.23.4**, npm **10.9.9**. Evidências sanitizadas: [índice e hashes](docs/verificacao/evidencias/ledger.json).

| Check real                   | Resultado                                                  | Evidência                                                                                                                                                                                 | O que não comprova                                                                            |
| ---------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `npm test`                   | **7 arquivos, 58 testes passaram**                         | [ops-fix-unit.log](docs/verificacao/evidencias/ops-fix-unit.log)                                                                                                                          | Hooks/context/Auth mockados não são Supabase real; imagens sintéticas não são fotos aprovadas |
| PostgreSQL real local        | **4 arquivos, 22 testes passaram**                         | [ops-fix-integration.log](docs/verificacao/evidencias/ops-fix-integration.log)                                                                                                            | Identidades Auth sintéticas; não testa Supavisor remoto nem Docker/Testcontainers             |
| `npm run typecheck`          | exit 0                                                     | [release3-typecheck.log](docs/verificacao/evidencias/release3-typecheck.log)                                                                                                              | Não prova autorização em produção                                                             |
| `npm run lint`               | exit 0, sem warning nesta rodada                           | [release3-lint.log](docs/verificacao/evidencias/release3-lint.log)                                                                                                                        | Não equivale a auditoria de segurança completa                                                |
| `npm run build`              | exit 0, Prisma + Next webpack                              | [release3-build.log](docs/verificacao/evidencias/release3-build.log)                                                                                                                      | Next carrega placeholders locais; não é deploy nem instalação limpa na Vercel                 |
| Playwright Chromium          | **6 passaram**, desktop/mobile                             | [release3-e2e.log](docs/verificacao/evidencias/release3-e2e.log)                                                                                                                          | Login visual, anônimo e CSP; não percorre as seis telas com sessão real                       |
| Harness macOS                | **8 selftests passaram, zero skips**                       | [release-harness-selftest.log](docs/verificacao/evidencias/release-harness-selftest.log)                                                                                                  | Prova subprocessos isolados, não restrição das ferramentas de IA inteira                      |
| Prisma generate sem URLs     | exit 0, schema copiado e output descartável                | [prisma-generate-without-env.log](docs/verificacao/evidencias/prisma-generate-without-env.log)                                                                                            | Não certifica `npm ci`/build limpos na Vercel                                                 |
| Migration/replay local       | criada via Prisma CLI, deploy e reset descartável passaram | [criação](docs/verificacao/evidencias/migration-create.log), [deploy](docs/verificacao/evidencias/migration-deploy.log), [replay](docs/verificacao/evidencias/migration-reset-replay.log) | Não aplicou migration remota                                                                  |
| Audit runtime snapshot       | **zero vulnerabilidades** com `--omit=dev`                 | [audit-runtime.json](docs/verificacao/evidencias/audit-runtime.json)                                                                                                                      | Snapshot, não garantia futura; não significa audit completo limpo                             |
| Audit incluindo dev snapshot | **16 moderate; zero high/critical**                        | [audit-second.json](docs/verificacao/evidencias/audit-second.json)                                                                                                                        | Pendência de ferramentas de desenvolvimento/CI                                                |
| Git                          | `git status` falhou: diretório não é repositório           | [release-results.json](docs/verificacao/evidencias/release-results.json)                                                                                                                  | Nenhuma branch, commit, push ou tag comprovados                                               |

PostgreSQL usado: standalone **16.15**, somente loopback, bancos novos dedicados. A integração inicial de release passou 20 testes; depois da correção de filtros, nova integração passou **22** em banco novo dedicado (arquivo `.work/ops-fix-db-name.txt` no ambiente local). Nenhum banco existente foi apagado. Logs JSON preservam nomes/assertions por teste. Relatórios independentes por CA são separados dos checks acima: ver seção 6.

Uma cópia limpa sem `.next`, `.env.local`, `next-env.d.ts` e `*.tsbuildinfo` passou em `tsc --noEmit`; seguir a ordem `npm ci` → `npm run build` → checks no ambiente final para gerar tipos Next antes das demais etapas.

A cópia original do ZIP foi preservada. SHA-256 do ZIP recebido: `38e960ac0eec25def3a7a512ae2f6b7d067b7d9ea350c3eed3afbc92644e63e3`. Os quatro arquivos de testes históricos da spec001 foram preservados byte a byte, apenas com sufixo `.historical`; não são executados nem vendidos como validação dos novos fluxos.

## 1. Conflitos: o que foi pedido contra o que já existia

Proveniência: **recomendações incluídas no pacote de execução, ratificadas de forma geral; Pixabay foi pedido explícito do usuário**. Não atribuir escolhas independentes ao usuário ou aprovação acadêmica inexistente.

| Pedido / conflito                                         | Contrariava                       | Decisão realizada                                              | Alternativa e motivo                                                                                       | Registro                                                                            | Commit     |
| --------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------- |
| Usar Pixabay                                              | Fonte Pexels exigida no enunciado | Implementar exclusivamente Pixabay e sinalizar desvio          | Pexels preservaria aderência acadêmica, mas contrariaria pedido explícito; professor ainda precisa aceitar | `docs/adr/003-execucao-local-aprovada.md:14`; spec002/CA-06                         | Não existe |
| Cinco empréstimos abertos                                 | PRD/pacote recomendado: três      | **Máximo três** no servidor sob locks                          | Cinco mudaria regra já estabelecida; validação só na UI seria vulnerável à concorrência                    | `docs/specs/003-solicitar-emprestimo/spec.md:20`; `src/server/services/loans.ts:51` | Não existe |
| Quatorze dias úteis                                       | Prazo civil recomendado           | **14 dias corridos, America/Sao_Paulo**                        | Dias úteis exigiriam outro calendário; 14×24h UTC não é soma civil                                         | `docs/specs/003-solicitar-emprestimo/spec.md:13`; `src/server/services/dates.ts:1`  | Não existe |
| Briefing menciona dois em manutenção                      | Lista literal inclui TI-0010      | Manutenção TI-0004/0007/0010, **9/3**                          | Corrigir a lista sem decisão perderia o contrato explícito                                                 | spec002; `prisma/seed.ts:36`                                                        | Não existe |
| Sem crédito nas fotos                                     | Contrato da skill/proveniência    | **Fotos: Pixabay** e links/metadados                           | Omitir crédito reduziria rastreabilidade; não tratar crédito como substituto da licença                    | spec003/CA-10                                                                       | Não existe |
| Senha acadêmica no seed                                   | Regra de segredos                 | Redigir somente a referência copiada e provisionar pelo humano | Hardcoded facilitaria acesso, mas exporia credencial; original não foi alterado                            | spec002/CA-04; `rules/secrets.md:1`                                                 | Não existe |
| Verificador corrigir teste quebrado                       | Independência                     | Verificador reprova; principal corrige                         | Corrigir e certificar o próprio teste removeria controle independente                                      | `.agents/agents/verificador-spec.md:8`                                              | Não existe |
| Migration remota no CI                                    | Proibição de tocar produção       | CI somente checks; migration humana separada                   | Deploy automático facilitaria operação mas ampliaria risco/autoridade                                      | ADR004; `.github/workflows/ci.yml:1`                                                | Não existe |
| Pausa obrigatória após cada tarefa/vedação de ADR e sharp | Execução completa solicitada      | Exceções específicas registradas, sem revogação geral          | Ignorar regras silenciosamente seria inadequado; escopo local do pacote foi documentado                    | ADR003; `rules/restrictions.md:47`                                                  | Não existe |
| Só mock e funcionalidades mínimas da prática              | Pedido de frontend funcional      | Auth/persistência na 004 e Operações/devolução na 005          | API separada/Server Actions/direct Supabase cliente fugiriam do stack aprovado                             | specs004/005                                                                        | Não existe |

## 1b. Lacunas: o que foi pedido de forma incompleta

| Spec | Lacuna                                 | Alternativas                                                               | Caminho escolhido e justificativa                                                                                                   | Commit     |
| ---- | -------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 004  | Relação entre Auth, tenant e papéis    | Input cliente, metadado Auth ou membership server                          | Membership `(tenantId,userId)` e papel `colaborador/operacoes`, consulta por identidade `getUser`; cliente não escolhe papel/tenant | Não existe |
| 003  | Concorrência limite/mesmo item         | Contar fora da transação, lock só do item, ou locks ordenados + constraint | Membership antes do equipamento, rechecagem sob locks e índice parcial único; audit na mesma transação                              | Não existe |
| 003  | Quando inicia atraso                   | Hora exata/UTC ou data civil                                               | Dia seguinte ao vencimento civil São Paulo; dia do vencimento continua válido                                                       | Não existe |
| 005  | Devolução repetida                     | Erro/novo timestamp ou resposta idempotente                                | Preservar timestamp/evento original; própria conta ou Operações do tenant pode devolver                                             | Não existe |
| 005  | Foto em cadastro adicional             | URL arbitrária/upload, foto obrigatória, ou opcional sem imagem            | Opcional, sem affordance falsa para upload/URL; ausência honesta evita SSRF/fonte indevida                                          | Não existe |
| 004  | Rate limit distribuído                 | Memória local, IP puro ou Postgres com HMAC                                | Contadores atômicos persistidos; login 15/15min IP+e-mail e mutações 60/min IP+user; review de ambiente pendente                    | Não existe |
| 002  | Licença e revisão sem chave disponível | Scrapear/hotlink/placeholder ou preparar pipeline                          | CLI segura por item, originais/recortes/hash e revisão humana vinculada; não inventar foto aprovada                                 | Não existe |

## 2. Onde o agente tentou decidir por você

Houve uma suposição real, não um episódio fictício criado para cumprir o enunciado: documentos intermediários herdaram patrimônios abreviados sem hífen e disseram faltar descrição de inventário antes de conferir o anexo. O coordenador da execução detectou a divergência, leu a referência preservada e corrigiu para **TI-0001…TI-0012**, nomes, categorias e estados literais. Teste compara a lista ao JSON da referência; seed valida a sequência e o conjunto em manutenção (`prisma/seed.ts:33–37`).

Isso foi uma correção dentro da execução do agente, **não uma intervenção humana individual que não ocorreu**. A decisão humana explícita comprovada é trocar Pexels por Pixabay e solicitar execução completa com roteiro de dependências. A rubrica que exigir um episódio de intervenção pessoal precisa ser complementada pelo responsável com um acontecimento real, sem inventar conversa ou autoria. Registro da falha documental: `docs/adr/003-execucao-local-aprovada.md:8`.

## 3. Uma decisão que merece ADR

**Persistência e autoridade do runtime mereceram ADR004**, porque mudam segurança e operação, não só organização de arquivos. O stack histórico conecta Prisma como owner: habilitar RLS não impede que owner/BYPASSRLS a ignore. Optou-se por `SET LOCAL ROLE emprestai_app` em transações de domínio e settings locais, com policies que verificam membership real.

Alternativas defensáveis: apenas filtros server (mais simples, menos defesa em profundidade), credencial runtime least privilege completa (preferível antes de dados sensíveis, exige estratégia/grants/pooler e nova aprovação), ou abandonar Prisma para cliente Supabase (contraria arquitetura). A escolha local preserva o stack e é testável, mas **não resolve privilégio owner fora do wrapper**: lookup de membership/pré-auth ainda ocorre na conexão original. Não apresentar esse limite como isolamento irrestrito. Código: `src/server/api/context.ts:20`, `src/server/services/transaction.ts:12`; testes reais: `src/__tests__/integration/spec004.integration.test.ts:36`.

ADR003 registra a exceção de fonte/fluxo e a aprovação geral, sem dizer que o professor ou o usuário escolheu cada detalhe independentemente. Sentry está removido/inativo; nenhuma telemetria autorizada.

## 4. A skill imagens-equipamentos

- **SKILL.md:** propósito, gatilho, ordem e proibições que orientam o trabalho; `.agents/skills/imagens-equipamentos/SKILL.md:1`.
- **references/:** política Pixabay, limites de licença e roteiro que humano precisa compreender; não transformar instrução em prova.
- **Script:** garantias determinísticas e verificáveis: host HTTPS permitido, DNS público fixado, redirects revalidados, timeout, máximo 10 MiB, decodificação segura/Sharp, JPEG 800×600 sem metadados, IDs/hashes únicos, revisão vinculada aos bytes. `scripts/equipment-images.ts:23`, `:138`, `:385`, `:584`.
- **Humano:** coerência semântica do equipamento, ausência de pessoas/logos/texto/telas, direito/licença e aceite acadêmico. Nenhum parâmetro da API substitui essas inspeções.
- **Produção:** CLI de preparação não tem cliente administrativo; rede exige `--human` e terminal interativo antes de ler chave (`scripts/equipment-images-cli.ts:18`). Uploader separado exige confirmação de projeto/ação, bucket público existente, manifesto validado e rehash dos bytes. Seed exige receipt correspondente e bytes públicos idênticos (`scripts/human-production.ts:14`, `:46`, `:75`).

TTY e confirmação são barreiras operacionais contra execução acidental, **não sandbox da IA inteira**. A política desta execução proíbe qualquer ação remota pelo agente. O harness de revisão também não possui rede nem segredos.

**Fotos reais reprovadas: não apurado — nenhuma foto real foi submetida à revisão.** Vinte e dois dos 58 testes unitários do pacote são do pipeline e usam fixtures sintéticas. Não declarar “zero rejeições” como se uma revisão real tivesse ocorrido. A página de licença foi inacessível à consulta anterior (403); leitura/aceite humano vigentes continuam pendentes.

## 5. O subagente verificador

Gatilho: o principal solicita rodada ao terminar a implementação, com spec, escopo e hash; depois encaminha relatório a um revisor de contexto limpo. Não é disparado automaticamente por frontmatter, “agente existe” ou nome de teste. O launcher não invoca IA sozinho.

O revisor lê AGENTS/regras/ADRs/spec/plan/tasks e código/testes do manifesto para avaliar o CA inteiro, não herda certeza do principal. Neste monolito precisa cobrir UI, HTTP/tRPC, serviços e banco; a suite unitária isolada é insuficiente para CAs de Auth/integração/E2E.

**Isolamento comprovado dos subprocessos de checks:** macOS `sandbox-exec`, cópia sanitizada, env limpo (telemetria desligada), allowlist fixa Node/CLIs e binário esbuild instalado/resolvido, signals somente self/children, rede negada inclusive localhost, original/node_modules somente leitura, escrita só no temporário. Selftest ampliado também nega shell/curl e sinais a processos externos. Não executa shell/install/migration/deploy/Git nem copia `.env.local`, `.local` ou `.work`. `scripts/verify-spec.mjs:49–96`.

**Limite explícito:** a plataforma não ofereceu redução comprovada das ferramentas do revisor inteiro. Não chamar um subagente com Bash livre de sandboxado. A escrita de build/typecheck só ocorre na cópia através do launcher; a identidade do revisor no JSON é declarativa, não autenticação criptográfica. O gate verifica hashes/freshness/logs/review, mas não substitui auditoria de uma adulteração maliciosa do próprio supervisor.

## 6. O verificador em ação

### Histórico real de falhas e correções

| Rodada                  | Achado                                                              | Correção pelo principal                                                                                                                    | Evidência                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Integração inicial      | Item emprestado por outro usuário parecia livre sob RLS             | Helper tenant-scoped SECURITY DEFINER retorna somente booleano de ocupação; não abre loans/nomes alheios                                   | `src/server/services/occupancy.ts:1`; integração final 20/20                                                                                                   |
| Integração seguinte     | Seed com estados acentuados divergentes do schema                   | Lista literal e estados DB ASCII alinhados, teste de origem/lista                                                                          | [integration-final.log](docs/verificacao/evidencias/integration-final.log), `assets/equipment-list.json:1`                                                     |
| Build anterior          | Header `location` admitia array/undefined                           | Narrowing explícito antes de URL, redirects revalidados                                                                                    | [build-final-attempt.log](docs/verificacao/evidencias/build-final-attempt.log), `scripts/equipment-images.ts:105`                                              |
| E2E inicial             | Login sem alerta/hidratação com nonce CSP                           | Layout dinâmico para nonce por request; repetir os seis checks                                                                             | [e2e-first.log](docs/verificacao/evidencias/e2e-first.log), `src/app/layout.tsx:3`; E2E final 6/6                                                              |
| Release1                | Imports do mapper ausentes; stream sem async iterator nos tipos DOM | Imports explícitos e leitura limitada com getReader/cancel                                                                                 | [release-typecheck.log](docs/verificacao/evidencias/release-typecheck.log), [release-build.log](docs/verificacao/evidencias/release-build.log); release2 verde |
| Revisão independente005 | Categoria e atraso exclusivos, violando combinação de filtros       | Filtro temporal e categoria separados, UI acessível e condições AND; regressões de componente/PostgreSQL para busca, cursor, semana e KPIs | `docs/verificacao/reviews/semantic-004-005.md`; [ops-fix-integration.log](docs/verificacao/evidencias/ops-fix-integration.log), 22/22                          |

A rodada isolada **004/preflight1** reprovou tests (EPERM ao iniciar esbuild) e build (EPERM ao sinalizar worker); typecheck passou. O sandbox foi mantido, sem repetir fora dele e chamar isso de verificação isolada. Ajuste local do executor permitiu somente esbuild instalado e signals self/children, mantendo rede/segredos/escrita original negados; probe real tests/typecheck/build passou. Nova rodada compat1 e logs de selftest/probe preservados. Logs e relatório: `docs/verificacao/harness/004/preflight1/report.json`.

Essas rodadas de desenvolvimento não são automaticamente tabelas finais independentes de aceite. As tabelas estruturadas por CA ficam em `docs/verificacao/harness/{004,002,003,005}/final1/report.md`; rodadas preliminares/comparáveis usam IDs próprios. Ler verdict/problemas/review no relatório, não inferir que todos os CAs passaram pelos nomes dos testes. Logs unitários e testes candidatos são inventário, não aprovação.

### Erro plantado

Selftest cria uma **fixture descartável**, com `assert.equal(false,true,'intentional CA-10 planted error')`. Sandbox reprova com exit 1; o principal do teste muda a fixture para true/true e a nova cópia passa com exit 0. Os hashes de fonte diferem e os arquivos originais/sintéticos protegidos permanecem intactos. `scripts/__tests__/verifier.test.mjs:96` e [log real](docs/verificacao/evidencias/release-harness-selftest.log).

**Não são dois commits reais nem erro de domínio plantado na spec002/003.** O diretório não é Git e não houve autorização para commit/tag; esse requisito acadêmico continua pendente e deve ser realizado honestamente pelo humano no repositório, antes de marcar entrega. Hash de fixture não substitui hash de commit.

### Gate final

`node scripts/check-delivery.mjs --reports ...` valida reports/logs/hash/review por spec, rejeita stale/incompletos e mantém **NÃO PRONTA** por pendências humanas/produção e commits. Não existe flag para transformar placeholders em aceite. Resultado efetivo preservado em `docs/verificacao/delivery/gate-final.json` com exit em arquivo separado. Revisões finais estritas só aprovam evidência integral executada na rodada: integração histórica externa continua separada, sem converter seu nome em assertion unitária. Comparação de 002/003 entre rodadas em `docs/verificacao/delivery/comparacao-rodadas.json`. A avaliação externa de Auth/fotos/professor/deploy e a assinatura humana não foram implementadas como aprovação fictícia no gate.

## 7. Uma regra posta à prova

`rules/checks.md` exigia reset via Supabase CLI enquanto `rules/migration.md` atribuía schema ao Prisma Migrate. Aplicar ambos poderia produzir dois donos de schema. O anexo específico/ADR004 mantém **Prisma CLI como único dono**; resets somente sobre banco descartável local e replay documentado. Não executar SQL remoto para contornar constraints.

Outra regra incompleta dizia que políticas assegurariam isolamento ao usar owner: **não é verdade para bypass**. O ADR foi complementado com privilégio efetivo, wrapper, teste real da role e limitação externa ao wrapper. O prompt do verificador também não garante somente leitura quando build/test podem escrever: substituir promessa por enforcement do subprocesso e registrar o que não está restrito.

## 8. O que ficou de fora e o que faria diferente

### Ações que dependem de vc

Roteiro completo, comandos e checklist sem valores: **[docs/PUBLICACAO-HUMANA.md](docs/PUBLICACAO-HUMANA.md)**.

1. Criar/controlar contas e projetos **GitHub, Supabase, Vercel e Pixabay**; obter chave da API somente no seu ambiente local. Não enviar chaves/senhas no chat.
2. Obter **aceite do professor** ao Pixabay e ao acesso seguro em vez de senha versionada. Não falsificar conformidade ao Pexels.
3. Provisionar Auth do professor, Operações e testes com UUIDs reais distintos; fechar cadastro público e configurar origins. Professor é colaborador e fica sem empréstimos iniciais.
4. Revisar **12 fotos, originais e recortes**, licença/direitos; gerar manifesto, bucket público somente para fotos revisadas, sem escrita anon.
5. Revisar privilégios runtime/owner/grants/pooler **antes de dados reais**. Correspondência Auth/Storage/DATABASE_URL do mesmo projeto é gate humano: o runtime atual valida URLs/protocolos, mas não cruza project ref. Header de IP confiável precisa ser validado na Vercel; fora dela `unavailable` agrega limites e pode bloquear vários usuários.
6. Executar pessoalmente **migration → upload → seed** via scripts interativos após revisar destino. Nenhuma dessas ações remotas foi feita.
7. Validar instalação/build limpos, CI/Testcontainers, **Auth HTTP real** (cookies sem revelar valores, refresh/expiração/adulteração/logout/back), fluxos autenticados nas seis telas e viewports 360/390/desktop. O E2E existente cobre apenas fronteiras anônimas.
8. Criar/revisar **histórico Git, prova acadêmica com commits e tag `entrega-pratica`**, acesso do avaliador, publicar e registrar URL/commit/smoke test. Nenhum push/deploy/convite executado.

### Limites do pacote

- Sem fotos/Auth/Storage/Vercel/produção reais comprovados; sem E2E autenticado completo.
- Sem repositório Git, hashes de commits ou tag, sem prova acadêmica de dois commits.
- Owner fora do wrapper e grants/pooler exigem revisão; não adequado a dados sensíveis como está.
- Audit dev tem 16 moderate; não executar `audit fix --force` nem mascarar risco. Reavaliar ferramentas/versões antes de CI público.
- Next avisa convenção middleware deprecated; build webpack passou. Não migrou para proxy automaticamente fora do escopo.
- Snapshot/hashes/logs não equivalem a assinaturas externas; enforcement pertence ao launcher local, não à IA inteira.
- ZIP exclui segredos/.env.local, node_modules, .work, .local, .next, traces e dados dos testes. Inclui somente fonte, lockfile, docs/referências redigidas e evidências sanitizadas. Precisa de `npm ci` em ambiente compatível.

Em uma próxima etapa, priorizaria credencial runtime least privilege aprovada, Auth local reproduzível e E2E autenticado completo antes de ampliar funcionalidades. Não acrescentaria notificações, reservas ou relatórios para disfarçar gates de segurança/aceite ainda abertos.
