/* DB-05.19.6 — escala interna da molécula specification sem shim de ícone. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = name => `<span class="icon-shell"><svg data-icon="${name}"></svg></span>`;
[
  "app/catalog-source.js",
  "app/presentation-registry.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/text-alignment-contract.js",
  "app/text-scale-contract.js",
  "app/text-overflow-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));

CatalogTextAlignmentContract.install();
CatalogTextScaleContract.install();
CatalogTextOverflowContract.install();

const scaleField = CATALOG_COMPONENT_REGISTRY.specification.contentFields.find(field => field.path === "iconScale");
assert(scaleField, "A escala interna não está publicada em specification.");
assert(scaleField.options.map(option => Number(option.value)).join(",") === "100,80,120", "A escala de specification deixou de ser discreta.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const standalone = store.addComponent("specification", { x: 20, y: 20, width: 150, height: 54 });
assert(standalone.props.iconScale === 100, "Specification não iniciou em 100%.");
const standaloneFrame = clone(standalone.frame);
const historyBefore = store.getHistoryState().undoCount;
store.updateComponent(standalone.id, { props: { iconScale: 120 } });
assert(store.findComponent(standalone.id).component.props.iconScale === 120, "Specification não persistiu 120%.");
assert(store.getHistoryState().undoCount === historyBefore + 1, "A escala de specification não gerou uma entrada de histórico.");
assert(JSON.stringify(store.findComponent(standalone.id).component.frame) === JSON.stringify(standaloneFrame), "A escala interna alterou o frame da molécula.");
assert(CATALOG_COMPONENT_REGISTRY.specification.render(store.findComponent(standalone.id).component).includes("--icon-content-scale:1.2"), "O render não publicou 1.2.");

assert(store.undo(), "Não foi possível desfazer a escala de specification.");
assert(store.findComponent(standalone.id).component.props.iconScale === 100, "Desfazer não restaurou 100%.");
assert(store.redo(), "Não foi possível refazer a escala de specification.");
assert(store.findComponent(standalone.id).component.props.iconScale === 120, "Refazer não restaurou 120%.");

const card = store.addComponent("product-card", { x: 20, y: 100, width: 420, height: 320 });
const cardSpecification = card.children.find(component => component.type === "specification");
assert(cardSpecification, "O card não materializou specification.");

for (const presentation of [
  { mode: "standard", density: "standard", responsiveState: "wide" },
  { mode: "hero", density: "comfortable", responsiveState: "wide" },
  { mode: "technical", density: "compact", responsiveState: "wide" },
  { mode: "variants", density: "compact", responsiveState: "compact" },
  { mode: "data-only", density: "compact", responsiveState: "wide" }
]) {
  store.setComponentPresentation(card.id, presentation);
  const cardFrame = clone(store.findComponent(card.id).component.frame);
  const slotFrame = clone(CatalogComponentGeometry.slotFrame(store.findComponent(card.id).component, "specifications"));
  for (const scale of [80, 100, 120]) {
    store.updateComponent(cardSpecification.id, { props: { iconScale: scale } });
    const currentCard = store.findComponent(card.id).component;
    const currentSpecification = store.findComponent(cardSpecification.id).component;
    assert(currentSpecification.props.iconScale === scale, `${presentation.mode} não persistiu ${scale}%.`);
    assert(JSON.stringify(currentCard.frame) === JSON.stringify(cardFrame), `${presentation.mode}/${scale}% alterou o frame do card.`);
    assert(JSON.stringify(CatalogComponentGeometry.slotFrame(currentCard, "specifications")) === JSON.stringify(slotFrame), `${presentation.mode}/${scale}% alterou o slot de especificações.`);
  }
}

const imported = new CatalogDocumentStore(store.getExportDocument());
assert(imported.findComponent(cardSpecification.id).component.props.iconScale === 120, "Exportação/importação não preservou 120% no card.");
assert(imported.getState().schemaVersion === "1.16.0", "A escala de specification exigiu mudança de schema.");
imported.updateComponent(standalone.id, { props: { iconScale: 95 } });
assert(CATALOG_COMPONENT_REGISTRY.specification.render(imported.findComponent(standalone.id).component).includes("--icon-content-scale:1"), "Valor livre não retornou ao fallback de 100%.");

console.log("✓ DB-05.19.6 preserva escala de specification, histórico, slots, apresentações e schema sem shim.");
