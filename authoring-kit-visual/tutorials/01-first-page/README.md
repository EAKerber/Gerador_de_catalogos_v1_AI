# 01 — De dados a uma página importável

Quando usar: início de qualquer catálogo orientado por fatos.

1. Copie `../../../examples/reference-catalog-source.json` para um arquivo de trabalho
   e substitua apenas fatos fornecidos.
2. Use o plano padrão ou adapte `../../../examples/catalog-generation-plan.json`.
3. Execute o compilador conforme `../../../GUIDE.md`.
4. Exija `ok: true`, zero colisões, zero overflow e zero correções pendentes.
5. Importe o documento no editor, faça refinamentos pós-compilação e exporte
   pacote/PDF.

Artefatos executáveis deste complemento:

- `../../examples/first-page.document.json`;
- `../../examples/first-page.report.json`;
- `reference-canvas-05.17.png` como orientação histórica real, não golden image.

Erro comum: editar o documento materializado antes de estabilizar
`CatalogSource`; isso transfere fatos para geometria e dificulta regeneração.
