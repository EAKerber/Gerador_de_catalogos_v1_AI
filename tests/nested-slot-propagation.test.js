/* Integração 05.20 — redimensionar um slot pai recalcula os slots dos contêineres filhos. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";

[
  "app/tokens.js",
  "app/catalog-source.js",
  "app/table-schema-registry.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/section-recipes.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/callout-recipe-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
CatalogCalloutRecipeContract.install();
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const footer = store.insertComponent("catalog-footer");
store.updateComponent(footer.id, { frame: { height: 80 } });

const resizedFooter = store.findComponent(footer.id).component;
assert(resizedFooter.frame.height === 80, `O rodapé não permaneceu em 80 px: ${resizedFooter.frame.height}.`);

for (const item of resizedFooter.children.filter(component => component.type === "footer-item")) {
  assert(item.frame.height === 77, `O footer-item não acompanhou o slot de 77 px: ${JSON.stringify(item.frame)}.`);
  for (const child of item.children.filter(component => component.type === "text")) {
    assert(CatalogLayoutEngine.itemMinimum(child, child.frame).height === 14, `O contrato de callout elevou indevidamente o mínimo de ${child.slot?.name}.`);
    assert(child.frame.y + child.frame.height <= item.frame.height, `O slot ${child.slot?.name} permaneceu com geometria anterior ao resize: ${JSON.stringify(child.frame)} em ${JSON.stringify(item.frame)}.`);
  }
}

console.log("✓ Slots aninhados acompanham o redimensionamento do contêiner pai até o mínimo de 80 px.");
