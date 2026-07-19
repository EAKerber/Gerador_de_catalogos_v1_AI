# Matriz de fidelidade canvas x PDF

| Região | Fonte visual | Regra de impressão | Resultado 05.0 |
| --- | --- | --- | --- |
| Divisor vertical do cabeçalho | átomo `separator` vertical | `0.6 mm`, cor exata | equivalente |
| Linha horizontal do cabeçalho | átomo `separator` horizontal | `0.6 mm`, cor exata | equivalente |
| Marcador final | `outline` do separador | círculo `2.2 mm`, traço `0.45 mm` | equivalente |
| Bordas da tabela | token de borda | `0.25 mm` | estável |
| Divisores do rodapé | token de borda | `0.25 mm` | estável |
| Grid e controles | estado do editor | ocultos em `@media print` | ausentes |
| Página | A4 lógica `794 x 1123 px` | A4 física `210 x 297 mm` | uma página |
| Área de composição | envelope exclusivo do editor | fundo, borda e auxiliares transparentes | ausente; filhos preservados |
| Galeria multiarte | envelope de `art-gallery` | fundo, borda e rótulo transparentes | ausente; imagens e legendas preservadas |
| Seleção e hierarquia | outlines/box-shadows do editor | neutralizados em toda a subárvore | ausentes |
