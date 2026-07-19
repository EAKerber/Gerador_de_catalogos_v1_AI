# ADR-012 — Subárvores reutilizáveis e sequência editorial explícita

## Status

Aceita no Incremento 05.0.

## Contexto

Duplicação atendia cópias locais, mas não oferecia uma biblioteca persistente de componentes editados. Ao mesmo tempo, galerias de variações e numeração de cards precisavam preservar identidade sem acoplar o editor a um backend ou antecipar o binding de produtos.

## Decisão

### Snapshot de componente

Um item `template` guarda:

- tipo da raiz;
- nome escolhido pelo usuário;
- instante e componente de origem;
- snapshot JSON completo da subárvore;
- valores das linhas de tabela referenciadas.

Na inserção, a raiz e todos os descendentes recebem novos IDs. Linhas de tabela são materializadas como novos itens de coleção. `assetId` continua sendo referência ao asset do documento e não transporta bytes.

### Galeria como composição

`art-gallery` é um contêiner, não um novo formato de imagem. Seus filhos são componentes `art`, de modo que legenda, acessibilidade, asset, ponto focal e cor vetorial continuem pertencendo à imagem correta.

### Numeração

A sequência usa um cursor persistido em `numbering.cardNext`. Alterações manuais não deslocam o cursor automaticamente. Somente uma confirmação explícita compacta cards posteriores ou move a continuação para um valor superior.

## Consequências

- componentes salvos permanecem portáveis dentro do documento atual;
- instâncias não compartilham IDs nem linhas de tabela mutáveis;
- assets ausentes degradam para o placeholder já existente;
- snapshots autônomos ficam conceitualmente separados dos futuros templates vinculados a produtos;
- documentos legados podem inferir a próxima numeração sem reescrever cards existentes;
- ações de confirmação pertencem à interface, enquanto o store recebe uma política explícita e testável.
