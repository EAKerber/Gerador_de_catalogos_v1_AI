# Incremento 05.41 — Registro canônico de receitas

## Causa

Quatro contratos tardios substituíam `CatalogSectionRecipes` e
`CATALOG_SECTION_RECIPES` em sequência. As nove receitas finais eram obtidas
somente na ordem fixa do editor; reinstalação ou ordem inversa podia perder
registros ou falhar na composição da unidade comercial.

## Correção

- manter uma única API e um único registro durante toda a inicialização;
- registrar receitas por uma operação canônica com conflito explícito;
- derivar a versão pública da maior versão registrada;
- preservar ordem determinística e clones independentes;
- permitir que a unidade comercial use a definição declarativa do bloco de
  preço antes de sua instalação;
- reduzir os quatro contratos tardios a definição, transformação, estilos e
  chamada de registro.

## Invariantes

- exatamente nove receitas, nas mesmas versões e ordem pública;
- schema `1.16.0`, 16 tipos e 45 capacidades;
- nenhuma nova capacidade promocional ou alteração visual;
- primeira referência como critério canônico da V1 e segunda referência apenas
  como benchmark pós-V1.

## Gates

- identidade estável da API e do registro;
- instalação, reinstalação e três ordens distintas;
- contratos históricos de fact, callout, preço, unidade comercial e pacote;
- suíte Node completa, build idempotente e quatro shards Chromium na CI.
