# Revisão semântica independente — specs 002 e 003 (draft)

NÃO PRONTA — 15 CAs sem prova integral; 3 atendidos semanticamente apenas pelas evidências históricas. Nenhuma spec aprovada integralmente e nenhum aceite final do harness.

**Sem vínculo final de hash/schema.** Rascunho independente; NÃO é review schemaVersion1 do harness, sem sourceHash/checksHash inventados. Vínculo ao hash e assertions JSON de rodadas finais é follow-up.

## Regras e evidências efetivas

ATENDIDO somente cobertura integral semântica com tipo exigido; SEM TESTE quando faltar parte/real/E2E/reload/restart. REPROVADO reservado a teste falho ou contradição comprovada de CA. Ausência de prova não foi vendida como bug reproduzido.

- 56 unitários = 22 pipeline sintético + 1 script humano + 33 unit/component; não 78.
- 20 integrações = 1 da002 + 6 da003 + 8 da004 + 5 da005, PostgreSQL real loopback; Auth/contextos sintéticos.
- 6 E2E = 3 testes em desktop/mobile, somente fronteira anônima/login/CSP; zero fluxo autenticado002/003.
- Release2 lint/typecheck/build passaram historicamente; integração reaproveitada. Nenhum comando extra executado por esta revisão.
- preflight004 tests spawn EPERM/build kill EPERM falharam. Allowlist/rodadas finais são follow-up; não mascarar falha nem afirmar isolamento global de ferramentas de IA.
- Nomes completos abaixo provêm dos describe+test/it efetivos, não de candidatos do harness. Logs default comprovam execução de arquivos/suítes e mostram alguns nomes; não fornecem JSON granular de todos asserts. Cobertura semântica histórica não substitui vínculo de rodada final.

## Contagem

| Spec | ATENDIDO | REPROVADO | SEM TESTE | AMBÍGUO | OUTRO REPOSITÓRIO |
|---|---:|---:|---:|---:|---:|
| 002 | 1 | 0 | 7 | 0 | 0 |
| 003 | 2 | 0 | 8 | 0 | 0 |
| Total | 3 | 0 | 15 | 0 | 0 |

## 002/CA-01 — ATENDIDO

**Critério inteiro:** **CA-01 — inventário [seed/banco].** Em banco local limpo, exatamente TI-0001 a TI-0012 no tenant, sem outros itens seedados. Evidência esperada: integração comparando conjunto completo de patrimônios e contagem 12, não só amostra.
Fonte normativa: `docs/specs/002-dados-iniciais/spec.md:36`.

Integração real compara conjunto completo e retorno 12 antes da adição legítima. Banco dedicado recebeu migration; não há reset remoto. Aceite semântico histórico somente deste CA estreito.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec002.integration.test.ts:8` — **002 dados iniciais — seed real local > test_ca_01_ca_02_ca_03_ca_04_ca_08_seed_exact_idempotent_preserves_legitimate_data**
  - Assert: L11 equipment=12/professorLoans=0; L14 conjunto TI-0001…TI-0012; L15 manutenção exata; L16 disponíveis=9; L17 loans=0; L18 role colaborador; L23–29 tenant=1/memberships=3/equipment=13, item/loan preservados e audit sem duplicação.
  - Tipo: PostgreSQL real local, IDs Auth sintéticos; execução: `docs/verificacao/evidencias/release-integration.log:134`.

**Falta:** Nenhuma lacuna semântica identificada no CA estreito; vínculo final de rodada permanece follow-up.

**Runtime/apoio:** `prisma/seed.ts:33`, `prisma/seed.ts:53`, `docs/verificacao/evidencias/release-integration.log:5`.

## 002/CA-02 — SEM TESTE

**Critério inteiro:** **CA-02 — estados [seed/banco].** Somente TI-0004, TI-0007 e TI-0010 em manutenção; outros nove disponíveis, nomes/categorias exatos da tabela, sem loan aberto nem projetor no seed. Evidência: comparação por patrimônio, agregados 3/9 e contagem de loans zero.
Fonte normativa: `docs/specs/002-dados-iniciais/spec.md:37`.

Estados/zero loans demonstrados; nomes/categorias completos não são comparados por patrimônio no banco. Um teste de fonte não substitui a comparação seed/banco requerida.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec002.integration.test.ts:8` — **002 dados iniciais — seed real local > test_ca_01_ca_02_ca_03_ca_04_ca_08_seed_exact_idempotent_preserves_legitimate_data**
  - Assert: L11 equipment=12/professorLoans=0; L14 conjunto TI-0001…TI-0012; L15 manutenção exata; L16 disponíveis=9; L17 loans=0; L18 role colaborador; L23–29 tenant=1/memberships=3/equipment=13, item/loan preservados e audit sem duplicação.
  - Tipo: PostgreSQL real local, IDs Auth sintéticos; execução: `docs/verificacao/evidencias/release-integration.log:134`.
