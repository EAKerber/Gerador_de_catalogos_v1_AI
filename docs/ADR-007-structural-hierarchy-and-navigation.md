# ADR-007 — Estruturas compostas e navegação categorizada

**Status:** aceita no Incremento 04.2.

## Contexto

Cabeçalho e rodapé eram renderizações monolíticas: suas partes podiam mudar apenas por props do nó raiz. Ao mesmo tempo, os dois painéis acumulavam conteúdo vertical e o zoom dependia exclusivamente de opções discretas.

## Decisão

- Cabeçalho e rodapé usam o mesmo contrato recursivo, slots e coordenadas locais do card.
- O cabeçalho combina tipos existentes (`art` e `text`) para evitar novos átomos específicos.
- O rodapé introduz apenas `footer-item`, uma molécula reutilizável que concentra ícone e dois níveis textuais.
- Props legadas alimentam filhos somente quando a estrutura ainda está vazia.
- Navegação de painel é estado efêmero da interface e não entra no JSON do documento.
- Selecionar um contêiner marca seus descendentes para ênfase visual sem torná-los editáveis fora do contexto.
- `Ctrl/Cmd + roda` altera `editor.zoom`; o navegador permanece em 100% e o seletor recebe uma opção intermediária quando necessário.

## Consequências

Os três grandes componentes editoriais passam a compartilhar o mesmo modelo de composição. A interface reduz scroll sem criar um segundo store de domínio. A migração continua determinística, e automações futuras podem tratar cabeçalho, card e rodapé como árvores equivalentes.
