# Incremento 05.52 — Fixture do ensaio real

## Objetivo

Preservar o primeiro ensaio real do fluxo `Authoring Kit → agente externo →
pacote → importação → revisão` como evidência reexecutável e comparável, sem
reconstruir artefatos nem misturar falhas de autoria, descoberta, compilação,
editor ou asset.

## Evidência

`docs/evidence/05.52/practical-flow-2026-07-30` contém:

- o `authoring-kit.zip` efetivamente entregue ao agente;
- os dois orçamentos MarketUP fornecidos, para uma e quinze unidades;
- as instruções e os dois ciclos de feedback relevantes;
- pacote, PDF, preview e alvo autoral da saída inicial;
- os mesmos quatro artefatos após a revisão;
- `fixture.json`, com tamanho, SHA-256, estágio, papel e propriedade de cada
  achado.

As URLs oficiais e a proveniência factual das três corrediças permanecem
dentro dos manifestos dos pacotes. A fixture não precisa de rede para ser
inspecionada ou reimportada.

## Contrato

`tests/practical-flow-fixture-05.52.test.js` bloqueia:

- artefato ausente, vazio ou alterado;
- pacote com arquivo interno ausente, tamanho ou hash divergente;
- perda de `CatalogDocument 1.16.0`, dos três produtos ou dos quatro assets;
- pacote que o importador real deixe de aceitar;
- regressão da revisão observada: preço unitário, rótulo de 15 unidades,
  remoção visual da coluna de unidade, `slot.span = 2` no primeiro item do
  rodapé, escala tipográfica de 80% e decisão explícita sobre legendas.

## Limites

- O caso preserva a conversa necessária, não uma transcrição integral do
  agente.
- Os alvos autorais são evidência de intenção, não golden images.
- A fixture não declara o resultado revisado como aprovado; ela preserva o
  feedback que originou os incrementos 05.48, 05.49, 05.51 e os itens ainda
  pendentes.
- Runtime, schema, Authoring Kit atual e editor não são alterados neste recorte.
