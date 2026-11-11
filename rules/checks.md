---
description: O que precisa passar antes de declarar uma tarefa pronta
globs: []
alwaysApply: true
---

# Verificação de fim de tarefa
> leitor: agente

## Quando
Sempre que você for dizer "pronto", "implementado" ou "funcionando".

## Procedimento
1. Rode `npx vitest run`. Cole a última linha da saída na resposta.
2. Se a tarefa tocou em migration, rode `supabase db reset` local e
   confirme que o banco sobe do zero com todas as migrations.
3. Rode `npx next build` antes de qualquer push. Build que quebra na
   Vercel é o feedback mais lento e mais caro deste projeto.
4. Rode `git status --short`. Só podem aparecer arquivos do escopo
   da tarefa.
5. Diga qual critério de aceitação (CA-xx) esta tarefa atende.

## Verificação
Pronto = os quatro comandos terminaram sem falha E o git status não
trouxe surpresa. As duas coisas, não uma.

## Não faça
- Não relate sucesso parcial. Teste vermelho é tarefa não terminada,
  mesmo que o código "esteja certo".
- Não tente consertar a mesma falha duas vezes seguidas sem me mostrar
  a saída do erro.
- Não rode teste contra o banco remoto.


## Aplicabilidade no pacote 002–005
Documentar specs/ADRs não equivale a implementar: nesta etapa registrar IMPLEMENTAÇÃO/PENDENTE, sem afirmar vitest/build/reset executados. Quem implementar deve fornecer saídas reais dos checks aplicáveis e verificar ambiente local antes. O reset de schema pertence exclusivamente ao Prisma CLI conforme migration.md; o passo 2 original com `supabase db reset` não pode servir como aplicação alternativa do schema. Nunca reset sobre banco local não descartável sem confirmação. Sem repositório Git, `git status` resulta em “não rodou com sucesso — não é repositório”, não status limpo; declarar limitação e pendência de verificação. Build/test produzem artefatos locais: não são estritamente somente leitura; verificador só os executa em ambiente descartável autorizado sem alterar código/testes e com launcher restrito quando disponível. Não chamar produção PRONTA só porque documentos existem.
