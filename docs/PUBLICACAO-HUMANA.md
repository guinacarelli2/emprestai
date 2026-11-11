# Publicação humana — EmpresTI

**Estado: código funcional local em implementação/verificação; publicação e aceite acadêmico PENDENTES. Não é autorização nem certificado de produção pronta.** Este roteiro é executado pelo responsável humano. O agente não cria contas, envia convites, aplica migration/seed remoto, faz upload, commit, push, tag ou deploy. Evidências e resultados efetivamente obtidos ficam em [ENTREGA.md](../ENTREGA.md); comandos abaixo são instruções, não prova de execução.

## 1. O que depende de vc

- [ ] Obter aprovação do professor ao uso exclusivo de **Pixabay**. O enunciado pede Pexels; o usuário pediu Pixabay, mas isso **não equivale a aceite acadêmico**. Não trocar a fonte silenciosamente nem usar fallback.
- [ ] Criar/controlar as contas, projetos, credenciais e acessos abaixo, sem compartilhar segredos com o agente.
- [ ] Revisar segurança, permissões e isolamento do runtime antes de colocar qualquer dado real. **Gate bloqueante**, explicado na seção 3.
- [ ] Provisionar as três identidades Auth reais e distintas e revisar as doze fotos, originais e recortes.
- [ ] Executar pessoalmente migration, upload e seed, cada um confirmado no terminal interativo para o projeto correto.
- [ ] Revisar pacote/Git, realizar os dois commits reais e a tag exigidos pelo enunciado, configurar publicação e fazer smoke test humano. Não fabricar histórico.

### Contas e referências oficiais

