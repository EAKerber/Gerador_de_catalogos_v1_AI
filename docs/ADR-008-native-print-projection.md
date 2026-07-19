# ADR-008 - PDF por projeção de impressão nativa

## Contexto

O editor já representa uma página A4 lógica e possui CSS de impressão. Gerar uma imagem ou um segundo DOM para produzir um PDF criaria divergência em relação ao JSON e reduziria qualidade de texto e SVG.

## Decisão

Expor uma ação **Imprimir / PDF** que chama `window.print()` e usa `@page`/`@media print` para projetar a página atual em A4 vertical. O estado de impressão é efêmero e não entra no documento persistido.

## Consequências

- a saída preserva recursos vetoriais do navegador e dispensa backend;
- o usuário escolhe explicitamente o destino **Salvar como PDF** no diálogo nativo;
- não há download automático, pois navegadores não permitem selecionar silenciosamente um destino PDF com fidelidade uniforme;
- exportação multipágina, sangria e arquivos portáteis continuam como responsabilidade do Incremento 06.
