# 03 — Modo editorial versus arranjo

Quando usar: arte e informações precisam mudar de hierarquia ou posição.

1. Escolha o modo pelo papel editorial: `hero`, `standard`, `technical`,
   `variants` ou `data-only`.
2. Escolha a geometria separadamente em
   `presentation.overrides.arrangement`: `auto`, `horizontal` ou `stacked`.
3. Use `stacked` para arte acima e especificações abaixo sem fingir que o card é
   de variantes.
4. Valide mínimos, clipping e densidade interna.

Veja `../../cookbook/product-arrangements.svg`. Erro comum: selecionar
`variants` apenas para empilhar a arte.
