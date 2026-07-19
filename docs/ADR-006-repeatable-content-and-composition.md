# ADR-006 — Conteúdo repetível por referência e cópias independentes

**Status:** aceita no Incremento 04.1.

## Contexto

A tabela de produto possuía somente três propriedades no componente e só conseguia representar uma linha. Ao mesmo tempo, duplicar uma estrutura que referencia dados exige decidir se original e cópia devem compartilhar ou isolar o conteúdo.

## Decisão

- Linhas pertencem à coleção genérica `tableRows`.
- `data-table` guarda apenas `collectionId` e `rowIds` ordenados.
- Cada item registra valores em `metadata.values` e usa `reference: null`, pois pertence ao documento.
- O store é a única camada que inclui, edita, remove, reordena e resolve linhas.
- Duplicar tabela, card ou outra subárvore cria novos itens de linha; a cópia visual é editável sem modificar o original.
- A altura mínima é derivada da quantidade de linhas e percorre o motor de mínimos e o layout de slots já existente.
- A legenda pertence às props da arte, não à coleção de assets, porque descreve o uso da imagem naquele ponto do documento.

## Consequências

O modelo passa a suportar repetição sem introduzir um segundo formato de persistência. Uma mesma coleção pode evoluir para bindings futuros, mas o comportamento atual privilegia cópias independentes. Itens órfãos não são criados em remoções normais; remoção só apaga a linha da coleção quando não há outro uso.

O renderer recebe um contexto de leitura do store, mantendo as funções de componente puras em relação ao DOM e sem acesso direto ao IndexedDB.
