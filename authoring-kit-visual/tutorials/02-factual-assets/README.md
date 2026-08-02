# 02 — Imagem factual sem deformação

Quando usar: produto, logo ou desenho técnico fornecido.

1. Clique no placeholder e escolha primeiro a biblioteca; importe do computador
   apenas quando o asset ainda não existir.
2. Comece por `fit`, foco, zoom e deslocamento na instância. Isso não cria outro
   asset nem altera seu hash.
3. Defina uma expectativa de ocupação para aquele papel e proporção de slot;
   compare antes/depois no mesmo viewport, sem percentual universal.
4. Se margens neutras incorporadas ainda limitarem o produto, crie um derivado
   com `method = "neutral-margin-crop"`, sem cortar pixels factuais.
5. Somente depois, se houver descontinuidade de fundo, expanda pixels brancos,
   transparentes ou uniformes com `method = "neutral-background-expansion"`.
6. Preserve o original e registre por uso `sourceAssetIds`, papel editorial,
   novo tamanho, SHA-256, fidelidade e aprovação.
7. Confirme proporção, ausência de corte e paridade entre tela e impressão no
   documento importado; mantenha `review-required` até revisão explícita.

Não estique, complete, regenere nem recolora um produto factual sem variante
confirmada. Expansão de fundo melhora continuidade, não ocupação. Veja
`../../cookbook/factual-image-fit.svg`.
