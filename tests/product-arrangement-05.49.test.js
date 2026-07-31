/* Incremento 05.49 — modo editorial e arranjo estrutural independentes. */
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
  "app/product-hero-contract.js",
  "app/product-technical-contract.js",
  "app/product-variants-contract.js",
  "app/product-data-only-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

CatalogProductHeroContract.install();
CatalogProductTechnicalContract.install();
CatalogProductVariantsContract.install();
CatalogProductDataOnlyContract.install();

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const frames = card => ({
  art: CatalogComponentGeometry.slotFrame(card, "art"),
  specifications: CatalogComponentGeometry.slotFrame(card, "specifications")
});
const horizontal = value => value.specifications.x > value.art.x && value.specifications.y === value.art.y;
const stacked = value => value.specifications.y > value.art.y && value.specifications.x === value.art.x && value.specifications.width === value.art.width;

const legacy = CatalogPresentations.normalizePresentation({
  mode: "technical",
  density: "compact",
  responsiveState: "wide",
  presetId: "product-technical",
  overrides: {}
}, "product-card");
assert(legacy.overrides.arrangement === "auto", "Apresentação legada não recebeu o default compatível auto.");
assert(CatalogPresentations.effectiveArrangement({ presentation: legacy, frame: { width: 420 } }) === "horizontal", "Auto amplo não preservou lado a lado.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const card = store.addComponent("product-card", { x: 24, y: 24, width: 420, height: 320 });
const childIds = card.children.map(child => child.id).join(",");

assert(horizontal(frames(card)), "Card padrão amplo deixou de iniciar lado a lado.");
store.setComponentPresentation(card.id, { overrides: { arrangement: "stacked", auditMarker: "preserve" } });
assert(card.presentation.mode === "standard", "Escolher empilhado alterou indevidamente o modo editorial.");
assert(card.presentation.overrides.arrangement === "stacked", "Arranjo empilhado não foi persistido.");
assert(stacked(frames(card)), "Arranjo empilhado não colocou arte acima das especificações.");

store.setComponentPresentation(card.id, { mode: "technical" });
assert(card.presentation.mode === "technical" && card.presentation.overrides.arrangement === "stacked", "Trocar modo perdeu o arranjo explícito.");
assert(card.presentation.overrides.auditMarker === "preserve", "Patch de apresentação apagou overrides não relacionados.");
assert(stacked(frames(card)), "Modo Técnico voltou a forçar orientação horizontal.");

store.setComponentPresentation(card.id, { overrides: { arrangement: "horizontal" } });
assert(horizontal(frames(card)), "Arranjo lado a lado não sobrepôs o estado estrutural do modo Técnico.");
store.setComponentPresentation(card.id, { mode: "variants" });
assert(card.presentation.mode === "variants" && horizontal(frames(card)), "Modo Variações ignorou o arranjo horizontal explícito.");

store.setComponentPresentation(card.id, { overrides: { arrangement: "auto" } });
assert(stacked(frames(card)), "Variações em Automático deixou de preservar o empilhamento histórico.");
assert(card.children.map(child => child.id).join(",") === childIds, "Trocar modo ou arranjo recriou a subárvore.");

store.undo();
let currentCard = store.findComponent(card.id).component;
assert(currentCard.presentation.overrides.arrangement === "horizontal" && horizontal(frames(currentCard)), "Desfazer não restaurou o arranjo anterior.");
store.redo();
currentCard = store.findComponent(card.id).component;
assert(currentCard.presentation.overrides.arrangement === "auto" && stacked(frames(currentCard)), "Refazer não restaurou o arranjo automático.");

const preview = store.getPresentationBatchPreview([card.id], { overrides: { arrangement: "horizontal" } });
assert(preview.changedCount === 1 && preview.items[0].after.mode === "variants", "Preview em lote acoplou arranjo e modo.");
store.setPresentationBatch([card.id], { overrides: { arrangement: "horizontal" } });
currentCard = store.findComponent(card.id).component;
assert(currentCard.presentation.mode === "variants" && horizontal(frames(currentCard)), "Aplicação em lote não preservou modo e arranjo independentes.");

const imported = new CatalogDocumentStore(store.getExportDocument());
const importedCard = imported.findComponent(card.id).component;
assert(imported.getState().schemaVersion === "1.16.0", "Arranjo independente exigiu mudança indevida de schema.");
assert(importedCard.presentation.mode === "variants" && importedCard.presentation.overrides.arrangement === "horizontal", "Round-trip perdeu a apresentação independente.");

console.log("✓ Modo editorial e arranjo auto/horizontal/stacked 05.49 validados sem ampliar CatalogDocument 1.16.0.");
