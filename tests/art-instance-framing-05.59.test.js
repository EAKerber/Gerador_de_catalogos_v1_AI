/* Incremento 05.59 — enquadramento não destrutivo por instância de arte. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
global.document = { createElement() { return { click() {} }; } };
global.URL = { createObjectURL() { return ""; }, revokeObjectURL() {} };
global.Blob = class Blob {};

for (const file of ["app/layout-engine.js", "app/component-registry.js", "app/collection-registry.js", "app/document-store.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const art = store.addComponent("art", { x: 24, y: 24, width: 240, height: 160 });
assert(art.props.zoom === 100 && art.props.offsetX === 0 && art.props.offsetY === 0, "A arte não nasceu com enquadramento neutro.");

const historyBefore = store.getHistoryState().undoCount;
store.updateComponent(art.id, { props: { fit: "cover", focalX: 32, focalY: 68, zoom: 175, offsetX: -14, offsetY: 9 } });
assert(store.getHistoryState().undoCount === historyBefore + 1, "O enquadramento não formou uma única ação de histórico.");
assert(art.props.fit === "cover" && art.props.zoom === 175 && art.props.offsetX === -14 && art.props.offsetY === 9, "O enquadramento não foi aplicado integralmente.");

assert(store.undo(), "O enquadramento não pôde ser desfeito.");
const restored = store.findComponent(art.id).component;
assert(restored.props.fit === "contain" && restored.props.zoom === 100 && restored.props.offsetX === 0 && restored.props.offsetY === 0, "Undo não restaurou o enquadramento neutro.");
assert(store.redo(), "O enquadramento não pôde ser refeito.");

const exported = store.getExportDocument();
const imported = new CatalogDocumentStore(exported);
const roundTrip = imported.findComponent(art.id).component;
assert(roundTrip.props.focalX === 32 && roundTrip.props.focalY === 68, "O round-trip perdeu o ponto focal.");
assert(roundTrip.props.zoom === 175 && roundTrip.props.offsetX === -14 && roundTrip.props.offsetY === 9, "O round-trip perdeu zoom ou deslocamento.");

imported.updateComponent(art.id, { props: { zoom: 999, offsetX: -999, offsetY: 999 } });
assert(roundTrip.props.zoom === 400 && roundTrip.props.offsetX === -100 && roundTrip.props.offsetY === 100, "Os limites determinísticos do enquadramento não foram aplicados.");

const legacy = JSON.parse(JSON.stringify(exported));
const legacyArt = legacy.pages[0].children.find(component => component.id === art.id);
delete legacyArt.props.zoom;
delete legacyArt.props.offsetX;
delete legacyArt.props.offsetY;
const normalizedLegacy = new CatalogDocumentStore(legacy).findComponent(art.id).component;
assert(normalizedLegacy.props.zoom === 100 && normalizedLegacy.props.offsetX === 0 && normalizedLegacy.props.offsetY === 0, "Documento anterior ao 05.59 não recebeu defaults compatíveis.");

const gallery = store.addComponent("art-gallery", { x: 300, y: 24, width: 300, height: 180 });
const galleryArt = gallery.children.find(component => component.type === "art");
store.updateComponent(galleryArt.id, { props: { zoom: 140, offsetX: 12, offsetY: -7 } });
assert(galleryArt.props.zoom === 140 && galleryArt.props.offsetX === 12 && galleryArt.props.offsetY === -7, "A galeria não preservou enquadramento por filho.");

console.log("✓ 05.59 preserva zoom, deslocamento, undo/redo, round-trip, limites e galerias por instância.");
