/* Auditoria 05.18 — reflow manual deve sincronizar o baseline da próxima ação. */
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

CatalogTextAlignmentContract.install();
CatalogTextScaleContract.install();
CatalogTextOverflowContract.install();
CatalogIconScaleContract.install();
CatalogProductHeroContract.install();
CatalogProductTechnicalContract.install();
CatalogProductVariantsContract.install();
CatalogProductDataOnlyContract.install();
CatalogReflowHistoryStabilityContract.install();

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));
const stable = state => {
  const value = clone(state);
  delete value.editor;
  delete value.updatedAt;
  return value;
};
const canonicalize = value => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  return value;
};
const signature = state => JSON.stringify(canonicalize(stable(state)));

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const area = store.addComponent("layout-container", { x: 24, y: 24, width: 746, height: 900 }, {
  parentId: null,
  layout: { mode: "grid", columns: 12, padding: 0, gap: 0, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 320, mode: "column" } }
});
for (let index = 0; index < 15; index += 1) store.addComponent(index % 2 ? "icon" : "text", { x: 0, y: 0, width: 80, height: 34 }, { parentId: area.id });
const card = store.addComponent("product-card", { x: 0, y: 0, width: 280, height: 240 }, { parentId: area.id });

const historyBeforeManual = store.getHistoryState().undoCount;
store.findComponent(card.id).component.frame.width = 66;
assert(store.reflowComponentTree(area.id), "O reflow manual não foi executado.");
assert(store.getHistoryState().undoCount === historyBeforeManual, "O reflow manual criou uma entrada de histórico.");
assert(store.findComponent(card.id).component.frame.width >= 220, "O reflow manual não restaurou o mínimo do card.");
const postReflowSignature = signature(store.getState());

const added = store.addComponent("text", { x: 0, y: 0, width: 100, height: 34 }, { parentId: area.id, props: { content: "AÇÃO APÓS REFLOW" } });
assert(store.findComponent(added.id), "A ação posterior ao reflow não foi criada.");
assert(store.undo(), "Não foi possível desfazer a ação posterior ao reflow.");
assert(signature(store.getState()) === postReflowSignature, "Undo voltou ao snapshot anterior ao reflow manual.");
assert(!store.findComponent(added.id), "Undo preservou o elemento criado depois do reflow.");
assert(store.redo(), "Não foi possível refazer a ação posterior ao reflow.");
assert(store.findComponent(added.id), "Redo não restaurou o elemento posterior ao reflow.");

const beforeDerivedState = signature(store.getState());
const beforeDerivedHistory = store.getHistoryState().undoCount;
const derivedCard = store.findComponent(card.id).component;
derivedCard.props = { ...(derivedCard.props || {}), auditDerivedState: "preservado" };
assert(store.reflowComponentTree(derivedCard, { derived: true }), "O reflow derivado não foi executado.");
const afterDerivedState = signature(store.getState());
assert(afterDerivedState !== beforeDerivedState, "A fixture derivada não alterou o documento.");
store.emit({ type: "derived-reflow-probe", componentId: derivedCard.id });
assert(store.getHistoryState().undoCount === beforeDerivedHistory + 1, "O reflow derivado sincronizou o baseline antes da captura.");
assert(store.undo(), "Não foi possível desfazer a ação com reflow derivado.");
assert(signature(store.getState()) === beforeDerivedState, "Undo não restaurou o estado anterior ao reflow derivado.");
assert(store.redo(), "Não foi possível refazer a ação com reflow derivado.");
assert(signature(store.getState()) === afterDerivedState, "Redo não restaurou o estado estabilizado pelo reflow derivado.");

assert(store.getState().schemaVersion === "1.16.0", "A sincronização alterou o schema.");
assert(CatalogReflowHistoryStabilityContract.VERSION === "05.18.audit.4", "Versão inesperada do contrato de estabilidade.");

console.log("✓ Reflow manual sincroniza baseline; reflow derivado permanece dentro da próxima ação de histórico.");
