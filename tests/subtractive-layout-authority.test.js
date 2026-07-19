/* Incremento 05.13 — auditoria comportamental das autoridades de layout. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
for (const file of ["app/layout-engine.js", "app/component-registry.js", "app/collection-registry.js", "app/document-store.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const area = store.addComponent("layout-container", { x: 24, y: 100, width: 730, height: 360 }, {
  layout: { mode: "row", responsive: { enabled: false } }
});
const card = store.addComponent("product-card", { x: 0, y: 0 }, { parentId: area.id });
store.addComponent("product-card", { x: 0, y: 0 }, { parentId: area.id });
const specification = card.children.find(child => child.slot?.name === "specifications");

store.markSlotFree(specification.id);
assert(specification.slot.managed === false, "O override local de slot não foi criado.");
store.updateComponent(area.id, { frame: { height: area.frame.height + 8 } });
assert(specification.slot.managed === false, "O reflow do pai apagou a autoridade local do slot descendente.");

store.updateComponent(card.id, { reflow: { mode: "manual" } });
store.markSlotFree(specification.id);
store.updateComponent(area.id, { frame: { height: area.frame.height + 8 } });
assert(specification.slot.managed === false, "O contêiner Manual deveria interromper a reintegração recursiva.");

store.fitComponentToSlot(specification.id);
assert(specification.slot.managed === true, "Reajustar ao slot não restaurou a mesma autoridade gerenciada.");

const freeText = store.addComponent("text", { x: 0, y: 0 }, { parentId: area.id, props: { content: "Livre" } });
store.markLayoutFree(freeText.id);
assert(freeText.layoutItem.managed === false, "O override do auto-layout não foi criado.");
store.fitComponentToAutoLayout(freeText.id);
assert(freeText.layoutItem.managed === true, "Reintegrar ao auto-layout não restaurou a autoridade gerenciada.");

const contract = {
  automaticReflowPreservesNestedOverrides: true,
  manualContainerPreservesNestedOverrides: true,
  fitSlotAndFitLayoutShareIntent: "return-to-managed-layout",
  diagnosis: "O toggle recursivo combina validade estrutural com persistência de overrides; os comandos de reajuste compartilham a intenção de devolver autoridade ao layout."
};

assert(contract.automaticReflowPreservesNestedOverrides && contract.manualContainerPreservesNestedOverrides, "O contrato de autoridade local ficou incompleto.");
console.log("✓ Autoridade local durável e reintegração explícita validadas.");