- `scripts/__tests__/images.test.ts:98` — **002/CA-05 CA-07 local image pipeline > test_ca_05_inventory_matches_literal_reference_html**
  - Assert: L103 equipment igual JSON do anexo; L104 primeiro nome completo. Comparação de fonte, não de linhas no banco.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:47`.

**Falta:** Comparação de todas as linhas DB com nome/categoria/estado esperados e ausência de projetor no seed.

**Runtime/apoio:** `prisma/seed.ts:63`, `assets/equipment-list.json:1`.

## 002/CA-03 — SEM TESTE

**Critério inteiro:** **CA-03 — idempotência [seed].** Segunda execução não duplica tenant, membership, item, foto ou audit de criação; não apaga empréstimos ou equipamentos criados depois e não repõe como disponível item já emprestado. Evidência: duas execuções mais fixture de dado legítimo preservado, sem reset remoto.
Fonte normativa: `docs/specs/002-dados-iniciais/spec.md:38`.

Segunda execução e preservação de equipamento/loan/audit demonstradas, mas chamada usa images=[] nas duas vezes. Equipment DB disponivel + loan aberto é modelo correto, não falha por si só.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec002.integration.test.ts:8` — **002 dados iniciais — seed real local > test_ca_01_ca_02_ca_03_ca_04_ca_08_seed_exact_idempotent_preserves_legitimate_data**
  - Assert: L11 equipment=12/professorLoans=0; L14 conjunto TI-0001…TI-0012; L15 manutenção exata; L16 disponíveis=9; L17 loans=0; L18 role colaborador; L23–29 tenant=1/memberships=3/equipment=13, item/loan preservados e audit sem duplicação.
  - Tipo: PostgreSQL real local, IDs Auth sintéticos; execução: `docs/verificacao/evidencias/release-integration.log:134`.

**Falta:** Reexecução com 12 fotos vinculadas e asserts de preservação/sem duplicação de foto e metadados. Consulta derivada autenticada mostrando item emprestado após reseed; teste atual só confirma returnedAt=null.

**Runtime/apoio:** `prisma/seed.ts:29`, `prisma/seed.ts:60`.

## 002/CA-04 — SEM TESTE

**Critério inteiro:** **CA-04 — professor [Auth/membership].** `marcelo.grilo@institutojef.org.br` tem membership `colaborador` em `suporte_ti`, sem papel operacoes e sem empréstimos iniciais; identity Auth provisionada por fluxo seguro local ou ação humana no remoto. Não inserir senha em código, seed, arquivo versionado, ZIP ou log. Evidência: vínculo ao ID real de Auth, login local e autorização negando operações; inspeção sem revelar segredos. Sem identidade provisionada, registrar pendência, não fingir login funcional.
Fonte normativa: `docs/specs/002-dados-iniciais/spec.md:39`.

UUID aleatório teacher verifica somente membership colaborador e zero loans; não é identity Supabase provisionada nem vínculo comprovado ao e-mail do professor. Não inspecionados .env.local/chaves ou senhas reais.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec002.integration.test.ts:8` — **002 dados iniciais — seed real local > test_ca_01_ca_02_ca_03_ca_04_ca_08_seed_exact_idempotent_preserves_legitimate_data**
  - Assert: L11 equipment=12/professorLoans=0; L14 conjunto TI-0001…TI-0012; L15 manutenção exata; L16 disponíveis=9; L17 loans=0; L18 role colaborador; L23–29 tenant=1/memberships=3/equipment=13, item/loan preservados e audit sem duplicação.
  - Tipo: PostgreSQL real local, IDs Auth sintéticos; execução: `docs/verificacao/evidencias/release-integration.log:134`.

**Falta:** Auth real local seguro, correspondência ID/e-mail professor, login e operações negadas usando aquela sessão. Inspeção de pacote final/ZIP sem senha real, feita sem divulgar segredo.

**Runtime/apoio:** `src/__tests__/integration/spec002.integration.test.ts:9`, `prisma/seed.ts:44`, `ENTREGA.md:5`.

## 002/CA-05 — SEM TESTE

**Critério inteiro:** **CA-05 — foto individual [pipeline local].** Cada um dos 12 itens possui uma foto própria/única (IDs Pixabay e arquivos distintos), obtida **exclusivamente pela API Pixabay**, processada para exatamente **800×600**, com associação semanticamente coerente ao tipo. Revisão visual obrigatória rejeita pessoas, marcas/logos legíveis, texto e telas com conteúdo; parâmetros API não garantem direito de imagem. Persistir origem, ID, fotógrafo/autor, página e licença/URL conforme campos existentes; não usar Pexels, outras fontes, scraping ou hotlink como substituto. Evidência: manifesto verificável das 12 respostas/origens sem chave, IDs distintos, dimensões, hashes dos 12 arquivos e manifesto/revisão visual com rejeições reais; não tratar imagem ilustrativa como foto da unidade real.
Fonte normativa: `docs/specs/002-dados-iniciais/spec.md:40`.

Fixture gera JPEGs de cor sólida e API injetada; reviewer/inspeções são artificiais. Nenhuma dessas imagens conta como foto real ou licença lida.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `scripts/__tests__/images.test.ts:272` — **002/CA-05 CA-07 local image pipeline > test_ca_05_manifest_binds_review_hash_provenance_and_maps_exact_seed_contract**
  - Assert: L276 entradas=12; L278–288 mapeamento origem/licença/hash; L290–310 duplica ID/hash, reordena, review inválido e traversal rejeitados; L312 tamper Hash rejeitado.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:47`.
