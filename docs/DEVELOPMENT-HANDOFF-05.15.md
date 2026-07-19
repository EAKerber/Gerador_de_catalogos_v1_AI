# Handoff de desenvolvimento — Incremento 05.15

## Estado

- editor: Incremento 05.15;
- schema: `CatalogDocument 1.16.0`;
- kit: `CatalogAuthoringKit 1.5.5`;
- receita: `CatalogSectionRecipes 1.2.0`;
- esquemas: `CatalogTableSchemas 1.0.0`;
- ADRs principais: `ADR-027-destino-contextual-e-acoes-compostas.md` e `ADR-028-esquemas-e-composicao-focal.md`.

## Contratos que não devem regredir

1. Contêiner compatível selecionado ou sob o ponteiro é o destino padrão.
2. `Shift` nunca altera o contexto e insere no contexto atual.
3. A nova peça permanece selecionada no contexto alvo.
4. Variação é entidade semântica; imagem e linha são projeções vinculadas e desfeitas juntas.
5. Galeria compacta não pode invadir especificações ou tabela.
6. A dica deve aceitar 236 px sem filhos fora do pai.
7. Nenhuma dessas regras introduz campo persistido novo.

8. Esquema em lote preserva valores por função semântica e uma única entrada de histórico.
9. Hero + grade + faixa materializa componentes comuns e mantém o foco na grade.

## Próximo foco

O 05.16 mede novamente a reconstrução manual e simplifica superfícies somente onde a evidência mostrar redundância ou quebra de continuidade. Deve preservar os comandos do 05.15, mas pode mudar sua posição e apresentação na interface.
