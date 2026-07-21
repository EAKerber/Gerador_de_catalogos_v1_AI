# Developer B — ciclo de consolidação 05.19

## Finalidade

Este ciclo sucede o fechamento operacional do 05.18 e continua exclusivamente em `agent/developer-b-05.18`.

Não adiciona capacidade de produto. Seu objetivo é reduzir sobreposições incrementais cuja utilidade já foi comprovada, incorporando o comportamento aos módulos canônicos sem alterar:

- `CatalogDocument 1.16.0`;
- os dezesseis tipos de componente;
- receitas, ícones ou navegação;
- contratos de canvas/PDF;
- histórico reversível;
- `development` ou `main`.

## Regras

1. Uma sobreposição por incremento.
2. Primeiro transferir a responsabilidade; remover o shim somente em incremento posterior.
3. Runtime principal antes do espelho do AuthoringKit.
4. Build idempotente obrigatório.
5. Auditoria consolidada após cada remoção física.

## Incrementos

### DB-05.19.1 — Overrides de tabela no store canônico

- incorporar ao `replaceTableRowsBulk` a marcação de `code`, `package` e `price`;
- preservar `bindingSync`, `bindingSyncDepth`, append, undo e redo;
- converter `table-binding-overrides-contract.js` em shim sem subclassificação;
- manter paridade com o AuthoringKit.

### DB-05.19.2 — Remoção do shim de overrides

Condicionado à aprovação do 05.19.1:

- remover carregamento no editor e compilador;
- remover cópias e referências de build;
- manter a regressão comportamental apontando apenas para o store;
- executar auditoria consolidada.

Outras consolidações serão adicionadas somente após concluir e medir estes dois incrementos.