- `scripts/__tests__/images.test.ts:314` — **002/CA-05 CA-07 local image pipeline > test_ca_05_rejects_blank_review_template_and_changed_provenance**
  - Assert: L327 review branco rejeitado; L333 fotógrafo alterado rejeitado.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:47`.

**Falta:** 12 respostas reais API sem chave + 12 IDs/arquivos/hashes/dimensões; manifesto real; seleção coerente e revisão visual original/recorte com rejeições reais. Leitura da licença/direitos aplicáveis por foto; não apenas literal licenseRead=true.

**Runtime/apoio:** `scripts/__tests__/images.test.ts:66`, `scripts/equipment-images.ts:415`, `ENTREGA.md:7`.

## 002/CA-06 — SEM TESTE

**Critério inteiro:** **CA-06 — desvio acadêmico [documentação].** O enunciado original exige Pexels; Pixabay é **DESVIO solicitado explicitamente pelo usuário e requer aprovação do professor**, ainda pendente. Evidência: registro explícito do desvio no pacote final e aprovação do professor separada quando existir; pedido do usuário não equivale a aprovação acadêmica.
Fonte normativa: `docs/specs/002-dados-iniciais/spec.md:41`.

Registro explícito correto em spec002:41, ADR003:14 e ENTREGA:7/38. Não reprovo o uso local solicitado de Pixabay. Gate acadêmico continua pendente; documentação não é aprovação do professor nem teste executado.

**Evidência efetiva (parcial salvo ATENDIDO):**
- Nenhum teste executado suficiente identificado para este CA; inspeção documental/runtime não é teste.

**Falta:** Aprovação acadêmica separada se concedida e conferência do pacote final.

**Runtime/apoio:** `docs/adr/003-execucao-local-aprovada.md:14`, `ENTREGA.md:38`.

## 002/CA-07 — SEM TESTE

**Critério inteiro:** **CA-07 — segurança de imagem [pipeline].** Chave API apenas servidor/ambiente local, nunca bundle ou crédito. Validar host permitido da resposta, redirects, timeout, tamanho, MIME e decodificação; recodificar com sharp, remover metadados e impedir SSRF/traversal. Sem SVG/script, uploads ou fallback externo. Evidência: testes com resposta inválida, host/redirect indevido, arquivo grande e falha API; erro preserva rastreabilidade e não gera placeholder apresentado como foto pronta. Sharp 0.35.5 validado no manifesto/registry preservados, sem instalação por esta correção.
Fonte normativa: `docs/specs/002-dados-iniciais/spec.md:42`.

Cobertura adversarial forte e recodificação real sharp de bytes sintéticos. CA-07 correto é segurança do pipeline 002, não contador/rate-limit da 004. Não concedo cobertura integral: teste de safeRequest rejeitar não verifica rastreabilidade/ausência de artefato da etapa completa após erro.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `scripts/__tests__/images.test.ts:118` — **002/CA-05 CA-07 local image pipeline > test_ca_07_rejects_nonpublic_dns_and_allows_global**
  - Assert: L130 IPs privados/reservados => false; L131–132 IPs globais => true.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:47`.
- `scripts/__tests__/images.test.ts:134` — **002/CA-05 CA-07 local image pipeline > test_ca_07_validates_each_redirect_and_caps_at_three**
  - Assert: L138 host evil rejeitado; L139 uma chamada; L141 loop rejeitado; L142 quatro chamadas; L148–150 terceiro redirect permitido.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:47`.
- `scripts/__tests__/images.test.ts:153` — **002/CA-05 CA-07 local image pipeline > test_ca_07_rejects_mime_size_errors_and_svg_decoding**
  - Assert: L159 MIME inválido rejeitado; L165 excesso MAX_BYTES rejeitado; L170 HTTP429 erro sem retry; L177–178 SVG/bytes inválidos rejeitados.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:47`.
- `scripts/__tests__/images.test.ts:180` — **002/CA-05 CA-07 local image pipeline > test_ca_07_timeout_covers_response_body_without_retry**
  - Assert: L194–198 timeout rejeitado após relógio sintético; L199 timeout=10000; L200 transport=1.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:47`.
- `scripts/__tests__/images.test.ts:205` — **002/CA-05 CA-07 local image pipeline > test_ca_07_transform_rotates_resizes_and_strips_exif**
  - Assert: L210 EXIF fonte existe; L213 final=[800,600,jpeg]; L215 metadados removidos.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:47`.
- `scripts/__tests__/images.test.ts:217` — **002/CA-05 CA-07 local image pipeline > test_ca_05_discover_caches_24h_sanitizes_and_no_key_or_images_in_html**
  - Assert: L222 cache evita chamada extra; L229 cache/HTML sem segredo fixture; L230 sem img; L231 sem key.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:47`.
- `scripts/__tests__/images.test.ts:269` — **002/CA-05 CA-07 local image pipeline > test_ca_07_cli_blocks_authenticated_discovery_without_human_tty**
  - Assert: L270 main(discover) rejeita ausência --human.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:47`.
