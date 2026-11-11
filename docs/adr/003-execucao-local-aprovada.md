# ADR-003 — Pacote de execução local e exceções específicas

Status: **APROVADO PARA EXECUÇÃO LOCAL pela instrução completa recebida; implementação e verificação pendentes**.

## Contexto real e autoridade
O usuário anexou `pratica-sdd` e uma referência visual `index`, pediu ZIP funcional Next/Vercel/Supabase e registros. Após consulta sobre o pacote recomendado, aprovou a execução completa do plano **local**; determinou explicitamente Pixabay em lugar de Pexels. Anexos agora preservados e lidos em `references/pratica-sdd.html` (senha redigida) e `references/index.html`; a lista literal passou a reger os dados, com correção de nomes/hífens.

Proveniência das decisões: **recomendação do agente incluída no pacote de execução; ratificada de forma geral; Pixabay pedido explícito**. Não atribuir escolhas independentes de arquitetura, papéis, datas ou DDL ao usuário. Conflito real do agente: documentos iniciais herdaram abreviações de patrimônio sem hífen e declararam dados descritivos ausentes antes de ler o anexo. O principal apontou a divergência e preservou as referências; esta revisão transcreve TI-0001…TI-0012 e os nomes reais. Este é o episódio verificável para ENTREGA seção 2, não história inventada nem escolha humana de hífen.

## Decisões e alcance
1. Registrar specs/plans/tasks antes de implementação, com dependência **004 → 002 → 003 → 005**. Planos locais desse pacote aprovados pela instrução completa, não por interpretar um “pode implementar” isolado. Executar tarefas sequencialmente, checks entre elas, sem parada obrigatória após cada tarefa. Bloqueio crítico e ação nova fora do pacote continuam exigindo escalonamento.
2. Permitido escrever ADRs que **documentem estas aprovações reais**, sem autoridade para inventar decisões novas. Exceção específica a `rules/restrictions.md`; não revogação geral.
3. Consultar documentação pública/npm e instalar dependências **localmente**, com Node 22/npm 10; sharp permitido para pipeline seguro. Toda versão deve ser exata e validada quanto a disponibilidade/compatibilidade e cooldown antes de instalar/fixar. Versões realizadas após registry/cooldown/audit: Next16.4.4, React19.3.1, Zod4.6.7, Prisma6.12.0 (6.19 rejeitado por high), Vitest5.1.0, Node22.23.4/npm10.9.9; sharp0.35.5. Evidências: manifesto e .work/security-versions.json, .work/versions.json; runtime informado pelo principal. Esta correção não executou install/check.
4. Pixabay é fonte exclusiva das 12 fotos únicas 800×600 da spec 002. **DESVIO do Pexels exigido pelo enunciado original**; aprovação do professor continua **PENDENTE**. A aprovação local do usuário não prova aceite acadêmico. Não usar Pexels/outra fonte como fallback, não hotlink/scraping, API key server-only, imagem ilustrativa não é prova da unidade real.
5. Sem deploy, migration/seed/upload remoto pelo agente, nem commit/push/tag. Qualquer script/ação remota será executado **somente pelo humano**, após configuração e revisão. Este registro não autoriza emissão de convites/e-mails remotos. Não automatizar migrate remoto em CI; ADR-004 substitui esse ponto de ADR-001.
6. Verificador com contexto limpo, escopo explícito e sem editar testes/código. Política no prompt/frontmatter não equivale a sandbox: isolamento efetivo só quando o **launcher enforce tools**, ainda a implementar. Bash é capacidade de escrita indireta e precisa allowlist/restrição real. Não declarar verificação independente efetivamente isolada apenas por descrição de agente.
7. DDL aprovado em ADR-004 pode seguir Prisma CLI **local**, sem repetir parada para o mesmo modelo; ampliação material permanece aprovação nova. Reset destrutivo de banco local existente não está implicitamente autorizado: usar banco descartável ou confirmar.
8. Produção **não pronta**: specs e tarefas em IMPLEMENTAÇÃO/PENDENTE até evidência real. Principal escreverá `ENTREGA.md` ao final e consolidará ZIP/registros; não criar esse arquivo nesta etapa documental.

## Alternativas e consequências
- Manter pausa por tarefa era regra original; foi substituída especificamente pela aprovação do pacote local, mantendo gates de qualidade e segurança.
- Pexels preservaria aderência ao enunciado, mas contraria o pedido explícito atual; Pixabay implementa o pedido e exige sinalizar desvio ao professor.
- Deploy/seed remoto automático facilitaria demonstração, mas excede autorização e risco aceito; ação humana é o caminho aprovado.
- Só prompt para verificador é orientação, não isolamento real; launcher restrito é recomendado e pendente.

Escopo desta tarefa: apenas documentos/regras, sem código de app, package, scripts, banco ou fotos. Nenhum comando de implementação ou teste é alegado como executado por este ADR.

## Ajuste realizado de dependências/telemetria
`.work/audit-runtime.json` registra npm audit --omit=dev **zero findings**; `.work/audit-second.json` mantém **16 moderate** incluindo dev, revisão pendente. Não prometer clean global. Sentry removido/inativo por ausência de autorização para telemetria e audit; exceção específica ao ADR-001, integração **opcional**, DSN não obrigatório no startup, ativação futura só com autorização e review. Não inventar aprovação de envio.

## Conflitos do anexo registrados após leitura
Lista literal inclui TI-0010 manutenção, enquanto briefing diz só dois itens: conservar lista 9/3. Senha no seed conflita com regras: redigida/configuração humana segura. Pedido de tech lead para verificador corrigir teste conflita com independência: jamais corrigir. Cinco empréstimos/14 úteis/sem crédito conflitam com PRD e contrato da skill: três/14 corridos/crédito Pixabay. Fonte exclusiva original Pexels versus pedido explícito Pixabay: desvio acadêmico pendente. Decisões são recomendação incluída no pacote, ratificada de forma geral; não escolhas isoladas atribuídas ao usuário.
