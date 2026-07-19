# ADR-022 — Ações contextuais e composição em lote

## Status

Aceita no Incremento 05.9.

## Contexto

O botão `+` reduziu a montagem de estruturas no 05.8, mas ainda tratava todos os contextos como uma biblioteca genérica. Tarefas frequentes — adicionar uma linha à tabela, transformar uma arte em galeria e uniformizar espaços — exigiam localizar controles distantes ou repetir ajustes por item.

## Decisão

O `+` passa a combinar biblioteca compatível e ações derivadas da seleção. A ação contextual é um comando do store, não um novo tipo persistido. Tabelas criam linhas usando suas colunas atuais; artes criam ou expandem galerias; contextos incompatíveis simplesmente não anunciam a ação.

Espaçamento em lote opera somente sobre irmãos. Em auto-layout compatível, modifica `parent.layout.gap` e reflow; fora dele, materializa frames manuais determinísticos. Separadores opcionais são componentes `separator` em overlay e recebem presets declarados no manifesto. A operação inteira usa `runCompoundChange`.

O inspetor adota vocabulário orientado à tarefa:

- **Conteúdo:** o que o componente comunica ou referencia;
- **Layout:** como ele participa e organiza o contexto;
- **Visual:** aparência e tokens;
- **Avançado:** frame, constraints, mínimo e detalhes técnicos.

Controles booleanos passam a toggles quando descrevem um estado persistente; botões continuam sendo usados para comandos instantâneos.

## Consequências

- reduz-se a distância entre seleção e próxima ação provável;
- componentes e schema continuam canônicos e editáveis após automações;
- comandos contextuais podem crescer de forma declarativa sem sobrecarregar a paleta;
- seleção cruzando pais permanece fora de escopo para evitar conversão ambígua de coordenadas;
- presets aceleram a composição, mas o átomo criado conserva edição individual.
