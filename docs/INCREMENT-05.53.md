# Incremento 05.53 — cabeçalhos de tabela

## Objetivo

Tornar o cabeçalho de `data-table` diretamente editável pela aba **Conteúdo**
sem confundir apresentação com binding semântico.

## Contrato

- `key` continua sendo a identidade estável da coluna e das células;
- `label` altera somente o texto exibido;
- a ordem do array `props.columns` define a projeção visual;
- `visible: false` oculta cabeçalho e células no editor e no PDF, mas preserva
  valores e legendas para reativação;
- ao menos uma coluna permanece visível;
- documentos sem `visible` são normalizados como `true`;
- `CatalogDocument 1.16.0` e `CatalogSource 1.1.0` permanecem compatíveis.

## Superfície

Selecionar uma tabela abre **Conteúdo → Configurar colunas**. Cada coluna
oferece rótulo, função, alinhamento, visibilidade e movimento para
esquerda/direita. Remover continua sendo uma operação distinta e destrutiva.

## Gates

- contrato Node para chaves, células, visibilidade, ordem, undo e round-trip;
- contrato Chromium para a superfície real a 1366×768 e projeção do renderer;
- schemas, Authoring Kit e build idempotente;
- regressão integral Node e quatro shards Chromium.
