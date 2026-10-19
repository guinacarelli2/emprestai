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
