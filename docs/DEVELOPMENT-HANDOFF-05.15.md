# Handoff de desenvolvimento — Incremento 05.15

## Estado

- editor: Incremento 05.15;
- schema: `CatalogDocument 1.16.0`;
- kit: `CatalogAuthoringKit 1.5.4`;
- receita: `CatalogSectionRecipes 1.1.0`;
- ADR principal: `ADR-027-destino-contextual-e-acoes-compostas.md`.

## Contratos que não devem regredir

1. Contêiner compatível selecionado ou sob o ponteiro é o destino padrão.
2. `Shift` nunca altera o contexto e insere no contexto atual.
3. A nova peça permanece selecionada no contexto alvo.
4. Variação é entidade semântica; imagem e linha são projeções vinculadas e desfeitas juntas.
5. Galeria compacta não pode invadir especificações ou tabela.
6. A dica deve aceitar 236 px sem filhos fora do pai.
7. Nenhuma dessas regras introduz campo persistido novo.

## Próximo foco

O próximo checkpoint do 05.15 deve tratar esquemas de tabela reutilizáveis, aplicação em lote e organização hero + grade + faixa. Depois disso, o 05.16 mede novamente a reconstrução manual e simplifica superfícies somente onde a evidência mostrar redundância ou quebra de continuidade.
