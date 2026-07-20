/* DB-05.18.8 — contraste standard/technical amplo e compacto. */
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
  "app/text-alignment-contract.js",
  "app/text-scale-contract.js",
  "app/text-overflow-contract.js",
  "app/icon-scale-contract.js",
  "app/product-hero-contract.js",
  "app/product-technical-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));
const framesEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const slotFrames = card => ({
  title: CatalogComponentGeometry.slotFrame(card, "title"),
  art: CatalogComponentGeometry.slotFrame(card, "art"),
  specifications: CatalogComponentGeometry.slotFrame(card, "specifications"),
  table: CatalogComponentGeometry.slotFrame(card, "table")
});
const galleryMinimum = gallery => {
  const items = gallery.children.filter(component => component.type === "art");
  const count = Math.max(1, items.length);
  const columns = Math.max(1, Math.min(Number(gallery.layout?.columns) || 3, count));
  const rows = Math.ceil(count / columns);
  const padding = Math.max(0, Number(gallery.layout?.padding) || 4);
  const gap = Math.max(0, Number(gallery.layout?.gap) || 6);
  const childMinimum = Math.max(44, ...items.map(component => Number(component.constraints?.minHeight) || 44));
  return padding * 2 + rows * childMinimum + Math.max(0, rows - 1) * gap;
};

