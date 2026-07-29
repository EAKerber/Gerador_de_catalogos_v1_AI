# ADR-028 — Esquemas reutilizáveis e composição focal

**Status:** aceita no Incremento 05.15.

## Contexto

A auditoria manual mostrou que sete esquemas e linhas de tabela consumiram 82 ações. A seleção de produtos já criava cards em grade, mas uma organização próxima da referência ainda exigia montar destaque, grade e faixa separadamente.

## Decisão

- esquemas de tabela são presets declarativos versionados, não uma segunda entidade persistida;
- aplicar um esquema substitui colunas e preserva valores/legendas primeiro pela chave e depois pela função semântica;
- cards ou tabelas selecionados recebem o mesmo esquema em uma transação reversível;
- hero + grade + faixa é uma receita e um comando composto: primeiro produto vira destaque, os demais entram na grade e a faixa nasce com peças editáveis;
- o resultado usa somente `layout-container`, `product-card`, `data-table` e `specification` existentes;
- nenhuma inferência altera fatos comerciais e nenhum campo novo é exigido pelo `CatalogDocument`.

## Consequências

O caminho manual ganha ações de maior escala sem perder edição individual, importação ou compatibilidade. Presets podem evoluir no kit sem migração documental; mudanças de significado em funções de coluna continuam exigindo uma decisão de produto explícita.
