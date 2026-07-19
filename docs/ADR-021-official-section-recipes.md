# ADR-021 — Receitas oficiais como subárvores editáveis

## Status

Aceita no Incremento 05.8.

## Contexto

A construção manual ainda exigia montar cabeçalho, área principal, rodapé e pequenas seções recorrentes peça por peça. Criar um formato paralelo de template facilitaria a inserção, mas duplicaria regras de componentes, slots, migração e validação.

## Decisão

Receitas oficiais são snapshots versionados de subárvores compatíveis com o `CatalogDocument`. O registro declara apenas metadados de descoberta, contextos aceitos e um papel opcional para foco depois da inserção.

A materialização reutiliza a mesma clonagem de templates salvos, renova IDs, hidrata filhos padrão, aplica reflow e cria uma única entrada de histórico. O documento final não depende do registro para continuar editável.

Componentes, receitas e templates salvos oferecem duas intenções distintas:

- `+`: o store escolhe o primeiro slot compatível ou frame livre de forma determinística;
- arrastar: o usuário fornece a coordenada desejada.

## Consequências

- estruturas comuns passam a exigir uma ação sem reduzir a permissividade posterior;
- pacote, schema de documento, renderer e PDF continuam operando sobre os mesmos componentes;
- receitas oficiais podem evoluir sem misturar-se a **Meus componentes**;
- o kit de autoria passa a declarar as receitas disponíveis;
- falta de espaço ou capacidade vira erro explícito, não sobreposição silenciosa;
- seleção e contexto de edição permanecem estado efêmero.

