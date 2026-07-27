# Incremento 05.23 — transação estrutural e fechamento da V1

## Direção

Este incremento conclui o recorte transacional restante com risco comprovado:
espaçamento em lote combinado com criação ou atualização de separadores. Ele
não acrescenta controles, tipos persistidos, campos de schema ou constraints.

## Problema confirmado

`spaceComponents` usava `runCompoundChange`. O mecanismo preservava um único
undo e restaurava o documento diante de exceções, mas ainda permitia emissões
intermediárias de `updateComponent` e só descobria falhas depois de começar a
alterar frames, autoridade e estrutura.

## Contrato

`planSpacingTransaction(componentIds, options)`:

- executa a operação num store isolado;
- não altera documento, histórico, seleção ou listeners;
- enumera frames, reflow derivado, mudanças de autoridade e componentes
  estruturais adicionados/removidos;
- valida mínimos e limites novos ou agravados;
- retorna `applied`, `adjusted` ou `blocked`.

`applySpacingTransaction(componentIds, options)`:

- rejeita um plano bloqueado sem mutação;
- sincroniza a árvore planejada preservando a identidade dos componentes
  existentes;
- emite `components-spaced` uma única vez;
- cria uma única entrada de histórico.

`spaceComponents` permanece como API compatível e delega ao novo contrato.

## Gates

- planejamento puro e sem emissões;
- commit com uma emissão e um undo;
- bloqueio sem frame, autoridade, estrutura ou histórico parcial;
- separadores enumerados no relatório estrutural;
- paridade entre editor e Authoring Kit;
- 16 tipos, 45 capacidades e `CatalogDocument 1.16.0`;
- regressão Node, build, Chromium técnico/promocional e PDF.

## Fora do incremento

- locks persistentes;
- preview visual de normalização à grade;
- solver estrutural genérico;
- multipágina, colaboração e publicação;
- novos tipos de componente;
- reescrita do store.
