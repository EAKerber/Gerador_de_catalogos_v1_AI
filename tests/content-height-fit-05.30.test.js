/* Incremento 05.30 — o mínimo alcançável não pode depender da geometria anterior dos slots. */
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
const bottom = component => component.frame.y + component.frame.height;
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const card = store.addComponent("product-card", { x: 24, y: 24, width: 310, height: 360 });
store.setComponentPresentation(card.id, { density: "compact", responsiveState: "compact" });

card.children
  .filter(child => child.slot?.name === "art" || child.slot?.name === "specifications")
  .map(child => child.id)
  .forEach(componentId => store.deleteComponent(componentId));

const staleMinimum = store.getContentMinimum(card);
const profile = store.getMinimumProfile(card);
assert(staleMinimum.height === profile.calculated.height, "O painel e o motor discordaram sobre a altura alcançável.");
assert(profile.calculated.height === profile.technical.height, `O card reduzido deveria alcançar ${profile.technical.height}px, não ${profile.calculated.height}px.`);

const historyBefore = store.getHistoryState().undoCount;
store.fitComponentHeightToContent(card.id);
const table = card.children.find(child => child.slot?.name === "table");
assert(card.frame.height === profile.calculated.height, "O comando não aplicou a altura alcançável.");
assert(bottom(table) <= card.frame.height, "A tabela foi cortada ao recuperar o espaço liberado.");
assert(table.frame.y < 304, "A tabela permaneceu ancorada na geometria obsoleta.");
assert(store.getHistoryState().undoCount === historyBefore + 1, "O ajuste de altura não formou uma única ação reversível.");
store.undo();
assert(store.findComponent(card.id).component.frame.height === 360, "Desfazer não restaurou a altura anterior.");

console.log("✓ Altura alcançável recompõe card reduzido sem cortar a tabela.");