| Serviço  | Necessário                                                                                                                                 | Referência oficial                                                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub   | Conta humana, repositório sob controle do responsável e permissão de integração com Vercel; definir acesso do avaliador conforme enunciado | [Cadastro](https://github.com/signup), [criar repositório](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)                                                                             |
| Supabase | Conta, projeto dedicado, acesso administrativo para Auth, banco e Storage; conferir ID público do projeto e conexões no painel             | [Painel](https://supabase.com/dashboard), [conexões PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres), [Auth](https://supabase.com/docs/guides/auth), [Storage](https://supabase.com/docs/guides/storage)        |
| Vercel   | Conta humana com acesso ao repositório e projeto Next.js; configurar ambientes e branch antes de qualquer push conectado                   | [Cadastro](https://vercel.com/signup), [integração Git](https://vercel.com/docs/git), [variáveis de ambiente](https://vercel.com/docs/environment-variables), [Node.js](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) |
| Pixabay  | Conta humana e chave para API; uso somente no shell local da preparação, nunca no navegador/Vercel                                         | [API](https://pixabay.com/api/docs/), [resumo da licença](https://pixabay.com/service/license-summary/), [termos](https://pixabay.com/service/terms/)                                                                                        |

Não é necessário pagar por uma ferramenta adicional de imagens. Limites e condições dos planos devem ser conferidos pelo responsável; este documento não promete disponibilidade gratuita ilimitada.

## 2. Ambiente e checklist sem valores

Toolchain fixado: **Node 22.23.4 / npm 10.9.9**, `.nvmrc`, lockfile e dependências exatas. Vercel permite selecionar a família Node 22.x: não presumir que oferece a mesma versão patch do ambiente local.

`.env.local` fica **somente na máquina do humano**; não entra em Git, ZIP, screenshots ou logs. `.env.example` é o inventário versionado **sem valores**. Nada aqui usa prefixo `NEXT_PUBLIC_`; Auth é server-only. Não copiar todo o arquivo local para Vercel.

| Nome                        | Local humano                                                                                  | `.env.example`  | Vercel Preview / Production                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`              | Banco local dedicado para desenvolvimento; remoto só no fluxo humano autorizado               | Presente, vazio | Runtime via transaction pooler/Supavisor 6543, `pgbouncer=true&connection_limit=1`, após gate de role/conexão |
| `DIRECT_URL`                | Prisma e scripts humanos; remoto usa conexão direta/session pooler 5432 do projeto confirmado | Presente, vazio | **Não enviar URL owner/admin; só ferramentas locais/migration**                                               |
| `SUPABASE_URL`              | Projeto local ou projeto remoto conscientemente escolhido                                     | Presente, vazio | URL do projeto correspondente ao ambiente                                                                     |
| `SUPABASE_ANON_KEY`         | Chave do projeto escolhido, tratada como configuração server-only                             | Presente, vazio | Chave anon do projeto correspondente; não substitui políticas/autorização                                     |
| `SUPABASE_STORAGE_BUCKET`   | Nome do bucket revisado                                                                       | Presente, vazio | Mesmo bucket das fotos públicas revisadas                                                                     |
| `APP_URL`                   | Origem local no desenvolvimento                                                               | Presente, vazio | Origem HTTPS exata do ambiente; alinhar URLs permitidas do Auth                                               |
| `RATE_LIMIT_SECRET`         | Segredo próprio, pelo menos 32 caracteres, gerado/guardado pelo humano                        | Presente, vazio | Segredo exclusivo do ambiente, sem divulgação                                                                 |
| `PIXABAY_API_KEY`           | **Exportar no shell da sessão** para a CLI de imagens                                         | Presente, vazio | **Não configurar**                                                                                            |
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas scripts administrativos humanos                                                        | Presente, vazio | **Não configurar**                                                                                            |
| `TEACHER_AUTH_USER_ID`      | UUID real Auth do professor                                                                   | Presente, vazio | **Não configurar**                                                                                            |
| `OPERATIONS_AUTH_USER_ID`   | UUID real Auth de Operações                                                                   | Presente, vazio | **Não configurar**                                                                                            |
| `TEST_AUTH_USER_ID`         | UUID real Auth da conta de testes                                                             | Presente, vazio | **Não configurar**                                                                                            |
| `SENTRY_DSN`                | Opcional/inativo                                                                              | Presente, vazio | Não configurar sem autorização específica de telemetria                                                       |

Presença em `.env.example` não prova preenchimento local nem configuração remota. O responsável confere cada ambiente diretamente, sem imprimir valores.

**Carregamento:** Next carrega `.env.local`; os scripts `human-production.ts` o carregam depois da confirmação humana. A CLI `equipment-images-cli.ts` **não carrega dotenv nem `.env.local`**: lê `PIXABAY_API_KEY` do ambiente do processo. Prisma CLI/postinstall e o launcher de migration local não devem ser presumidos leitores de `.env.local`; disponibilize os nomes necessários na sessão por um mecanismo seguro, sem colar credenciais no histórico. Não use `cat .env.local`, `printenv`, rastreamento `set -x` ou gravação do terminal.

## 3. Gate de segurança — bloqueia dados reais e publicação sensível

O código usa Prisma com `DATABASE_URL`. Dentro de `tenantTransaction`, executa `SET LOCAL ROLE emprestai_app` e settings transacionais `app.tenant_id`, `app.user_id`, `app.role`. A migration declara `emprestai_app` NOLOGIN/NOBYPASSRLS e concede a role ao **usuário que executou a migration**. Isso não comprova que outro usuário do runtime pode assumir a role, nem que o pooler preserva o isolamento esperado.

O lookup de membership em `src/server/api/context.ts` e o lookup de tenant pré-auth continuam fora desse wrapper, no contexto da conexão Prisma original/owner. Owner ou BYPASSRLS pode ignorar policies. Filtros server, autorização, FKs composites e transação não transformam a credencial owner em least privilege; `FORCE RLS` também não neutraliza superuser/BYPASSRLS.

Antes de qualquer dado real, revisão humana deve comprovar:

- [ ] Usuário efetivo do runtime, privilégios, capacidade de `SET LOCAL ROLE` e grants corretos para **esse usuário**, não apenas o migrador.
- [ ] Ausência de superuser/BYPASSRLS no caminho restrito e teste real de isolamento entre tenants e entre transações no pooler; analisar também os lookups externos ao wrapper.
- [ ] Estratégia aprovada de credencial runtime least privilege e migrations versionadas necessárias, caso haja alteração. **Este pacote não entrega uma migração pronta dessa estratégia.** Não resolver por SQL avulso, chave admin ou desativação de RLS.
- [ ] Revisão do build/Prisma e contrato de env: `prisma/schema.prisma` referencia `DIRECT_URL`, mas **`src/env.ts` não a exige mais no runtime**. Prisma generate foi comprovado sem DATABASE_URL/DIRECT_URL em cópia local do schema e saída descartável (evidência em ENTREGA). Ainda verificar `npm ci`/postinstall e build limpos sem a credencial direta no ambiente final. Se a geração exigir variável apenas de build, revisar o mecanismo mínimo e seu escopo antes de liberar; não enviar URL direta owner à Vercel nem inventar valor/fallback como solução. A remoção da validação runtime não comprova o comportamento de Prisma no build; sem evidência compatível, deploy permanece bloqueado.
- [ ] Revisão de Auth fechado, cookies httpOnly/secure, origins, rate limit, audit, dependências, exposição de metadados e acesso do avaliador.

Usar apenas dados de demonstração não sensíveis em ambiente dedicado, após autorização; não conectar este pacote a uma base corporativa. Nenhuma exposição pública do banco é autorizada.

## 4. Preparação e checks locais

Na raiz do projeto, depois de configurar a sessão/ambiente local dedicado:

```bash
node --version
npm --version
npm ci
npm run build
npm run typecheck
npm test
npm run lint
```

`npm run build` executa `prisma generate && next build --webpack`. Não substituir por build Turbopack nem retirar geração Prisma para mascarar erro. Para desenvolvimento: `npm run dev` e `http://localhost:3000` → `/login`. Build/start usa modo production e suas exigências de HTTPS/origin; build aprovado não prova login ou integração Supabase.

Banco local deve ser loopback e descartável/dedicado. O launcher existente `npm run db:migrate:local -- deploy` valida destino real e aplica migrations via Prisma; não cria automaticamente um servidor PostgreSQL. Não rodar reset sobre dados existentes nem usar Supabase CLI/Studio como dono alternativo do schema.

```bash
npm run test:integration
npm run test:e2e
```

Integração usa PostgreSQL **local** por `TEST_DATABASE_URL` em banco novo dedicado/loopback, ou Testcontainers que precisa de Docker funcional. O caminho Docker/Testcontainers ainda precisa de evidência real (PostgreSQL standalone local foi testado); ter configuração de CI não comprova execução. E2E requer navegador e ambiente/fixtures próprios do teste. Não apontar testes ao Supabase remoto nem usar conta do professor para empréstimos de teste.

A CI atual tem jobs de qualidade (tipos, testes, lint, build e audit de runtime) e integração local/Testcontainers. Não aplica migration/seed/upload/deploy remoto. Registrar saídas reais, falhas e limitações em ENTREGA; não inferir aprovação do CI pela existência do YAML.

## 5. Auth e bucket — configuração manual antes dos scripts

No painel do projeto correto, o humano deve criar/provisionar três contas por fluxo seguro. Qualquer convite/e-mail é ação externa separada, que precisa de autorização. Não há provisionamento automático de senha neste pacote.

| Identidade | Requisito                                                                              | Papel do seed                   |
| ---------- | -------------------------------------------------------------------------------------- | ------------------------------- |
| Professor  | E-mail **marcelo.grilo@institutojef.org.br**, UUID Auth real em `TEACHER_AUTH_USER_ID` | `colaborador`, zero empréstimos |
| Operações  | Conta controlada pelo responsável, UUID Auth real em `OPERATIONS_AUTH_USER_ID`         | `operacoes`                     |
| Testes     | Outra conta controlada pelo responsável, UUID Auth real em `TEST_AUTH_USER_ID`         | `colaborador`                   |

Os três UUIDs precisam ser distintos. O seed humano consulta Auth e confere o e-mail do professor e existência das outras duas contas. Não incluir senha do enunciado em código, docs, env, seed, log, ZIP ou Git; credenciais/acesso são administrados diretamente pelo humano em canal seguro. Cadastro público deve ficar fechado e URLs/Auth do ambiente revisadas.

Criar/revisar manualmente um **bucket existente e público** com o nome de `SUPABASE_STORAGE_BUCKET`, restrito às fotos públicas aprovadas (JPEG, limite de 10 MiB por arquivo). O uploader deve **recusar bucket inexistente ou privado**, sem criar nem torná-lo público automaticamente. Conferir essa condição no código final antes de executá-lo; qualquer divergência bloqueia upload.

“Público” aplica-se apenas à leitura das fotos. **Nenhuma policy de escrita anon**, nenhum documento interno, dado pessoal, equipamento fotografado com informações corporativas, original não revisado ou segredo no bucket. Não tornar o banco público nem usar credencial administrativa no app.

## 6. Doze fotos Pixabay — execução humana por item

Ler [licença/resumo](https://pixabay.com/service/license-summary/) e termos vigentes. SafeSearch e resolução mínima não garantem ausência de pessoas, marcas, texto ou direitos de terceiros. As fotos são ilustrativas do tipo de equipamento, não prova de uma unidade física real.

Disponibilizar `PIXABAY_API_KEY` **somente no shell da sessão**, por entrada segura sem eco/histórico. Não pôr a chave na linha de comando, sugestões, manifesto ou navegador. Depois executar a sequência **para cada patrimônio TI-0001 até TI-0012**, sem automatizar a seleção/revisão:

```bash
npx --no-install tsx scripts/equipment-images-cli.ts discover TI-0001 --human
# Inspecionar .local/images/suggestions-TI-0001.html e a página oficial de cada candidato.
# Substituir ID_ESCOLHIDO por um ID numérico realmente listado no cache.
npx --no-install tsx scripts/equipment-images-cli.ts select TI-0001 ID_ESCOLHIDO
npx --no-install tsx scripts/equipment-images-cli.ts prepare TI-0001 --human
```

`discover` e `prepare` exigem **humano, --human e TTY interativo**, pois acessam a rede. `select` usa as sugestões em cache e exige escolha explícita; não aceita repetir ID de outro item. `prepare` baixa o original e gera JPEG **800×600**, sem hotlink de runtime. Não usar Pexels, scraping, download arbitrário ou placeholder para disfarçar ausência de foto. Se nenhuma sugestão serve, parar e registrar o bloqueio; não forçar uma aprovação.

Ao terminar os doze itens, existem em `.local/images/`: caches e sugestões por item, `selection.json`, `prepared.json`, **doze originais** `original-TI-xxxx.*`, **doze recortes** `TI-xxxx.jpg` e `gallery.html`. Revisar visualmente **ambos** os arquivos de cada item.

```bash
npx --no-install tsx scripts/equipment-images-cli.ts review-template
# Editar manualmente .local/images/review.json após inspeção verdadeira.
npx --no-install tsx scripts/equipment-images-cli.ts finalize
npx --no-install tsx scripts/equipment-images-cli.ts verify
```

Em `review.json`, preservar vínculos de patrimônio/ID/hashes e `preparationSha256`. Preencher revisor responsável e timestamp ISO real (não futuro). Em `originalInspection` **e** `finalCropInspection`, confirmar individualmente `noPeople`, `noLogos`, `noText`, `noScreenContent`, `equipmentMatch` e `licenseRead` somente quando forem verdadeiros. O template não aprova nada; não trocar todos os campos automaticamente por `true`.

Rejeitou uma foto? Voltar à escolha/preparação e revisar novamente. O template não sobrescreve `review.json`; guardar a revisão anterior de forma recuperável e gerar nova revisão vinculada à nova preparação, sem reaproveitar aprovação/hash antigos.

`finalize` gera `manifest.json`; `verify` valida manifesto, revisão, IDs únicos, arquivos, dimensões e hashes dos originais/recortes. Essa validação não substitui inspeção humana nem aprovação acadêmica. Manter crédito **Fotos: Pixabay**, link para fonte, autor/página da foto e **Pixabay Content License** com URL do resumo no manifesto/metadados. Nenhuma chave nesses artefatos.

## 7. Migration → upload → seed: três ações remotas separadas

Somente após os gates anteriores e uma nova revisão de destino, permissões e conteúdo, o humano abre um terminal TTY na raiz. Scripts administrativos carregam `.env.local` **após** confirmação. Variáveis já exportadas na sessão podem interferir na configuração: conferir o destino sem imprimir segredos; não misturar projetos.

```bash
npm run db:deploy:human
npm run images:upload:human
npm run db:seed:human
```

Cada execução solicita o ID público do projeto e confirmação exata `MIGRATE <projeto>`, `IMAGES <projeto>` ou `SEED <projeto>`. Não executar por CI, pipe, here-document, terminal do agente ou contornar o TTY. O script compara `SUPABASE_URL` e `DIRECT_URL` ao projeto confirmado; a conexão administrativa usa 5432 e banco `postgres`. Migration usa **Prisma migrate deploy**, sem reset, SQL avulso ou edição de migration já publicada. Não confirma permissões do runtime por si só.

Upload consome apenas manifesto/arquivos revisados, envia recortes a caminhos determinísticos `equipment/TI-xxxx.jpg` e grava `.local/images/upload-receipt.json` com projeto, bucket, hash do manifesto e associações. Usa upsert: pode substituir bytes nesses caminhos. Um erro pode deixar upload parcial; revisar antes de repetir os mesmos caminhos. Recibo local sozinho **não prova acessibilidade pública**.

Seed deriva fotos via **`manifestToSeedImages`**, não arquivo artesanal nem **`seed-images.json` legado**. Exige manifesto/revisão válidos, recibo correspondente a projeto/bucket/hash e faz fetch público dos bytes de cada foto, sem redirects, comparando SHA-256 antes de associar os metadados ao banco. URL que abre, recibo ou quantidade de arquivos isoladamente não bastam. Se qualquer etapa falhar, não declarar fotos/seed publicados.

O inventário inicial é TI-0001…TI-0012, **9 disponíveis / 3 em manutenção**: TI-0004, TI-0007 e TI-0010. Papéis são `operacoes` e `colaborador`; tenant `suporte_ti`. O seed não cria empréstimos nem apaga dados legítimos; reexecução não corrige silenciosamente estado/papel divergente existente. Professor com empréstimos já existentes causa bloqueio, não limpeza automática.

## 8. Git e Vercel — só depois de revisão

1. Revisar escopo, docs, artefatos do pacote e segredos. Confirmar se já existe repositório Git: nesta leitura, `git status` informou **não é repositório**; não alegar branch ou histórico existente. Inicialização/remoto é decisão/ação humana.
2. Criar os **dois commits reais e tag** exigidos, com nomes/conteúdo conforme enunciado e trabalho efetivamente revisado. Não produzir commits artificiais, autoria falsa ou datas inventadas. Antes de commit, revisar status/diff/log quando aplicável. `.env.local`, `.work`, `.local`, dependências, build e segredos não entram; `review.json`/recibo ficam locais e só evidência sanitizada entra no pacote autorizado.
3. Configurar integração GitHub/Vercel, visibilidade e ambientes **antes de push**. Push em branch conectada pode publicar automaticamente; PR pode criar Preview. Usar branch de trabalho/PR e proteger produção. Preview também não deve expor dados reais ou receber credenciais administrativas.
4. Após resolver gate de `DIRECT_URL` e runtime, revisar `npm ci`, Node 22.x e build `npm run build` já descritos em `vercel.json`; não adicionar migration/seed/upload ao build. Configurar apenas variáveis de runtime aprovadas, separadas entre Preview e Production; alinhar `APP_URL` e Auth à origem HTTPS efetiva.
5. Publicar manualmente pelo humano apenas quando houver autorização e gates aprovados. Registrar URL, versão/commit e resultado do smoke test, sem segredos. Não considerar a existência de `vercel.json` ou build local como deploy verificado.

## 9. Smoke test e evidências de entrega

O responsável registra em [ENTREGA.md](../ENTREGA.md), depois de executar de fato:

- Instalação/toolchain, checks locais/CI, integração Docker e verificador: saídas reais e limitações, sem números de testes presumidos.
- Aceite acadêmico Pixabay ou pendência explícita; revisão/licença das doze imagens e confirmação de bytes públicos/hash.
- Provisionamento Auth, login/logout/refresh e autorização: professor colaborador sem empréstimos, conta de Operações separada, nenhuma senha registrada.
- Inventário 12/9/3 no ambiente limpo, persistência após recarregar, manutenção sem solicitação e controle de tenant.
- Usando **conta de testes**: solicitar/devolver, limite de **três empréstimos abertos**, vencimento **14 dias civis corridos em America/Sao_Paulo**, atraso no dia seguinte bloqueando nova solicitação; devolução idempotente/audit e concorrência comprovadas por testes apropriados.
- Segurança runtime/RLS/grants/pooler e compatibilidade de build sem credencial `DIRECT_URL` owner comprovadas por review/evidência, não por afirmação documental.
- Histórico Git/tag reais, URL publicada e smoke test humano, ou bloqueios ainda abertos.

Sem essas evidências, manter explicitamente PENDENTE: Auth remoto, banco/seed remoto, fotos reais revisadas/publicadas, deploy e prontidão de produção. Não entregar pacote com segredos nem anunciar adequação a dados sensíveis.
