/* DB-05.18.10 — data-only amplo/compacto, conteúdo parcial e tabelas. */
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
  "app/product-hero-contract.js",
  "app/product-technical-contract.js",
  "app/product-variants-contract.js",
  "app/product-data-only-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));
const slotFrames = card => ({
  title: CatalogComponentGeometry.slotFrame(card, "title"),
  art: CatalogComponentGeometry.slotFrame(card, "art"),
  specifications: CatalogComponentGeometry.slotFrame(card, "specifications"),
  table: CatalogComponentGeometry.slotFrame(card, "table")
});
const assertContained = (card, label) => {
  const frames = slotFrames(card);
  const artPresent = card.children.some(component => component.slot?.name === "art");
  const specificationsPresent = card.children.some(component => component.slot?.name === "specifications");
  if (artPresent && specificationsPresent && card.presentation?.responsiveState === "compact") {
    assert(frames.art.y + frames.art.height < frames.specifications.y, `${label}: arte e especificações se sobrepõem.`);
  }
  if (specificationsPresent) assert(frames.specifications.y + frames.specifications.height <= frames.table.y, `${label}: especificações invadiram a tabela.`);
  if (artPresent && !specificationsPresent) assert(frames.art.y + frames.art.height <= frames.table.y, `${label}: arte invadiu a tabela.`);
  assert(frames.table.y + frames.table.height <= card.frame.height, `${label}: tabela escapou do card.`);
  return frames;
};

