# Integração dos contratos incrementais no AuthoringKit

## Motivo

Os incrementos Developer B foram implementados como contratos pequenos e auditáveis, carregados sobre o runtime canônico. Espelhar os arquivos em `authoring-kit/runtime` não era suficiente: o compilador autocontido precisava carregá-los e instalá-los antes de materializar documentos.

A auditoria encontrou duas lacunas:

1. `tools/build-authoring-kit.js` não copiava novamente os contratos a partir de `app/`;
2. `authoring-kit/compiler/compile-catalog.js` não carregava nem instalava os contratos.

Sem essa integração, o editor e o compilador poderiam produzir geometrias diferentes para o mesmo modo de card.

## Contratos integrados

- `text-alignment-contract.js`;
- `text-scale-contract.js`;
- `text-overflow-contract.js`;
- `icon-scale-contract.js`;
- `product-hero-contract.js`;
- `product-technical-contract.js`;
- `product-variants-contract.js`;
- `product-data-only-contract.js`.

## Ordem do compilador

O compilador carrega:

1. tokens, fonte, plano, apresentações, ícones e layout;
2. registro de componentes, coleções e store;
3. contratos incrementais;
4. validador e compilador;
5. instalações dos contratos;
6. chamada `CatalogCompiler.compile`.

Alinhamento, overflow, variants e data-only precisam da store para compor seus wrappers. Hero, técnico, variants e data-only precisam ser instalados antes que o compilador consulte frames e mínimos dos slots.

## Build

`tools/build-authoring-kit.js` copia cada contrato de `app/` para `authoring-kit/runtime/` antes de gerar manifestos, inventário e o bundle embutido `app/authoring-kit-files.js`.

Isso restaura a regra operacional:

> o runtime principal é corrigido primeiro; o kit é derivado e validado depois.

## Teste

`tests/authoring-kit-runtime-contracts-05.18.test.js` verifica:

- existência dos contratos nos dois runtimes;
- igualdade textual app × kit;
- presença na lista de cópia do build;
- presença na lista de carregamento do compilador;
- presença no bootstrap do editor;
- ordem store → contratos → validador → compilador;
- instalação antes de `CatalogCompiler.compile`;
- execução real do compilador sobre `authoring-kit/examples/catalog-source.json`;
- documento `1.16.0` e relatório aprovado.

## Estado

A integração foi implementada na branch `agent/developer-b-05.18` e não foi mesclada.

A execução do teste e a regeneração dos arquivos gerados permanecem pendentes no ambiente atual:

```bash
node tests/authoring-kit-runtime-contracts-05.18.test.js
node tools/build-authoring-kit.js
```

Depois do build, os arquivos gerados devem ser revisados antes de qualquer promoção da branch.
