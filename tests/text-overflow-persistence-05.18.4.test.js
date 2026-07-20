/* DB-05.18.4 — políticas wrap, ellipsis e clip com persistência e legado. */
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
  "app/text-scale-contract.js",
  "app/text-overflow-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));
const findIn = (children, id) => {
  for (const component of children || []) {
    if (component.id === id) return component;
    const nested = findIn(component.children, id);
    if (nested) return nested;
  }
  return null;
};

CatalogTextAlignmentContract.install();
CatalogTextScaleContract.install();
const installation = CatalogTextOverflowContract.install();
assert(installation.registryInstalled && installation.storeInstalled, "O contrato de overflow não foi instalado.");

const overflowField = CATALOG_COMPONENT_REGISTRY.text.contentFields.find(field => field.path === "overflow");
assert(overflowField, "O campo de overflow não está publicado.");
assert(overflowField.options.map(option => option.value).join(",") === "wrap,ellipsis,clip", "O vocabulário de overflow deixou de ser canônico.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const text = store.addComponent("text", { x: 20, y: 20, width: 180, height: 52 });
store.updateComponent(text.id, { props: { content: "Conteúdo longo para diferenciar quebra, reticências e corte visual." } });
assert(text.props.overflow === "wrap" && text.props.overflowExplicit === false, "O texto autônomo perdeu o default wrap.");

for (const overflow of ["wrap", "ellipsis", "clip"]) {
  store.updateComponent(text.id, { props: { overflow } });
  const current = store.findComponent(text.id).component;
  assert(current.props.overflow === overflow && current.props.overflowExplicit === true, `A política ${overflow} não foi persistida como explícita.`);
  assert(CATALOG_COMPONENT_REGISTRY.text.render(current).includes(`data-text-overflow="${overflow}"`), `A política ${overflow} não foi publicada no markup.`);
}

const frameBefore = clone(store.findComponent(text.id).component.frame);
const historyBefore = store.getHistoryState().undoCount;
store.updateComponent(text.id, { props: { overflow: "ellipsis" } });
assert(store.getHistoryState().undoCount === historyBefore + 1, "A mudança de overflow não gerou uma entrada de histórico.");
assert(JSON.stringify(store.findComponent(text.id).component.frame) === JSON.stringify(frameBefore), "O overflow modificou o frame externo.");
assert(store.undo(), "Não foi possível desfazer overflow.");
assert(store.findComponent(text.id).component.props.overflow === "clip", "Desfazer não restaurou a política anterior.");
assert(store.redo(), "Não foi possível refazer overflow.");
assert(store.findComponent(text.id).component.props.overflow === "ellipsis", "Refazer não restaurou reticências.");

const exported = store.getExportDocument();
const imported = new CatalogDocumentStore(exported);
assert(imported.findComponent(text.id).component.props.overflow === "ellipsis", "Exportação/importação não preservou reticências.");

const footer = imported.addComponent("footer-item", { x: 20, y: 100, width: 180, height: 96 });
const footerTitle = footer.children.find(component => component.type === "text" && component.slot?.name === "title");
assert(footerTitle.props.overflow === "ellipsis" && footerTitle.props.overflowExplicit === false, "O rodapé não preservou reticências como default estrutural.");
imported.updateComponent(footerTitle.id, { props: { overflow: "wrap" } });
assert(imported.findComponent(footerTitle.id).component.props.overflow === "wrap", "A escolha explícita wrap não foi aplicada no rodapé.");
assert(imported.findComponent(footerTitle.id).component.props.overflowExplicit === true, "A escolha explícita wrap não foi marcada.");
const explicitWrap = new CatalogDocumentStore(imported.getExportDocument());
assert(explicitWrap.findComponent(footerTitle.id).component.props.overflow === "wrap", "A escolha explícita wrap foi confundida com o fallback legado.");

const legacy = clone(imported.getExportDocument());
const legacyTitle = findIn(legacy.pages[0].children, footerTitle.id);
legacyTitle.props.overflow = "wrap";
delete legacyTitle.props.overflowExplicit;
const migratedLegacy = new CatalogDocumentStore(legacy);
assert(migratedLegacy.findComponent(footerTitle.id).component.props.overflow === "ellipsis", "O documento legado não preservou a aparência anterior com reticências.");
assert(migratedLegacy.findComponent(footerTitle.id).component.props.overflowExplicit === false, "O fallback legado foi marcado como explícito.");
assert(migratedLegacy.getState().schemaVersion === "1.16.0", "O overflow exigiu mudança de schema.");

imported.updateComponent(text.id, { props: { overflow: "desconhecido" } });
assert(CATALOG_COMPONENT_REGISTRY.text.render(imported.findComponent(text.id).component).includes('data-text-overflow="wrap"'), "Overflow inválido não usou fallback wrap.");

console.log("✓ DB-05.18.4 preserva políticas de overflow, histórico, importação e legado.");
