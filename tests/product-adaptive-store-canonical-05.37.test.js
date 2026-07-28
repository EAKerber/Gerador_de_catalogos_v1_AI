/* Incremento 05.37 — variants e data-only no store canônico. */
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
  "app/product-variants-contract.js",
  "app/product-data-only-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const Store = CatalogDocumentStore;
const emit = Store.prototype.emit;
const remove = Store.prototype.deleteComponent;

const dataInstallation = CatalogProductDataOnlyContract.install();
const variantsInstallation = CatalogProductVariantsContract.install();
assert(dataInstallation.geometryInstalled && dataInstallation.storeInstalled, "Data-only não reconheceu o store canônico.");
assert(variantsInstallation.geometryInstalled && variantsInstallation.storeInstalled, "Variants não reconheceu o store canônico.");
assert(CatalogDocumentStore === Store, "A instalação substituiu a identidade da store.");
assert(Store.prototype.emit === emit, "A instalação substituiu emit.");
assert(Store.prototype.deleteComponent === remove, "A instalação substituiu deleteComponent.");

const store = new Store(createBlankCatalogDocument());
const variants = store.addComponent("product-card", { x: 20, y: 20, width: 280, height: 190 });
const dataOnly = store.addComponent("product-card", { x: 320, y: 20, width: 280, height: 190 });
store.setComponentPresentation(variants.id, {
  presetId: "product-variants",
  mode: "variants",
  density: "compact",
  responsiveState: "compact"
});
store.setComponentPresentation(dataOnly.id, {
  presetId: "product-standard",
  mode: "data-only",
  density: "standard",
  responsiveState: "compact"
});

assert(store.allAdaptiveProductCards().length === 2, "O store não encontrou os dois modos adaptativos.");
assert(store.allVariantsCards().map(card => card.id).join() === variants.id, "A compatibilidade variants retornou o card incorreto.");
assert(store.allDataOnlyCards().map(card => card.id).join() === dataOnly.id, "A compatibilidade data-only retornou o card incorreto.");
assert(store.getLastReflowStability()?.presentations === 2, "A estabilização não registrou os dois cards adaptativos.");

const art = store.findComponent(variants.id).component.children.find(child => child.slot?.name === "art");
const historyBeforeDelete = store.getHistoryState().undoCount;
store.deleteComponent(art.id);
assert(store.getHistoryState().undoCount === historyBeforeDelete + 1, "A exclusão em variants fragmentou o histórico.");
assert(!store.findComponent(variants.id).component.children.some(child => child.slot?.name === "art"), "A arte excluída foi recriada.");

const exported = store.getExportDocument();
const imported = new Store(exported);
assert(imported.allAdaptiveProductCards().length === 2, "A importação perdeu cards adaptativos.");
assert(imported.getHistoryState().undoCount === 0 && !imported.isDirty(), "A convergência inicial contaminou histórico ou dirty state.");
assert(CatalogProductVariantsContract.install().storeInstalled, "A reinstalação de variants deixou de ser idempotente.");
assert(CatalogProductDataOnlyContract.install().storeInstalled, "A reinstalação de data-only deixou de ser idempotente.");
assert(CatalogDocumentStore === Store, "A reinstalação alterou a identidade da store.");

console.log("✓ 05.37 consolida variants e data-only sem subclasses ou dependência da ordem de instalação.");
