# ADR-027 — Destino contextual e ações compostas

**Status:** aceita no Incremento 05.15.

## Contexto

Inserções por `+` e arraste usavam sempre o contexto já aberto. Selecionar um card e adicionar uma peça compatível ainda a criava como irmã, contrariando a intenção visual. Além disso, linhas, imagens e variações podiam produzir representações parecidas por mecanismos semanticamente distintos.

## Decisão

- `+` e teclado priorizam o contêiner selecionado quando ele aceita o tipo;
- o arraste prioriza o contêiner compatível mais profundo sob o ponteiro;
- a inserção entra no contexto alvo e mantém a nova peça selecionada;
- `Shift` preserva o contexto atual para a intenção explícita de inserir por cima;
- “Linha da tabela” continua sendo representação visual;
- “Variação do produto” só aparece em tabela de card vinculado e cria, em uma transação, entidade de variação, linha comercial e imagem legendada com IDs estáveis;
- ações compostas materializam componentes comuns e permanecem reversíveis.

## Consequências

A inserção manual exige menos navegação e passa a seguir o alvo visual. O modificador oferece escape sem adicionar outro modo persistente. Variações deixam de depender da posição de uma linha ou imagem, preservando o modelo canônico de produto.
