# Incremento 05.38 — Renderer canônico da biblioteca por intenção

## Objetivo

Remover a última substituição tardia evidente de método na superfície de
descoberta de componentes, preservando integralmente a biblioteca organizada
por intenção.

## Escopo

- `CatalogEditorRenderer.renderPalette` passa a chamar explicitamente a projeção
  declarativa da biblioteca depois de produzir a estrutura-base;
- `CatalogComponentPaletteIntentContract` continua responsável por plano,
  agrupamento, busca, navegação e estilos;
- a instalação do contrato apenas valida a integração e garante a folha de
  estilos, sem substituir o método do renderer;
- instalação e reinstalação preservam a identidade de `renderPalette`;
- busca, atalho `/`, grupos primários, caminho avançado e filtragem pelo
  contexto permanecem inalterados.
- a publicação pelo conector confirma escritas por readback independente,
  prossegue sem repetição cega diante de acknowledgement insuficiente e bloqueia
  identidade remota divergente ou não verificável.

## Fora do escopo

- novos tipos, capacidades ou grupos semânticos;
- inferência probabilística ou IA na contextualização;
- alterações de schema, documento, geometria ou impressão;
- expansão da peça promocional de referência.

## Gates

- contrato Node de identidade e idempotência do renderer;
- contrato Node da confirmação de escrita por acknowledgement + readback;
- plano puro existente dos 16 tipos;
- regressão Chromium da biblioteca por intenção;
- suíte Node completa e quatro shards Chromium;
- build idempotente do Authoring Kit.
