# Incremento 05.0 — Reuso editorial, galerias e numeração

## Objetivo

Transformar subárvores já editadas em peças reutilizáveis sem perder a independência das instâncias, representar conjuntos de variações com uma legenda por imagem e assistir a sequência editorial dos cards.

## Entregas

### Meus componentes

- ação **Salvar em Meus componentes** disponível para qualquer seleção;
- categoria própria no topo da biblioteca de componentes;
- snapshot recursivo persistido na coleção `templates`;
- inserção por drag and drop ou API do store;
- novos IDs para toda a subárvore;
- remapeamento de referências internas de separadores contextuais;
- cópia dos valores de tabela para novos `rowIds`;
- preservação de `assetId`, tokens, slots, conteúdo, layout e overrides;
- remoção explícita de itens salvos.

### Galeria multiarte

- novo contêiner `art-gallery` em auto-layout de grade;
- três imagens legendadas como estrutura inicial;
- inclusão, remoção, ordenação e edição independente de átomos `art`;
- suporte no slot de arte do card e em Áreas de composição;
- mínimos reduzidos apenas para itens dentro da galeria;
- envelope auxiliar invisível no PDF, com imagens e legendas preservadas.

### Numeração assistida

- `numbering.cardNext` persiste o cursor editorial;
- cards adicionados, duplicados ou inseridos por template recebem o próximo número;
- conflito manual oferece compactação dos cards posteriores;
- valor acima da sequência oferece continuar ou manter o cursor anterior;
- títulos e demais conteúdos não são reescritos.

## Persistência e migração

O schema passa para `1.10.0`. Documentos anteriores recebem `numbering.cardNext` inferido a partir dos cards existentes e a coleção `templates` normalizada como **Meus componentes**. Nenhum binário é incorporado aos snapshots.

## Fora do escopo

- inventário funcional de produtos;
- binding por `productId`;
- templates de apresentação ligados a entidades;
- legenda cromática vinculada a células de tabela.

Esses contratos permanecem, respectivamente, no Incremento 05.1 e na trilha de descoberta registrada no backlog.

## Evidência

- `tests/reusable-components.test.js` cobre snapshots, dependências, IDs, galerias e políticas de numeração;
- `tests/browser-reusable-components.test.js` cobre a categoria visual, inserção, projeção da galeria e sequência no navegador;
- `tests/ui-contract.test.js` protege a conexão entre store, inspetor, drag and drop, CSS e schema;
- `tests/reference-coverage.test.js` mantém a matriz alinhada à imagem-base.
