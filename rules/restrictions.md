---
description: O que o agente não pode fazer neste projeto
globs: []
alwaysApply: true
---

# O que não fazer
> leitor: agente

## Autoridade

- Não escreva ADR. Se encontrar uma decisão que precisa de um, descreva
  a decisão e as alternativas, e PARE. Quem decide é o time.
- Não contrarie o que está em docs/adr/. Se precisar contrariar, pare.
- Não responda por conta própria o que o PRD deixou ambíguo. Liste as
  perguntas e espere.
- Não escolha biblioteca que não esteja no ADR-001. Proponha e espere.

## Escopo

- Não altere arquivo fora do escopo da tarefa atual.
- Não gere scaffold automático de framework sem mostrar antes o que ele
  vai criar.
- Não escreva código de funcionalidade sem uma spec correspondente em
  docs/specs/.

## Ritmo

- Não escreva código antes de um plano aprovado. Escreva o plano,
  mostre e espere.
- "Pode implementar" NÃO autoriza o plano inteiro: execute UMA tarefa,
  rode os checks, mostre o resultado e pare.
- Não relate sucesso parcial. Se um check falhou, a tarefa não terminou.

## Produção

- Não faça push na branch de produção. Trabalhe em branch e abra PR.
- Não rode deploy nem altere configuração da Vercel.
- Não toque no projeto Supabase remoto: nada de SQL, de alteração de
  schema ou de dado por lá. Tudo acontece no banco local.

## Precedência

- Se o código e uma spec discordarem sobre comportamento, a spec está
  certa até que alguém mude a spec.
- Se uma regra de procedimento contrariar um ADR ou uma spec, PARE e
  avise. Não escolha um dos dois por conta própria.
- "Pode ir" e "pode implementar" não revogam nada deste arquivo.


## Exceção específica aprovada — pacote 002–005
A instrução completa aprovou o plano local após pacote recomendado: **recomendação do agente incluída no pacote de execução; ratificada de forma geral; Pixabay pedido explícito**. ADR-003/004 documentam a aprovação; é permitido escrevê-los com fatos reais e seguir os planos registrados. A vedação genérica de ADR e a pausa após UMA tarefa são substituídas apenas neste pacote: executar sequencialmente, checks por tarefa, sem pausa automática. Sharp permitido, versões exatas somente após validar docs/npm; consultas públicas e installs locais Node22/npm10 aprovados. DDL aprovado segue ADR-004/004 spec, somente Prisma CLI local. Não inventar ambiguidades resolvidas; detalhes ausentes continuam pendentes/bloqueados. Nenhum deploy/migrate/seed/upload remoto, commit/push/tag pelo agente. Script remoto só humano. Pixabay desvia do Pexels original e requer aprovação do professor ainda pendente. Demais restrições permanecem.