- `scripts/__tests__/images.test.ts:272` — **002/CA-05 CA-07 local image pipeline > test_ca_05_manifest_binds_review_hash_provenance_and_maps_exact_seed_contract**
  - Assert: L302–303 ../TI-0001.jpg rejeitado; L305–306 gallery local sem hotlink; L312 arquivo adulterado rejeitado.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:47`.

**Falta:** Teste efetivo discover/preparePhoto falhando por API inválida e conferindo cache/proveniência preservados, nenhum preparado/manifesto/placeholder declarado pronto. Prova de exclusão da chave do bundle/crédito efetivos e boundary de transporte DNS/HTTPS; testes atuais injetam transporte.

**Runtime/apoio:** `scripts/equipment-images.ts:23`, `scripts/equipment-images.ts:86`, `scripts/equipment-images.ts:138`, `scripts/equipment-images-cli.ts:18`.

## 002/CA-08 — SEM TESTE

**Critério inteiro:** **CA-08 — persistência tenant [integração].** Seed usa modelo/FKs e isolamento de 004; consulta autenticada confirma 12/9/3 sem nomes de outros colaboradores e persiste após reinício. Evidência: integração local com dois tenants e reload; fotos e seed remotos nunca executados pelo agente.
Fonte normativa: `docs/specs/002-dados-iniciais/spec.md:43`.

Seed é lido via Prisma owner, não consulta autenticada 12/9/3. Fixtures de isolamento têm sete notebooks, não seed. Query posterior não é reload/reinício.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec002.integration.test.ts:8` — **002 dados iniciais — seed real local > test_ca_01_ca_02_ca_03_ca_04_ca_08_seed_exact_idempotent_preserves_legitimate_data**
  - Assert: L11 equipment=12/professorLoans=0; L14 conjunto TI-0001…TI-0012; L15 manutenção exata; L16 disponíveis=9; L17 loans=0; L18 role colaborador; L23–29 tenant=1/memberships=3/equipment=13, item/loan preservados e audit sem duplicação.
  - Tipo: PostgreSQL real local, IDs Auth sintéticos; execução: `docs/verificacao/evidencias/release-integration.log:134`.
- `src/__tests__/integration/spec003.integration.test.ts:21` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_01_catalog_occupancy_of_other_borrower_and_cross_tenant_procedures**
  - Assert: L25 emprestado; L26 history=[]; L27 sem nome; L29–30 exclui ocupado/tenant B; L31 available=6; L32 B obtém seu próprio item.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:97`.
- `src/__tests__/integration/spec004.integration.test.ts:36` — **004 auth/persistência — PostgreSQL real > test_ca_05_every_table_isolates_tenants_under_real_restricted_role**
  - Assert: L43 effective role emprestai_app sem super/bypass; L44–49 tenant B não aparece; L61 settings limpos após transação.
  - Tipo: Postgres real local; cobertura semântica auxiliar, CA pertence à spec004; execução: `docs/verificacao/evidencias/release-integration.log:21`.

**Falta:** Consulta autenticada dos 12 seedados com dois tenants, contagens 12/9/3 e sem nomes alheios. Reload e reinício efetivos sem perda.

**Runtime/apoio:** `src/__tests__/integration/fixtures.ts:18`, `src/server/api/context.ts:20`.

## 003/CA-01 — SEM TESTE

**Critério inteiro:** **CA-01 — catálogo real [API/UI].** Buscar nome/patrimônio, filtrar categoria e Só disponíveis no servidor com filtros combináveis, contagens verdadeiras e estados vazios/loading/erro; detalhe por patrimônio real, sem dependência de static params mock. Evidência: fixture 12/9/3 e consultas combinadas, E2E navegação e indisponibilidade; sem números fixos do mock.
Fonte normativa: `docs/specs/003-solicitar-emprestimo/spec.md:18`.

Consulta Postgres prova ocupação e segregação; combinação só é verificada no argumento do hook mockado. Fixture integração tem 7 disponíveis; não 12/9/3.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec003.integration.test.ts:21` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_01_catalog_occupancy_of_other_borrower_and_cross_tenant_procedures**
  - Assert: L25 emprestado; L26 history=[]; L27 sem nome; L29–30 exclui ocupado/tenant B; L31 available=6; L32 B obtém seu próprio item.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:97`.
- `src/__tests__/frontend-contract.test.tsx:130` — **test_ca_01_spec003_busca_categoria_disponibilidade_combinadas_sem_contagem_mock**
  - Assert: L135–140 mock recebeu search/category/onlyAvailable/limit=12; L141–142 contagem zero/estado vazio.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:51`.

**Falta:** Queries reais combinadas nome/patrimônio/categoria/disponíveis usando inventário 12/9/3. E2E autenticado catálogo→detalhe real, indisponibilidade, loading/erro/vazio e contagens.

**Runtime/apoio:** `src/server/services/equipment.ts:12`, `src/components/screens/catalogo.tsx:19`, `docs/verificacao/evidencias/release2-build.log:48`.

## 003/CA-02 — SEM TESTE

**Critério inteiro:** **CA-02 — autenticação/tenant [API].** Sem sessão negar pedido/listagem; tenant, borrower e papel sempre do contexto verificado, nunca IDs/papel controlados pelo input; não listar loans de outro colaborador/tenant nem seus nomes em catálogo/detalhe/histórico. Evidência: `createCaller` código e corpo para anônimo, colaborador, IDOR e tenant B por procedimento.
Fonte normativa: `docs/specs/003-solicitar-emprestimo/spec.md:19`.

