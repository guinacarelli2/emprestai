# Plano 003 — Solicitar empréstimo

Status: **APROVADO PARA EXECUÇÃO LOCAL; implementação pendente**.

Aprovação: recomendação do agente incluída no pacote de execução; ratificada de forma geral pela instrução completa. Pixabay foi pedido explícito. Restrições: ADR-001/002, complementados por ADR-003/004, spec desta pasta e rules/.

Executar tarefas sequencialmente, verificando cada uma, sem parada obrigatória entre tarefas aprovadas. Falha de check não vira sucesso; bloqueio crítico ou ação fora da autorização exige escalonamento. Nenhum commit é necessário ou autorizado.

Pré-requisitos: 004 e 002. Schema/índice pertencem à migration Prisma de 004; qualquer alteração adicional segue ADR-004 e approval gate para DDL fora do modelo aprovado.
## Sequência

1. Implementar listagem/detalhe/busca/filtros tenant e próprios loans em routers/services reais com contratos inferidos — **CA-01 CA-02 CA-10**.
2. Implementar data civil e elegibilidade dentro da transação com locks membership/item, índice parcial já migrado e audit atômica — **CA-03 CA-04 CA-05 CA-06 CA-08**.
3. Conectar UI, confirmação, motivos, fotos/crédito e revalidação de todos os caches afetados — **CA-07 CA-09 CA-10**.
4. Provar concorrência usuário/item, fronteiras de data, rollback, isolamento, persistência e navegação real — **CA-01 CA-02 CA-03 CA-04 CA-05 CA-06 CA-07 CA-08 CA-09 CA-10**.

## Evidência e gate

Tests por CA com prefixo `test_ca_xx_`, qualificados pela spec; integração em Postgres local real, `createCaller` verificando código e corpo, e E2E para fluxos. Rodar somente checks aplicáveis em ambiente local validado; registrar saída real, comando, ambiente e limitações. Verificador com contexto limpo recebe esta spec e escopo explícito, sem editar testes. Nenhum CA está aprovado neste registro. ZIP, credenciais, deploy e passos humanos ficam na consolidação final pelo agente principal, que escreverá ENTREGA.md; este plano não a cria.

## Atualização documental após leitura das referências
Anexos references/pratica-sdd.html e references/index.html lidos; lista/descritivos não são mais lacuna. Schema realizado e mapeamento/RLS/versões/audit em spec004/ADR004. Checkboxes permanecem gates de implementação/verificação; leitura não aprova CA e não substitui relatório final do verificador. Nenhum código/check executado por esta correção.
