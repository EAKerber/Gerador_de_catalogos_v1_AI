# ADR-013 — Binding de produto e templates de apresentação

## Status

Aceita no Incremento 05.1.

## Contexto

Snapshots reutilizáveis do 05.0 preservam corretamente uma subárvore autônoma, mas não resolvem atualização compartilhada de preço ou descrição. Reutilizar o mesmo snapshot como entidade de produto misturaria conteúdo e apresentação e exigiria reconstruir cards para cada alteração.

## Decisão

1. Produtos pertencem à coleção genérica `products` e guardam conteúdo em `metadata.values`.
2. Um `product-card` guarda `binding.productId`, `binding.templateId` e um mapa fechado de overrides.
3. Atualizações de produto são aplicadas granularmente aos nós e linhas existentes; IDs não mudam.
4. Edição local de um campo sincronizado ativa seu override. Desativá-lo reaplica apenas aquele campo.
5. Templates cujo tipo raiz é `product-card` recebem `kind: product-presentation`.
6. Arrastar um item de **Meus componentes** continua criando uma instância autônoma; escolher o mesmo item no controle **Template de apresentação** troca explicitamente a estrutura do card atual.
7. Ao aplicar uma apresentação, a raiz preserva ID, frame, constraints, slot, layout item, número e binding. Conteúdo e overrides são capturados e reaplicados.
8. Subcatálogos guardam somente listas de `productIds`.

## Consequências

- preço pode ser atualizado em vários cards sem invalidar seleção, hierarquia ou referências;
- template e conteúdo evoluem independentemente;
- o contrato de overrides é explícito e migrável;
- trocar apresentação pode renovar IDs internos e `rowIds`, pois é uma ação estrutural consciente;
- o primeiro ciclo cobre um conjunto fechado de campos e a primeira linha da tabela; variações avançadas de produto exigirão um contrato posterior;
- remover produto em uso precisa de uma política explícita de detach.

## Alternativas rejeitadas

- duplicar todo o produto dentro de cada card: impediria atualização compartilhada;
- usar o template como entidade de produto: acoplaria preço e texto à estrutura visual;
- resolver binding somente durante renderização: criaria uma projeção não persistida, difícil de exportar e editar;
- substituir a subárvore a cada atualização de preço: quebraria IDs, seleção e overrides locais.