Há createCaller código/corpo e isolamento parcial, mas contexto Auth/tenant/role é construído pelo fixture; cobertura por procedimento não é completa.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec003.integration.test.ts:8` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_02_anonymous_idor_own_loans_and_privacy**
  - Assert: L11–13 UNAUTHORIZED mine/request e NOT_FOUND item tenant B; L15 corpo loan equipmentId/returnedAt; L17 mine vazio; L18 sem nome de outro; L19 próprio loan retornado.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:85`.
- `src/__tests__/integration/spec003.integration.test.ts:21` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_01_catalog_occupancy_of_other_borrower_and_cross_tenant_procedures**
  - Assert: L25 emprestado; L26 history=[]; L27 sem nome; L29–30 exclui ocupado/tenant B; L31 available=6; L32 B obtém seu próprio item.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:97`.
- `src/__tests__/server-api.test.ts:92` — **tRPC authorization with explicit service mocks — not RLS or integration proof > test_ca_02_spec003_context_injected_and_response_body_preserved_without_tenant_input**
  - Assert: L96 corpo equipment.list preservado; L97 ctx recebido; L100–101 corpo mine history e ctx, services mockados.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:28`.
- `src/__tests__/server-api.test.ts:61` — **tRPC authorization with explicit service mocks — not RLS or integration proof > test_ca_02_spec004_missing_membership_is_forbidden_and_promotion_input_rejected**
  - Assert: L64 sem membership FORBIDDEN; L66–71 role/tenant input BAD_REQUEST; auxiliar da 004.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:10`.

**Falta:** Matriz createCaller anônimo/A/outro colaborador/B/IDOR em equipment.list/get e loans.mine/request, incluindo history próprio/de outro e tentativas borrower/role/tenant input. Sessão verificada real não é coberta por fixture; Auth HTTP local pendente da dependência004.

**Runtime/apoio:** `src/server/api/context.ts:21`, `src/server/api/schemas.ts:11`, `src/__tests__/integration/fixtures.ts:22`.

## 003/CA-03 — SEM TESTE

**Critério inteiro:** **CA-03 — regras de elegibilidade [service/UI].** Abrir empréstimo só de item disponível, com no máximo três abertos por usuário no tenant e nenhum aberto em atraso. Pedido deve revalidar tudo no servidor mesmo se UI antiga permitir clique. Evidência: 0/2/3 abertos, atraso, manutenção, fora de uso, já emprestado e rollback sem mutação parcial.
Fonte normativa: `docs/specs/003-solicitar-emprestimo/spec.md:20`.

Boa cobertura parcial do service. Teste integração de elegibilidade não testa limite apesar do nome; corrida verifica limite=3, não toda matriz UI antiga/rollback.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec003.integration.test.ts:34` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_03_eligibility_maintenance_out_of_use_limit_and_overdue**
  - Assert: L38 manutenção/fora de uso => CONFLICT; L39 loans=0; L41 atraso => FORBIDDEN com mensagem específica. O nome menciona limit, mas o corpo não testa três loans nem sucesso com dois.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:109`.
- `src/__tests__/server-rules.test.ts:24` — **Backend pure rules — not database integration > test_ca_03_spec003_eligibility_is_rechecked_and_never_accepts_three_or_late**
  - Assert: L26 dois aceitos; L27–30 três/atraso rejeitados; L31–33 manutenção/fora de uso/ocupado rejeitados.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:43`.
- `src/__tests__/integration/spec003.integration.test.ts:52` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_05_two_parallel_requests_with_two_existing_loans_exactly_one_success**
  - Assert: L54 dois loans prévios; L55 Promise.allSettled em dois itens; L56 um fulfilled; L58 outro FORBIDDEN; L59 total abertos=3; L60 audit request=1.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:121`.
- `src/__tests__/integration/spec003.integration.test.ts:62` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_06_two_users_one_item_exactly_one_success**
  - Assert: L64 dois callers/mesmo item em Promise.allSettled; L65 um fulfilled; L67 outro CONFLICT; L68 aberto=1; L69 audit=1.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:127`.
- `src/__tests__/frontend-contract.test.tsx:181` — **test_ca_03_spec003_atraso_bloqueia_com_motivo_explicito**
  - Assert: L184 botão disabled; L185 motivo Bloqueado por atraso.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:51`.

**Falta:** Integração serial 0/2/3 com asserts de loan/audit sem mutação parcial para todas as rejeições. UI antiga permitindo clique e servidor revalidando todos os casos, sem sucesso falso.

**Runtime/apoio:** `src/server/services/loans.ts:53`, `src/server/services/loans.ts:63`.

## 003/CA-04 — SEM TESTE

**Critério inteiro:** **CA-04 — data civil [service/UI/banco].** Confirmação informa vencimento calculado no servidor: hoje São Paulo +14 corridos, `dueDate` YYYY-MM-DD persistido sem deslocar. Dia do vencimento não bloqueia; dia seguinte bloqueia. Evidência: relógio controlado em meia-noite São Paulo versus UTC, mês/ano/bissexto, comparação antes/no/depois da data e cliente em outro fuso.
Fonte normativa: `docs/specs/003-solicitar-emprestimo/spec.md:21`.

Persistência DATE e funções puras corretas no escopo testado; request usa agora real, não relógio congelado nas fronteiras. Teste modal CA07 não vira prova inteira de CA04.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec003.integration.test.ts:43` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_04_persists_civil_date_and_atomic_audit**
  - Assert: L46 dueDate=addCalendarDays(localToday(),14); L47 requestedAt Date; L49 coluna date com string igual ao retorno; L50 audit tenant/actor/action. Relógio do serviço não é controlado.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:118`.
- `src/__tests__/server-rules.test.ts:15` — **Backend pure rules — not database integration > test_ca_04_spec003_civil_date_midnight_and_calendar_boundaries**
  - Assert: L16–17 fronteira UTC/São Paulo; L18 bissexto; L19 ano; L20 no vencimento false; L21 dia seguinte true; L22 devolvido false.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:43`.
