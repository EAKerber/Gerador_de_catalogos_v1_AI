/* DB-05.19.1 — overrides de tabela em lote pertencem ao document-store canônico. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {}, clear() {} };
global.CatalogEditorIcon = () => "";

[
  "app/catalog-source.js",
  "app/presentation-registry.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/reflow-history-stability-contract.js",
  "app/table-binding-overrides-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

CatalogReflowHistoryStabilityContract.install();
const storeClassBeforeShim = CatalogDocumentStore;
assert(CatalogTableBindingOverridesContract.install(), "O shim não encontrou o document-store.");
assert(CatalogDocumentStore === storeClassBeforeShim, "O shim ainda substitui a classe canônica.");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const clone = value => JSON.parse(JSON.stringify(value));
const findType = (component, type) => {
  if (component?.type === type) return component;
  for (const child of component?.children || []) {
    const found = findType(child, type);
    if (found) return found;
  }
  return null;
};

function commercial(store, cardId) {
  const card = store.getProductCard(cardId);
  const table = findType(card, "data-table");
  const row = store.getTableRows(table)[0];
  return {
    card,
    table,
    values: clone(row?.metadata?.values || {}),
    overrides: clone(card?.binding?.overrides || {})
  };
}

const seed = new CatalogDocumentStore(createBlankCatalogDocument());
const product = seed.createProduct({
  title: "Produto vinculado",
  code: "ST-0001",
  package: "CAIXA 100",
  price: "R$ 111,99"
});
const createdCard = seed.addComponent("product-card", { x: 24, y: 24, width: 360, height: 300 }, { parentId: null });
seed.bindProduct(createdCard.id, product.id);
const cardId = createdCard.id;
const store = new CatalogDocumentStore(seed.getExportDocument());

let state = commercial(store, cardId);
assert(state.values.code === "ST-0001", `A fixture não recebeu o código: ${JSON.stringify(state.values)}.`);
assert(["code", "package", "price"].every(field => state.overrides[field] !== true), `A fixture começou com overrides: ${JSON.stringify(state.overrides)}.`);

store.replaceTableRowsBulk(state.table.id, [{
  values: { code: "VAR-001", package: "PACOTE 1", price: "R$ 17,00" }
}], { mode: "replace" });

state = commercial(store, cardId);
assert(state.values.code === "VAR-001" && state.values.package === "PACOTE 1" && state.values.price === "R$ 17,00", `A substituição não persistiu: ${JSON.stringify(state.values)}.`);
assert(["code", "package", "price"].every(field => state.overrides[field] === true), `A substituição não marcou overrides: ${JSON.stringify(state.overrides)}.`);
assert(store.getHistoryState().undoCount === 1, `A substituição deveria criar uma ação: ${JSON.stringify(store.getHistoryState())}.`);

assert(store.undo(), "Não foi possível desfazer a substituição.");
state = commercial(store, cardId);
assert(state.values.code === "ST-0001" && state.values.package === "CAIXA 100" && state.values.price === "R$ 111,99", `Undo não restaurou o produto: ${JSON.stringify(state.values)}.`);
assert(["code", "package", "price"].every(field => state.overrides[field] !== true), `Undo não removeu overrides: ${JSON.stringify(state.overrides)}.`);

assert(store.redo(), "Não foi possível refazer a substituição.");
state = commercial(store, cardId);
assert(state.values.code === "VAR-001" && state.values.package === "PACOTE 1" && state.values.price === "R$ 17,00", `Redo não restaurou a substituição: ${JSON.stringify(state.values)}.`);
assert(["code", "package", "price"].every(field => state.overrides[field] === true), "Redo não restaurou os overrides.");

const partial = new CatalogDocumentStore(seed.getExportDocument());
let partialState = commercial(partial, cardId);
partial.replaceTableRowsBulk(partialState.table.id, [{ values: { price: "R$ 9,00" } }], { mode: "replace" });
partialState = commercial(partial, cardId);
assert(partialState.overrides.price === true, "Campo presente não virou override.");
assert(partialState.overrides.code !== true && partialState.overrides.package !== true, `Campos ausentes viraram override: ${JSON.stringify(partialState.overrides)}.`);

const synchronized = new CatalogDocumentStore(seed.getExportDocument());
let synchronizedState = commercial(synchronized, cardId);
synchronized.replaceTableRowsBulk(synchronizedState.table.id, [{
  values: { code: "SYNC-001", package: "SYNC", price: "R$ 1,00" }
}], { mode: "replace", bindingSync: true });
synchronizedState = commercial(synchronized, cardId);
assert(["code", "package", "price"].every(field => synchronizedState.overrides[field] !== true), `Sincronização interna virou override: ${JSON.stringify(synchronizedState.overrides)}.`);

const generated = new CatalogDocumentStore(createBlankCatalogDocument());
const generatedProduct = generated.createProduct({
  title: "Produto gerado",
  code: "GEN-001",
  package: "CAIXA 50",
  price: "R$ 50,00"
});
const composition = generated.createCardsForProducts([generatedProduct.id], { columns: 1, density: "compact", parentId: null });
const generatedCard = composition.cards[0];
const generatedTable = findType(generatedCard, "data-table");
const generatedRow = generated.getTableRows(generatedTable)[0];
assert(generatedRow?.metadata?.values?.code === "GEN-001", `A geração interna não materializou o produto: ${JSON.stringify(generatedRow?.metadata?.values)}.`);
assert(["code", "package", "price"].every(field => generatedCard.binding?.overrides?.[field] !== true), `A geração interna virou override: ${JSON.stringify(generatedCard.binding?.overrides)}.`);

const appStore = fs.readFileSync(path.join(root, "app", "document-store.js"), "utf8");
const kitStore = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "document-store.js"), "utf8");
const appShim = fs.readFileSync(path.join(root, "app", "table-binding-overrides-contract.js"), "utf8");
const kitShim = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "table-binding-overrides-contract.js"), "utf8");
assert(appStore === kitStore, "O document-store divergiu entre editor e AuthoringKit.");
assert(appShim === kitShim, "O shim divergiu entre editor e AuthoringKit.");
assert(CatalogTableBindingOverridesContract.VERSION === "05.19.1", "Versão inesperada do shim.");

console.log("✓ Overrides de tabela pertencem ao store canônico; shim não substitui classe e sincronizações internas permanecem limpas.");
