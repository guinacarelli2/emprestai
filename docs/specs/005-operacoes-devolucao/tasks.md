# Tarefas 005 — Operações e devolução

Status: **CÓDIGO LOCAL IMPLEMENTADO; ACEITE INTEGRAL E PRODUÇÃO PENDENTES**. Os checkboxes abaixo são gates integrais: não são aprovados apenas pela presença do código. Plano local aprovado nas condições de ADR-003; uma tarefa por vez, sem pausa automática, sem commit/push/tag.

- [ ] **T01** Implementar devolução autorizada/idempotente com locks, audit atômica e contratos de erro. **CA-01 CA-02**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T02** Conectar devolução própria/operacoes e caches, painel cursor/busca/filtros e KPIs reais tenant/data civil. **CA-03 CA-04 CA-05**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T03** Implementar cadastro operacoes com campos/categorias/estados exatos, validação/persistência/audit, prévia e últimos reais; imagem opcional segura. **CA-06 CA-07 CA-08**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T04** Implementar logout server/limpeza cache, retirar affordances falsas, role navigation e adaptar seis telas mobile/acessíveis. **CA-09 CA-10**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T05** Verificar concorrência/rollback/IDOR, paginação/KPIs, cadastro, logout e E2E mobile/desktop sem falsificar checks. **CA-01 CA-02 CA-03 CA-04 CA-05 CA-06 CA-07 CA-08 CA-09 CA-10**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **VER** Verificar todos os CAs com contexto limpo e escopo explícito; registrar ATENDIDO/REPROVADO/SEM TESTE/AMBÍGUO, checks reais e limitações. Launcher macOS implementado e selftestado; limita os subprocessos de checks, não todas as ferramentas do subagente. Revisão e relatórios em docs/verificacao/harness; não alegar aceite sem evidência integral.

## Atualização documental após leitura das referências
Anexos references/pratica-sdd.html e references/index.html lidos; lista/descritivos não são mais lacuna. Schema realizado e mapeamento/RLS/versões/audit em spec004/ADR004. Checkboxes permanecem gates de implementação/verificação; leitura não aprova CA e não substitui relatório final do verificador. Nenhum código/check executado por esta correção.

## Consolidação da execução local
Código e checks locais registrados em ENTREGA.md e docs/verificacao/evidencias. Permanecem sem fechamento os gates que exigem Auth real, fotos reais/licença/revisão, E2E autenticado completo, grants/pooler remoto e aceite acadêmico. Não tratar esses checkboxes como implementação inexistente, nem marcá-los completos sem satisfazer os CAs inteiros.
