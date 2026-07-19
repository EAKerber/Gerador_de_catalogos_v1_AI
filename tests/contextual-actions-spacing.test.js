/* Incremento 05.10 — ações contextuais, gap e separadores em lote. */
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
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/section-recipes.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/catalog-validator.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());

const table = store.addComponent("data-table", { x: 24, y: 24, width: 320, height: 80 });
store.setSelection(table.id);
assert(store.getContextualActions()[0]?.id === "add-table-row", "A tabela selecionada não ofereceu + Linha da tabela.");
const rowsBefore = store.getTableRows(table).length;
store.performContextualAction("add-table-row", table.id);
assert(store.getTableRows(table).length === rowsBefore + 1 && store.getHistoryState().undoLabel === "Adicionar linha", "A ação contextual não acrescentou uma linha reversível.");

store.reset();
const art = store.addComponent("art", { x: 30, y: 40, width: 260, height: 150 }, { props: { assetId: "asset-preservado", caption: "Original" } });
store.setSelection(art.id);
assert(store.getContextualActions()[0]?.id === "convert-art-gallery", "A arte isolada não ofereceu a conversão contextual em galeria.");
const historyBeforeGallery = store.getHistoryState().undoCount;
const gallery = store.performContextualAction("convert-art-gallery", art.id);
assert(gallery.type === "art-gallery" && gallery.children.length === 2, "A conversão não criou uma galeria com duas imagens.");
assert(gallery.children.some(child => child.id === art.id && child.props.assetId === "asset-preservado" && child.props.caption === "Original"), "A arte original perdeu ID, asset ou legenda.");
assert(store.getState().editor.editingContextId === gallery.id && store.getHistoryState().undoCount === historyBeforeGallery + 1, "Galeria e foco não foram concluídos em uma transação.");
const selectedArt = store.getSelected();
assert(store.getContextualActions()[0]?.id === "add-gallery-art", "A arte dentro da galeria não ofereceu uma nova imagem.");
store.performContextualAction("add-gallery-art", selectedArt.id);
assert(gallery.children.length === 3 && gallery.children[2].props.caption, "A nova imagem não recebeu legenda individual automática.");

store.reset();
const texts = [
  store.addComponent("text", { x: 24, y: 100, width: 80, height: 40 }),
  store.addComponent("text", { x: 150, y: 100, width: 90, height: 40 }),
  store.addComponent("text", { x: 310, y: 100, width: 100, height: 40 })
];
const spacingHistory = store.getHistoryState().undoCount;
const spaced = store.spaceComponents(texts.map(item => item.id), { axis: "horizontal", gap: 16, separators: true, separatorPresetId: "emphasis" });
assert(spaced.components[1].frame.x - (spaced.components[0].frame.x + spaced.components[0].frame.width) === 16, "O primeiro gap horizontal não foi aplicado.");
assert(spaced.components[2].frame.x - (spaced.components[1].frame.x + spaced.components[1].frame.width) === 16, "O segundo gap horizontal não foi aplicado.");
assert(spaced.separators.length === 2 && spaced.separators.every(item => item.props.orientation === "vertical" && item.props.thickness === 4), "Os separadores não seguiram eixo e preset.");
assert(store.getHistoryState().undoCount === spacingHistory + 1 && store.getHistoryState().undoLabel === "Ajustar espaçamento", "Gap e linhas não foram uma única ação.");
store.undo();
assert(store.getPage().children.filter(item => item.type === "separator").length === 0, "Desfazer não removeu os separadores do lote.");

store.reset();
const area = store.addComponent("layout-container", { x: 24, y: 24, width: 600, height: 160 }, { layout: { mode: "row", gap: 8, padding: 8, distribution: "fill" } });
store.setEditingContext(area.id);
const managed = [store.insertComponent("text"), store.insertComponent("text"), store.insertComponent("text")];
const autoSpaced = store.spaceComponents(managed.map(item => item.id), { axis: "horizontal", gap: 20, separators: true, separatorPresetId: "solid-dot" });
assert(area.layout.gap === 20 && autoSpaced.separators.length === 2 && autoSpaced.separators.every(item => item.layoutItem.overlay), "A seleção completa não atualizou o gap do pai e seus overlays.");
const report = store.getPublicationReport("draft");
assert(report.summary.collisions === 0 && report.summary.overflows === 0, "O espaçamento em auto-layout gerou geometria inválida.");

console.log("✓ Ações contextuais, conversão em galeria, gap e separadores em lote 05.10 validados.");
