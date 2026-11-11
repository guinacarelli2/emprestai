# Tarefas 003 — Solicitar empréstimo

Status: **CÓDIGO LOCAL IMPLEMENTADO; ACEITE INTEGRAL E PRODUÇÃO PENDENTES**. Os checkboxes abaixo são gates integrais: não são aprovados apenas pela presença do código. Plano local aprovado nas condições de ADR-003; uma tarefa por vez, sem pausa automática, sem commit/push/tag.

- [ ] **T01** Implementar listagem/detalhe/busca/filtros tenant e próprios loans em routers/services reais com contratos inferidos. **CA-01 CA-02 CA-10**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T02** Implementar data civil e elegibilidade dentro da transação com locks membership/item, índice parcial já migrado e audit atômica. **CA-03 CA-04 CA-05 CA-06 CA-08**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T03** Conectar UI, confirmação, motivos, fotos/crédito e revalidação de todos os caches afetados. **CA-07 CA-09 CA-10**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T04** Provar concorrência usuário/item, fronteiras de data, rollback, isolamento, persistência e navegação real. **CA-01 CA-02 CA-03 CA-04 CA-05 CA-06 CA-07 CA-08 CA-09 CA-10**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **VER** Verificar todos os CAs com contexto limpo e escopo explícito; registrar ATENDIDO/REPROVADO/SEM TESTE/AMBÍGUO, checks reais e limitações. Launcher macOS implementado e selftestado; limita os subprocessos de checks, não todas as ferramentas do subagente. Revisão e relatórios em docs/verificacao/harness; não alegar aceite sem evidência integral.

## Atualização documental após leitura das referências
Anexos references/pratica-sdd.html e references/index.html lidos; lista/descritivos não são mais lacuna. Schema realizado e mapeamento/RLS/versões/audit em spec004/ADR004. Checkboxes permanecem gates de implementação/verificação; leitura não aprova CA e não substitui relatório final do verificador. Nenhum código/check executado por esta correção.

## Consolidação da execução local
Código e checks locais registrados em ENTREGA.md e docs/verificacao/evidencias. Permanecem sem fechamento os gates que exigem Auth real, fotos reais/licença/revisão, E2E autenticado completo, grants/pooler remoto e aceite acadêmico. Não tratar esses checkboxes como implementação inexistente, nem marcá-los completos sem satisfazer os CAs inteiros.
