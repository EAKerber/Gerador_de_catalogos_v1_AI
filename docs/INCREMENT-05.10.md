# Incremento 05.10 — Variantes semânticas e legendas visuais

O incremento fecha a ambiguidade entre variação de produto, imagem e linha de tabela. A entidade semântica passa a ter identidade estável e pode materializar, em uma única ação reversível, uma arte legendável e uma linha comercial. Representações podem ser removidas sem apagar a entidade.

## Contratos entregues

- `CatalogDocument 1.16.0` e migração conservadora de documentos anteriores;
- `CatalogSource 1.1.0` com IDs de linhas, `variantId`, `commercialRowIds` e `legends[]` agrupadas;
- componentes `legend-panel`, `legend-group` e `legend-item` vinculados por `legendKey`;
- materialização de legenda ativada por default e desativável antes da confirmação;
- atualização semântica preservando a legenda editorial local da imagem;
- validação de variantes, linhas, tokens, contraste e referências quebradas;
- preservação dos vínculos ao duplicar e salvar componentes;
- compilação determinística com reserva de faixa visual; se não houver capacidade técnica, a definição é preservada e o relatório registra o adiamento;
- `CatalogAuthoringKit 1.4.0` com schemas, runtime, exemplos e capacidades atualizados.

## Verificação

Há testes unitários específicos para criação, atualização, materialização, exportação, migração e validação. A suíte anterior continua cobrindo compilador, histórico, pacote, layout, slots, tabelas e ações contextuais.
