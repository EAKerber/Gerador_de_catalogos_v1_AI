/* DB-05.18.9 — variants com conteúdo parcial, galeria e legendas. */
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
  "app/product-technical-contract.js",
  "app/product-variants-contract.js"
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
const assertContained = (card, label) => {
  const frames = slotFrames(card);
  const hasArt = card.children.some(component => component.slot?.name === "art");
  const hasSpecifications = card.children.some(component => component.slot?.name === "specifications");
  if (hasArt && hasSpecifications) {
    assert(frames.art.y + frames.art.height < frames.specifications.y, `${label}: arte e especificações se sobrepõem.`);
  }
  if (hasSpecifications) assert(frames.specifications.y + frames.specifications.height <= frames.table.y, `${label}: especificações invadiram a tabela.`);
  if (hasArt && !hasSpecifications) assert(frames.art.y + frames.art.height <= frames.table.y, `${label}: arte invadiu a tabela.`);
  assert(frames.table.y + frames.table.height <= card.frame.height, `${label}: tabela escapou do card.`);
  return frames;
};

CatalogTextAlignmentContract.install();
CatalogTextScaleContract.install();
CatalogTextOverflowContract.install();
CatalogIconScaleContract.install();
CatalogProductHeroContract.install();
CatalogProductTechnicalContract.install();
const installation = CatalogProductVariantsContract.install();
assert(installation.geometryInstalled && installation.storeInstalled, "O contrato completo de variants não foi instalado.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const variantsWide = { presetId: "product-variants", mode: "variants", density: "compact", responsiveState: "wide" };
const variantsCompact = { presetId: "product-variants", mode: "variants", density: "compact", responsiveState: "compact" };
const standardWide = { presetId: "product-standard", mode: "standard", density: "standard", responsiveState: "wide" };

const card = store.addComponent("product-card", { x: 20, y: 20, width: 420, height: 260 }, { parentId: null });
store.addComponent("specification", { x: 0, y: 0, width: 130, height: 38 }, { parentId: card.id, slotName: "specifications", props: { icon: "truck", label: "Entrega rápida" } });
store.addComponent("specification", { x: 0, y: 0, width: 130, height: 38 }, { parentId: card.id, slotName: "specifications", props: { icon: "layers", label: "Quatro opções" } });
const simpleArt = card.children.find(component => component.type === "art" && component.slot?.name === "art");
const gallery = store.addArtVariation(simpleArt.id);
store.applyGalleryItemsBulk(gallery.id, [{ caption: "Acabamento natural" }]);
const oneItemIds = gallery.children.map(component => component.id);
const oneItemHeightBeforeVariants = card.frame.height;
const historyBeforeVariants = store.getHistoryState().undoCount;
store.setComponentPresentation(card.id, variantsWide);
const currentWide = store.findComponent(card.id).component;
const wideInspection = CatalogProductVariantsContract.inspect(currentWide);
const wideFrames = assertContained(currentWide, "variants amplo com uma imagem");
assert(store.getHistoryState().undoCount === historyBeforeVariants + 1, "Aplicar variants não gerou exatamente uma entrada de histórico.");
assert(currentWide.frame.height >= oneItemHeightBeforeVariants, "Variants reduziu o frame ao aplicar o modo.");
assert(wideFrames.art.height >= wideInspection.artMinimum, "Variants amplo não respeitou o mínimo da galeria com legenda.");
assert(wideFrames.specifications.height >= wideInspection.specificationsMinimum, "Variants amplo não respeitou o mínimo da coluna de especificações.");
assert(gallery.children.length === 1 && gallery.children[0].props.caption === "Acabamento natural", "Galeria de uma imagem ou sua legenda foi alterada.");

const beforeFive = {
  frame: clone(currentWide.frame),
  frames: slotFrames(currentWide),
  ids: gallery.children.map(component => component.id),
  history: store.getHistoryState().undoCount
};
store.applyGalleryItemsBulk(gallery.id, [
  { caption: "Natural" },
  { caption: "Preto" },
  { caption: "Branco" },
  { caption: "Grafite" },
  { caption: "Dourado" }
]);
const fiveWide = store.findComponent(card.id).component;
const fiveGallery = fiveWide.children.find(component => component.type === "art-gallery");
const fiveInspection = CatalogProductVariantsContract.inspect(fiveWide);
const fiveFrames = assertContained(fiveWide, "variants amplo com cinco imagens");
assert(store.getHistoryState().undoCount === beforeFive.history + 1, "Editar a galeria em variants criou mais de uma entrada de histórico.");
assert(fiveGallery.children.length === 5, "A galeria não materializou cinco imagens.");
assert(fiveGallery.children.map(component => component.props.caption).join("|") === "Natural|Preto|Branco|Grafite|Dourado", "Legendas individuais não foram preservadas.");
assert(fiveWide.frame.height >= beforeFive.frame.height, "O card não cresceu após ampliar a galeria.");
assert(fiveFrames.art.height >= fiveInspection.artMinimum, "A galeria ampla ficou abaixo do mínimo calculado.");
assert(fiveFrames.specifications.height >= fiveInspection.specificationsMinimum, "As quatro especificações amplas ficaram abaixo do mínimo.");

assert(store.undo(), "Não foi possível desfazer a galeria de cinco itens.");
const undoneGallery = store.findComponent(card.id).component.children.find(component => component.type === "art-gallery");
assert(undoneGallery.children.length === 1, "Desfazer não restaurou a galeria de uma imagem.");
assert(store.findComponent(card.id).component.frame.height === beforeFive.frame.height, "Desfazer não restaurou a altura anterior do card.");
assert(store.redo(), "Não foi possível refazer a galeria de cinco itens.");
assert(store.findComponent(card.id).component.children.find(component => component.type === "art-gallery").children.length === 5, "Refazer não restaurou cinco imagens.");

store.updateComponent(card.id, { frame: { width: 280, height: 260 } });
store.setComponentPresentation(card.id, variantsCompact);
const compactCard = store.findComponent(card.id).component;
const compactInspection = CatalogProductVariantsContract.inspect(compactCard);
const compactFrames = assertContained(compactCard, "variants compacto");
assert(compactInspection.compact === true, "O contrato não reconheceu variants compacto.");
assert(compactFrames.art.height >= compactInspection.artMinimum, "Variants compacto reduziu a galeria abaixo do mínimo.");
assert(compactFrames.specifications.height >= compactInspection.specificationsMinimum, "Variants compacto reduziu a grade de especificações abaixo do mínimo.");
assert(compactCard.frame.width === 280, "O contrato alterou a largura solicitada do card compacto.");

const simpleCard = store.addComponent("product-card", { x: 320, y: 20, width: 280, height: 260 }, { parentId: null });
store.setComponentPresentation(simpleCard.id, variantsCompact);
const simpleCurrent = store.findComponent(simpleCard.id).component;
assert(simpleCurrent.children.some(component => component.type === "art" && component.slot?.name === "art"), "Variants converteu arte simples em galeria sem solicitação.");
assert(!simpleCurrent.children.some(component => component.type === "art-gallery"), "Variants criou galeria fictícia.");
assertContained(simpleCurrent, "variants sem galeria");

const artToRemove = simpleCurrent.children.find(component => component.slot?.name === "art");
const historyBeforeDelete = store.getHistoryState().undoCount;
store.deleteComponent(artToRemove.id);
const withoutArt = store.findComponent(simpleCard.id).component;
const withoutArtFrames = assertContained(withoutArt, "variants sem arte");
assert(store.getHistoryState().undoCount === historyBeforeDelete + 1, "Remover arte criou histórico inconsistente.");
assert(!withoutArt.children.some(component => component.slot?.name === "art"), "Arte removida reapareceu ficticiamente.");
assert(withoutArtFrames.specifications.height > 0, "Informações comerciais não ocuparam a região disponível sem arte.");

const artOnlyCard = store.addComponent("product-card", { x: 20, y: 620, width: 280, height: 260 }, { parentId: null });
artOnlyCard.children.filter(component => component.slot?.name === "specifications").forEach(component => store.deleteComponent(component.id));
store.setComponentPresentation(artOnlyCard.id, variantsCompact);
const artOnlyCurrent = store.findComponent(artOnlyCard.id).component;
const artOnlyFrames = assertContained(artOnlyCurrent, "variants somente com arte");
assert(!artOnlyCurrent.children.some(component => component.slot?.name === "specifications"), "Variants recriou especificações ausentes.");
assert(artOnlyFrames.art.height > 0, "Arte não ocupou a região disponível sem especificações.");

const idsBeforeStandard = store.findComponent(card.id).component.children.map(component => component.id);
store.setComponentPresentation(card.id, standardWide);
const returnedStandard = store.findComponent(card.id).component;
assert(returnedStandard.presentation.mode === "standard", "Retorno ao modo padrão falhou.");
assert(returnedStandard.children.map(component => component.id).join(",") === idsBeforeStandard.join(","), "Retornar ao padrão recriou a subárvore.");
assert(returnedStandard.children.some(component => component.type === "art-gallery"), "Retornar ao padrão removeu a galeria.");

const exported = store.getExportDocument();
const imported = new CatalogDocumentStore(exported);
const importedWithoutArt = imported.findComponent(simpleCard.id).component;
const importedArtOnly = imported.findComponent(artOnlyCard.id).component;
assert(importedWithoutArt.presentation.mode === "variants" && !importedWithoutArt.children.some(component => component.slot?.name === "art"), "Importação criou conteúdo fictício no card sem arte.");
assert(importedArtOnly.presentation.mode === "variants" && !importedArtOnly.children.some(component => component.slot?.name === "specifications"), "Importação criou especificações fictícias.");
assert(imported.getState().schemaVersion === "1.16.0", "Variants exigiu mudança de schema.");
assert(oneItemIds.length === 1, "A preparação da galeria de uma imagem falhou.");

console.log("✓ DB-05.18.9 dimensiona variants por conteúdo real e preserva galerias, legendas, estados parciais e histórico.");
