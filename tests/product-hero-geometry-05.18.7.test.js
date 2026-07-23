/* DB-05.18.7 — contraste standard/hero amplo e compacto. */
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
  "app/product-hero-contract.js"
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

CatalogTextAlignmentContract.install();
CatalogTextScaleContract.install();
CatalogTextOverflowContract.install();
const installation = CatalogProductHeroContract.install();
assert(installation.geometryInstalled, "O contrato geométrico do hero não foi instalado.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const card = store.addComponent("product-card", { x: 20, y: 20, width: 420, height: 320 }, { parentId: null });
const initialIds = card.children.map(component => component.id);
const initialContent = clone(card.children.map(component => ({ id: component.id, type: component.type, props: component.props })));

const standardWidePresentation = { presetId: "product-standard", mode: "standard", density: "standard", responsiveState: "wide" };
const heroWidePresentation = { presetId: "product-hero", mode: "hero", density: "comfortable", responsiveState: "wide" };
store.setComponentPresentation(card.id, standardWidePresentation);
const standardWide = slotFrames(store.findComponent(card.id).component);
store.setComponentPresentation(card.id, heroWidePresentation);
const heroWide = slotFrames(store.findComponent(card.id).component);
assert(heroWide.art.width > standardWide.art.width, "Hero amplo não priorizou a largura da arte.");
assert(heroWide.specifications.width < standardWide.specifications.width, "Hero amplo não cedeu largura das especificações à arte.");
assert(heroWide.title.height > standardWide.title.height, "Hero amplo não reforçou a região de título.");

store.updateComponent(card.id, { frame: { width: 280, height: 390 } });
const standardCompactPresentation = { presetId: "product-standard", mode: "standard", density: "standard", responsiveState: "compact" };
const heroCompactPresentation = { presetId: "product-hero", mode: "hero", density: "comfortable", responsiveState: "compact" };
store.setComponentPresentation(card.id, standardCompactPresentation);
const standardCompact = slotFrames(store.findComponent(card.id).component);
const historyBeforeHero = store.getHistoryState().undoCount;
store.setComponentPresentation(card.id, heroCompactPresentation);
const heroCompactCard = store.findComponent(card.id).component;
const heroCompact = slotFrames(heroCompactCard);
assert(store.getHistoryState().undoCount === historyBeforeHero + 1, "A troca para hero não gerou uma única entrada de histórico.");
assert(heroCompact.art.height > standardCompact.art.height, "Hero compacto não priorizou verticalmente a arte.");
assert(heroCompact.art.height - standardCompact.art.height <= 24, "Hero compacto ultrapassou o ganho máximo previsto.");
assert(heroCompact.specifications.y > standardCompact.specifications.y, "Hero compacto não deslocou as especificações após a arte.");
assert(heroCompact.art.y + heroCompact.art.height < heroCompact.specifications.y, "Hero compacto sobrepôs arte e especificações.");
assert(heroCompact.specifications.y + heroCompact.specifications.height <= heroCompact.table.y, "Hero compacto invadiu a tabela.");
assert(heroCompact.specifications.height >= 28, "Hero compacto reduziu especificações abaixo do mínimo técnico.");
assert(CatalogProductHeroContract.inspect(heroCompactCard).compactHero === true, "O contrato não reconheceu o estado hero compacto.");

assert(store.undo(), "Não foi possível desfazer hero compacto.");
const undoneCard = store.findComponent(card.id).component;
assert(undoneCard.presentation.mode === "standard", "Desfazer não restaurou o modo padrão.");
assert(framesEqual(slotFrames(undoneCard), standardCompact), "Desfazer não restaurou a geometria compacta padrão.");
assert(store.redo(), "Não foi possível refazer hero compacto.");
assert(store.findComponent(card.id).component.presentation.mode === "hero", "Refazer não restaurou hero.");
assert(framesEqual(slotFrames(store.findComponent(card.id).component), heroCompact), "Refazer não restaurou a geometria hero.");

store.setComponentPresentation(card.id, standardCompactPresentation);
assert(framesEqual(slotFrames(store.findComponent(card.id).component), standardCompact), "Retornar explicitamente ao padrão não restaurou sua geometria.");
assert(store.findComponent(card.id).component.children.map(component => component.id).join(",") === initialIds.join(","), "Trocar modos recriou ou removeu filhos.");
assert(JSON.stringify(store.findComponent(card.id).component.children.map(component => ({ id: component.id, type: component.type, props: component.props }))) === JSON.stringify(initialContent), "Trocar modos alterou conteúdo ou vínculos dos filhos.");

const extraOne = store.addComponent("specification", { x: 0, y: 0, width: 120, height: 38 }, { parentId: card.id, slotName: "specifications" });
const extraTwo = store.addComponent("specification", { x: 0, y: 0, width: 120, height: 38 }, { parentId: card.id, slotName: "specifications" });
assert(extraOne && extraTwo, "Não foi possível completar quatro especificações.");
store.setComponentPresentation(card.id, heroCompactPresentation);
const fourSpecs = slotFrames(store.findComponent(card.id).component);
assert(fourSpecs.specifications.height >= 63, "Hero compacto não preservou duas linhas mínimas de especificações.");
assert(fourSpecs.art.y + fourSpecs.art.height < fourSpecs.specifications.y, "Quatro especificações causaram sobreposição com a arte.");
assert(fourSpecs.specifications.y + fourSpecs.specifications.height <= fourSpecs.table.y, "Quatro especificações invadiram a tabela.");

const currentCardBeforeExport = store.findComponent(card.id).component;
const imported = new CatalogDocumentStore(store.getExportDocument());
const importedCard = imported.findComponent(card.id).component;
assert(importedCard.presentation.mode === "hero" && importedCard.presentation.responsiveState === "compact", "Exportação/importação não preservou hero compacto.");
assert(importedCard.children.length === currentCardBeforeExport.children.length, "Importação alterou a subárvore do card.");
assert(importedCard.children.map(component => component.id).join(",") === currentCardBeforeExport.children.map(component => component.id).join(","), "Importação alterou os IDs da subárvore do card.");
assert(imported.getState().schemaVersion === "1.16.0", "Hero exigiu mudança de schema.");

console.log("✓ DB-05.18.7 diferencia hero amplo/compacto, preserva mínimos, conteúdo e reversibilidade.");
