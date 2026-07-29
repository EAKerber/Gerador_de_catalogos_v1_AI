/* Incremento 05.15 — esquemas reutilizáveis e aplicação em lote. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
for (const file of ["app/tokens.js", "app/catalog-source.js", "app/table-schema-registry.js", "app/presentation-registry.js", "app/catalog-icons.js", "app/layout-engine.js", "app/component-registry.js", "app/section-recipes.js", "app/collection-registry.js", "app/document-store.js"]) vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const products = ["A", "B"].map((title, index) => store.createProduct({ title, code: `10${index}`, package: "CX 100", price: `R$ ${index + 1},00` }));
const created = store.createCardsForProducts(products.map(product => product.id), { columns: 2, density: "compact" });
const before = store.getHistoryState().undoCount;
const tables = store.applyTableSchema(created.cards.map(card => card.id), "measured");
assert(tables.length === 2 && tables.every(table => table.props.tableSchemaId === "measured"), "O esquema não alcançou todas as tabelas dos cards.");
assert(tables.every(table => store.getTableColumns(table).map(column => column.key).join(",") === "code,measure,package,price"), "A estrutura reutilizável divergiu entre tabelas.");
assert(store.getTableRows(tables[0])[0].metadata.values.code === "100" && store.getTableRows(tables[0])[0].metadata.values.package === "CX 100", "A troca de esquema perdeu valores com papel semântico conhecido.");
assert(store.getHistoryState().undoCount === before + 1 && store.getHistoryState().undoLabel === "Aplicar esquema às tabelas", "A aplicação em lote não gerou uma única entrada de histórico.");
store.undo();
assert(store.getTableColumns(store.getTablesForComponents([created.cards[0].id])[0]).length === 3, "Desfazer não restaurou o esquema anterior.");
console.log("✓ Esquemas reutilizáveis preservam valores semânticos e aplicam em lote com undo único.");
