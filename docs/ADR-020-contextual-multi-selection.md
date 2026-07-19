# ADR-020 — Multisseleção contextual e comandos em lote

## Status

Aceita no Incremento 05.7.

## Contexto

As operações compostas do 05.6 reduziram cadastro e materialização repetitiva, mas o refinamento manual ainda exigia selecionar e configurar cada componente isoladamente. Uma seleção global e irrestrita introduziria ambiguidades entre coordenadas locais, slots e contêineres diferentes.

## Decisão

Manter `editor.selectedComponentId` como item primário compatível e acrescentar `editor.selectedComponentIds` como estado efêmero de sessão. A seleção múltipla aceita somente componentes irmãos, isto é, itens no mesmo sistema local de coordenadas.

- clique simples mantém a seleção individual como comportamento padrão;
- `Shift`, `Ctrl` ou `Cmd` + clique alterna um irmão na seleção;
- `Ctrl/Cmd+A` seleciona os filhos diretos do contexto aberto;
- seleção e contexto continuam fora do histórico e do JSON autoral;
- alinhar, distribuir, aplicar apresentação/tokens, duplicar e excluir usam uma transação única;
- itens governados por slot ou auto-layout recebem override manual quando um comando geométrico explícito os reposiciona.

O inspetor múltiplo expõe apenas propriedades aplicáveis ao conjunto. Campos incompatíveis não são inventados; propriedades visuais são aplicadas somente aos tipos que as declaram, e apresentação alcança somente cards elegíveis.

## Consequências

- operações geométricas permanecem bem definidas em coordenadas locais;
- documentos anteriores continuam válidos porque o novo array é opcional no schema de sessão e hidratado na migração;
- uma única entrada de histórico representa todo comando de lote;
- edição individual, slots e auto-layout continuam disponíveis depois do lote;
- seleção cruzando pais e transformação de grupo por arraste permanecem fora deste incremento.
