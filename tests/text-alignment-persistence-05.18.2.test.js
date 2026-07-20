/* DB-05.18.2 — alinhamento horizontal/vertical, histórico e importação. */
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
  "app/text-alignment-contract.js"
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

const installation = CatalogTextAlignmentContract.install();
assert(installation.registryInstalled && installation.storeInstalled, "O contrato não foi instalado no registro e na store.");
assert(CatalogTextAlignmentContract.VERSION === "05.18.2", "Versão inesperada do contrato de alinhamento.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const standalone = store.addComponent("text", { x: 20, y: 20, width: 260, height: 80 });
assert(standalone.props.align === "start" && standalone.props.verticalAlign === "center", "O texto autônomo perdeu seus defaults conservadores.");
assert(standalone.props.alignExplicit === false, "O alinhamento inicial não deveria ser explícito.");

for (const align of ["start", "center", "end"]) {
  store.updateComponent(standalone.id, { props: { align } });
  assert(store.findComponent(standalone.id).component.props.align === align, `O alinhamento ${align} não foi persistido.`);
  assert(store.findComponent(standalone.id).component.props.alignExplicit === true, `O alinhamento ${align} não foi marcado como explícito.`);
}
for (const verticalAlign of ["start", "center", "end"]) {
  store.updateComponent(standalone.id, { props: { verticalAlign } });
  assert(store.findComponent(standalone.id).component.props.verticalAlign === verticalAlign, `O alinhamento vertical ${verticalAlign} não foi persistido.`);
}

const footer = store.addComponent("footer-item", { x: 20, y: 130, width: 160, height: 96 });
const footerTitle = footer.children.find(component => component.type === "text" && component.slot?.name === "title");
const footerSubtitle = footer.children.find(component => component.type === "text" && component.slot?.name === "subtitle");
assert(footerTitle && footerSubtitle, "O item de rodapé não materializou seus dois textos.");
assert(footerTitle.props.align === "center" && footerSubtitle.props.align === "center", "O alinhamento estrutural do rodapé não foi preservado como default do componente.");
assert(footerTitle.props.alignExplicit === false && footerSubtitle.props.alignExplicit === false, "O default do rodapé foi marcado incorretamente como escolha explícita.");

const frameBefore = clone(footerTitle.frame);
const historyBefore = store.getHistoryState().undoCount;
store.updateComponent(footerTitle.id, { props: { align: "end" } });
assert(store.getHistoryState().undoCount === historyBefore + 1, "Uma mudança de alinhamento não gerou exatamente uma entrada de histórico.");
assert(store.findComponent(footerTitle.id).component.props.align === "end", "A escolha Fim não foi aplicada ao texto do rodapé.");
assert(store.findComponent(footerTitle.id).component.props.alignExplicit === true, "A escolha Fim não foi marcada como explícita.");
assert(JSON.stringify(store.findComponent(footerTitle.id).component.frame) === JSON.stringify(frameBefore), "Alterar alinhamento modificou o frame do texto.");

assert(store.undo(), "Não foi possível desfazer o alinhamento.");
assert(store.findComponent(footerTitle.id).component.props.align === "center", "Desfazer não restaurou o default central do rodapé.");
assert(store.redo(), "Não foi possível refazer o alinhamento.");
assert(store.findComponent(footerTitle.id).component.props.align === "end", "Refazer não restaurou a escolha Fim.");

const exportedEnd = store.getExportDocument();
const importedEnd = new CatalogDocumentStore(exportedEnd);
const importedTitle = importedEnd.findComponent(footerTitle.id).component;
assert(importedTitle.props.align === "end" && importedTitle.props.alignExplicit === true, "Exportação/importação não preservou a escolha explícita Fim.");

importedEnd.updateComponent(footerTitle.id, { props: { align: "start" } });
const exportedStart = importedEnd.getExportDocument();
const reimportedStart = new CatalogDocumentStore(exportedStart);
const reimportedTitle = reimportedStart.findComponent(footerTitle.id).component;
assert(reimportedTitle.props.align === "start" && reimportedTitle.props.alignExplicit === true, "Uma escolha explícita Início foi confundida com o fallback legado.");

const legacy = clone(exportedEnd);
const legacyTitle = findIn(legacy.pages[0].children, footerTitle.id);
legacyTitle.props.align = "start";
delete legacyTitle.props.alignExplicit;
const migratedLegacy = new CatalogDocumentStore(legacy);
const migratedLegacyTitle = migratedLegacy.findComponent(footerTitle.id).component;
assert(migratedLegacyTitle.props.align === "center", "O documento legado não preservou a aparência central anterior do rodapé.");
assert(migratedLegacyTitle.props.alignExplicit === false, "O fallback legado foi marcado como escolha explícita.");
assert(migratedLegacy.getState().schemaVersion === "1.16.0", "O contrato exigiu mudança de schema.");

const analyzed = store.analyzeDocument(legacy);
const analyzedTitle = findIn(analyzed.document.pages[0].children, footerTitle.id);
assert(analyzed.ok && analyzedTitle.props.align === "center", "A análise de importação não aplicou o fallback legado antes do commit.");

console.log("✓ DB-05.18.2 preserva alinhamento, histórico, importação e aparência legada do rodapé.");
