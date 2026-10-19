# Spec 001 — Telas da v1 (front estático)

Fonte de negócio: `docs/PRD.md` (v1).  
Fonte visual: `layout.md` (medidas, tokens, componentes). Se esta spec e o `layout.md` discordarem de pixel, vence o `layout.md`. Se discordarem de comportamento, vence esta spec.

Esta spec **não** autentica, **não** grava no banco e **não** chama tRPC. Os dados vêm de um módulo mock. Auth, convite, papéis e persistência ficam para specs seguintes.

## Fora de escopo

- Reserva com data futura, e-mail, importação de planilha (PRD).
- Alternador de tema; só modo escuro (`layout.md`).
- HTML/CSS avulso, Nocturne `_ds/*` (arquivos inexistentes) e estilo inline (ADR-001: Tailwind + CSP sem `unsafe-inline`).
- Esconder o grupo Operações da sidebar por papel (o `layout.md` desenha os dois grupos; autorização real não está decidida no PRD).

## Princípios

- Client Components nas telas (`docs/adr/001-stack.md`).
- Tokens do `layout.md` entram no tema Tailwind; componentes shadcn/ui restilizados para essas variantes — botão primário **contornado**, nunca preenchido com sólido.
- Ícones Phosphor (`layout.md` §5.11), via `@phosphor-icons/react` (empacotado no build; CSP do ADR não permite unpkg).
- Fonte Open Sans 400/600 (500/700 podem carregar; título nunca 700).
- Flex/grid + `gap`. Sem margem entre irmãos para espaçar.
- Copy seca, pt-BR, sem exclamação, sem emoji. Data `dd/mmm` (`14/set`).
- Cada tela: atributo `data-screen-label` (`01 Login` … `06 Cadastrar equipamento`).
- Viewport de referência: 1440×820 (login, meus empréstimos, cadastro) e 1440×900 (catálogo, detalhe, operações). Sem breakpoint mobile nesta spec.

## Rotas

| Rota | Tela |
|---|---|
| `/login` | 01 Login |
| `/catalogo` | 02 Catálogo |
| `/catalogo/:patrimonio` | 03 Detalhe |
| `/meus-emprestimos` | 04 Meus empréstimos |
| `/operacoes/emprestimos` | 05 Empréstimos em aberto |
| `/operacoes/equipamentos/novo` | 06 Cadastrar equipamento |
| `/` | redireciona para `/login` |

Fluxos: card disponível → detalhe → diálogo confirmar → `/meus-emprestimos`. “Pegar emprestado” → `/catalogo`. “Cadastrar equipamento” → `/operacoes/equipamentos/novo`. Submit do login → `/catalogo` (sem Auth). `ph-bell` visível e inerte.

## Copy que o layout não fechou

| Onde | Texto |
|---|---|
| Hero título (≤20ch) | `Quem está com o quê` |
| Hero subtítulo (≤38ch, `#93A0C6`) | `Pedido e devolução sem planilha.` |
| Marca | `EmpresTI` |
| Form subtítulo | `E-mail e senha do convite.` |
| Nota de suporte | `Sem acesso? Fale com Operações.` |
| Faixa de regras (título) | `Regras de empréstimo` |
| Faixa de regras (corpo) | `Até 3 itens por pessoa. Prazo padrão 14 dias. Atraso impede novo pedido. Item em manutenção não aparece como disponível.` |
| Manutenção no card | `Na assistência · peça` |
| Nota de retirada (detalhe) | `Retirada no balcão de Operações.` |
| Nota Seus itens (sem atraso) | `Nenhum item em atraso.` |
| Nota Seus itens (com atraso) | `Há item em atraso. Novo empréstimo bloqueado.` |
| Solicitar desabilitado | `Bloqueado por atraso.` |
| Diálogo título | `Confirmar empréstimo` |
| Diálogo corpo | `O prazo começa na confirmação. Devolver até {data}.` |
| Diálogo consequência (3º item) | `Este pedido leva a 3 de 3 itens.` |
| Diálogo ações | `Cancelar` · `Confirmar` |

## Persona e mock

Persona padrão da shell: **Marina Alves**, Design, iniciais `MA`, 2 de 3 itens, nenhum atraso.

Persona **Operações** no bloco da sidebar da tela 05/06: nome `Operações`, linha `Balcão · 2º andar`, iniciais `OP`.

Persona **Camila Duarte** existe só para o estado de atraso (CA-10): 1 item em atraso; “Solicitar” desabilitado. Troca de persona nesta spec = constante no mock (`currentUserId`), não tela de troca.

### Equipamentos (catálogo 3×2)

| Patrimônio | Nome | Categoria | Estado | Rodapé |
|---|---|---|---|---|
| PAT-1042 | MacBook Pro 14" | Notebooks | Disponível | `Solicitar →` |
| PAT-1188 | ThinkPad T14 | Notebooks | Emprestado | `Com Marina Alves · devolve 14/set` |
| PAT-0871 | Dell UltraSharp 27" | Monitores | Disponível | `Solicitar →` |
| PAT-0233 | Sony A7 III | Câmeras | Emprestado | `Com Rafael Lima · devolve 05/out` |
| PAT-0455 | Dock USB-C Anker | Cabos | Manutenção | `Na assistência · peça` |
| PAT-0102 | Projetor Epson X49 | Projetores | Manutenção | `Na assistência · peça` |

Contagem do H1 do catálogo: `6 equipamentos · 2 disponíveis agora` (os seis cards desta spec; o `layout.md` cita 32/11 como densidade de um dump maior — nesta spec o grid é 3×2 com estes seis).

