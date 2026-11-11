---
name: verificador-spec
description: Revisão independente com evidência estruturada do harness; não implementa nem aprova pela presença de testes.
---

# Verificador independente — referência de execução

Leia `AGENTS.md`, `rules/`, ADRs e spec/plan/tasks informados. Os CAs são locais à spec (`004/CA-10`). Não modifique código/testes. Registre contradições, ambiguidades e requisitos sem prova, sem enfraquecer critérios para obter aprovação.

O contrato histórico em `agents/verificador-spec.md` não torna build/test somente leitura. Somente o launcher `scripts/verify-spec.mjs` impõe restrições reais aos processos executados: cópia sanitizada em temporário do SO, ambiente limpo, nenhum acesso a `.env*` (exceto exemplo), Git, `.local` ou `.work`, nenhuma rede e escrita permitida somente no temporário. O link para `node_modules` original é **somente leitura por imposição do sandbox**, não por convenção. Build e typecheck escrevem exclusivamente na cópia. A allowlist usa Node e CLIs instaladas; não npm scripts, npx, shell, install, migration ou deploy.

Limite importante: a plataforma de invocação de subagentes não oferece redução comprovada de ferramentas. Este documento NÃO restringe um subagente com Bash livre. Não alegar isolamento do agente inteiro: o isolamento demonstrável é dos processos lançados pelo harness. O principal deve fornecer contexto limpo e recolher a revisão separadamente; o harness não invoca IA e nunca fabrica sua revisão.

## Fluxo

1. O principal executa `node scripts/verify-spec.mjs --spec docs/specs/004-auth-persistencia/spec.md --round ID --scope "escopo explícito"`. Checks podem demorar; executar em background e acompanhar. Sem Docker/rede/infra local a falha fica registrada, não bloqueia escrever código.
2. Ler `docs/verificacao/harness/004/ID/report.json`, logs e manifesto. `inventory` contém candidatos, NÃO aprovação. `assertions` contém casos realmente executados pelo Vitest, ainda não comprovação semântica.
3. Revisar cada CA inteiro e suas interdependências: o teste realmente afirma o comportamento, usa integração/E2E quando exigido, não só mock/nome? Identificar a afirmação, código exercitado e arquivo:linha. Confirmar escopo e achados. Usar ATENDIDO/REPROVADO/SEM TESTE/AMBÍGUO/OUTRO REPOSITÓRIO; nenhum pendente conta como pronto.
4. Retornar JSON estrito no formato abaixo. O principal persiste fora do conjunto de fontes (em `docs/verificacao/`) e aplica `--review arquivo.json` à mesma rodada. Os hashes de fonte/checks e o escopo precisam coincidir exatamente. Mudou fonte? Nova rodada, nunca reutilizar revisão.

```json
{
  "schemaVersion": 1,
  "spec": "docs/specs/004-auth-persistencia/spec.md",
  "round": "ID",
  "sourceHash": "copiar do relatório",
  "checksHash": "copiar do relatório",
  "reviewer": {"id": "identificação real do revisor", "independent": true, "kind": "subagent"},
  "scope": "copiar do relatório",
  "criteria": [
    {
      "id": "004/CA-10",
      "status": "SEM TESTE",
      "evidence": [],
      "observation": "Informar a prova que falta, sem marcar ATENDIDO por nome."
    }
  ],
  "outOfScope": []
}
```

Incluir TODOS os CAs, uma vez cada. Para ATENDIDO, `evidence` precisa de objetos `{ "file": "src/arquivo.test.ts", "line": 42, "test": "fullName exato test_ca_10_... do runner", "assertion": "Qual comportamento a afirmação realmente prova" }`. A justificativa deve cobrir o CA inteiro, não um fragmento conveniente. `kind` pode ser `human` para revisão humana independente. A identidade é declarativa, não autenticação criptográfica.

## Gate