CatalogTextAlignmentContract.install();
CatalogTextScaleContract.install();
CatalogTextOverflowContract.install();
CatalogProductHeroContract.install();
CatalogProductTechnicalContract.install();
CatalogProductVariantsContract.install();
const installation = CatalogProductDataOnlyContract.install();
assert(installation.geometryInstalled && installation.storeInstalled, "O contrato data-only não foi instalado integralmente.");
assert(CatalogPresentations.MODES["data-only"]?.visualPriority === "data", "O modo data-only não está declarado no registro de apresentações.");
assert(!CatalogPresentations.PRESETS["product-data-only"], "O incremento criou um preset redundante para data-only.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const standardWide = { presetId: "product-standard", mode: "standard", density: "standard", responsiveState: "wide" };
const standardCompact = { presetId: "product-standard", mode: "standard", density: "standard", responsiveState: "compact" };
const dataWide = { presetId: "product-standard", mode: "data-only", density: "standard", responsiveState: "wide" };
const dataCompact = { presetId: "product-standard", mode: "data-only", density: "standard", responsiveState: "compact" };

const card = store.addComponent("product-card", { x: 20, y: 20, width: 420, height: 280 });
store.addComponent("specification", { x: 0, y: 0, width: 130, height: 38 }, { parentId: card.id, slotName: "specifications", props: { icon: "truck", label: "Entrega rápida" } });
store.addComponent("specification", { x: 0, y: 0, width: 130, height: 38 }, { parentId: card.id, slotName: "specifications", props: { icon: "layers", label: "Quatro opções" } });
const initialIds = card.children.map(component => component.id);
const initialContent = clone(card.children.map(component => ({ id: component.id, type: component.type, props: component.props })));

store.setComponentPresentation(card.id, standardWide);
const standardWideFrames = slotFrames(store.findComponent(card.id).component);
const historyBeforeWide = store.getHistoryState().undoCount;
store.setComponentPresentation(card.id, dataWide);
const dataWideCard = store.findComponent(card.id).component;
const dataWideFrames = assertContained(dataWideCard, "data-only amplo");
assert(store.getHistoryState().undoCount === historyBeforeWide + 1, "Aplicar data-only amplo não gerou uma única entrada de histórico.");
assert(dataWideFrames.art.width < standardWideFrames.art.width, "Data-only amplo não reduziu a largura relativa da arte.");
assert(dataWideFrames.specifications.width > standardWideFrames.specifications.width, "Data-only amplo não ampliou a região informativa.");
assert(dataWideFrames.specifications.height >= CatalogProductDataOnlyContract.inspect(dataWideCard).specificationsMinimum, "Data-only amplo não respeitou o mínimo das quatro especificações.");
assert(dataWideCard.children.map(component => component.id).join(",") === initialIds.join(","), "Trocar para data-only recriou a subárvore.");
assert(JSON.stringify(dataWideCard.children.map(component => ({ id: component.id, type: component.type, props: component.props }))) === JSON.stringify(initialContent), "Trocar para data-only alterou o conteúdo dos filhos.");

store.updateComponent(card.id, { frame: { width: 280, height: 280 } });
store.setComponentPresentation(card.id, standardCompact);
const standardCompactFrames = slotFrames(store.findComponent(card.id).component);
const artId = store.findComponent(card.id).component.children.find(component => component.slot?.name === "art").id;
const historyBeforeCompact = store.getHistoryState().undoCount;
store.setComponentPresentation(card.id, dataCompact);
const dataCompactCard = store.findComponent(card.id).component;
const dataCompactInspection = CatalogProductDataOnlyContract.inspect(dataCompactCard);
const dataCompactFrames = assertContained(dataCompactCard, "data-only compacto");
assert(store.getHistoryState().undoCount === historyBeforeCompact + 1, "Aplicar data-only compacto fragmentou o histórico.");
assert(dataCompactInspection.compact === true, "O contrato não reconheceu data-only compacto.");
assert(dataCompactFrames.art.height < standardCompactFrames.art.height, "Data-only compacto não reduziu a arte ao mínimo.");
assert(dataCompactFrames.art.height >= dataCompactInspection.artMinimum, "Data-only compacto reduziu a arte abaixo do mínimo.");
assert(dataCompactFrames.specifications.height > standardCompactFrames.specifications.height, "Data-only compacto não ampliou as informações.");
assert(dataCompactFrames.specifications.height >= dataCompactInspection.specificationsMinimum, "Data-only compacto não respeitou o mínimo da grade de especificações.");
assert(dataCompactCard.children.find(component => component.slot?.name === "art").id === artId, "Data-only substituiu ou removeu a arte preservada.");

const table = dataCompactCard.children.find(component => component.type === "data-table" && component.slot?.name === "table");
const oneRowHeight = dataCompactCard.frame.height;
const historyBeforeRows = store.getHistoryState().undoCount;
store.replaceTableRowsBulk(table.id, Array.from({ length: 8 }, (_, index) => ({
  code: String(1000 + index),
  package: `CX ${index + 1}`,
  price: `R$ ${index + 1},00`
})), { mode: "replace" });
const longTableCard = store.findComponent(card.id).component;
const longTableFrames = assertContained(longTableCard, "data-only com tabela longa");
assert(store.getHistoryState().undoCount === historyBeforeRows + 1, "A tabela longa não permaneceu em uma única entrada de histórico.");
assert(store.getTableRows(table).length === 8, "A tabela longa não materializou oito linhas.");
assert(longTableCard.frame.height > oneRowHeight, "O card não cresceu para a tabela longa.");
assert(longTableFrames.table.height >= 20 + 8 * 28, "A tabela longa recebeu altura inferior ao conteúdo semântico.");
assert(longTableFrames.art.y + longTableFrames.art.height < longTableFrames.specifications.y, "Tabela longa provocou sobreposição entre arte e informações.");

assert(store.undo(), "Não foi possível desfazer a tabela longa.");
const undoneCard = store.findComponent(card.id).component;
assert(store.getTableRows(undoneCard.children.find(component => component.type === "data-table")).length === 1, "Desfazer não restaurou a tabela curta.");
assert(undoneCard.frame.height === oneRowHeight, "Desfazer não restaurou a altura anterior.");
assert(store.redo(), "Não foi possível refazer a tabela longa.");
assert(store.getTableRows(store.findComponent(card.id).component.children.find(component => component.type === "data-table")).length === 8, "Refazer não restaurou a tabela longa.");

const partial = store.addComponent("product-card", { x: 320, y: 20, width: 280, height: 280 });
store.setComponentPresentation(partial.id, dataCompact);
const partialArt = partial.children.find(component => component.slot?.name === "art");
store.deleteComponent(partialArt.id);
const withoutArt = store.findComponent(partial.id).component;
const withoutArtFrames = assertContained(withoutArt, "data-only sem arte");
assert(!withoutArt.children.some(component => component.slot?.name === "art"), "Data-only recriou arte ausente.");
assert(withoutArtFrames.specifications.height > 0, "Informações não ocuparam a região sem arte.");

const artOnly = store.addComponent("product-card", { x: 20, y: 700, width: 280, height: 280 });
artOnly.children.filter(component => component.slot?.name === "specifications").forEach(component => store.deleteComponent(component.id));
store.setComponentPresentation(artOnly.id, dataCompact);
const artOnlyCurrent = store.findComponent(artOnly.id).component;
const artOnlyFrames = assertContained(artOnlyCurrent, "data-only sem especificações");
assert(!artOnlyCurrent.children.some(component => component.slot?.name === "specifications"), "Data-only recriou especificações ausentes.");
assert(artOnlyFrames.art.height > 0, "A arte preservada não ocupou a região disponível.");

const idsBeforeStandard = store.findComponent(card.id).component.children.map(component => component.id);
store.setComponentPresentation(card.id, standardWide);
const returned = store.findComponent(card.id).component;
assert(returned.presentation.mode === "standard", "Retorno explícito ao padrão falhou.");
assert(returned.children.map(component => component.id).join(",") === idsBeforeStandard.join(","), "Retornar ao padrão recriou a subárvore.");

const imported = new CatalogDocumentStore(store.getExportDocument());
const importedPartial = imported.findComponent(partial.id).component;
const importedArtOnly = imported.findComponent(artOnly.id).component;
assert(importedPartial.presentation.mode === "data-only" && !importedPartial.children.some(component => component.slot?.name === "art"), "Importação criou arte fictícia no card parcial.");
assert(importedArtOnly.presentation.mode === "data-only" && !importedArtOnly.children.some(component => component.slot?.name === "specifications"), "Importação criou informações fictícias.");
assert(imported.getState().schemaVersion === "1.16.0", "Data-only exigiu mudança de schema.");

console.log("✓ DB-05.18.10 prioriza dados amplo/compacto e preserva arte, tabelas, conteúdo parcial e reversibilidade.");
