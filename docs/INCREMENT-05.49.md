# Incremento 05.49 — apresentação encontrável e arranjo independente

## Problema confirmado

Os cinco modos de `product-card` existiam no domínio e na interface, mas o
controle ficava oculto atrás da seleção da raiz, da aba **Conteúdo** e do bloco
de vínculo. Além disso, `variants` era usado como atalho geométrico para obter
arte acima e especificações abaixo. Isso acoplava intenção editorial e
orientação estrutural e fazia uma capacidade pública se comportar como interna.

## Decisão

O incremento preserva `CatalogDocument 1.16.0` e não cria um sexto modo.

- `presentation.mode` continua declarando prioridade editorial:
  `standard`, `hero`, `technical`, `variants` ou `data-only`;
- `presentation.overrides.arrangement` declara orientação:
  `auto`, `horizontal` ou `stacked`;
- `auto` preserva o comportamento anterior: cards compactos e `variants`
  empilham; os demais cards amplos usam lado a lado;
- `stacked` materializa arte acima e especificações abaixo em qualquer modo;
- `horizontal` materializa arte e especificações lado a lado em qualquer modo.

O campo usa o objeto de overrides já previsto no schema. Documentos anteriores
são normalizados para `auto`, e consumidores 1.16.0 continuam recebendo uma
estrutura válida.

## Superfície de edição

**Apresentação do card** passou a ser a primeira seção da aba **Conteúdo**.
Cards novos abrem nessa aba. Quando uma peça interna é selecionada, a mesma
seção resolve e altera o card pai sem trocar a seleção de trabalho.

Arranjo e modo ficam sempre visíveis. Preset, densidade e estado responsivo
permanecem disponíveis em **Ajustes complementares**, evitando misturar a
decisão principal com detalhes de refinamento.

## Compatibilidade e contratos

- mudanças de modo e arranjo preservam a subárvore e seus IDs;
- patches de apresentação fazem merge dos overrides em vez de apagar chaves
  não relacionadas;
- seleção múltipla aceita o mesmo arranjo em uma transação;
- undo/redo, importação, exportação e templates preservam o override;
- o manifesto publica `presentations.arrangements`;
- o Authoring Kit orienta explicitamente a não escolher `variants` apenas para
  obter geometria vertical.

## Fora do recorte

Este incremento não altera `specification`, cabeçalhos de tabela, assets,
receitas, paginação, colaboração, touch ou plataforma online. Esses itens
permanecem na fila própria da revisão prática.
