# Plano 004 — Auth e persistência

Status: **APROVADO PARA EXECUÇÃO LOCAL; implementação pendente**.

Aprovação: recomendação do agente incluída no pacote de execução; ratificada de forma geral pela instrução completa. Pixabay foi pedido explícito. Restrições: ADR-001/002, complementados por ADR-003/004, spec desta pasta e rules/.

Executar tarefas sequencialmente, verificando cada uma, sem parada obrigatória entre tarefas aprovadas. Falha de check não vira sucesso; bloqueio crítico ou ação fora da autorização exige escalonamento. Nenhum commit é necessário ou autorizado.

Executar esta spec primeiro. DDL do contrato aprovado em spec.md/ADR-004 não exige nova parada pelo mesmo modelo; divergência material exige nova aprovação. Reset que destrói dados locais existentes requer confirmação ou banco descartável dedicado. Supabase CLI pode operar infraestrutura local se autorizado, nunca gerar/aplicar schema de domínio. Installs locais e consultas públicas foram aprovados; apenas versões validadas e fixadas, respeitando cooldown. Nesta tarefa documental nenhum install/DDL/check é executado.
## Sequência

1. Conferir versões realizadas/registry/audit (spec004), runtime Node22.23.4/npm10.9.9 e segredos locais; validar defaults propostos 15/15min login IP+e-mail e 60/min mutações IP+user sem prometer clean dev — **CA-07 CA-09**.
2. Implementar schema aprovado e gerar migrations somente Prisma CLI local com FKs composites, índice parcial, RLS/policies e audit append-only; replay local — **CA-04 CA-05 CA-08**.
3. Implementar Supabase SSR server-only, cookies/refresh, cadastro fechado e contexto membership/tenant com guards tRPC no monolito — **CA-01 CA-02 CA-03**.
4. Implementar rate limit IP+user, privacidade, audit atômica, CSRF/origin/cabeçalhos e explicitar segurança real da role de runtime — **CA-05 CA-06 CA-07 CA-08 CA-10**.
5. Provar integração local, isolamento por procedimento, cookies, concorrência de counters, rollback, typecheck/build; preparar CI sem migrate remoto e verificador restrito — **CA-01 CA-02 CA-03 CA-04 CA-05 CA-06 CA-07 CA-08 CA-09 CA-10**.

## Evidência e gate

Tests por CA com prefixo `test_ca_xx_`, qualificados pela spec; integração em Postgres local real, `createCaller` verificando código e corpo, e E2E para fluxos. Rodar somente checks aplicáveis em ambiente local validado; registrar saída real, comando, ambiente e limitações. Verificador com contexto limpo recebe esta spec e escopo explícito, sem editar testes. Nenhum CA está aprovado neste registro. ZIP, credenciais, deploy e passos humanos ficam na consolidação final pelo agente principal, que escreverá ENTREGA.md; este plano não a cria.

## Atualização documental após leitura das referências
Anexos references/pratica-sdd.html e references/index.html lidos; lista/descritivos não são mais lacuna. Schema realizado e mapeamento/RLS/versões/audit em spec004/ADR004. Checkboxes permanecem gates de implementação/verificação; leitura não aprova CA e não substitui relatório final do verificador. Nenhum código/check executado por esta correção.
