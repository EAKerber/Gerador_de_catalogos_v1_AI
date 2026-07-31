/* 05.51 — densidade interna discreta e reversível de specification. */
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

const definition = CATALOG_COMPONENT_REGISTRY.specification;
const fields = Object.fromEntries(definition.contentFields.map(field => [field.path, field]));
assert(["densityPreset", "iconScale", "gap", "padding"].every(path => fields[path]), "O inspetor não publicou todos os controles internos.");
assert(fields.gap.options.map(option => String(option.value)).join(",") === "auto,3,7,10", "Gap deixou de ser discreto.");
assert(fields.padding.options.map(option => String(option.value)).join(",") === "auto,2,4,6", "Padding deixou de ser discreto.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const first = store.addComponent("specification", { x: 20, y: 20, width: 150, height: 54 });
const second = store.addComponent("specification", { x: 190, y: 20, width: 150, height: 54 });
const firstFrame = clone(first.frame);
const secondFrame = clone(second.frame);

assert(first.props.densityPreset === "auto" && first.props.gap === "auto" && first.props.padding === "auto", "Specification nova não preservou o fallback automático.");
const automaticRender = definition.render(first);
assert(!automaticRender.includes("--specification-gap:") && !automaticRender.includes("--specification-padding-x:"), "Automático materializou espaçamento inline.");

const historyBeforeSingle = store.getHistoryState().undoCount;
store.setSpecificationDensity(first.id, "comfortable");
let current = store.findComponent(first.id).component;
assert(current.props.densityPreset === "comfortable" && current.props.iconScale === 120 && current.props.gap === 10 && current.props.padding === 6, "Preset confortável não foi materializado integralmente.");
assert(store.getHistoryState().undoCount === historyBeforeSingle + 1, "Preset individual não gerou uma entrada de histórico.");
assert(JSON.stringify(current.frame) === JSON.stringify(firstFrame), "Preset individual alterou o frame externo.");
const comfortableRender = definition.render(current);
assert(comfortableRender.includes("--specification-gap:10px") && comfortableRender.includes("--specification-padding-x:6px") && comfortableRender.includes("--specification-padding-y:3px"), "Render não publicou o preset confortável.");

const historyBeforeBatch = store.getHistoryState().undoCount;
store.setSpecificationDensityBatch([first.id, second.id], "compact");
assert(store.getHistoryState().undoCount === historyBeforeBatch + 1, "Lote gerou mais de uma entrada de histórico.");
[first.id, second.id].forEach(id => {
  const component = store.findComponent(id).component;
  assert(component.props.densityPreset === "compact" && component.props.iconScale === 80 && component.props.gap === 3 && component.props.padding === 2, "Lote compacto ficou incompleto.");
});
assert(JSON.stringify(store.findComponent(first.id).component.frame) === JSON.stringify(firstFrame), "Lote alterou o primeiro frame.");
assert(JSON.stringify(store.findComponent(second.id).component.frame) === JSON.stringify(secondFrame), "Lote alterou o segundo frame.");

assert(store.undo(), "Não foi possível desfazer o lote.");
assert(store.findComponent(first.id).component.props.densityPreset === "comfortable", "Undo não restaurou o primeiro preset.");
assert(store.findComponent(second.id).component.props.densityPreset === "auto", "Undo não restaurou o segundo preset.");
assert(store.redo(), "Não foi possível refazer o lote.");

const imported = new CatalogDocumentStore(store.getExportDocument());
assert(imported.getState().schemaVersion === "1.16.0", "Densidade interna exigiu mudança de schema.");
assert(imported.findComponent(first.id).component.props.densityPreset === "compact", "Importação não preservou a densidade.");
imported.updateComponent(first.id, { props: { densityPreset: "custom", iconScale: 100, gap: 7, padding: 6 } });
const customRender = definition.render(imported.findComponent(first.id).component);
assert(customRender.includes('data-density-preset="custom"') && customRender.includes("--specification-gap:7px") && customRender.includes("--specification-padding-x:6px"), "Ajuste personalizado não foi renderizado.");

console.log("✓ 05.51 preserva presets, ajustes discretos, lote, undo/redo, frames, importação e schema.");
