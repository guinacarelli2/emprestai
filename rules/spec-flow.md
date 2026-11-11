---
description: Como uma funcionalidade sai do PRD até a tarefa
globs: []
alwaysApply: true
---

# Fluxo de spec
> leitor: agente

## Quando
Ao iniciar qualquer funcionalidade nova do PRD.

## Procedimento
1. Crie `docs/specs/<NNN-nome-curto>/` com `spec.md`.
2. Antes de escrever a spec, liste as perguntas que o PRD não
   responde. Espere as respostas.
3. `plan.md` sai da spec e cita os ADRs que o restringem.
4. `tasks.md` sai do plano. Cada tarefa cita um CA-xx e cabe
   num commit.
5. Uma tarefa por vez. Ao terminar, siga `rules/checks.md`.

## Não faça
- Não escreva código antes do plano aprovado.
- Não crie pasta de spec fora do padrão `NNN-nome-curto`.


## Exceção específica — pacote local aprovado
ADRs 003/004 e a instrução completa registram aprovação geral dos planos de 002–005 após recomendação, não um “pode implementar” isolado. Registrar spec/plan/tasks antes do código, ordem 004 → 002 → 003 → 005; executar uma tarefa por vez com checks, sem parada obrigatória entre tarefas aprovadas. Dados descritivos agora transcritos do anexo preservado references/pratica-sdd.html em spec002; não manter falso bloqueio nem substituir por nomes inventados. Toda tarefa continua rastreada a CA; nenhum commit autorizado.
