# Harness — evidências próprias de execução local

Escopo: `scripts/verify-spec.mjs`, `scripts/check-delivery.mjs`, `scripts/__tests__/verifier.test.mjs` e referência `.agents/agents/verificador-spec.md`. Não foram modificados AGENTS/rules, contrato histórico do agente, app, package, schema ou testes de negócio. Lidos AGENTS, rules, ADR-001/002/003/004 e specs/plans/tasks 002–005. ADR-003/004 apareceram durante execução documental paralela e foram lidos assim que disponibilizados.

## Checks realmente executados

- `node --test scripts/__tests__/verifier.test.mjs`: **8 passaram, 0 falharam, 0 skipped**. Somente fixtures próprias temporárias, não suíte do app. Runner nativo Node é bootstrap do harness sem dependência adicional; testes de negócio permanecem Vitest pelo launcher.
- `node --check scripts/verify-spec.mjs` e `node --check scripts/check-delivery.mjs`: exit 0, sem saída.
- Gate com caminhos propositalmente ausentes: **NÃO PRONTA**, exit 1 esperado, exigindo quatro specs, evidências humanas e commits/tag.
- `git status --short`: falhou com `fatal: not a git repository (or any of the parent directories): .git`. Nenhum commit/tag criado.
- Runtime dos self-tests: **Node v25.8.0**, diferente do Node22 exigido pelo projeto. O harness registra runtime e recusa declarar prontidão local quando Node22 não está comprovado. Não foi alegada compatibilidade Node22 por este ensaio.

## Isolamento efetivamente provado

Fixture controlada executada pelo mesmo `sandbox-exec` e função `runCheck` usados no launcher: permite criar arquivo na cópia temporária; nega alterar fonte original e `node_modules` original; nega ler fonte original, `.env.local` original, `.env.local` na cópia e arquivo privado externo; ambiente não herda SECRET; socket localhost não pode escutar (rede bloqueada). Nenhuma conexão externa realizada. Symlinks de fonte são rejeitados; link dos módulos tem escrita negada pelo SO.

Primeiro ensaio revelou Node encerrado por SIGABRT antes da fixture. Diagnóstico hello isolou permissões necessárias do loader: metadados globais, raiz literal e configuração OpenSSL Homebrew, além das bibliotecas do SO. Conteúdo de HOME/arquivos privados continua negado. Ensaios de diagnóstico hello em perfil temporário mais aberto NÃO foram usados para executar revisão nem testes do app. Ensaio final abaixo usa perfil restrito real.

Erro plantado apenas em fixture: `assert.equal(false, true, 'intentional CA-10 planted error')`, depois substituído por `true, true`. Red exit 1, green exit 0 e hashes distintos no log. Hash de fonte é manifest determinístico de nomes+bytes; **não é commit Git**. Este exercício não constitui revisão independente de CA do produto.

## Saída integral dos self-tests finais

```text
[32m✔ test_ca_10_strips_credentials_and_environment [90m(1.635417ms)[39m[39m
[32m✔ test_ca_10_digest_excludes_evidence_but_tracks_source_specs_schema [90m(18.657917ms)[39m[39m
[32m✔ test_ca_10_profile_deny_network_write_original_and_fixed_commands [90m(0.264042ms)[39m[39m
[32m✔ test_ca_10_no_false_pass_from_test_names [90m(0.417375ms)[39m[39m
[32m✔ test_ca_10_review_rejects_unknown_missing_stale_and_fake_assertions [90m(0.497417ms)[39m[39m
[32m✔ test_ca_10_criteria_inventory_requires_unique_scoped_ids [90m(0.23725ms)[39m[39m
[32m✔ test_ca_10_delivery_refuses_missing_artifacts [90m(1.954959ms)[39m[39m
{"fixtureOnly":true,"redHash":"0ead4673235c511a0a21e7c511b93a9ecff3a1486d9e2934323ce8be8528a6bc","greenHash":"3f11bf06576c06ceb934cac042b2e5ca8c82814a409b0e4ea2dce3654bd79bb8","redExitCode":1,"greenExitCode":0,"redCheckHash":"7155c7e6067011122730325f3ce550d9d03444fa14f9035546a322e9a5273617","greenCheckHash":"50cbafb8bcaed6b6cae84a2385e2c3eb76107988fa781bd5044aee8d259f439f"}
[32m✔ test_ca_10_real_macos_sandbox_enforces_boundaries_and_red_green_hashes [90m(245.532667ms)[39m[39m
[34mℹ tests 8[39m
[34mℹ suites 0[39m
[34mℹ pass 8[39m
[34mℹ fail 0[39m
[34mℹ cancelled 0[39m
[34mℹ skipped 0[39m
[34mℹ todo 0[39m
[34mℹ duration_ms 388.351625[39m
```

## Saída do gate negativo

O digest deste gate é fotografia durante trabalho paralelo, não hash final do produto nem atestado de freshness futura.

