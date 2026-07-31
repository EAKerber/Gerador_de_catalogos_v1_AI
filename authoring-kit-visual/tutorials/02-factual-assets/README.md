# 02 — Imagem factual sem deformação

Quando usar: produto, logo ou desenho técnico fornecido.

1. Clique no placeholder e escolha primeiro a biblioteca; importe do computador
   apenas quando o asset ainda não existir.
2. Defina `art.props.fit = "contain"`.
3. Se faltar respiro, crie outro arquivo adicionando somente pixels brancos ou
   transparentes ao redor do original.
4. Registre `method = "neutral-canvas-padding"`, `sourceAssetIds`, novo tamanho
   e SHA-256.
5. Mantenha `review-required` até revisão explícita.

Não recorte, estique, complete, recolora nem regenere um produto factual. Veja
`../../cookbook/factual-image-fit.svg`.
