# Incremento 05.37 — apresentações adaptativas no store canônico

## Direção

Concluir o recorte de consolidação deixado pelo 05.36 sem alterar interface,
schema, geometria observável ou formatos persistidos.

## Problema confirmado

Os contratos `variants` e `data-only` ainda instalavam subclasses sucessivas de
`CatalogDocumentStore`. Cada subclasse substituía construtor, `emit` e
`deleteComponent`, fazendo a identidade final e o encadeamento da estabilização
dependerem da ordem dos scripts.

## Contrato

- o store canônico identifica e estabiliza os dois modos adaptativos antes do
  histórico;
- uma única passagem genérica preserva as APIs específicas de compatibilidade;
- exclusão de conteúdo parcial não recria filhos ausentes;
- construção, importação, undo, redo e dirty state partem da geometria
  convergida;
- os contratos tardios preservam geometria e inspeção, mas apenas validam a
  integração com o store;
- instalação normal, inversa e repetida preserva a identidade da classe e dos
  métodos críticos.

## Gates

- identidade de `CatalogDocumentStore`, `emit` e `deleteComponent`;
- instalação em ordem inversa e reinstalação idempotente;
- `variants` e `data-only` amplos, compactos e com conteúdo parcial;
- galerias, tabelas, exclusão, histórico, dirty state e importação;
- paridade entre runtime principal e Authoring Kit;
- regressão Node, build e Chromium multirreferência;
- schema `1.16.0`, tipos e capacidades preservados.

## Fora do incremento

- mudanças de interface, schema ou vocabulário;
- novas apresentações, tipos, capacidades ou regras de layout;
- reestruturação documental da V1;
- benchmark promocional pós-V1.
