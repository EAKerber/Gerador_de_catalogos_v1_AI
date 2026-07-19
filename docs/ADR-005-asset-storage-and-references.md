# ADR-005 — Armazenamento binário e referências de assets

**Status:** aceita no Incremento 04.

## Contexto

O editor precisa importar e reutilizar imagens sem transformar o documento JSON em um pacote pesado e difícil de migrar. Base64 também multiplica bytes, prejudica diffs e mistura conteúdo declarativo com armazenamento.

## Decisão

- O documento é a fonte de verdade para metadados e vínculos, nunca para bytes.
- Cada componente `art` guarda somente `assetId` e propriedades de apresentação.
- A coleção `assets` usa `storagePolicy: "reference-only"` e registra `metadata` e `reference`.
- No ambiente local, `reference.provider` é `indexeddb` e `reference.key` aponta para o blob persistido por `CatalogAssetStorage`.
- A interface aceita SVG, PNG, JPG e WebP com até 25 MB por arquivo.
- Previews são Object URLs transitórias e não são serializadas.
- A troca de asset não altera frame, constraints, slot, ordem ou filhos do componente.
- O provedor `remote` permanece previsto para a fase de API sem mudar o contrato do componente.

## Consequências

O JSON continua pequeno, legível e transportável. O mesmo `assetId` pode ser usado por vários componentes sem duplicar o arquivo. Nesta fase, abrir o JSON em outro navegador não transfere os blobs locais; a interface sinaliza a referência ausente. A sincronização entre dispositivos depende do storage remoto futuro.

## Segurança e integridade

O MIME type e o tamanho são validados antes da gravação. A coleção rejeita chaves binárias e URLs `data:*;base64`. Se o registro de metadados falhar, o blob recém-gravado é removido para evitar órfãos.
