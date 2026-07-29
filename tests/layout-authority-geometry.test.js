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
const area = store.addComponent("layout-container", { x: 24, y: 80, width: 500, height: 260 });
const text = store.addComponent("text", { x: 0, y: 0 }, { parentId: area.id });
store.markLayoutFree(text.id);
const x = text.frame.x + 17;
store.updateComponent(text.id, { frame: { x } });
const independentX = text.frame.x;
store.updateComponent(area.id, { frame: { width: area.frame.width + 40 } });
assert(text.layoutItem.managed === false && text.frame.x === independentX, "A exceção local não sobreviveu ao reflow do pai.");
store.setComponentLayoutAuthority(text.id, true);
assert(text.layoutItem.managed === true && text.frame.x !== independentX, "A reintegração explícita não recalculou a posição.");

store.updateComponent(area.id, { frame: { width: 1, height: 1 } });
const geometry = store.getLastGeometryResolution(area.id);
assert(geometry && geometry.requested.width === 1 && geometry.resolved.width > 1, "Requested/resolved não registrou o ajuste de mínimo.");
assert(geometry.reasons.includes("minimum-or-content"), "A resolução não explicou o motivo do ajuste.");

store.setEditingContext(area.id);
store.selectComponentInContext(area.id);
assert(store.getState().editor.editingContextId === null && store.getState().editor.selectedComponentId === area.id, "A seleção por camadas não transitou para o contexto do componente.");
const sibling = store.addComponent("text", { x: 180, y: 0 }, { parentId: area.id });
store.selectComponentInContext(text.id);
assert(store.getState().editor.editingContextId === area.id && store.getState().editor.selectedComponentId === text.id, "A seleção não entrou no contexto do descendente atomicamente.");
store.selectComponentInContext(sibling.id);
assert(store.getState().editor.editingContextId === area.id && store.getState().editor.selectedComponentId === sibling.id, "A alternância entre irmãos não preservou o contexto e o foco.");
console.log("✓ Autoridade local, geometria resolvida e seleção entre contextos validadas.");
