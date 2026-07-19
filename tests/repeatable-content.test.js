/* Contratos focados em conteúdo repetível e distribuição de cópias. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
global.document = { createElement() { return { click() {} }; } };
global.URL = { createObjectURL() { return ""; }, revokeObjectURL() {} };
global.Blob = class Blob {};

for (const file of ["app/layout-engine.js", "app/component-registry.js", "app/collection-registry.js", "app/document-store.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const table = store.addComponent("data-table", { x: 40, y: 40, width: 300, height: 48 });
const firstRow = store.getTableRows(table)[0];

store.addTableRow(table.id, { code: "02", package: "UN", price: "R$ 2,00" });
store.addTableRow(table.id, { code: "03", package: "CX", price: "R$ 3,00" });
assert(table.props.rowIds.length === 3, "A tabela deve ordenar três referências de linha.");
assert(table.frame.height >= 104, "A altura mínima da tabela não acompanhou as linhas.");
assert(store.getTableRowUsage(firstRow.id)[0] === table.id, "O vínculo inverso da linha não foi encontrado.");

const copies = store.duplicateComponentSeries(table.id, { direction: "down", mode: "offset", distance: 120, count: 2 });
assert(copies.length === 2, "A série deveria conter duas cópias.");
assert(copies[0].frame.y === table.frame.y + 120 && copies[1].frame.y === table.frame.y + 240, "O deslocamento vertical não foi aplicado progressivamente.");
assert(copies.every(copy => copy.props.rowIds.every(rowId => !table.props.rowIds.includes(rowId))), "As cópias devem ter linhas independentes.");

console.log("✓ Conteúdo repetível e duplicação direcional validados.");
