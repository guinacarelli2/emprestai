---
description: Onde cada variável de ambiente vive e qual chave usar
globs: ["**/.env*", "src/server/db.ts", "src/env.ts"]
alwaysApply: false
---

# Variáveis de ambiente e chaves
> leitor: agente

## Quando
Ao criar ou usar qualquer variável de ambiente, ao instanciar o client
do banco, ou ao escrever código que lê configuração.

## Procedimento
1. Chave pública (anon): só ela pode aparecer em código que roda no
   navegador. A proteção dela são as políticas de RLS. Segredo nunca
   leva prefixo `NEXT_PUBLIC_`.
2. Chave `service_role`: ignora todas as policies. Só em código que
   roda no servidor, nunca em Client Component, nunca em variável com
   prefixo `NEXT_PUBLIC_`. O Prisma de runtime usa o pooler (porta
   6543); migration usa `directUrl` (porta 5432).
3. Variável nova existe em TRÊS lugares ou em nenhum:
   `.env.local` (sua máquina) · `.env.example` (versionado, sem valor)
   · painel da Vercel (preview e production).
4. Ao criar uma variável, diga na resposta em quais dos três lugares
   você já a colocou e o que falta eu fazer à mão.

## Verificação
Uma busca por "service" no código que vai para o navegador não
retorna nada. `.env.example` tem todas as chaves que o projeto usa,
sem nenhum valor real.

## Não faça
- Não escreva valor de chave em resposta, commit, log ou comentário.
- Não crie variável só no `.env.local`. Ela quebra o deploy e o erro
  só aparece no build da Vercel.
- Não contorne uma policy de RLS trocando de chave. Se a policy
  atrapalha, a policy está errada — pare e me avise.
