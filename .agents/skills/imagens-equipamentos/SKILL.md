---
name: imagens-equipamentos
description: Pipeline local Pixabay para doze fotos únicas de equipamentos, com seleção explícita, revisão humana vinculada a hashes e sem upload automático.
---

# Imagens de equipamentos — spec 002

Leia AGENTS, rules, ADRs e spec 002. Inventário transcrito literalmente do JSON de `references/pratica-sdd.html` para `assets/equipment-list.json`, incluindo nomes, acentos, buscas, situações e patrimônios **TI-0001 a TI-0012**. Não usar formato sem hífen. Referência visual: `references/index.html`.

**Pixabay é desvio explicitamente solicitado pelo usuário em relação ao Pexels original; aprovação acadêmica do professor ainda pendente.** Não declarar conformidade com exigência exclusiva Pexels. Não usar outras fontes/fallbacks, scraping, placeholders ou fotos inventadas.

O agente implementa e testa offline. **Não lê `.env`/chaves, não busca nem baixa fotos reais e não envia arquivos remotamente.** O humano executa os comandos de rede com `--human` em terminal TTY e chave `PIXABAY_API_KEY` somente no ambiente de sessão. Não usar dotenv, gravar chave, passá-la em argumentos, compartilhar comandos com valor ou configurar chave na Vercel. Nenhuma chave de produção é necessária nesta skill.

## Código e artefatos

- `scripts/equipment-images.ts`: cache sanitizado 24h, seleção, download escolhido, Sharp 0.35.5, revisão, manifest e validação offline.
- `scripts/equipment-images-cli.ts`: interface humana descrita em `references/pipeline.md`.
- `.local/images/`: originais privados, JPEG final **TI-0001.jpg**, galeria local, cache, seleção, preparação, revisão e manifest. Não versionar essa pasta nem usar `public/`.
- Storage futuro: **equipment/TI-0001.jpg**, igual ao `imagePath` do mapper. Nenhum formato alternativo.
- `validateManifestFiles(value, dir?)` valida schema, lista ordenada, hashes/IDs únicos, arquivos reais, recorte derivado do original, dimensões/metadados, proveniência em cache e revisão atual; retorna `Promise<ImageManifest>`.
- `manifestToSeedImages(manifest)` produz o contrato exato SeedImage, sem importar Prisma nem acessar produção. O uploader deve chamar a validação assíncrona imediatamente antes de ler/enviar arquivos.

Não preencher aprovações pelo humano. SafeSearch **não** garante ausência de pessoas, marcas/logos, texto, telas com conteúdo ou direitos de terceiros. A inspeção do original **e do recorte final** exige nome/data e todas as declarações true; null/false não aprova. Não prometer que foto de stock representa a unidade física real.

## Checks

```sh
./node_modules/.bin/vitest run --config scripts/images-vitest.config.ts
./node_modules/.bin/tsc --noEmit --incremental false
./node_modules/.bin/eslint scripts/equipment-images.ts scripts/equipment-images-cli.ts scripts/images-vitest.config.ts scripts/__tests__/images.test.ts
```

Usar Node 22 (nesta máquina há runtime `.work/runtime/node_modules/.bin/node`; pode-se prefixar PATH). Fixtures sintéticas somente em diretórios temporários dos testes, nunca catálogo. Nenhuma dependência instalada pela skill. Fotos reais, revisão, upload, seed remoto e aprovação do professor permanecem pendências humanas até evidência concreta.
