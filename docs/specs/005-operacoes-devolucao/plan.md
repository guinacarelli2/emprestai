# Plano 005 — Operações e devolução

Status: **APROVADO PARA EXECUÇÃO LOCAL; implementação pendente**.

Aprovação: recomendação do agente incluída no pacote de execução; ratificada de forma geral pela instrução completa. Pixabay foi pedido explícito. Restrições: ADR-001/002, complementados por ADR-003/004, spec desta pasta e rules/.

Executar tarefas sequencialmente, verificando cada uma, sem parada obrigatória entre tarefas aprovadas. Falha de check não vira sucesso; bloqueio crítico ou ação fora da autorização exige escalonamento. Nenhum commit é necessário ou autorizado.

Pré-requisitos: 004, 002 e 003. Nenhum novo provedor/biblioteca de imagem ou projeto API. Após verificação, agente principal consolida ZIP funcional e instruções humanas; ENTREGA.md será escrita por ele no final, não nesta tarefa.
## Sequência

1. Implementar devolução autorizada/idempotente com locks, audit atômica e contratos de erro — **CA-01 CA-02**.
2. Conectar devolução própria/operacoes e caches, painel cursor/busca/filtros e KPIs reais tenant/data civil — **CA-03 CA-04 CA-05**.
3. Implementar cadastro operacoes com campos/categorias/estados exatos, validação/persistência/audit, prévia e últimos reais; imagem opcional segura — **CA-06 CA-07 CA-08**.
4. Implementar logout server/limpeza cache, retirar affordances falsas, role navigation e adaptar seis telas mobile/acessíveis — **CA-09 CA-10**.
5. Verificar concorrência/rollback/IDOR, paginação/KPIs, cadastro, logout e E2E mobile/desktop sem falsificar checks — **CA-01 CA-02 CA-03 CA-04 CA-05 CA-06 CA-07 CA-08 CA-09 CA-10**.

## Evidência e gate

Tests por CA com prefixo `test_ca_xx_`, qualificados pela spec; integração em Postgres local real, `createCaller` verificando código e corpo, e E2E para fluxos. Rodar somente checks aplicáveis em ambiente local validado; registrar saída real, comando, ambiente e limitações. Verificador com contexto limpo recebe esta spec e escopo explícito, sem editar testes. Nenhum CA está aprovado neste registro. ZIP, credenciais, deploy e passos humanos ficam na consolidação final pelo agente principal, que escreverá ENTREGA.md; este plano não a cria.

## Atualização documental após leitura das referências
Anexos references/pratica-sdd.html e references/index.html lidos; lista/descritivos não são mais lacuna. Schema realizado e mapeamento/RLS/versões/audit em spec004/ADR004. Checkboxes permanecem gates de implementação/verificação; leitura não aprova CA e não substitui relatório final do verificador. Nenhum código/check executado por esta correção.
