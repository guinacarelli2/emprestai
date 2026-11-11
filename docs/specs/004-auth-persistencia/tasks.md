# Tarefas 004 — Auth e persistência

Status: **CÓDIGO LOCAL IMPLEMENTADO; ACEITE INTEGRAL E PRODUÇÃO PENDENTES**. Os checkboxes abaixo são gates integrais: não são aprovados apenas pela presença do código. Plano local aprovado nas condições de ADR-003; uma tarefa por vez, sem pausa automática, sem commit/push/tag.

- [ ] **T01** Conferir versões realizadas/registry/audit (spec004), runtime Node22.23.4/npm10.9.9 e segredos locais; validar defaults propostos 15/15min login IP+e-mail e 60/min mutações IP+user sem prometer clean dev. **CA-07 CA-09**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T02** Implementar schema aprovado e gerar migrations somente Prisma CLI local com FKs composites, índice parcial, RLS/policies e audit append-only; replay local. **CA-04 CA-05 CA-08**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T03** Implementar Supabase SSR server-only, cookies/refresh, cadastro fechado e contexto membership/tenant com guards tRPC no monolito. **CA-01 CA-02 CA-03**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T04** Implementar rate limit IP+user, privacidade, audit atômica, CSRF/origin/cabeçalhos e explicitar segurança real da role de runtime. **CA-05 CA-06 CA-07 CA-08 CA-10**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **T05** Provar integração local, isolamento por procedimento, cookies, concorrência de counters, rollback, typecheck/build; preparar CI sem migrate remoto e verificador restrito. **CA-01 CA-02 CA-03 CA-04 CA-05 CA-06 CA-07 CA-08 CA-09 CA-10**. Evidência: testes/saídas reais anexados ao concluir, sem substituir ou enfraquecer CA.
- [ ] **VER** Verificar todos os CAs com contexto limpo e escopo explícito; registrar ATENDIDO/REPROVADO/SEM TESTE/AMBÍGUO, checks reais e limitações. Launcher macOS implementado e selftestado; limita os subprocessos de checks, não todas as ferramentas do subagente. Revisão e relatórios em docs/verificacao/harness; não alegar aceite sem evidência integral.

## Atualização documental após leitura das referências
Anexos references/pratica-sdd.html e references/index.html lidos; lista/descritivos não são mais lacuna. Schema realizado e mapeamento/RLS/versões/audit em spec004/ADR004. Checkboxes permanecem gates de implementação/verificação; leitura não aprova CA e não substitui relatório final do verificador. Nenhum código/check executado por esta correção.

## Consolidação da execução local
Código e checks locais registrados em ENTREGA.md e docs/verificacao/evidencias. Permanecem sem fechamento os gates que exigem Auth real, fotos reais/licença/revisão, E2E autenticado completo, grants/pooler remoto e aceite acadêmico. Não tratar esses checkboxes como implementação inexistente, nem marcá-los completos sem satisfazer os CAs inteiros.
