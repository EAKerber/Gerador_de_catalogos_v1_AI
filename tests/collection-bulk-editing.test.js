/* Incremento 05.17 checkpoint 2 — coleções manuais em lote. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
[
  "app/tokens.js", "app/catalog-source.js", "app/presentation-registry.js", "app/catalog-icons.js",
  "app/layout-engine.js", "app/component-registry.js", "app/collection-registry.js", "app/catalog-validator.js",
  "app/manual-entry.js", "app/document-store.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const gallery = store.addComponent("art-gallery", { x: 24, y: 24, width: 320, height: 180 });
const originalCaptions = store.findComponent(gallery.id).component.children.map(item => item.props.caption).join(",");
const beforeGallery = store.getHistoryState().undoCount;
const parsedGallery = CatalogManualEntry.parseGallery("Cromado\nPreto\nBranco");
const galleryItems = store.applyGalleryItemsBulk(gallery.id, parsedGallery.rows, { mode: "replace" });
assert(galleryItems.length === 3 && galleryItems.every(item => item.type === "art"), "A lista não gerou átomos art canônicos.");
assert(galleryItems.map(item => item.props.caption).join(",") === "Cromado,Preto,Branco", "As legendas não permaneceram vinculadas às imagens.");
assert(store.getHistoryState().undoCount === beforeGallery + 1 && store.getHistoryState().undoLabel === "Editar galeria em lote", "A galeria não gerou uma ação única.");
store.undo();
assert(store.findComponent(gallery.id).component.children.map(item => item.props.caption).join(",") === originalCaptions, "Desfazer não restaurou a coleção anterior.");
store.redo();
store.applyGalleryItemsBulk(gallery.id, CatalogManualEntry.parseGallery("Bege\nMarrom").rows, { mode: "append" });
assert(store.findComponent(gallery.id).component.children.filter(item => item.type === "art").length === 5, "Adicionar ao final substituiu a galeria.");

const parsedLegends = CatalogManualEntry.parseLegends("CX 1000\tpack.1000\tEmbalagens\nCX 500\tpack.500\tEmbalagens");
const beforeLegends = store.getHistoryState().undoCount;
const legends = store.upsertColorLegendsBulk(parsedLegends.rows, { materialize: false });
assert(legends.length === 2 && store.getColorLegends().length === 2, "A lista não criou as definições semânticas.");
assert(legends.every(item => item.metadata.groupLabel === "Embalagens"), "O grupo não foi preservado.");
assert(store.getHistoryState().undoCount === beforeLegends + 1 && store.getHistoryState().undoLabel === "Criar legendas em lote", "As legendas não geraram uma ação única.");
store.undo();
assert(store.getColorLegends().length === 0, "Desfazer não removeu o lote de legendas.");
const materialized = store.upsertColorLegendsBulk(parsedLegends.rows, { materialize: true });
const panel = store.getLegendPanels()[0];
assert(materialized.length === 2 && panel?.children.some(group => group.type === "legend-group" && group.children.filter(item => item.type === "legend-item").length === 2), "A materialização não reuniu o lote no grupo visual.");
store.undo();
assert(store.getColorLegends().length === 0 && store.getLegendPanels().length === 0, "Desfazer não removeu definições e painel materializados juntos.");

const left = store.addComponent("text", { x: 420, y: 40, width: 120, height: 40 });
const right = store.addComponent("text", { x: 500, y: 40, width: 120, height: 40 });
const geometry = store.getSelectionGeometryReport([left.id, right.id]);
assert(!geometry.ok && geometry.issues.some(issue => issue.code === "COMPONENT_COLLISION"), "O diagnóstico não filtrou a colisão da seleção.");

console.log("✓ Galeria, legendas e diagnóstico geométrico em lote validados com entidades canônicas e histórico atômico.");
