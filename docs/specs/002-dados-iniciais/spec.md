# Spec 002 — Dados iniciais

Status: **CÓDIGO LOCAL IMPLEMENTADO; VERIFICAÇÃO INTEGRAL PENDENTE — produção não pronta**. Checks e limites reais em ENTREGA.md/docs/verificacao. Critérios abaixo permanecem íntegros; implementação não implica aceite.

## Autoridade e aprovação
Fontes lidas: `references/pratica-sdd.html` (senha redigida), `references/index.html`, PRD, ADR-001/002 e ADR-003/004. O anexo da prática rege a transcrição dos 12 dados; o index é referência visual, não inventário normativo. O contrato realizado foi conferido em `prisma/schema.prisma`; esta correção documental não modifica o modelo nem comprova execução de testes.
Decisões de implementação: **recomendação do agente incluída no pacote de execução; ratificada de forma geral; Pixabay pedido explícito**. Os planos locais foram aprovados pela instrução completa após o pacote recomendado; não se atribui escolha independente de arquitetura ou regra ao usuário.
Dependências: **004 → 002 → 003 → 005** (ordem de execução, não ordem numérica). Cada spec tem seus próprios CAs, plano, tarefas e veredito. IDs de CA são locais à spec; referenciar como `002/CA-01`, por exemplo.

## Escopo
Inventário determinístico do tenant `suporte_ti`, vínculo do professor colaborador, zero empréstimos iniciais e fotos reais do Pixabay. Depende da identidade, modelo e autorização de 004. Seed é idempotente e exclusivamente local quando executado pelo agente de implementação; remoto somente humano.

## Lista exata do seed
Uma unidade física por patrimônio; não incluir os PAT-* do mock, projetor, pessoas fictícias ou loans de demonstração.

| Patrimônio | Nome completo | Categoria DB | Situação DB | Busca da prática |
|---|---|---|---|---|
| TI-0001 | Notebook 14 polegadas | notebook | disponivel | laptop on white desk |
| TI-0002 | Notebook 15 polegadas | notebook | disponivel | open laptop minimal desk |
| TI-0003 | Notebook 13 polegadas | notebook | disponivel | laptop closeup keyboard |
| TI-0004 | Notebook 15 polegadas | notebook | manutencao | closed laptop on table |
| TI-0005 | Monitor 24 polegadas | monitor | disponivel | computer monitor on desk |
| TI-0006 | Monitor 27 polegadas | monitor | disponivel | monitor screen office desk |
| TI-0007 | Monitor 22 polegadas | monitor | manutencao | black computer screen |
| TI-0008 | Cabo HDMI 2 m | cabo | disponivel | hdmi cable |
| TI-0009 | Cabo USB-C 1 m | cabo | disponivel | usb cable white background |
| TI-0010 | Cabo de rede 3 m | cabo | manutencao | ethernet cable |
| TI-0011 | Webcam Full HD | camera | disponivel | webcam |
| TI-0012 | Câmera compacta | camera | disponivel | compact camera on table |

Transcrição literal da lista JSON em `references/pratica-sdd.html`, sem nomes abreviados. DB usa estados ASCII `disponivel`/`manutencao`; labels UI podem usar acentos. São 4 notebooks, 3 monitores, 3 cabos, 2 câmeras. O briefing no mesmo HTML contradiz a lista ao dizer só TI-0004/TI-0007 em manutenção e dez disponíveis: prevalece lista exata incluindo TI-0010, conforme pacote ratificado (nove disponíveis/três manutenção). Hífens e nomes vêm do anexo, não de escolha independente do usuário. Busca orienta a skill, não é campo novo do schema.

Correção real: documentos iniciais reproduziram patrimônios sem hífen do briefing herdado antes da leitura do anexo e trataram indevidamente os dados descritivos como lacuna. O principal apontou o erro e preservou as referências; esta leitura corrige a suposição. Registrar esse episódio real em ENTREGA.md seção 2, sem fabricar história ou atribuir ao humano uma escolha de hífen.

