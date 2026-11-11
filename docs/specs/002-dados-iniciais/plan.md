# Plano 002 — Dados iniciais

Status: **APROVADO PARA EXECUÇÃO LOCAL; implementação pendente**.

Aprovação: recomendação do agente incluída no pacote de execução; ratificada de forma geral pela instrução completa. Pixabay foi pedido explícito. Restrições: ADR-001/002, complementados por ADR-003/004, spec desta pasta e rules/.

Executar tarefas sequencialmente, verificando cada uma, sem parada obrigatória entre tarefas aprovadas. Falha de check não vira sucesso; bloqueio crítico ou ação fora da autorização exige escalonamento. Nenhum commit é necessário ou autorizado.

Pré-requisito: 004 implementada e verificada no local. Esta spec não cria migration paralela ao schema de 004. Aprovação acadêmica do desvio continua gate externo, não bloqueio para registrar/implementar a opção pedida localmente.
## Sequência

1. Conferir seed contra transcrição literal já lida em references/pratica-sdd.html (TI-0001–TI-0012, nomes/categorias/estados ASCII); registrar desvio Pixabay pendente do professor — **CA-01 CA-02 CA-06**.
2. Implementar seed idempotente local do tenant, 12 equipamentos e membership colaborador do professor; prover identidade segura sem senha no código — **CA-01 CA-02 CA-03 CA-04 CA-08**.
3. Usar sharp0.35.5 validado e conferir contrato API pública; implementar pipeline local seguro e manifesto de 12 fotos únicas 800×600 exclusivamente Pixabay — **CA-05 CA-07**.
4. Testar segunda execução, preservação de dados, dimensões, crédito/origem e acesso tenant após reinício — **CA-03 CA-04 CA-05 CA-07 CA-08**.

## Evidência e gate

Tests por CA com prefixo `test_ca_xx_`, qualificados pela spec; integração em Postgres local real, `createCaller` verificando código e corpo, e E2E para fluxos. Rodar somente checks aplicáveis em ambiente local validado; registrar saída real, comando, ambiente e limitações. Verificador com contexto limpo recebe esta spec e escopo explícito, sem editar testes. Nenhum CA está aprovado neste registro. ZIP, credenciais, deploy e passos humanos ficam na consolidação final pelo agente principal, que escreverá ENTREGA.md; este plano não a cria.

## Atualização documental após leitura das referências
Anexos references/pratica-sdd.html e references/index.html lidos; lista/descritivos não são mais lacuna. Schema realizado e mapeamento/RLS/versões/audit em spec004/ADR004. Checkboxes permanecem gates de implementação/verificação; leitura não aprova CA e não substitui relatório final do verificador. Nenhum código/check executado por esta correção.