- `src/__tests__/frontend-contract.test.tsx:170` — **test_ca_07_spec003_erro_pedido_mantem_modal_e_nao_afirma_sucesso**
  - Assert: L175 modal usa 24/nov da sessão mockada; não exercício de fuso real.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:51`.

**Falta:** Relógio controlado no request/router/persistência e UI em meia-noite SP/UTC/mês/ano/bissexto. Antes/no/depois com pedidos reais e cliente em outro fuso; confirmação igual prazo gravado.

**Runtime/apoio:** `src/server/services/loans.ts:61`, `src/components/screens/detalhe.tsx:118`, `src/components/screens/detalhe.tsx:151`.

## 003/CA-05 — ATENDIDO

**Critério inteiro:** **CA-05 — concorrência por usuário [transação].** Locks do usuário (membership tenant/user) e item na mesma transação, sempre usuário antes de item e mesma ordem nos fluxos que alteram abertos; contar/revalidar somente depois dos locks. Se usuário com dois abertos solicita simultaneamente dois itens, exatamente um sucesso; total máximo três. Evidência: requests concorrentes em Postgres real, não mock; retries limitados de conflito/transação nunca violam limite.
Fonte normativa: `docs/specs/003-solicitar-emprestimo/spec.md:22`.

Corrida real cumpre exatamente um sucesso/total3/audit1. Inspeção confirma membership antes de equipment em request e return; contagem/revalidação após ambos. Não existem retries automáticos (zero tentativas adicionais é limite finito); P2034 retorna CONFLICT, não retry ilimitado. Aceite semântico histórico, ainda sem vínculo à rodada final.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec003.integration.test.ts:52` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_05_two_parallel_requests_with_two_existing_loans_exactly_one_success**
  - Assert: L54 dois loans prévios; L55 Promise.allSettled em dois itens; L56 um fulfilled; L58 outro FORBIDDEN; L59 total abertos=3; L60 audit request=1.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:121`.

**Falta:** Nenhuma lacuna semântica identificada no CA estreito; vínculo final de rodada permanece follow-up.

**Runtime/apoio:** `src/server/services/loans.ts:53`, `src/server/services/loans.ts:55`, `src/server/services/loans.ts:87`, `src/server/services/transaction.ts:16`, `src/server/services/transaction.ts:20`.

## 003/CA-06 — ATENDIDO

**Critério inteiro:** **CA-06 — concorrência por item [constraint/transação].** Dois usuários pedindo mesmo item geram exatamente um aberto, garantido por índice parcial único `(tenant_id, equipment_id) WHERE returned_at IS NULL`, além do lock e rechecagem. Evidência: corrida em Postgres local e tentativa direta de duplicação rejeitada pela constraint; mapear conflito a erro tRPC compreensível sem SQL bruto.
Fonte normativa: `docs/specs/003-solicitar-emprestimo/spec.md:23`.

Corrida Postgres, duplicação direta e predicado do índice demonstrados. CA04 da spec004 é evidência auxiliar sem renomear IDs. Wrapper converte P2002/P2034 a TRPCError CONFLICT sem SQL; corrida perdedora afirma CONFLICT. Sem exigência nova de retry ou remotos.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec003.integration.test.ts:62` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_06_two_users_one_item_exactly_one_success**
  - Assert: L64 dois callers/mesmo item em Promise.allSettled; L65 um fulfilled; L67 outro CONFLICT; L68 aberto=1; L69 audit=1.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:127`.
- `src/__tests__/integration/spec004.integration.test.ts:26` — **004 auth/persistência — PostgreSQL real > test_ca_04_unique_open_constraint_dates_required_fields_and_credit**
  - Assert: L29 primeiro loan; L30 duplicação direta por outro usuário => P2002.
  - Tipo: Postgres real local; cobertura semântica auxiliar, CA pertence à spec004; execução: `docs/verificacao/evidencias/release-integration.log:21`.
- `src/__tests__/integration/spec004.integration.test.ts:11` — **004 auth/persistência — PostgreSQL real > test_ca_04_catalog_has_six_rls_tables_and_partial_unique_index**
  - Assert: L15–16 indexdef UNIQUE tenant_id,equipment_id WHERE returned_at IS NULL.
  - Tipo: Postgres real local; cobertura semântica auxiliar, CA pertence à spec004; execução: `docs/verificacao/evidencias/release-integration.log:21`.

**Falta:** Nenhuma lacuna semântica identificada no CA estreito; vínculo final de rodada permanece follow-up.

**Runtime/apoio:** `src/server/services/loans.ts:54`, `src/server/services/loans.ts:63`, `src/server/services/transaction.ts:20`.

## 003/CA-07 — SEM TESTE

**Critério inteiro:** **CA-07 — motivo e confirmação [UI].** Exibir motivo específico por atraso, limite, manutenção, fora de uso, outro loan/conflito e sessão expirada; botão desabilitado não basta. Modal mostra prazo verdadeiro, cancela sem gravar, evita envio duplicado durante request e só mostra sucesso depois do commit. Evidência: testes de componentes mais E2E erro/sucesso; não revelar nome do atual tomador ao colaborador.
Fonte normativa: `docs/specs/003-solicitar-emprestimo/spec.md:24`.

Teste real de componente prova conflito/erro, não cancelamento de pedido/sucesso após commit nem todos os motivos. Cancelar devolução pertence a spec005; não o mapear como cancelar solicitação 003.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/frontend-contract.test.tsx:170` — **test_ca_07_spec003_erro_pedido_mantem_modal_e_nao_afirma_sucesso**
  - Assert: L175 prazo da sessão fixture; L177 mutate equipmentId; L178 erro explícito; L179 sem sucesso.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:51`.
- `src/__tests__/frontend-contract.test.tsx:181` — **test_ca_03_spec003_atraso_bloqueia_com_motivo_explicito**
  - Assert: L184 disabled/L185 motivo atraso, cobertura auxiliar CA03.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:51`.

