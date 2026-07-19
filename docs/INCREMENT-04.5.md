# Incremento 04.5 - Consistência recursiva e saída visual

## Entrega

- modo de reflow **Auto** por padrão e **Manual** como override por contêiner;
- propagação recursiva para slots, auto-layout e irmãos afetados;
- mínimo calculado após simular a geometria final dos descendentes;
- bloqueio de resize antes que a Área de composição atravesse cards ou tabelas;
- linhas horizontal e vertical do cabeçalho convertidas em átomos `separator`;
- borda genérica removida dos separadores;
- cor exata e espessuras físicas em milímetros no PDF;
- schema `1.8.0` e migração de contêineres legados para Auto;
- testes de domínio, navegador e comparação visual canvas×PDF.

## Validação

A prova gerada possui uma página A4. A renderização Poppler confirmou linhas vermelhas contínuas, marcador de contorno, tabela contida no card e ausência de controles editoriais.