CatalogTextAlignmentContract.install();
CatalogTextScaleContract.install();
CatalogTextOverflowContract.install();
CatalogIconScaleContract.install();
CatalogProductHeroContract.install();
const installation = CatalogProductTechnicalContract.install();
assert(installation.geometryInstalled, "O contrato geométrico técnico não foi instalado.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const card = store.addComponent("product-card", { x: 20, y: 20, width: 420, height: 320 });
const initialIds = card.children.map(component => component.id);
const initialContent = clone(card.children.map(component => ({ id: component.id, type: component.type, props: component.props })));

const standardWidePresentation = { presetId: "product-standard", mode: "standard", density: "standard", responsiveState: "wide" };
const technicalWidePresentation = { presetId: "product-technical", mode: "technical", density: "compact", responsiveState: "wide" };
store.setComponentPresentation(card.id, standardWidePresentation);
const standardWide = slotFrames(store.findComponent(card.id).component);
store.setComponentPresentation(card.id, technicalWidePresentation);
const technicalWide = slotFrames(store.findComponent(card.id).component);
assert(technicalWide.specifications.width > standardWide.specifications.width, "Técnico amplo não priorizou a largura das especificações.");
assert(technicalWide.art.width < standardWide.art.width, "Técnico amplo não reduziu proporcionalmente a arte.");

store.updateComponent(card.id, { frame: { width: 280, height: 390 } });
const standardCompactPresentation = { presetId: "product-standard", mode: "standard", density: "standard", responsiveState: "compact" };
const technicalCompactPresentation = { presetId: "product-technical", mode: "technical", density: "compact", responsiveState: "compact" };
store.setComponentPresentation(card.id, standardCompactPresentation);
const standardCompact = slotFrames(store.findComponent(card.id).component);
const historyBeforeTechnical = store.getHistoryState().undoCount;
store.setComponentPresentation(card.id, technicalCompactPresentation);
const technicalCompactCard = store.findComponent(card.id).component;
const technicalCompact = slotFrames(technicalCompactCard);
assert(store.getHistoryState().undoCount === historyBeforeTechnical + 1, "A troca para técnico não gerou uma entrada de histórico.");
assert(technicalCompact.art.height < standardCompact.art.height, "Técnico compacto não reduziu a arte em favor das especificações.");
assert(standardCompact.art.height - technicalCompact.art.height <= 24, "Técnico compacto ultrapassou a transferência máxima.");
assert(technicalCompact.specifications.height > standardCompact.specifications.height, "Técnico compacto não ampliou as especificações.");
assert(technicalCompact.specifications.y < standardCompact.specifications.y, "Técnico compacto não antecipou a região de especificações.");
assert(technicalCompact.art.height >= 60, "Técnico compacto reduziu arte simples abaixo do mínimo.");
assert(technicalCompact.art.y + technicalCompact.art.height < technicalCompact.specifications.y, "Técnico compacto sobrepôs arte e especificações.");
assert(technicalCompact.specifications.y + technicalCompact.specifications.height <= technicalCompact.table.y, "Técnico compacto invadiu a tabela.");
assert(CatalogProductTechnicalContract.inspect(technicalCompactCard).compactTechnical === true, "O contrato não reconheceu técnico compacto.");

assert(store.undo(), "Não foi possível desfazer técnico compacto.");
assert(store.findComponent(card.id).component.presentation.mode === "standard", "Desfazer não restaurou standard.");
assert(framesEqual(slotFrames(store.findComponent(card.id).component), standardCompact), "Desfazer não restaurou a geometria padrão.");
assert(store.redo(), "Não foi possível refazer técnico compacto.");
assert(store.findComponent(card.id).component.presentation.mode === "technical", "Refazer não restaurou técnico.");
assert(framesEqual(slotFrames(store.findComponent(card.id).component), technicalCompact), "Refazer não restaurou a geometria técnica.");

store.setComponentPresentation(card.id, standardCompactPresentation);
assert(framesEqual(slotFrames(store.findComponent(card.id).component), standardCompact), "Retornar a standard não restaurou sua geometria.");
assert(store.findComponent(card.id).component.children.map(component => component.id).join(",") === initialIds.join(","), "Trocar modos recriou a subárvore.");
assert(JSON.stringify(store.findComponent(card.id).component.children.map(component => ({ id: component.id, type: component.type, props: component.props }))) === JSON.stringify(initialContent), "Trocar modos alterou conteúdo dos filhos.");

const galleryCard = store.addComponent("product-card", { x: 320, y: 20, width: 280, height: 600 });
const simpleArt = galleryCard.children.find(component => component.type === "art");
const gallery = store.addArtVariation(simpleArt.id);
store.applyGalleryItemsBulk(gallery.id, [
  { caption: "Variação 1" },
  { caption: "Variação 2" },
  { caption: "Variação 3" },
  { caption: "Variação 4" },
  { caption: "Variação 5" }
]);
store.setComponentPresentation(galleryCard.id, technicalCompactPresentation);
const galleryCardCurrent = store.findComponent(galleryCard.id).component;
const galleryCurrent = galleryCardCurrent.children.find(component => component.type === "art-gallery");
const galleryFrames = slotFrames(galleryCardCurrent);
assert(galleryFrames.art.height >= galleryMinimum(galleryCurrent), "Técnico compacto reduziu a galeria abaixo do mínimo calculado.");
assert(galleryFrames.art.y + galleryFrames.art.height < galleryFrames.specifications.y, "Galeria técnica sobrepôs especificações.");
assert(galleryFrames.specifications.y + galleryFrames.specifications.height <= galleryFrames.table.y, "Galeria técnica invadiu a tabela.");

const imported = new CatalogDocumentStore(store.getExportDocument());
const importedCard = imported.findComponent(card.id).component;
const importedGalleryCard = imported.findComponent(galleryCard.id).component;
assert(importedCard.presentation.mode === "standard", "Importação não preservou o retorno do primeiro card ao padrão.");
assert(importedGalleryCard.presentation.mode === "technical", "Importação não preservou o card técnico com galeria.");
assert(importedGalleryCard.children.some(component => component.type === "art-gallery"), "Importação perdeu a galeria técnica.");
assert(imported.getState().schemaVersion === "1.16.0", "Técnico exigiu mudança de schema.");

console.log("✓ DB-05.18.8 diferencia técnico amplo/compacto e preserva arte, galeria, conteúdo e reversibilidade.");
