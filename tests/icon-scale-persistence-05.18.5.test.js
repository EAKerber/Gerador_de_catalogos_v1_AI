/* DB-05.18.5 — escala interna de icon sem alterar o frame externo. */
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
  "app/text-overflow-contract.js",
  "app/icon-scale-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));

CatalogTextAlignmentContract.install();
CatalogTextScaleContract.install();
CatalogTextOverflowContract.install();
const installation = CatalogIconScaleContract.install();
assert(installation.version === "05.18.5", "Versão inesperada do contrato de ícone.");

const scaleField = CATALOG_COMPONENT_REGISTRY.icon.contentFields.find(field => field.path === "iconScale");
assert(scaleField, "O campo de escala do ícone não está publicado.");
assert(scaleField.options.map(option => Number(option.value)).join(",") === "100,80,120", "A escala do ícone deixou de ser discreta.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const icon = store.addComponent("icon", { x: 20, y: 20, width: 56, height: 56 });
assert(icon.props.iconScale === 100, "O ícone não iniciou em 100%.");
const originalFrame = clone(icon.frame);
const historyBefore = store.getHistoryState().undoCount;
store.updateComponent(icon.id, { props: { iconScale: 120 } });
assert(store.findComponent(icon.id).component.props.iconScale === 120, "A escala 120% do ícone não foi persistida.");
assert(store.getHistoryState().undoCount === historyBefore + 1, "A escala do ícone não gerou uma entrada de histórico.");
assert(JSON.stringify(store.findComponent(icon.id).component.frame) === JSON.stringify(originalFrame), "A escala interna modificou o frame do ícone.");
assert(CATALOG_COMPONENT_REGISTRY.icon.render(store.findComponent(icon.id).component).includes("--icon-content-scale:1.2"), "O render não publicou o multiplicador 1.2.");

assert(store.undo(), "Não foi possível desfazer a escala do ícone.");
assert(store.findComponent(icon.id).component.props.iconScale === 100, "Desfazer não restaurou 100%.");
assert(store.redo(), "Não foi possível refazer a escala do ícone.");
assert(store.findComponent(icon.id).component.props.iconScale === 120, "Refazer não restaurou 120%.");

const imported = new CatalogDocumentStore(store.getExportDocument());
assert(imported.findComponent(icon.id).component.props.iconScale === 120, "Exportação/importação não preservou 120%.");
assert(imported.getState().schemaVersion === "1.16.0", "A escala do ícone exigiu mudança de schema.");

imported.updateComponent(icon.id, { props: { iconScale: 95 } });
assert(CATALOG_COMPONENT_REGISTRY.icon.render(imported.findComponent(icon.id).component).includes("--icon-content-scale:1"), "Valor livre não retornou ao fallback de 100%.");

const footer = imported.addComponent("footer-item", { x: 20, y: 100, width: 180, height: 96 });
const footerIcon = footer.children.find(component => component.type === "icon" && component.slot?.name === "icon");
assert(footerIcon && footerIcon.props.iconScale === 100, "O ícone do rodapé não preservou o default 100%.");
for (const scale of [80, 100, 120]) {
  imported.updateComponent(footerIcon.id, { props: { iconScale: scale } });
  assert(imported.findComponent(footerIcon.id).component.props.iconScale === scale, `O rodapé não persistiu ${scale}%.`);
}

console.log("✓ DB-05.18.5 preserva escala de ícone, histórico, frame, importação e schema.");
