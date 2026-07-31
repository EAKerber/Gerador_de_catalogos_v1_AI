# 06 — Rodapé com ocupação ponderada

Quando usar: um item precisa de mais largura sem carregar conteúdo de dois
itens.

1. Selecione o primeiro `footer-item` no slot `items`.
2. Defina `slot.span = 2`.
3. Mantenha `slot.span = 1` nos demais itens.
4. Ajuste os átomos `text` internos para `props.scale = 80` quando a hierarquia
   deve ser mais discreta.
5. Confirme que a soma dos spans não excede a capacidade do rodapé.

Não duplique a informação do item seguinte. `layoutItem.span` pertence a pais
com auto-layout em grade e não substitui `slot.span`.
