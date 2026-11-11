# Tarefas 002 — Dados iniciais

Status: **CÓDIGO LOCAL IMPLEMENTADO; ACEITE INTEGRAL E PRODUÇÃO PENDENTES**. Os checkboxes abaixo são gates integrais: não são aprovados apenas pela presença do código. Plano local aprovado nas condições de ADR-003; uma tarefa por vez, sem pausa automática, sem commit/push/tag.

- [ ] **T01** Conferir seed contra transcrição literal já lida em references/pratica-sdd.html (TI-0001–TI-0012, nomes/categorias/estados ASCII); registrar desvio Pixabay pendente do professor. **CA-01 CA-02 CA-06**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T02** Implementar seed idempotente local do tenant, 12 equipamentos e membership colaborador do professor; prover identidade segura sem senha no código. **CA-01 CA-02 CA-03 CA-04 CA-08**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T03** Usar sharp0.35.5 validado e conferir contrato API pública; implementar pipeline local seguro e manifesto de 12 fotos únicas 800×600 exclusivamente Pixabay. **CA-05 CA-07**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T04** Testar segunda execução, preservação de dados, dimensões, crédito/origem e acesso tenant após reinício. **CA-03 CA-04 CA-05 CA-07 CA-08**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **VER** Verificar todos os CAs com contexto limpo e escopo explícito; registrar ATENDIDO/REPROVADO/SEM TESTE/AMBÍGUO, checks reais e limitações. Launcher macOS implementado e selftestado; limita os subprocessos de checks, não todas as ferramentas do subagente. Revisão e relatórios em docs/verificacao/harness; não alegar aceite sem evidência integral.

## Atualização documental após leitura das referências
Anexos references/pratica-sdd.html e references/index.html lidos; lista/descritivos não são mais lacuna. Schema realizado e mapeamento/RLS/versões/audit em spec004/ADR004. Checkboxes permanecem gates de implementação/verificação; leitura não aprova CA e não substitui relatório final do verificador. Nenhum código/check executado por esta correção.

## Consolidação da execução local
Código e checks locais registrados em ENTREGA.md e docs/verificacao/evidencias. Permanecem sem fechamento os gates que exigem Auth real, fotos reais/licença/revisão, E2E autenticado completo, grants/pooler remoto e aceite acadêmico. Não tratar esses checkboxes como implementação inexistente, nem marcá-los completos sem satisfazer os CAs inteiros.
