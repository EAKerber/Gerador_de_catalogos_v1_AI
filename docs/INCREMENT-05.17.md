# Incremento 05.17 — Geometria orientada por intenção

## Ajuste de direção canonizado

A precisão geométrica permanece uma capacidade de primeira classe. O problema medido no 05.16 não é a presença de valores exatos, mas a dependência de correções numéricas isoladas, repetidas componente por componente.

A superfície geométrica passa a ser entendida em três níveis complementares:

1. **direta** — arraste, resize, nudge, snap, guias e distâncias;
2. **relacional** — alinhamento, distribuição, equalização, espaçamento e relações sobre conjuntos;
3. **numérica** — X, Y, largura, altura e deltas aplicáveis a um ou vários elementos.

Intenção editorial, coesão estrutural e assistência estética orientam a evolução, mas não substituem a decisão do usuário. Constraints relacionais persistentes continuam sendo uma possível mudança arquitetural futura, não um requisito deste checkpoint.

## Entregue no checkpoint 1

- seleção simples pela árvore atualiza contexto e foco atomicamente em uma emissão;
- alternância entre irmãos preserva o contexto correto;
- inspetor de multisseleção consolida alinhamento, distribuição e espaçamento sob **Geometria do conjunto**;
- igualar largura ou altura usa o item primário como referência;
- X, Y, largura ou altura exatos podem ser aplicados à seleção;
- delta X/Y move o conjunto numa única transação;
- operações liberam overrides gerenciados de forma explícita, respeitam clamps/mínimos existentes e são desfeitas como um comando;
- `batchGeometry` integra o manifesto e o `CatalogAuthoringKit 1.5.8`.

## Entregue no checkpoint 2

- galeria selecionada aceita colagem de até 24 linhas no formato `legenda ⇥ assetId opcional`;
- **Sincronizar coleção** preserva os átomos existentes por índice, cria os ausentes e remove excedentes; **Adicionar ao final** não substitui itens;
- legendas cromáticas aceitam até 40 linhas no formato `nome ⇥ token ⇥ grupo`;
- o lote pode materializar painel, subgrupos e itens visuais reutilizando as entidades canônicas;
- cada aplicação gera uma única entrada de histórico e restaura foco/contexto após materialização;
- multisseleção informa colisões e extrapolações que envolvem os itens selecionados;
- `bulkCollectionEditing` e `selectionGeometryDiagnostics` passam a integrar o kit.

## Limites e próximo recorte

O diagnóstico descreve o estado atual; preview anterior ao commit, reserva de regiões e constraints relacionais persistentes não foram introduzidos. Importação binária em lote também permanece fora do recorte: a segunda coluna só referencia assets já cadastrados. O próximo checkpoint mensurável é o benchmark integral em Chromium.

O teste Chromium foi adicionado, mas o binário disponível nesta sessão encerrou com `SIGSEGV` antes de abrir a página. Testes de domínio cobrem transação, equalização, valores exatos, deltas, mínimos e seleção atômica; o teste real permanece executável quando o runtime estiver saudável.

`CatalogDocument` permanece em `1.16.0`; nenhum novo campo persistido foi criado.