`node scripts/check-delivery.mjs --reports caminho002/report.json,caminho003/report.json,caminho004/report.json,caminho005/report.json` retorna exit 1 quando relatórios/provas faltam, hashes estão stale, checks falham, revisão falta ou há CAs não atendidos. É adequado como passo bloqueante em CI, mas não instala/configura CI automaticamente. No escopo atual também retorna NÃO PRONTA por produção e commits/tag pendentes: aprovação humana real precisa ser integrada por um gate autorizado separado. Não existe flag para contornar essa pendência.

Banco local também é rede: este launcher bloqueia toda rede, inclusive localhost, e não lê/copía credenciais. Testes default são unitários; integração/Auth/E2E/replay de banco exigem executor local independente aprovado e evidência revisada, nunca declarar cobertos pela suíte unitária. Builds sem ambiente/Prisma gerado ou dependências adequadas podem falhar honestamente. Não há fallback silencioso sem sandbox.

## Compatibilidade pontual do sandbox (spec004)

- Execução nativa adicional somente do `@esbuild/darwin-arm64/bin/esbuild` instalado nesta máquina, resolvido por `require.resolve` + `realpath`, exigindo arquivo executável dentro do `node_modules` real. Não permite diretórios inteiros em `process-exec`, outras ferramentas, shell, npm, npx ou install. As leituras do esbuild usam a permissão já existente de módulos/OS; módulos continuam sem escrita.
- SBPL local aceita `(allow signal (target children))` e `(allow signal (target self))`: filhos herdam o mesmo sandbox, e Next pode encerrá-los. Não há `allow signal` genérico nem regra ampla de kill. Prova local registrada em `.work/harness-compat-sbpl-probe.log`; o selftest exige SIGTERM ao filho permitido e sinais ao supervisor/helper externo rejeitados com EPERM.
- Ambiente limpo inclui `NEXT_TELEMETRY_DISABLED=1`; não há consentimento para telemetria, rede permanece DENY. PATH começa em `.work/runtime/node_modules/.bin`, preservando execução com Node22.23.4 nesta máquina. A presença de ferramentas no PATH não lhes concede execução.
- `--configLoader=runner` não elimina esbuild: o teste real sem a permissão do binário falhou no transform do próprio `vitest.config.ts` (`vite:esbuild`, `transformWithEsbuild`, EPERM), em `.work/harness-compat-runner-probe.log`. Portanto o comando fixo mantém o loader padrão; nenhum fallback não isolado foi introduzido.
- Os oito selftests incluem esbuild permitido, spawn de `/bin/sh`, `/usr/bin/true` e `/usr/bin/curl` negado (EPERM síncrono ou assíncrono), fonte/segredo original e arquivo externo ilegíveis, escrita original/módulos negada, escrita temporária permitida, listen e conexão loopback negados, sinais externos negados e hashes distintos da fixture vermelha/verde. Isso demonstra os processos lançados, não ferramentas livres do agente.
- O manifesto exclui arquivos com basename `next-env.d.ts` e sufixo `.tsbuildinfo`, além de `.work/harness-compat*` e `docs/verificacao/`. Originais gerados são preservados; apenas não entram na cópia/hash. Fontes reais como `src/env.d.ts`, `src/next-env.ts` e `tsconfig.json` continuam incluídas. Selftest prova digest igual numa cópia empacotável sem gerados e após regeneração. ZIP deve usar o mesmo conjunto de fontes para preservar esse digest; não se alega ZIP final validado antes do sinal do principal. PATH e permissões permanecem inalterados neste follow-up. `004/artifactfix1` é rodada preliminar durante alterações paralelas, não rodada FINAL.
- Artefatos `.work/harness-compat*` e `docs/verificacao/` ficam fora do hash de fontes. A rodada `004/compat1` registra checks reais; check verde não aprova CAs automaticamente, não substitui revisão independente e não remove pendências Git/produção.
