# Fonte e política de imagem

Documentação oficial pública de API arquivada em `.work/pixabay-api.txt` e lida nesta implementação: https://pixabay.com/api/docs/. Cache por 24h, consultas para humanos, sem coleta/download sistemático em massa, créditos na apresentação dos resultados e sem hotlink permanente. Três sugestões por item, página 1, `image_type=photo`, `safesearch=true`, mínimo 800×600. Não há retry automático. Cache guarda só ID, página, autor, perfil, URL para baixar e endpoint de origem, sem chave nem payload bruto.

Licença: https://pixabay.com/service/license-summary/. A consulta anterior retornou HTTP 403; **não alegar leitura integral ou validação jurídica concluída**. Humano deve ler resumo/termos completos antes de confirmar `licenseRead` em ambas as inspeções. A licença de conteúdo não elimina direitos de imagem, marcas ou outros direitos de terceiros. Não redistribuir como banco de stock independente. Foto é ilustração do tipo, não prova da unidade física real.

## Regras técnicas implementadas

- HTTPS, hosts exatos `pixabay.com`/`cdn.pixabay.com`; sem credenciais, porta explícita/customizada, query ou fragmento nas URLs de proveniência/fotos. Apenas a requisição API constrói query em memória; nunca a grava/exibe. URL autenticada não admite redirect.
- Até **3 redirects** para imagem, validando política em cada salto; URL externa, query ou credencial rejeitada. DNS IPv4 resolvido e validado antes da conexão, endereço público fixado no lookup TLS; IP privado/reservado bloqueado, hostname TLS preservado.
- **10 segundos** de sinal global por requisição (DNS/conexão/redirects/leitura), até **10 MiB** por imagem e **1 MiB** por API. Content-Length e bytes acumulados limitados no transporte real.
- Resposta API JSON; foto somente JPEG/PNG/WebP. Decodificação Sharp deve confirmar formato raster de um frame; SVG e arquivo corrompido rejeitados. Até 40 milhões de pixels.
- Orientação aplicada, cover central, JPEG 800×600, sem EXIF/ICC/IPTC/XMP; ID, hash original e final únicos por inventário.
- Arquivos finais basename exato, caminhos determinísticos sem traversal; symlink de arquivo rejeitado. Pasta local pertence ao humano, não deve ser compartilhada com processos que alterem conteúdo durante validação/upload.
- Manifest validado contra cache sanitizado, bytes originais, bytes finais, transformação reproduzível e revisão atual vinculada à preparação e hashes. Cache não é assinatura criptográfica da API: edição deliberada de todos os JSONs locais não é detectável como fraude remota. Revisão declara inspeção, não detecção automática de pessoas ou direitos.
- SafeSearch é filtro etário, não prova de ausência de pessoa/marca/texto/conteúdo de tela ou outros direitos. Aprovações nascem null e exigem preenchimento humano real.

Nenhuma imagem ou requisição real foi necessária nos testes. Fixtures sintéticas são temporárias, não saem dos testes nem abastecem catálogo.
