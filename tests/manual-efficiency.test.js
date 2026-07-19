/* Incremento 05.6 — operações compostas para reduzir ações da construção manual. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
[
  "app/tokens.js",
  "app/catalog-source.js",
  "app/manual-entry.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/catalog-validator.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const productsText = [
  "Título\tCódigo\tEmbalagem\tPreço\tEspecificação 1\tEspecificação 2",
  "PARAFUSO OVAL\t1176\tCX 1000\tR$ 35,90\tCabeça oval\tAço cromado",
  "BUCHA NYLON\t2040\tPCT 100\tR$ 12,50\tAlta resistência\tNylon branco"
].join("\n");
const parsedProducts = CatalogManualEntry.parseProducts(productsText);
assert(parsedProducts.rows.length === 2 && parsedProducts.rows[0].price === "R$ 35,90", "A colagem tabular de produtos perdeu cabeçalhos ou vírgula decimal.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const products = store.createProductsBulk(parsedProducts.rows);
assert(products.length === 2 && store.getHistoryState().undoCount === 1 && store.getHistoryState().undoLabel === "Adicionar produtos em lote", "O cadastro em lote não foi uma transação única.");
store.undo();
assert(store.getProducts().length === 0, "Desfazer não removeu todo o cadastro em lote.");
store.redo();
assert(store.getProducts().length === 2, "Refazer não recuperou o cadastro em lote.");

const result = store.createCardsForProducts(store.getProducts().map(product => product.id), { columns: 2, density: "compact" });
assert(result.area?.type === "layout-container" && result.cards.length === 2, "A seleção não criou uma composição com todos os cards.");
assert(result.cards.every(card => card.binding?.productId), "Os cards em lote não foram vinculados aos produtos.");
assert(store.getState().editor.editingContextId === result.area.id, "A operação não preservou o foco na nova composição.");
assert(store.getHistoryState().undoLabel === "Criar cards da seleção", "A criação de cards não foi uma transação única.");
const report = store.getPublicationReport("draft");
assert(report.ok && report.summary.collisions === 0 && report.summary.overflows === 0, "A grade manual assistida nasceu geometricamente inválida.");

const table = result.cards[0].children.find(child => child.type === "data-table");
const parsedRows = CatalogManualEntry.parseTable("Código\tEmbalagem\tPreço\n1176-A\tCX 500\tR$ 31,90\n1176-B\tCX 250\tR$ 29,90", store.getTableColumns(table));
assert(parsedRows.rows.length === 2, "A colagem tabular não reconheceu as colunas da tabela selecionada.");
const historyBeforeRows = store.getHistoryState().undoCount;
store.replaceTableRowsBulk(table.id, parsedRows.rows, { mode: "replace" });
assert(store.getTableRows(table).length === 2 && store.getTableRows(table)[1].metadata.values.code === "1176-B", "As linhas coladas não substituíram a tabela.");
assert(store.getHistoryState().undoCount === historyBeforeRows + 1 && store.getHistoryState().undoLabel === "Colar linhas da tabela", "A colagem de tabela não foi uma transação única.");
store.undo();
assert(store.getTableRows(table.id).length === 1, "Desfazer não recuperou as linhas anteriores da tabela.");
store.undo();
assert(store.getPage().children.every(component => component.id !== result.area.id) && store.getProducts().length === 2, "Desfazer a criação de cards afetou produtos ou deixou a composição parcial.");

console.log("✓ Colagem de produtos, criação/vínculo de cards e linhas tabulares em lote validadas como ações manuais compostas.");
