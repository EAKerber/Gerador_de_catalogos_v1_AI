/* Auditoria 05.18 — estresse determinístico de domínio, limites e histórico. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const outputDir = path.resolve(process.env.CATALOG_STRESS_OUTPUT_DIR || "/tmp/catalog-developer-b-stress", "domain");
const seed = Number(process.env.CATALOG_STRESS_SEED || 5182026);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));
const stableSnapshot = state => {
  const snapshot = clone(state);
  delete snapshot.editor;
  delete snapshot.updatedAt;
  return snapshot;
};
const canonicalize = value => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  return value;
};
const signature = state => JSON.stringify(canonicalize(stableSnapshot(state)));

fs.mkdirSync(outputDir, { recursive: true });
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {}, clear() {} };
global.CatalogEditorIcon = () => "";

[
  "app/tokens.js",
  "app/catalog-source.js",
  "app/table-schema-registry.js",
  "app/catalog-generation-plan.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/icon-library.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/component-intent-registry.js",
  "app/section-recipes.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/catalog-validator.js",
  "app/fact-recipe-contract.js",
  "app/callout-recipe-contract.js",
  "app/component-initial-placement-contract.js",
  "app/text-alignment-contract.js",
  "app/text-scale-contract.js",
  "app/text-overflow-contract.js",
  "app/icon-scale-contract.js",
  "app/product-hero-contract.js",
  "app/product-technical-contract.js",
  "app/product-variants-contract.js",
  "app/product-data-only-contract.js",
  "app/reflow-history-stability-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

[
  CatalogFactRecipeContract,
  CatalogCalloutRecipeContract,
  CatalogComponentInitialPlacementContract,
  CatalogTextAlignmentContract,
  CatalogTextScaleContract,
  CatalogTextOverflowContract,
  CatalogIconScaleContract,
  CatalogProductHeroContract,
  CatalogProductTechnicalContract,
  CatalogProductVariantsContract,
  CatalogProductDataOnlyContract
].forEach(contract => {
  if (contract?.install && contract.install() === false) throw new Error(`Contrato não instalado: ${contract.VERSION || "sem versão"}.`);
});

function mulberry32(value) {
  let state = value >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let result = state;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}

function visit(children, callback, parent = null) {
  (children || []).forEach(component => {
    callback(component, parent);
    visit(component.children, callback, component);
  });
}

function allComponents(store) {
  const components = [];
  visit(store.getPage().children, component => components.push(component));
  return components;
}

const random = mulberry32(seed);
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const events = [];
store.subscribe((state, change) => {
  if (change?.type !== "init") events.push(change?.type || "unknown");
});

const products = store.createProductsBulk(Array.from({ length: 10 }, (_, index) => ({
  title: `Produto ${index + 1}`,
  code: `P-${1000 + index}`,
  package: `CX ${index + 1}`,
  price: `R$ ${10 + index},90`,
  specOne: `${20 + index} kg`,
  specTwo: `${40 + index} cm`
})));
assert(products.length === 10, "A criação em lote não produziu dez produtos.");

const composition = store.createCardsForProducts(products.map(product => product.id), { columns: 4, density: "compact", parentId: null });
assert(composition.cards.length === 10, "A grade não produziu dez cards.");
assert(store.getHistoryState().undoCount === 2, `Criação em lote e grade deveriam ocupar duas ações: ${JSON.stringify(store.getHistoryState())}.`);

const firstCard = composition.cards[0];
const firstTable = (() => {
  let table = null;
  visit([firstCard], component => { if (!table && component.type === "data-table") table = component; });
  return table;
})();
assert(firstTable, "O primeiro card não possui tabela.");

const beforeRows = store.getHistoryState().undoCount;
store.replaceTableRowsBulk(firstTable.id, Array.from({ length: 12 }, (_, index) => ({
  code: `VAR-${index + 1}`,
  package: `PACOTE ${index + 1}`,
  price: `R$ ${index + 1},00`
})), { mode: "replace" });
assert(store.getTableRows(firstTable).length === 12, "A tabela não atingiu o limite de doze linhas.");
assert(store.getHistoryState().undoCount === beforeRows + 1, "A substituição da tabela fragmentou o histórico.");
assert(["code", "package", "price"].every(field => firstCard.binding?.overrides?.[field] === true), "A substituição local não marcou overrides canônicos.");

const beforeGallery = store.getHistoryState().undoCount;
let art = null;
visit([firstCard], component => { if (!art && component.type === "art") art = component; });
assert(art, "O primeiro card não possui arte.");
const gallery = store.addArtVariation(art.id);
store.applyGalleryItemsBulk(gallery.id, Array.from({ length: 8 }, (_, index) => ({ caption: `Variação ${index + 1}` })), { mode: "replace" });
assert(gallery.children.filter(child => child.type === "art").length === 8, "A galeria não materializou oito itens.");
assert(store.getHistoryState().undoCount === beforeGallery + 2, "Conversão e edição da galeria não ocuparam duas ações.");

const cards = composition.cards.slice(0, 5);
const beforePresentations = store.getHistoryState().undoCount;
store.setPresentationBatch(cards.map(card => card.id), { density: "comfortable", responsiveState: "wide" });
assert(store.getHistoryState().undoCount === beforePresentations + 1, "A apresentação em lote fragmentou o histórico.");

const beforeStyles = store.getHistoryState().undoCount;
store.setStyleBatch(cards.map(card => card.id), { accentColor: "brand.secondary" });
assert(store.getHistoryState().undoCount === beforeStyles + 1, "O estilo em lote fragmentou o histórico.");

const area = composition.area;
store.setEditingContext(area.id);
store.setSelection(cards[0].id);
cards.slice(1, 4).forEach(card => store.setSelection(card.id, { additive: true }));
const beforeFrames = store.getHistoryState().undoCount;
store.applyComponentFramesBulk(cards.slice(0, 4).map((card, index) => ({
  id: card.id,
  x: 8 + index * 132,
  y: 8,
  width: 120,
  height: 220 + Math.round(random() * 20)
})));
assert(store.getHistoryState().undoCount === beforeFrames + 1, "A geometria em lote fragmentou o histórico.");

const snapshotBeforeUndo = signature(store.getState());
const undoCount = store.getHistoryState().undoCount;
for (let index = 0; index < Math.min(6, undoCount); index += 1) assert(store.undo(), `Undo ${index + 1} falhou.`);
for (let index = 0; index < Math.min(6, undoCount); index += 1) assert(store.redo(), `Redo ${index + 1} falhou.`);
assert(signature(store.getState()) === snapshotBeforeUndo, "Undo/redo em sequência não restaurou o snapshot canônico.");

const report = store.getPublicationReport("draft");
const components = allComponents(store);
const evidence = {
  seed,
  products: store.getProducts().length,
  components: components.length,
  tableRows: store.getCollection("tableRows")?.items.length || 0,
  history: store.getHistoryState(),
  events: events.length,
  report: {
    ok: report.ok,
    issues: (report.issues || []).map(issue => ({ code: issue.code, severity: issue.severity, componentId: issue.componentId || null }))
  }
};
fs.writeFileSync(path.join(outputDir, "domain-summary.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`✓ Estresse de domínio concluído com ${evidence.products} produtos, ${evidence.components} componentes e ${evidence.history.undoCount} ações reversíveis.`);
