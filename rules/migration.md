---
description: Procedimento para qualquer mudança de schema
globs: ["prisma/migrations/**", "prisma/schema.prisma"]
alwaysApply: false
---

# Mudança de schema
> leitor: agente

## Quando
Qualquer tarefa que precise criar, alterar ou remover tabela, coluna,
índice, constraint ou política de acesso — inclusive quando a mudança
parecer trivial.

## Procedimento
1. Antes de gerar qualquer coisa: escreva o DDL pretendido na resposta
   e PARE. Eu aprovo ou corrijo.
2. Gere a migration pela CLI do Prisma: `npx prisma migrate dev --name <nome>`.
   Uma migration por tarefa. RLS, policy e trigger entram como SQL
   bruto na mesma migration — o Prisma não modela esses objetos.
3. Toda tabela nova nasce com Row Level Security habilitada e pelo
   menos uma policy explícita na mesma migration. Tabela sem policy
   não entra no repositório.
4. Se a tabela já tem dado, diga o que acontece com as linhas
   existentes. Coluna obrigatória nova precisa de default ou de um
   passo de preenchimento.
5. Aplique com `npx prisma migrate reset` local e rode `npx vitest run`.

## Verificação
`npx prisma migrate reset` numa máquina limpa aplica todas as
migrations do zero, sem erro e sem nenhum passo manual.

## Não faça
- Não altere schema pelo Studio, pelo Supabase CLI nem por SQL avulso.
  O dono do schema é o Prisma Migrate; o que não está em migration
  não existe.
- Não edite migration que já foi para o repositório remoto. Escreva
  a próxima.
- Não toque no projeto Supabase remoto. Tudo acontece no local.


## Exceção específica e limite aprovado
O modelo DDL de ADR-004 e spec 004 foi aprovado no pacote local antes da implementação. Para esse mesmo contrato, não repetir pausa genérica do passo 1; qualquer alteração material precisa de nova aprovação. **Apenas Prisma CLI local** gera/aplica migrations; RLS/policies/triggers/índice parcial na migration gerada, sem SQL aplicado avulso nem Supabase CLI como dono do schema. Não executar reset destrutivo sobre dados existentes sem confirmação: usar DB local descartável dedicado ou confirmar. Checks desta regra apenas para quem implementar schema, não para tarefa só documental. Sem migration remota pelo agente/CI, só ação manual humana. Este anexo não afirma que migration/reset já foi executado.
