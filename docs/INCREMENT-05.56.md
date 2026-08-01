# Incremento 05.56 — integridade textual renderizada

## Motivação

O primeiro ensaio externo do Authoring Kit 1.7.0 gerou um documento
estruturalmente válido, mas o PDF continha dez truncamentos visíveis. O relatório
declarava zero overflow porque o validador existente mede frames JSON, não os
glifos renderizados. A mesma evidência mostrou imagens fiéis, porém pequenas ou
com limites de canvas visíveis por uma política conservadora demais.

## Escopo

- auditor DOM determinístico para reticências, clipping, colisões texto–texto e
  texto–imagem/ícone/divisor;
- aviso separado para fonte renderizada abaixo de 6 pt;
- resultado agregado ao relatório do editor e ao `reports/export-report.json`;
- rascunho conserva achados como avisos; publicação bloqueia truncamentos e
  colisões;
- fixture mínima com os dez textos truncados confirmados no PDF do ensaio;
- Authoring Kit 1.7.1 autorizando edição factual não imaginativa e rastreável de
  assets.

## Fora do escopo

- correção automática de texto ou layout;
- recorte automático de margens neutras no componente de arte;
- comparação pixel a pixel;
- paginação;
- troca estrutural de componentes com reflow.

## Critérios de aceite

1. O compilador Node deixa explícito que `overflows` é geometria, não tipografia.
2. O Chromium localiza os dez truncamentos da fixture com componente e texto.
3. Colisões texto–texto e texto–objeto são diagnosticadas separadamente.
4. Fonte abaixo do mínimo não é confundida com colisão.
5. O pacote de rascunho registra as contagens e o relatório completo.
6. O pacote de publicação é bloqueado quando houver truncamento ou colisão.
7. A política de imagens permite zoom, foco, reenquadramento, expansão de fundo
   e correções não imaginativas, preservando proveniência e reversibilidade.

`CatalogDocument` permanece em `1.16.0`; o Authoring Kit passa a `1.7.1`.