**Falta:** Componentes cobrindo todos motivos, sessão expirada, cancelar pedido sem mutate, pending sem duplicar e sucesso callback só depois de commit. E2E autenticado erro/sucesso com prazo verdadeiro e privacidade.

**Runtime/apoio:** `src/components/screens/detalhe.tsx:18`, `src/components/screens/detalhe.tsx:32`, `src/components/screens/detalhe.tsx:167`.

## 003/CA-08 — SEM TESTE

**Critério inteiro:** **CA-08 — persistência/auditoria [transação].** Commit cria um loan e audit append-only atomicamente com tenant/ator/recurso; falha audit ou inserção reverte tudo. Meus empréstimos mostra só próprios, abertos e histórico persistido. Evidência: falha induzida audit, reload/reinício e retorno tipado do router.
Fonte normativa: `docs/specs/003-solicitar-emprestimo/spec.md:25`.

Atomicidade e append-only possuem integração auxiliar real, mas falha induzida não percorre requestLoan/createCaller. Mine mostra aberto de fixture; histórico/reload/reinício ausentes.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/integration/spec003.integration.test.ts:43` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_04_persists_civil_date_and_atomic_audit**
  - Assert: L46 dueDate=addCalendarDays(localToday(),14); L47 requestedAt Date; L49 coluna date com string igual ao retorno; L50 audit tenant/actor/action. Relógio do serviço não é controlado.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:118`.
- `src/__tests__/integration/spec003.integration.test.ts:8` — **003 solicitar empréstimo — createCaller/PostgreSQL real > test_ca_02_anonymous_idor_own_loans_and_privacy**
  - Assert: L11–13 UNAUTHORIZED mine/request e NOT_FOUND item tenant B; L15 corpo loan equipmentId/returnedAt; L17 mine vazio; L18 sem nome de outro; L19 próprio loan retornado.
  - Tipo: createCaller e Postgres real local; contexto sintético; execução: `docs/verificacao/evidencias/release-integration.log:85`.
- `src/__tests__/integration/spec004.integration.test.ts:84` — **004 auth/persistência — PostgreSQL real > test_ca_08_audit_append_only_for_runtime_and_owner_and_transaction_rollback**
  - Assert: L87 update/delete audit owner/runtime rejeitados; L88–91 loan+audit ator inválido reverte; L92 loans=0/L93 audit=1. Transação manual, não loans.request.
  - Tipo: Postgres real local; cobertura semântica auxiliar, CA pertence à spec004; execução: `docs/verificacao/evidencias/release-integration.log:21`.

**Falta:** Falha induzida audit e inserção no procedimento loans.request, com retorno tipado/erro e loan/audit revertidos. Meus loans abertos/histórico somente próprios após reload e reinício real.

**Runtime/apoio:** `src/server/services/loans.ts:29`, `src/server/services/loans.ts:64`, `src/server/services/loans.ts:74`.

## 003/CA-09 — SEM TESTE

**Critério inteiro:** **CA-09 — cache [cliente].** Após sucesso ou conflito revalidar catálogo, detalhe, meus empréstimos, contador e consultas/KPIs operacoes pertinentes; não promover sucesso otimista falso. Evidência: múltiplas telas/consultas previamente em cache, segunda sessão tentando item recém-ocupado e reload.
Fonte normativa: `docs/specs/003-solicitar-emprestimo/spec.md:26`.

Runtime chama invalidate global tanto onSuccess quanto onError. Nenhum teste efetivo da solicitação afirma invalidação e refetch de consultas múltiplas; assert invalidate de cadastro spec005 não prova este CA.