Chips do catálogo: `Todos` (ativo) · `Notebooks` · `Monitores` · `Câmeras` · `Cabos` · `Projetores`, e à direita `Só disponíveis`. Clique de chip só altera estilo ativo; **não** filtra nesta spec (filtro real na spec de catálogo com dados).

### Marina — comigo agora

1. ThinkPad T14 PAT-1188 — prazo 14/set, barra ~ metade de 14 dias.  
2. LG UltraFine 24" PAT-0910 — prazo 20/set, barra menor.

Histórico (tabela 04): pelo menos uma linha `No prazo` (verde) e uma com atraso (âmbar), usando nomes do `layout.md` §10.

### Operações — tabela (7 linhas, 21 no texto de paginação)

H1 apoio: `21 itens fora · atualizado agora`.  
Cards: Em aberto **21** · Vencem em 3 dias **4** · Em atraso **3** (borda e número no vermelho de atraso) · Em manutenção **2**.  
Chips: `Todos` (ativo) · `Em atraso` · `Vencem esta semana` · `Notebooks`. Sem filtrar nesta spec.  
Paginação: `7 de 21 empréstimos` · Anterior · Próximo (controles visíveis; clique não muda página nesta spec).

Linhas: Marina Alves, Rafael Lima, Camila Duarte (atraso), Tiago Menezes (atraso), Ana Sato, Bruno Kato, Helena Prado (atraso). Colunas conforme `layout.md` §4.6. Botão `Devolver` em cada linha; nas de atraso, variante “ação de linha em atraso”. Clique em Devolver **não** persiste; pode animar remoção da linha (CA-09) e a linha volta no reload (mock).

### Cadastro (06)

Campos e labels exatamente: Nome · Categoria · Patrimônio · Número de série · Local de retirada · Situação inicial (Disponível / Em manutenção / Fora de uso) · Observações.  
Nota sob situação: `Em manutenção não aparece no catálogo.`  
Nota sob H1: `Um registro por unidade física`.  
Prévia: o card do catálogo (§5.4) com os valores atuais do form (vazio = placeholders do mock).  
Últimos cadastros: 3 linhas (item + data `dd/mmm`) fixas no mock.  
Submit não grava; “Cadastrar e adicionar outro” limpa o form na tela.

### Detalhe (03) — PAT-1042 como exemplo da rota

Breadcrumb: `Catálogo` › `Notebooks` › `MacBook Pro 14"`.  
Descrição ≤60ch: `Notebook corporativo para desenho e build local.`  
Ficha: Categoria Notebooks · Patrimônio PAT-1042 · Local Balcão 2º andar · Última devolução 02/set.  
Histórico: 3 linhas `data | evento | resultado`.  
Card solicitar: Retirada `Balcão 2º andar` · Prazo padrão 14 dias · Devolver até **12/out** (28/set + 14 dias; se a data de “hoje” do mock mudar, recalcular e manter `dd/mmm`).  
Hoje do mock: **28/set/2026**.

Item em manutenção ou emprestado: sem botão Solicitar (card do catálogo já sem ação; detalhe pode abrir só para disponível nesta spec — rotas dos seis patrimônios renderizam; nos não disponíveis o card lateral explica o estado e não oferece confirmar).

## Shell (telas 02–06)

Sidebar 236px, grupos **Colaborador** (Catálogo, Meus empréstimos com badge `2`) e **Operações** (Empréstimos em aberto, Cadastrar equipamento). Item ativo: fill + barra inset `#5B7FE0`. Login **sem** sidebar.

## Critérios de aceitação

- **CA-01** Tema: tokens do `layout.md` §2–4 no Tailwind; só escuro; Open Sans; sem arquivo `_ds/nocturne`.
- **CA-02** `/login` reproduz §6.01 e a copy desta spec; submit vai a `/catalogo`.
- **CA-03** Shell §4.4 e §7 nas rotas autenticadas-de-mentira (todas menos login).
- **CA-04** `/catalogo` reproduz §6.02 com os seis cards e os três estados.
- **CA-05** `/catalogo/PAT-1042` reproduz §6.03; diálogo §5.9 com copy desta spec; confirmar navega a `/meus-emprestimos`.
- **CA-06** `/meus-emprestimos` reproduz §6.04 (lista + histórico + Pegar emprestado).
- **CA-07** `/operacoes/emprestimos` reproduz §6.05 (stats, chips, 7 linhas, paginação).
- **CA-08** `/operacoes/equipamentos/novo` reproduz §6.06; prévia acompanha o form.
- **CA-09** Rotas e fluxos desta spec; `data-screen-label` em cada tela; Devolver não persiste.
- **CA-10** Regras visíveis §9 / PRD: contador 2 de 3; prazo 14 dias no detalhe; atraso (Camila) desabilita Solicitar `opacity:.45` + nota; manutenção sem “Solicitar →”.
- **CA-11** Mock e copy desta spec; datas `dd/mmm`; sem e-mail, reserva ou importação na UI.
- **CA-12** Foco `outline:2px solid #5B7FE0; outline-offset:2px`; animações §8; `prefers-reduced-motion: reduce` corta transform/opacity.
- **CA-13** `ph-bell` visível e sem painel; nenhum texto prometendo notificação por e-mail.

## Verificação

Comparar cada rota a 1440px com `layout.md` §6. Playwright ou olho: as seis `data-screen-label` existem e os fluxos de âncora viraram as rotas acima.
