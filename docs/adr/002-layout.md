  superfícies. Sombras são limitadas às três escalas definidas no layout.

### Tipografia e conteúdo

- A família tipográfica é Open Sans, nos pesos 400, 500 e 600.
- Títulos usam peso 600; peso 700 não será usado em títulos.
- A interface usa português do Brasil e tom seco, operacional e conciso.
- Datas seguem o formato `dd/mmm`.
- Não serão usados emoji como ícone ou decoração.

### Estrutura de tela

- As telas internas usam sidebar fixa de 236px e header de 64px.
- O conteúdo é alinhado à esquerda, com densidade alta e padding horizontal
  aproximado de 28px.
- Grupos de elementos usam `flex` ou `grid` com `gap`; espaçamento por
  margem individual ou whitespace não é permitido.
- Os seis pontos de entrada visuais são Login, Catálogo, Detalhe do item,
  Meus empréstimos, Operações e Cadastro de equipamento.
- Cada tela informa sua identidade por meio de `data-screen-label`.

### Componentes e ícones

- Botões primários são contornados e transparentes; confirmações podem usar o
  fundo translúcido previsto na especificação.
- Inputs, cards, tabelas, pills, diálogos, chips e indicadores de limite usam
  os raios, alturas e tokens definidos em `layout.md`.
- Ícones vêm de Phosphor Icons. O peso regular é padrão; o peso fill é
  reservado ao item ativo da sidebar.
- Links usam `#8AA6EE` e hover em `#B4C6F6`.

### Acessibilidade e movimento

- O foco de teclado usa `outline: 2px solid #5B7FE0` com offset de 2px.
- Controles desabilitados usam opacidade reduzida, sem remover a indicação
  de estado.
- Transições são funcionais, discretas e limitadas a 240ms.
- `prefers-reduced-motion: reduce` desativa transformações e fades.

### Regras visíveis do produto

O layout deve tornar explícitas as seguintes regras da v1:

1. Cada pessoa pode ter no máximo 3 itens.
2. O prazo padrão é de 14 dias.
3. Um atraso bloqueia novo empréstimo.
4. Equipamento em manutenção não aparece como disponível.
5. Reserva futura, notificação por e-mail e importação de planilha ficam fora
   do escopo.

## Consequências

### Positivas

- Todas as telas compartilham a mesma linguagem visual e os mesmos tokens.
- O estado operacional dos equipamentos fica legível sem depender apenas de
  texto.
- A interface fica previsível para colaboradores e para Operações.
- A implementação pode ser validada contra dimensões, componentes e estados
  definidos no layout de referência.

### Negativas

- O produto não poderá oferecer modo claro sem uma nova decisão de design.
- A paleta escura exige atenção contínua a contraste e legibilidade.
- Restringir estilos e componentes ao layout aumenta o custo de qualquer
  mudança visual ampla.
- A densidade e o uso de seis telas de referência podem exigir ajustes para
  telas menores, mantendo os mesmos tokens e hierarquia.

## Alternativas consideradas

### Tema claro e tema escuro

Rejeitada para a v1. A especificação define somente modo escuro e não há
necessidade de manter dois conjuntos de tokens neste momento.

### Botões preenchidos com a cor primária

Rejeitada. `#001449` tem pouco contraste como ação em fundos escuros; a ação
visível deve usar a rampa clara, especialmente `#5B7FE0`.

### Design livre por tela

Rejeitada. Criaria inconsistência de espaçamento, estados e hierarquia entre
Catálogo, empréstimos e Operações.

### Gradientes e animações decorativas

Rejeitada. O produto é operacional; gradientes ficam limitados a três áreas e
movimento só aparece como feedback funcional.

### Biblioteca de ícones diferente

Rejeitada. Phosphor Icons já fornece os pesos e os símbolos necessários para a
navegação e os tipos de equipamento.

## Referência

`layout.md` é a especificação normativa de tokens, medidas, componentes,
conteúdo visual e exemplos de tela. Em caso de detalhe não coberto por esta
ADR, consultar o `layout.md`; em caso de conflito, uma nova ADR deve registrar
a decisão que substituirá esta.