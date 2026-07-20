# Incremento 05.18 — Profundidade da biblioteca e linguagem editorial

## Motivação

A auditoria após o benchmark 05.17 encontrou uma biblioteca estruturalmente suficiente, mas com profundidade visual desigual. Criar mais tipos imediatamente aumentaria descoberta, schema e manutenção sem resolver a fragilidade dos átomos existentes. O checkpoint 1 mantém os dezesseis componentes e torna capacidades já declaradas observáveis.

## Entregue no checkpoint 1

- `text` preserva conteúdo simples e adiciona alinhamento horizontal/vertical, escala discreta 80/100/120% e overflow por quebra, reticências ou corte;
- `icon` e `specification` recebem escala interna discreta, independente do frame;
- `product-card` usa a mesma subárvore nos cinco modos, mas agora `hero` prioriza arte, `technical` especificações, `variants` empilha galeria e informações, e `data-only` amplia dados;
- presets continuam reversíveis, compatíveis com binding, mínimos e PDF;
- o kit passa a 1.6.0 e declara `editorialTextControls`, `internalIconScale` e `distinctProductModes`;
- `CatalogDocument` permanece em 1.16.0: os novos valores vivem em `props` já extensíveis e documentos anteriores usam defaults conservadores.

## Decisão subtrativa

`section-heading` e `fact` ficam reservados como únicas candidatas imediatas a novos tipos. `callout` permanece receita até haver evidência de insuficiência. Preço, selo, chip, botão, QR code, caixa colorida, contato, aplicação e novas tabelas não viram componentes neste ciclo.

## Próximos checkpoints

- validar visualmente os cinco modos em larguras ampla e compacta e na projeção PDF;
- avaliar descoberta por intenção, mantendo `layout-container` e peças internas no caminho avançado;
- testar `section-heading` e `fact` contra casos de catálogo diferentes da referência antes de alterar o registro.
