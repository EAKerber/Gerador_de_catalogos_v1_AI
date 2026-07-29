# Incremento 05.33 — reordenação acessível em Camadas

## Recorte

A árvore de Camadas passa a expor a operação existente `reorderComponent` por
controles “mover para cima” e “mover para baixo”. Cada controle funciona por
mouse e teclado, informa o alvo por nome acessível e fica desabilitado no limite
do grupo.

## Limites

- somente irmãos do mesmo pai e do mesmo slot;
- sem arrastar, reparenting ou cruzamento entre slots;
- a ordem do documento continua sendo a fonte única;
- reflow e undo continuam sob responsabilidade do store existente;
- nenhuma alteração de schema ou persistência.

## Gates

- contrato estrutural da interface;
- Chromium em 1366 × 768 para ordem visual/serializada, limites e teclado;
- uma ação no histórico e restauração por undo;
- suíte Node, build canônico e CI integral.
