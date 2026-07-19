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
- `batchGeometry` e `batchFrameMap` integram o manifesto e o `CatalogAuthoringKit 1.5.9`.

## Entregue no checkpoint 2

- galeria selecionada aceita colagem de até 24 linhas no formato `legenda ⇥ assetId opcional`;
- **Sincronizar coleção** preserva os átomos existentes por índice, cria os ausentes e remove excedentes; **Adicionar ao final** não substitui itens;
- legendas cromáticas aceitam até 40 linhas no formato `nome ⇥ token ⇥ grupo`;
- o lote pode materializar painel, subgrupos e itens visuais reutilizando as entidades canônicas;
- cada aplicação gera uma única entrada de histórico e restaura foco/contexto após materialização;
- multisseleção informa colisões e extrapolações que envolvem os itens selecionados;
- `bulkCollectionEditing` e `selectionGeometryDiagnostics` passam a integrar o kit.

## Entregue no checkpoint 3

- **Editar cada caixa** apresenta uma grade `ID, X, Y, largura, altura` predefinida pela multisseleção;
- caixas diferentes são confirmadas em uma única transação, sem reflow intermediário entre campos;
- o comando exige exatamente os irmãos selecionados e mantém uma única entrada de histórico;
- cards compactos sem especificações recalculam o mínimo usando galeria e tabela, permitindo que o conteúdo remanescente ocupe o espaço vago;
- a reconstrução integral caiu de 223 para **157 ações** (−29,6%), com **zero colisão e zero overflow**;
- o kit passa a `1.5.9` e declara `batchFrameMap`.

## Limites e próximo recorte

O diagnóstico descreve o estado atual; preview anterior ao commit, reserva de regiões e constraints relacionais persistentes não foram introduzidos. Importação binária em lote também permanece fora do recorte: a segunda coluna só referencia assets já cadastrados. A evidência comparável está em `docs/evidence/05.17` e `REFERENCE-RECONSTRUCTION-USABILITY-AUDIT-05.17.md`.

O bloqueio Chromium foi diagnosticado depois do checkpoint: três candidatos eram arquivos vazios e o único executável tinha 7,8 MB, embora o cabeçalho ELF apontasse para seções próximas de 200 MB. O `SIGSEGV` ocorria no binário truncado, antes do Playwright e do editor. Uma distribuição íntegra de 191 MB, com cache de fontes em diretório temporário gravável, abriu o editor e validou geometria em lote, seleção/autoridade local, inserção contextual, continuidade de tarefa, fidelidade de impressão e chrome responsivo. Os testes de autoridade e continuidade também foram corrigidos para abrir explicitamente as superfícies que exercitam.

`CatalogDocument` permanece em `1.16.0`; nenhum novo campo persistido foi criado.
