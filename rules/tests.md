---
description: Como escrever e rodar testes neste projeto
globs: ["**/*.{test,spec}.{ts,tsx}", "e2e/**"]
alwaysApply: false
---

# Testes
> leitor: agente

## Quando
Ao escrever, alterar ou remover qualquer teste.

## Procedimento
1. Testes rodam contra Postgres local (Testcontainers na integração,
   banco local nas demais). Nunca contra o remoto.
2. O nome do teste cita o critério que ele prova: `test_ca_03_...`.
3. Teste de procedimento tRPC usa `createCaller` e verifica código
   (`TRPCError` ou sucesso) E o corpo do retorno.
4. Tabela com policy de RLS tem um teste que prova o bloqueio: o
   mesmo dado, com outro tenant, não retorna. Um caso desses por
   procedimento.

## Verificação
`npx vitest run` passa com o banco local recém-resetado
(`npx prisma migrate reset`).
