# Execução humana local

Pré-condições: Node 22, dependências fixadas já instaladas, `.local/` ignorado. Rodar na raiz do projeto. A chave `PIXABAY_API_KEY` é fornecida pelo humano em variável de ambiente de sessão, nunca argumento CLI/arquivo/versionamento. O programa não lê `.env`. Não publicar chave na conversa. `--human` + stdin/stdout TTY são proteção contra execução acidental, **não sandbox contra um agente malicioso**.

## 1. Descobrir um item e escolher um ID

```sh
./node_modules/.bin/tsx scripts/equipment-images-cli.ts discover TI-0001 --human
```

Busca somente o item indicado, até três fotos, sem paginação; cache sanitizado por 24h. Não rodar loops/coleta em massa. Abra `.local/images/suggestions-TI-0001.html`: contém texto, origem Pixabay, créditos e links, sem carregar imagens remotas. Abra manualmente a página da foto e leia a licença oficial/termos vinculados. SafeSearch não garante ausência de restrições. Escolha uma foto adequada ao item, sem pessoa, logos, texto nem telas com conteúdo.

```sh
./node_modules/.bin/tsx scripts/equipment-images-cli.ts select TI-0001 ID_REAL_ESCOLHIDO
```

Substitua `ID_REAL_ESCOLHIDO` por número retornado no cache atual. Este comando grava `.local/images/selection.json`, não aprova imagem. Não aceita URL avulsa/ID fora do cache; rejeita ID já selecionado para outro item.

## 2. Preparar somente a foto escolhida

```sh
./node_modules/.bin/tsx scripts/equipment-images-cli.ts prepare TI-0001 --human
```

Baixa apenas a URL do ID explicitamente selecionado em cache válido. Grava `original-TI-0001.jpg` (ou .png/.webp conforme MIME), `TI-0001.jpg` e `prepared.json`. Aplica orientação e recorte central cover 800×600 JPEG, removendo metadados. `gallery.html` mostra originais e recortes **locais**, com nomes/créditos escapados. Sem upload ou hotlink no app.

Repita os três comandos explicitamente, um patrimônio por vez, até TI-0012; não automatize downloads em massa. Se um cache expirar antes de preparar, redescubra e selecione entre as sugestões atuais.

## 3. Revisar todos os originais e recortes finais

```sh
./node_modules/.bin/tsx scripts/equipment-images-cli.ts review-template
```

Exige os doze arquivos corretos. Cria `.local/images/review.json` sem sobrescrever arquivo existente. Preenche hashes/IDs automaticamente, mas deixa nome/data vazios e declarações null. Abra a galeria e inspecione cada original e cada recorte. Preencha manualmente por entrada:

- `reviewer`: nome real do revisor; `reviewedAt`: data/hora ISO UTC, sem data futura.
- `originalInspection` e `finalCropInspection`: `noPeople`, `noLogos`, `noText`, `noScreenContent`, `equipmentMatch`, `licenseRead`: todos true somente após inspeção e leitura reais.
- Não altere `patrimonio`, `photoId`, `sha256`, `originalSha256`, `preparationSha256` para contornar rejeição.

Se qualquer declaração não for verdadeira, escolha outra foto. Se nova preparação mudar bytes/ID/proveniência, a revisão antiga é inválida; preserve-a com outro nome e gere/revise novo modelo. A vinculação por hash detecta mudança dos arquivos, mas JSON local não constitui assinatura digital nem prova automatizada de ausência de direitos.

```sh
./node_modules/.bin/tsx scripts/equipment-images-cli.ts finalize
./node_modules/.bin/tsx scripts/equipment-images-cli.ts verify
```

Finalização gera `.local/images/manifest.json` apenas após checks completos. Verify refaz os checks offline, sem rede ou chave. Erros não geram placeholder/aprovação; comandos exibem mensagem genérica sem dados sensíveis. Manifest antigo pode permanecer no disco após erro, mas sua validação falha se preparação/revisão/arquivos mudaram. Não usar arquivo existente como prova de prontidão.

## Contrato para o uploader humano do principal

```ts
import { validateManifestFiles, manifestToSeedImages, type ImageManifest } from "./equipment-images";
// raw: JSON.parse do manifest; directory: pasta .local/images absoluta.
const manifest: ImageManifest = await validateManifestFiles(raw, directory);
const images = manifestToSeedImages(manifest);
```

Envelope: `{version:1, preparationSha256, entries:[...]}`. Entradas: `patrimonio`, `nome`, `file:'TI-0001.jpg'`, `storagePath:'equipment/TI-0001.jpg'`, `source:'Pixabay'`, `photoId:number`, `pageUrl`, `photographer`, `photographerUrl`, `sourceEndpoint:'https://pixabay.com/api/'`, `downloadUrl` (URL retornada pela API), `licenseName:'Pixabay Content License'`, `licenseUrl:'https://pixabay.com/service/license-summary/'`, `originalFile`, `originalSha256`, `sha256`, `width:800`, `height:600`, `reviewer`, `reviewedAt`, `review` completo.

`downloadUrl` conserva a URL aprovada do cache que iniciou o download; redirects permitidos são validados, mas a URL final transitória não substitui proveniência. O termo original identifica os bytes baixados, não promete resolução nativa.

Mapper devolve exatamente `{patrimonio,imagePath,photoId:string,photoPage,photographer,photographerUrl,licenseName,licenseUrl,imageHash}`. Não usar nomes antigos `localFile`, `uploadPath`, `sourcePage`, `originalUrl`. Não enviar originais ao bucket de catálogo. Verificar imediatamente antes do envio e não modificar arquivos entre validação e leitura. Este módulo não contém cliente de produção/upload, não lê service_role e não grava seed-images.json. Integração remota é responsabilidade do uploader humano principal.

Sem credencial e inspeção humanas, não há fotos reais ou manifest final: isso é pendência, não motivo para fabricar dados. Aprovação do professor ao desvio Pixabay continua separada.
