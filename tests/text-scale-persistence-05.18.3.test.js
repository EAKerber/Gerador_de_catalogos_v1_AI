/* DB-05.18.3 — escala tipográfica discreta, histórico e exportação. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = name => `<svg data-icon="${name}"></svg>`;
[
  "app/catalog-source.js",
  "app/presentation-registry.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/text-alignment-contract.js",
  "app/text-scale-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));

CatalogTextAlignmentContract.install();
const scaleInstallation = CatalogTextScaleContract.install();
assert(scaleInstallation.version === "05.18.3", "Versão inesperada do contrato de escala.");

const scaleField = CATALOG_COMPONENT_REGISTRY.text.contentFields.find(field => field.path === "scale");
assert(scaleField, "O campo de escala não está publicado no registro.");
assert(scaleField.options.map(option => Number(option.value)).join(",") === "100,80,120", "A escala deixou de ser discreta ou mudou sua ordem canônica.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const text = store.addComponent("text", { x: 20, y: 20, width: 260, height: 80 });
assert(text.props.scale === 100, "O texto não iniciou em 100%.");
const originalFrame = clone(text.frame);
const historyBefore = store.getHistoryState().undoCount;
store.updateComponent(text.id, { props: { scale: 120 } });
assert(store.findComponent(text.id).component.props.scale === 120, "A escala 120% não foi persistida.");
assert(store.getHistoryState().undoCount === historyBefore + 1, "A escala não gerou uma única entrada de histórico.");
assert(JSON.stringify(store.findComponent(text.id).component.frame) === JSON.stringify(originalFrame), "A escala interna modificou o frame externo.");
assert(CATALOG_COMPONENT_REGISTRY.text.render(store.findComponent(text.id).component).includes("--text-content-scale:1.2"), "A renderização não publicou o multiplicador 1.2.");

assert(store.undo(), "Não foi possível desfazer a escala.");
assert(store.findComponent(text.id).component.props.scale === 100, "Desfazer não restaurou 100%.");
assert(store.redo(), "Não foi possível refazer a escala.");
assert(store.findComponent(text.id).component.props.scale === 120, "Refazer não restaurou 120%.");

const exported = store.getExportDocument();
const imported = new CatalogDocumentStore(exported);
assert(imported.findComponent(text.id).component.props.scale === 120, "Exportação/importação não preservou 120%.");
assert(imported.getState().schemaVersion === "1.16.0", "A escala exigiu mudança de schema.");

imported.updateComponent(text.id, { props: { scale: 95 } });
const invalidMarkup = CATALOG_COMPONENT_REGISTRY.text.render(imported.findComponent(text.id).component);
assert(invalidMarkup.includes("--text-content-scale:1"), "Um valor livre não retornou ao fallback conservador de 100%.");

const footer = imported.addComponent("footer-item", { x: 20, y: 130, width: 180, height: 96 });
const footerTexts = footer.children.filter(component => component.type === "text");
assert(footerTexts.length === 2 && footerTexts.every(component => component.props.scale === 100), "Os textos do rodapé não preservaram 100% como escala inicial.");
footerTexts.forEach(component => {
  imported.updateComponent(component.id, { props: { scale: 80 } });
  assert(imported.findComponent(component.id).component.props.scale === 80, "A escala 80% não foi persistida em texto interno do rodapé.");
});

console.log("✓ DB-05.18.3 preserva escala discreta, histórico, frame e schema.");
