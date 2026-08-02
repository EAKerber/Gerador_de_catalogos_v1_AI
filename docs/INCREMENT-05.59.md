# Incremento 05.59 — enquadramento não destrutivo de artes

## Motivação

O primeiro ensaio real preservou os produtos, mas não isolou se os vazios e o
baixo aproveitamento da área útil vinham do asset, da autoria ou do editor. O
editor já possuía `contain`, `cover` e ponto focal, porém não oferecia zoom e
deslocamento por instância nem comandos claros para preencher e redefinir o
enquadramento.

As duas referências conhecidas continuam sendo evidências de desenvolvimento,
não templates, golden images ou fontes factuais.

## Escopo

- persistir `zoom` entre 100% e 400%;
- persistir `offsetX` e `offsetY` entre −100% e 100%;
- recortar visualmente pelo viewport existente do slot, sem alterar o arquivo;
- aplicar a mesma transformação a imagem raster e máscara SVG;
- usar a mesma regra no canvas e na impressão/PDF;
- oferecer **Preencher mantendo foco**, preservando `focalX/focalY` e
  normalizando zoom/deslocamento;
- oferecer **Redefinir enquadramento**, retornando a `contain`, foco central,
  zoom 100% e deslocamentos zero;
- preservar undo/redo, importação/exportação, duplicação e `art-gallery`;
- normalizar documentos anteriores com defaults neutros;
- projetar a capacidade no manifesto e no runtime do Authoring Kit.

## Compatibilidade

`CatalogDocument` permanece em `1.16.0`: as novas propriedades são opcionais
no schema e recebem defaults durante a normalização. O Authoring Kit permanece
em `1.7.1`; seu incremento e runtime avançam para 05.59 sem antecipar a revisão
editorial 1.7.2.

O asset continua sendo uma única entrada em `collections.assets`. Enquadrar
uma instância não cria derivado, não regrava bytes, não muda hash, dimensões,
proveniência ou aprovação.

## Critérios de aceite

1. Tela e impressão calculam a mesma transformação.
2. O viewport recorta a arte sem deformar nem modificar o arquivo-fonte.
3. Os dois comandos são uma única ação de histórico e podem ser desfeitos.
4. Exportação/importação preserva foco, zoom e deslocamento.
5. Cada filho de galeria mantém enquadramento independente.
6. Valores externos são normalizados nos limites documentados.
7. Schema, runtime, manifesto e inventário gerado permanecem equivalentes.
8. Node, build e Chromium ficam verdes.

## Fora do escopo

- ensaio causal das quatro condições (05.59B);
- Authoring Kit 1.7.2;
- editor de pixels, filtros ou recorte destrutivo;
- expansão generativa de fundo;
- cálculo automático de ocupação útil;
- renderizador headless autônomo.
