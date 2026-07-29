/* Incremento 05.18 — profundidade editorial sem ampliar o schema. */
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
  "app/document-store.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());

const text = store.addComponent("text", { x: 20, y: 20, width: 240, height: 80 });
store.updateComponent(text.id, { props: { align: "end", verticalAlign: "start", scale: 120, overflow: "ellipsis", content: "Texto editorial longo" } });
const textMarkup = CATALOG_COMPONENT_REGISTRY.text.render(text);
assert(textMarkup.includes('data-text-align="end"') && textMarkup.includes('data-text-vertical="start"'), "O texto não publicou alinhamentos horizontal e vertical.");
assert(textMarkup.includes('data-text-overflow="ellipsis"') && textMarkup.includes("--text-content-scale:1.2"), "O texto não publicou escala e overflow discretos.");

const icon = store.addComponent("icon", { x: 280, y: 20, width: 56, height: 56 });
store.updateComponent(icon.id, { props: { iconScale: 80 } });
assert(CATALOG_COMPONENT_REGISTRY.icon.render(icon).includes("--icon-content-scale:0.8"), "O átomo de ícone não publicou sua escala interna.");

const card = store.addComponent("product-card", { x: 20, y: 140, width: 420, height: 300 });
const frames = {};
for (const mode of ["standard", "hero", "technical", "variants", "data-only"]) {
  store.setComponentPresentation(card.id, { mode, responsiveState: "wide" });
  frames[mode] = {
    art: CatalogComponentGeometry.slotFrame(card, "art"),
    specifications: CatalogComponentGeometry.slotFrame(card, "specifications")
  };
}
assert(frames.hero.art.width > frames.standard.art.width, "O modo Destaque não priorizou a arte.");
assert(frames.technical.specifications.width > frames.standard.specifications.width, "O modo Técnico não priorizou os dados.");
assert(frames["data-only"].specifications.width > frames.technical.specifications.width, "O modo Dados não ampliou a região informativa.");
assert(frames.variants.art.width === frames.variants.specifications.width && frames.variants.specifications.y > frames.variants.art.y, "O modo Variações não adotou organização empilhada.");

console.log("✓ Texto, escala de ícones e cinco modos de card possuem representação editorial observável.");