## Critérios de aceitação
- **CA-01 — inventário [seed/banco].** Em banco local limpo, exatamente TI-0001 a TI-0012 no tenant, sem outros itens seedados. Evidência esperada: integração comparando conjunto completo de patrimônios e contagem 12, não só amostra.
- **CA-02 — estados [seed/banco].** Somente TI-0004, TI-0007 e TI-0010 em manutenção; outros nove disponíveis, nomes/categorias exatos da tabela, sem loan aberto nem projetor no seed. Evidência: comparação por patrimônio, agregados 3/9 e contagem de loans zero.
- **CA-03 — idempotência [seed].** Segunda execução não duplica tenant, membership, item, foto ou audit de criação; não apaga empréstimos ou equipamentos criados depois e não repõe como disponível item já emprestado. Evidência: duas execuções mais fixture de dado legítimo preservado, sem reset remoto.
- **CA-04 — professor [Auth/membership].** `marcelo.grilo@institutojef.org.br` tem membership `colaborador` em `suporte_ti`, sem papel operacoes e sem empréstimos iniciais; identity Auth provisionada por fluxo seguro local ou ação humana no remoto. Não inserir senha em código, seed, arquivo versionado, ZIP ou log. Evidência: vínculo ao ID real de Auth, login local e autorização negando operações; inspeção sem revelar segredos. Sem identidade provisionada, registrar pendência, não fingir login funcional.
- **CA-05 — foto individual [pipeline local].** Cada um dos 12 itens possui uma foto própria/única (IDs Pixabay e arquivos distintos), obtida **exclusivamente pela API Pixabay**, processada para exatamente **800×600**, com associação semanticamente coerente ao tipo. Revisão visual obrigatória rejeita pessoas, marcas/logos legíveis, texto e telas com conteúdo; parâmetros API não garantem direito de imagem. Persistir origem, ID, fotógrafo/autor, página e licença/URL conforme campos existentes; não usar Pexels, outras fontes, scraping ou hotlink como substituto. Evidência: manifesto verificável das 12 respostas/origens sem chave, IDs distintos, dimensões, hashes dos 12 arquivos e manifesto/revisão visual com rejeições reais; não tratar imagem ilustrativa como foto da unidade real.
- **CA-06 — desvio acadêmico [documentação].** O enunciado original exige Pexels; Pixabay é **DESVIO solicitado explicitamente pelo usuário e requer aprovação do professor**, ainda pendente. Evidência: registro explícito do desvio no pacote final e aprovação do professor separada quando existir; pedido do usuário não equivale a aprovação acadêmica.
- **CA-07 — segurança de imagem [pipeline].** Chave API apenas servidor/ambiente local, nunca bundle ou crédito. Validar host permitido da resposta, redirects, timeout, tamanho, MIME e decodificação; recodificar com sharp, remover metadados e impedir SSRF/traversal. Sem SVG/script, uploads ou fallback externo. Evidência: testes com resposta inválida, host/redirect indevido, arquivo grande e falha API; erro preserva rastreabilidade e não gera placeholder apresentado como foto pronta. Sharp 0.35.5 validado no manifesto/registry preservados, sem instalação por esta correção.
- **CA-08 — persistência tenant [integração].** Seed usa modelo/FKs e isolamento de 004; consulta autenticada confirma 12/9/3 sem nomes de outros colaboradores e persiste após reinício. Evidência: integração local com dois tenants e reload; fotos e seed remotos nunca executados pelo agente.

## Contrato da skill e armazenamento
O anexo exige skill `imagens-equipamentos`, única origem das fotos de equipamentos; bucket público Supabase Storage e URLs públicas, com caminhos/manifesto determinísticos e repetição sem duplicação. Preparação local pode ser do agente; upload do deploy somente humano. Fotos antigas de equipamentos devem ser substituídas pela skill; logo/landing fora de escopo. Crédito original “Fotos: Pexels” passa a “Fotos: Pixabay” com link por pedido explícito, mantendo licença/proveniência. Pedido de senha no seed conflita com rules: não atendê-lo, senha já redigida no anexo, configurar diretamente pelo humano, professor com zero empréstimos e testes em outra conta.

## Pendências e fora de escopo
Aprovação do professor ao desvio, imagens/revisão e provisionamento/evidências finais pendentes; a transcrição do inventário está resolvida pelo anexo. Sem inventar versões ou evidência. Convites remotos, senhas padrão, loans fictícios e imagem de projetor não entram.
