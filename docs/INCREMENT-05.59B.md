# Incremento 05.59B — ensaio causal de enquadramento factual

## Motivação

O ensaio prático 05.52 mostrou baixa ocupação útil e descontinuidade de fundo,
mas não separou falha de asset, derivação externa, autoria ou editor. O 05.59
entregou enquadramento não destrutivo por instância; este incremento mede a
camada responsável antes de alterar o Authoring Kit.

As referências conhecidas continuam sendo evidências de desenvolvimento, não
templates, golden images ou fontes factuais.

## Desenho controlado

As quatro condições usam o mesmo átomo `art`, o mesmo `product-card`, o mesmo
slot e o mesmo frame de 351×204. Os irmãos do card foram removidos somente no
harness para impedir que o arranjo do card legado alterasse o viewport entre
condições. O viewport interno observado é 349×202 em tela e 350×202 em
impressão; a diferença de um pixel vem do arredondamento da mídia impressa.

Fonte factual:

- asset oficial `corredica-invisivel-soft-extra.png`, 680×503;
- SHA-256 `d62a535b54ecbb813c63b640c29f81e622b41a704d2eb2e24711fe0407ad184d`;
- proveniência e bytes preservados a partir da fixture 05.52.

Condições:

1. original em `contain`;
2. original com canvas branco expandido, sem reamostrar o produto;
3. margem neutra recortada externamente, sem pixels inventados;
4. original em `cover`, **Preencher mantendo foco** e zoom 107% no editor.

O protocolo reproduzível, comandos de derivação, hashes e dimensões estão em
`docs/evidence/05.59B/art-framing-causal/protocol.json`.

## Resultado medido

| Condição | Ocupação útil | Ganho | Fundo neutro | Corte factual |
| --- | ---: | ---: | ---: | --- |
| Original | 16,37% | 1,00× | 58,79% | não |
| Canvas neutro expandido | 16,33% | 1,00× | 80,01% | não |
| Recorte externo | 30,73% | 1,88× | 62,68% | não |
| Enquadramento no editor | 30,52% | 1,86× | 63,23% | não |

O editor ficou 0,68% abaixo do recorte externo na métrica-gate, muito dentro
do limite relativo de 15%. Tela e impressão variaram no máximo 0,24 ponto
percentual nas razões medidas. Original e condição do editor mantiveram a
mesma identidade, hash, bytes e proveniência.

O comparativo visual, relatório JSON, capturas de tela/impressão e quatro PDFs
estão preservados em
`docs/evidence/05.59B/art-framing-causal/results/`.

## Atribuição causal

- expandir somente o canvas melhora a continuidade do fundo, sem aumentar a
  ocupação factual;
- recortar margens neutras externamente aumenta materialmente a ocupação;
- os controles 05.59 produzem ganho equivalente sem criar derivado nem alterar
  o asset;
- para este caso, a falha anterior era predominantemente de autoria e
  descoberta do kit, não insuficiência atual do editor.

A conclusão é limitada à camada de enquadramento da arte. O harness isolou o
slot deliberadamente e não afirma que a composição completa do card esteja
validada por este ensaio.

## Compatibilidade e próximo gate

O incremento não altera runtime, schema, catálogo de componentes ou
Authoring Kit. Permanecem `CatalogDocument 1.16.0`, 51 capacidades e Authoring
Kit `1.7.1`.

A evidência libera a revisão editorial `1.7.2` para tornar salientes:

- recorte de margem neutra antes de expandir canvas;
- metas de ocupação como orientação contextual, não norma universal;
- derivados específicos por uso, com origem e método;
- uso do enquadramento do editor antes de recorrer a edição externa;
- proibição de preview paralelo como substituto do documento importado.

Somente depois dessa revisão deve ocorrer o ensaio em início frio com terceira
referência inédita.

## Gates

- Node: 114/114;
- build, schema e arquivos gerados: aprovados;
- Chromium: 4/4 shards;
- CI oficial: `Catalog Integration #157`;
- PR de integração: `#46`.

