# ADR-023 — Variantes semânticas e legendas visuais vinculadas

## Status

Aceita e entregue no Incremento 05.10.

## Problema

“Linha” descreve uma linha comercial de tabela, enquanto “variação” descreve uma alternativa real do produto que pode possuir imagem, legenda e valores próprios. Tratar variação como uma segunda linha visual produziria vínculos frágeis entre galeria, tabela e legenda. A referência também usa uma legenda de embalagens dividida em grupos, cuja cor precisa permanecer coerente com células vinculadas.

## Vocabulário canônico

| Conceito | Responsabilidade |
| --- | --- |
| `product.variant` | identidade semântica da variação; pode referenciar asset, atributos e uma ou mais linhas comerciais |
| `table-row` | registro comercial vinculado a produto ou `variantId`; não é componente visual independente |
| legenda de imagem | texto local de um átomo `art`, opcionalmente derivado da variação vinculada |
| `legend-definition` | chave estável, rótulo, token de cor, fallback textual e grupo |
| `legend-panel` | componente visual que materializa definições de legenda |
| `legend-group` | subgrupo destacável e ordenável dentro do painel |
| `legend-item` | item visual vinculado por `legendKey`, nunca pela cor literal |

## Fluxo pretendido

1. **Adicionar variação** cria uma entidade semântica e, por padrão, materializa uma imagem legendável e uma linha comercial vinculadas pelo mesmo `variantId`.
2. O usuário pode desativar a materialização automática antes de confirmar ou remover uma representação depois sem apagar a entidade.
3. **Adicionar legenda** cria ou reutiliza uma `legend-definition` e, por default configurável, materializa um `legend-item` no painel de legenda compatível.
4. Vincular uma célula guarda `legendKey`; mudar o token na definição atualiza célula e item visual.
5. Grupos de legenda podem ser destacados, recolhidos e reordenados sem alterar as chaves semânticas.
6. Se a automação não souber rótulo ou vínculo, cria placeholder explícito e bloqueia publicação factual; não inventa significado.

## Modelo proposto

- evoluir `CatalogSource.products[].variants[]` com `id`, `label`, `assetIds`, `attributes` e `commercialRowIds`;
- generalizar a coleção atual de legendas para definições agrupáveis, preservando migração das chaves cromáticas do 05.4;
- introduzir componentes `legend-panel`, `legend-group` e `legend-item` como uma árvore editável;
- manter linhas dentro das coleções genéricas existentes e referenciá-las por ID;
- expor ações contextuais por capacidade declarada, evitando condicionais espalhadas pela interface.

## Decisões de materialização

- uma linha comercial pertence a no máximo uma variante; uma variante pode referenciar várias linhas;
- o rótulo da arte acompanha a variante, enquanto sua legenda é uma cópia editorial local e pode divergir;
- remover uma representação não apaga a entidade semântica; remover explicitamente a variante remove suas representações por default;
- a materialização usa o painel selecionado/contextual, depois o primeiro compatível e, por fim, cria um painel;
- contraste quase indistinguível do papel gera aviso; token e referência ausentes bloqueiam publicação;
- quando os mínimos técnicos esgotam a página compilada, a definição permanece semântica e o painel é adiado com decisão explícita no relatório.
