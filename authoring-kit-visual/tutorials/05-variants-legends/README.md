# 05 — Variações e legendas vinculadas

Quando usar: imagens, cores/modelos e linhas comerciais representam a mesma
variante.

1. Dê ID à variante.
2. Vincule a linha por `commercialRows[].variantId` e a variante por
   `variants[].commercialRowIds`.
3. Use uma arte por variante com legenda individual.
4. Use `legendKey` para classificações compartilhadas; nunca inferência por
   posição ou somente cor.
5. Materialize `legend-panel` apenas quando a classificação precisa aparecer na
   página.

Legenda de imagem descreve uma projeção específica. `legend-item` resolve uma
classificação semântica compartilhada; não são substitutos automáticos.