**Evidência efetiva (parcial salvo ATENDIDO):**
- Nenhum teste executado suficiente identificado para este CA; inspeção documental/runtime não é teste.

**Falta:** Catálogo/detalhe/mine/contador/operacoes pré-cacheados, sucesso e conflito, refetch e dados atualizados. Segunda sessão disputa item recém-ocupado e reload; ausência de promoção otimista falsa.

**Runtime/apoio:** `src/components/screens/detalhe.tsx:19`, `src/components/screens/detalhe.tsx:24`.

## 003/CA-10 — SEM TESTE

**Critério inteiro:** **CA-10 — fotos/crédito [UI].** Catálogo e detalhe usam fotos individuais de 002 com alt e proporção adequada; crédito visível **Fotos: Pixabay** com link `https://pixabay.com/`, mantendo origem por item. Sem hotlinks/placeholder fingindo foto; ausência gera estado honesto. Evidência: 12 associações, link acessível e fallback sem outra fonte.
Fonte normativa: `docs/specs/003-solicitar-emprestimo/spec.md:27`.

Imagem Storage é URL fixture, não upload nem 12 associações. Teste isolado EquipmentPhoto não renderiza PhotoCredit global nem afirma alt/link raiz Fotos: Pixabay do catálogo/detalhe.

**Evidência efetiva (parcial salvo ATENDIDO):**
- `src/__tests__/frontend-contract.test.tsx:247` — **test_ca_10_spec003_sem_foto_nao_inventa_imagem**
  - Assert: L249 mensagem honesta; L250 nenhum img.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:51`.
- `src/__tests__/frontend-contract.test.tsx:267` — **test_ca_10_spec003_foto_storage_dimensoes_credito_escapado_e_link_inseguro_rejeitado**
  - Assert: L283–285 width800/height600/aspect4:3; L286 rel noreferrer; L287–289 texto escapado/sem script/link inseguro.
  - Tipo: Vitest unitário/componente com mocks ou transporte sintético; execução: `docs/verificacao/evidencias/release2-unit.log:51`.

**Falta:** 12 associações reais da002 no catálogo/detalhe, alt e proporção com arquivos válidos. Crédito Fotos: Pixabay e href=https://pixabay.com/ acessível nas telas; falha de imagem/fallback sem outra fonte. Storage real pendente de ação humana; não usar fixture como confirmação de upload.

**Runtime/apoio:** `src/components/ui/equipment-photo.tsx:13`, `src/components/ui/equipment-photo.tsx:33`, `src/components/screens/catalogo.tsx:80`, `src/components/screens/detalhe.tsx:60`.

## Gates reais e limites

- Fotos reais API Pixabay, revisão visual original/recorte, licença por foto e manifesto real.
- Professor/Auth HTTP real local, associação segura e sessão/permissions.
- E2E autenticado completo, reload/reinício e cache multisessão.
- Storage, Supabase/Vercel e produção pendentes, somente humano; nenhum remoto autorizado nesta revisão.
- Dois commits reais/tag acadêmicos pendentes; planted-error em fixture e hashes red/green NÃO equivalem a commits nem bug real de CA produto. docs/verificacao/harness-selftest-evidencias.md:19 e :62.
- Rodadas finais/hash/schema/assertions runner JSON pós-correção executor pendentes.

## Checks históricos

- `npm test`: passed histórico; `docs/verificacao/evidencias/release2-unit.log:53`. 22 scripts pipeline sintéticos + 1 script humano + 33 unit/component; não 56+22.
- `./node_modules/.bin/vitest run --config vitest.integration.config.ts`: passed histórico reaproveitado pelo release2; `docs/verificacao/evidencias/release-integration.log:5`. 4 arquivos; 1 teste002+6 testes003+8 testes004+5 testes005; Postgres standalone loopback real, identidades/contextos sintéticos; não Auth HTTP/Testcontainers.
- `npm run test:e2e`: passed histórico; `docs/verificacao/evidencias/release2-e2e.log:9`. 3 testes × desktop/mobile: login anônimo/CSP/bloqueio; nenhum E2E autenticado002/003.
- `npm run build / typecheck / lint`: passed histórico release2; `docs/verificacao/evidencias/release2-results.json:6`. Build não é Vercel nem validação de credenciais.
- `harness004 preflight1`: tests failed spawn EPERM; build failed kill EPERM; typecheck passed; `docs/verificacao/harness/004/preflight1/report.md:20`. Falhas de executor são reais e NÃO sucesso; não demonstram falha semântica do domínio002/003. Correção allowlist/finais por outro agente em follow-up; sem alegar que o subagente inteiro esteve isolado.

## Escopo de escrita

- `/Users/guilherme.nacarelli/.wolf/emprestai-pratica/emprestai/docs/verificacao/reviews/semantic-002-003.json`
- `/Users/guilherme.nacarelli/.wolf/emprestai-pratica/emprestai/docs/verificacao/reviews/semantic-002-003.md`

Nenhum outro caminho foi alterado por este revisor. `scripts/verify-spec.mjs:15–18` exclui `docs/verificacao/` do digest. Não foram fabricados sourceHash/checksHash, commits ou aprovações humanas.
