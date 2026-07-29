const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
for (const file of ["app/layout-engine.js", "app/component-registry.js", "app/collection-registry.js", "app/document-store.js"]) vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const area = store.addComponent("layout-container", { x: 24, y: 100, width: 720, height: 380 });
const card = store.addComponent("product-card", { x: 0, y: 0, width: 320, height: 300 }, { parentId: area.id });
store.setEditingContext(area.id);
store.setSelection(card.id);

const nested = store.insertComponent("specification");
assert(store.getParentId(nested.id) === card.id, "O + não priorizou o contêiner selecionado.");
assert(store.getState().editor.editingContextId === card.id, "A inserção contextual não entrou no contêiner alvo.");
assert(store.getState().editor.selectedComponentId === nested.id, "A nova peça não permaneceu selecionada.");

store.setEditingContext(area.id);
store.setSelection(card.id);
const overlaid = store.insertComponent("specification", { preferCurrentContext: true });
assert(store.getParentId(overlaid.id) === area.id, "Shift não preservou a inserção no contexto atual.");
assert(store.getState().editor.editingContextId === area.id, "Shift alterou o contexto de edição.");

console.log("✓ Destino contextual do +, foco automático e override por Shift validados.");
