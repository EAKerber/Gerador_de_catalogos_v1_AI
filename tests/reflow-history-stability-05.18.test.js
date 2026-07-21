/* Auditoria 05.18 — snapshots restaurados devem preservar geometria convergida. */
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
const signature = state => JSON.stringify(stable(state));

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const area = store.addComponent("layout-container", { x: 24, y: 24, width: 746, height: 900 }, {
  parentId: null,
  layout: { mode: "grid", columns: 4, padding: 4, gap: 2, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 320, mode: "column" } }
});
for (let index = 0; index < 15; index += 1) {
  store.addComponent(index % 2 ? "icon" : "text", { x: 0, y: 0, width: 80, height: 34 }, { parentId: area.id });
}
const card = store.addComponent("product-card", { x: 0, y: 0, width: 280, height: 240 }, { parentId: area.id });

const beforeExtreme = signature(store.getState());
store.updateComponent(area.id, { layout: { mode: "grid", columns: 12, padding: 0, gap: 0 } });
const afterExtreme = signature(store.getState());
const widthAfterOperation = store.findComponent(card.id).component.frame.width;
assert(widthAfterOperation >= 220, `A operação registrada terminou abaixo do mínimo do card: ${widthAfterOperation}.`);

const beforeSecondReflow = signature(store.getState());
store.reflowComponentTree(area.id);
assert(signature(store.getState()) === beforeSecondReflow, "Um segundo reflow alterou o estado já registrado.");

assert(store.undo(), "Não foi possível desfazer o layout extremo.");
assert(signature(store.getState()) === beforeExtreme, "Undo não restaurou o estado anterior ao layout extremo.");
assert(store.redo(), "Não foi possível refazer o layout extremo.");
assert(signature(store.getState()) === afterExtreme, "Redo não restaurou a geometria convergida capturada no histórico.");
const widthAfterRedo = store.findComponent(card.id).component.frame.width;
assert(widthAfterRedo === widthAfterOperation, `Redo alterou a largura do card: ${widthAfterOperation} -> ${widthAfterRedo}.`);

const afterRedo = signature(store.getState());
store.reflowComponentTree(area.id);
assert(signature(store.getState()) === afterRedo, "Reflow após redo ainda encontrou geometria pendente.");

const imported = new CatalogDocumentStore(store.getExportDocument());
assert(signature(imported.getState()) === afterExtreme, "Importação não preservou a geometria convergida.");
assert(imported.getLastReflowStability()?.roots >= 1, "O contrato não registrou estabilização de raízes.");
assert(imported.getState().schemaVersion === "1.16.0", "A correção alterou o schema.");

const app = fs.readFileSync(path.join(root, "app", "reflow-history-stability-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "reflow-history-stability-contract.js"), "utf8");
assert(app === kit, "O contrato de estabilidade divergiu entre editor e AuthoringKit.");

console.log(`✓ Reflow restaurado permanece convergido: card ${widthAfterOperation}px, undo/redo/importação estáveis.`);
