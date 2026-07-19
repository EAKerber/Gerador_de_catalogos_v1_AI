# Incremento 04 — Biblioteca de artes

## Objetivo

Transformar o contrato preparatório de `assetId` em um fluxo completo de importação, persistência local, seleção, reutilização e apresentação de artes, sem acoplar binários ao documento.

## Entregue

- modal que lista primeiro as artes do projeto;
- upload pelo seletor do sistema e drag and drop;
- SVG, PNG, JPG e WebP, até 25 MB;
- extração de MIME type, tamanho e dimensões;
- blobs persistidos em IndexedDB;
- referências por `assetId`, com reuso entre componentes;
- arte com funções `generic`, `logo`, `product` e `technical`;
- ajustes `contain`, `cover` e tamanho original;
- ponto focal horizontal e vertical de 0% a 100%;
- texto alternativo;
- SVG com cores originais ou recoloração por `vectorColor`;
- placeholder substituível sem mudar layout, slot ou frame;
- estado explícito para referência cujo blob não existe no navegador;
- schema 1.4.0, migração, testes e documentação.

## Fluxo de dados

1. A interface valida o arquivo e mede a imagem.
2. `CatalogAssetStorage` grava o blob no IndexedDB.
3. O store registra metadados e referência na coleção `assets`.
4. `setComponentAsset` grava o ID no componente `art`.
5. O renderer projeta atributos `data-asset-*`.
6. A biblioteca resolve o blob, cria uma Object URL e hidrata o preview.

Se a etapa 3 falhar, a etapa 2 é revertida. Nenhuma etapa serializa base64.

## Migração

Documentos de 1.0.0 a 1.3.0 são normalizados para 1.4.0. Artes antigas recebem `assetId: null`, `alt: ""`, foco central e `vectorMode: "original"`. Conteúdo, IDs existentes, frames, constraints, estilos, slots e subárvores são preservados.

## Fora do escopo

- remoção definitiva de assets com análise de dependências;
- sincronização de blobs entre navegadores;
- inventário e bindings de produto;
- tabelas com múltiplas linhas e legendas vinculadas;
- duplicação direcional ou distribuição de cópias;
- backend, storage remoto e exportação dedicada.
