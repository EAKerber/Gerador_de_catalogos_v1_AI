# 04 — Tabela comercial completa

Quando usar: uma tabela precisa de linhas repetidas ou outra projeção editorial.

1. Adicione/cole linhas pelo painel **Conteúdo**.
2. Mude o cabeçalho por `props.columns[].label`; preserve `key`.
3. Reordene o próprio array de colunas.
4. Use `visible = false` para omitir uma coluna do editor/PDF sem apagar valores
   ou bindings.
5. Mantenha pelo menos uma coluna visível e verifique undo/redo.

Para o exemplo das corrediças: `Medida`, `Ref.`, `Preço unit.` e `Preço 15 un.`
são rótulos; `PAR/UN` pode permanecer na fonte sem virar coluna visual.