```json
{
  "schemaVersion": 1,
  "sourceHash": "19a4af8743e130bf1a1eec62d14895b883bcc9a5662a4f5b746a3e167f638d03",
  "verdict": "NÃO PRONTA",
  "problems": [
    "docs/verificacao/ausente002.json: ENOENT: no such file or directory, open '/Users/guilherme.nacarelli/.wolf/emprestai-pratica/emprestai/docs/verificacao/ausente002.json'",
    "docs/verificacao/ausente003.json: ENOENT: no such file or directory, open '/Users/guilherme.nacarelli/.wolf/emprestai-pratica/emprestai/docs/verificacao/ausente003.json'",
    "docs/verificacao/ausente004.json: ENOENT: no such file or directory, open '/Users/guilherme.nacarelli/.wolf/emprestai-pratica/emprestai/docs/verificacao/ausente004.json'",
    "docs/verificacao/ausente005.json: ENOENT: no such file or directory, open '/Users/guilherme.nacarelli/.wolf/emprestai-pratica/emprestai/docs/verificacao/ausente005.json'",
    "002: relatório obrigatório ausente",
    "003: relatório obrigatório ausente",
    "004: relatório obrigatório ausente",
    "005: relatório obrigatório ausente",
    "Produção: evidências humanas de Auth/professor/fotos/migrations/deploy e credenciais provisionadas pendentes de validação externa",
    "Prática: dois commits reais e tag pendentes; hashes de fixtures não substituem commits; execução atual não autoriza commit/tag"
  ]
}
```

## Uso e limites

`node scripts/verify-spec.mjs --spec docs/specs/004-auth-persistencia/spec.md --round rodada-ID --scope "escopo explícito"` lança somente CLIs Node aprovadas, dentro da cópia. Executar em background. Em `docs/verificacao/harness/004/rodada-ID/`: report JSON/Markdown, perfil, logs stdout/stderr, resultados Vitest. Não npx/install/npm lifecycle/migration/deploy. Próxima etapa: revisão independente semântica retorna JSON completo conforme `.agents/agents/verificador-spec.md`; salvar em docs/verificacao e reaplicar com `--review`. Sem revisão não há aprovação automática por nome de teste. Nova fonte exige nova rodada. Nenhuma rodada do app foi executada enquanto outros agentes o modificavam.

`node scripts/check-delivery.mjs --reports ...` pode ser passo bloqueante de CI com os quatro report.json; verifica CA atual, manifesto atual, checks/log hashes e resultados do runner. Não foi criada/modificada configuração CI. O gate atual intencionalmente não certifica produção e sempre exige validação externa humana separada (Auth, aprovação acadêmica, fotos, migrations/deploy) e commits/tag, fora da autorização. Git não comprovado também bloqueia prontidão local.

Não confundir: sandbox isola **processos lançados pelo harness**, não ferramentas livres concedidas pela plataforma a um subagente. Identidade/independência no JSON são declarações auditáveis, não autenticação criptográfica; um operador que altera código/relatórios pode forjar declarações. CI/revisor precisa tratar o harness como código confiável/revisado, sem capacidade administrativa do host.

Toda rede, inclusive localhost, é negada; integração real Postgres/Auth/Testcontainers/E2E/replay requer executor local independente autorizado e prova própria. Falta Docker não bloqueia implementação do harness; tampouco transforma integração ausente em sucesso. Build sem env/Prisma gerado pode falhar honestamente. Não se copiam segredos arbitrários disfarçados em arquivo de fonte: convenções de exclusão não substituem classificação/revisão do projeto.

## Follow-up — build Webpack e runtime Node22

Allowlist de build alinhada ao package atual: CLI Next instalada com `build --webpack`, sem invocar lifecycle npm nem Prisma generate (que poderia escrever nos módulos originais). Acrescentada afirmação exata dos argumentos no self-test existente. Não foi rodado build/test do app neste follow-up.

Execução própria: `.work/runtime/node_modules/node/bin/node --version` → **v22.23.4**; `--check scripts/verify-spec.mjs` → exit 0; `--test scripts/__tests__/verifier.test.mjs` → **8 testes passaram, 0 falharam, 0 skipped**, inclusive isolamento real com executável em `.work/runtime`. Saída integral desta execução está no temporário local `/tmp/emprestai-verifier-webpack-selftest.log`. Isso supersede a limitação de runtime Node25 apenas para este novo ensaio; não altera a proveniência do ensaio anterior.

O requisito Node22 já é efetivo em `reportProblems`; runtime real é registrado no relatório. Fonte na cópia exclui `node_modules` antes de inspecionar symlink; evidências em docs/verificacao não mudam digest. Nenhuma permissão do sandbox foi ampliada.

CI inspecionada neste follow-up: jobs `quality` e `database` em Ubuntu; não invocam check-delivery nem launcher. Portanto NÃO se alega gate automaticamente integrado. Se o principal integrar `check-delivery`, produção/commits/tag pendentes bloqueiam esse gate intencionalmente; manter testes de qualidade separados permite apresentar resultados verdes sem confundir com autorização de entrega. Não houve alteração CI nem invocação automática de revisor.
