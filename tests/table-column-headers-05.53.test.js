/* Incremento 05.53 — rótulo, ordem e visibilidade sem alterar chaves/células. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";

for (const file of [
  "app/tokens.js",
  "app/catalog-source.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/collection-registry.js",
  "app/document-store.js"
]) vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const table = store.addComponent("data-table", { x: 24, y: 24, width: 360, height: 100 });
const row = store.getTableRows(table)[0];
store.updateTableRow(table.id, row.id, { code: "1176", package: "CX 1000", price: "R$ 35,90" });
const initialKeys = store.getTableColumns(table).map(column => column.key).join(",");
const initialValues = { ...row.metadata.values };
const historyBefore = store.getHistoryState().undoCount;

const renamed = store.getTableColumns(table).map(column => column.key === "package" ? { ...column, label: "Caixa" } : column);
store.updateTableColumns(table.id, renamed);
store.reorderTableColumn(table.id, "price", -1);
store.setTableColumnVisibility(table.id, "package", false);

const columns = store.getTableColumns(table);
assert(columns.map(column => column.key).join(",") === "code,price,package", "A reordenação alterou ou perdeu chaves semânticas.");
assert(columns.find(column => column.key === "package").label === "Caixa", "O rótulo editorial não foi preservado.");
assert(store.getVisibleTableColumns(table).map(column => column.key).join(",") === "code,price", "A coluna oculta ainda participa da projeção visível.");
assert(Object.keys(initialValues).every(key => row.metadata.values[key] === initialValues[key]), "Renomear, mover ou ocultar alterou valores das células.");
assert(initialKeys === "code,package,price", "A fixture não começou com as chaves canônicas.");
assert(store.getHistoryState().undoCount === historyBefore + 3, "Cada operação de cabeçalho deveria ser reversível.");
store.undo();
assert(store.getTableColumns(table.id).find(column => column.key === "package").visible === true, "Undo não restaurou a visibilidade.");
store.redo();
assert(store.getTableColumns(table.id).find(column => column.key === "package").visible === false, "Redo não reaplicou a visibilidade.");

const definition = CATALOG_COMPONENT_REGISTRY["data-table"];
const html = definition.render(store.findComponent(table.id).component, { store });
assert(html.includes(">Código<") && html.includes(">Preço<"), "A projeção perdeu uma coluna visível.");
assert(!html.includes(">Caixa<") && !html.includes("CX 1000"), "A projeção incluiu cabeçalho ou célula ocultos.");
assert(html.indexOf(">Código<") < html.indexOf(">Preço<"), "A projeção não respeitou a nova ordem.");

store.setTableColumnVisibility(table.id, "code", false);
assert(store.getVisibleTableColumns(table.id).length === 1, "Ocultar uma coluna ainda deveria deixar outra visível.");
assert(store.setTableColumnVisibility(table.id, "price", false) === false, "A última coluna visível pôde ser ocultada.");

const exported = store.getExportDocument();
const imported = new CatalogDocumentStore(exported);
const importedTable = imported.findComponent(table.id).component;
assert(imported.getTableColumns(importedTable).map(column => `${column.key}:${column.visible}`).join(",") === "code:false,price:true,package:false", "Round-trip perdeu ordem ou visibilidade.");
assert(imported.getTableRows(importedTable)[0].metadata.values.package === "CX 1000", "Round-trip perdeu a célula oculta.");
assert(imported.getState().schemaVersion === "1.16.0", "O contrato compatível exigiu migração de schema.");

console.log("✓ Cabeçalhos 05.53 preservam chaves e células ao renomear, mover, ocultar e reimportar.");
