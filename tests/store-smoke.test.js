/* Smoke tests sem dependências para a árvore, slots, reordenação e migração. */
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const card = store.addComponent("product-card", { x: 24, y: 100, width: 350, height: 260 });
assert(card.children.length === 5, "O card deve nascer com cinco peças internas.");
assert(store.getState().collections.length === 6, "As coleções genéricas padrão não foram criadas.");
assert(card.children.find(child => child.type === "art").props.assetId === null, "A arte deve nascer preparada para referência por assetId.");
const sourceTable = card.children.find(child => child.type === "data-table");
assert(sourceTable.props.collectionId === "tableRows", "A tabela deve apontar para a coleção de linhas.");
assert(store.getTableRows(sourceTable).length === 1, "A tabela deve nascer com uma linha ligada à coleção.");

const duplicate = store.duplicateComponent(card.id);
assert(duplicate && duplicate.id !== card.id, "A duplicação não criou um novo ID.");
assert(duplicate.children.length === card.children.length, "A duplicação deve preservar a subárvore.");
assert(duplicate.children.every((child, index) => child.id !== card.children[index].id), "Filhos duplicados precisam de novos IDs.");
assert(duplicate.frame.x === card.frame.x + 16 && duplicate.frame.y === card.frame.y + 16, "A cópia livre deve receber deslocamento visível.");
const duplicateTable = duplicate.children.find(child => child.type === "data-table");
assert(duplicateTable.props.rowIds[0] !== sourceTable.props.rowIds[0], "A cópia deve receber linhas independentes na coleção.");

const addedRow = store.addTableRow(sourceTable.id, { code: "B-02", package: "CX 20", price: "R$ 19,90" });
assert(store.getTableRows(sourceTable).length === 2, "A tabela não aceitou uma segunda linha.");
store.updateTableRow(sourceTable.id, addedRow.id, { price: "R$ 17,90" });
assert(store.getTableRows(sourceTable).find(row => row.id === addedRow.id).metadata.values.price === "R$ 17,90", "A linha da coleção não foi atualizada.");
store.reorderTableRow(sourceTable.id, addedRow.id, -1);
assert(sourceTable.props.rowIds[0] === addedRow.id, "A ordem dos rowIds não foi atualizada.");
const legacyRowId = sourceTable.props.rowIds[1];
assert(store.removeTableRow(sourceTable.id, legacyRowId), "A linha excedente não foi removida.");
assert(store.getTableRows(sourceTable).length === 1, "A tabela deve manter a linha restante.");

store.upsertCollectionItem("assets", {
  id: "asset-logo",
  label: "Logo",
  metadata: { fileName: "logo.svg", mimeType: "image/svg+xml", size: 128, width: 120, height: 80, createdAt: "2026-07-13T12:00:00.000Z", isVector: true },
  reference: { provider: "indexeddb", key: "asset-logo" }
});
assert(store.getCollection("assets").items.length === 1, "A coleção de assets não aceitou uma referência.");
assert(store.getAsset("asset-logo").metadata.provenance.origin === "provided" && store.getAsset("asset-logo").metadata.approval.status === "review-required", "Assets legados não receberam governança conservadora.");
const sourceArt = card.children.find(child => child.type === "art");
store.setComponentAsset(sourceArt.id, "asset-logo");
assert(sourceArt.props.assetId === "asset-logo", "A arte não recebeu o assetId.");
assert(store.getAsset("asset-logo").metadata.isVector === true, "O asset não preservou os metadados.");
assert(store.getAssetUsage("asset-logo").includes(sourceArt.id), "O uso do asset não foi rastreado.");
store.setComponentAsset(sourceArt.id, null);
assert(sourceArt.props.assetId === null, "A remoção do vínculo não preservou o componente.");
let rejectedBase64 = false;
try {
  store.upsertCollectionItem("assets", { id: "bad", label: "Inválido", data: "data:image/png;base64,AAAA" });
} catch (error) {
  rejectedBase64 = true;
}
assert(rejectedBase64, "A coleção de assets deve rejeitar binários/base64 embutidos.");

const specifications = () => card.children
  .filter(child => child.slot?.name === "specifications")
  .sort((a, b) => a.slot.order - b.slot.order);

const before = specifications().map(item => item.props.label);
store.reorderComponent(specifications()[0].id, 1);
const after = specifications().map(item => item.props.label);
assert(after[0] === before[1] && after[1] === before[0], "A reordenação do slot falhou.");

store.setEditingContext(card.id);
store.addComponent("specification", { x: 0, y: 0 }, { parentId: card.id, slotName: "specifications", props: { label: "Terceira" } });
store.addComponent("specification", { x: 0, y: 0 }, { parentId: card.id, slotName: "specifications", props: { label: "Quarta" } });
assert(specifications().length === 4, "O slot deve respeitar a capacidade 4.");

store.addComponent("specification", { x: 0, y: 0 }, {
  parentId: card.id,
  slotName: "specifications",
  props: { label: "Nova" },
  replace: true
});
assert(specifications().length === 4, "A substituição deve manter a capacidade do slot.");
assert(specifications().some(item => item.props.label === "Nova"), "A nova especificação não foi inserida.");
const spanTarget = specifications()[0];
assert(store.updateSlotSpan(spanTarget.id, 2) === false, "Um item não pode exceder a capacidade ponderada do slot.");
store.deleteComponent(specifications()[3].id);
assert(store.updateSlotSpan(spanTarget.id, 2) === true, "O item deveria ocupar duas unidades após liberar capacidade.");
assert(store.getSlotUsage(card.id, "specifications") === 4, "A capacidade deve somar slot.span, não apenas a quantidade de itens.");
assert(spanTarget.frame.height > specifications().find(item => item.id !== spanTarget.id).frame.height, "O span múltiplo não ampliou a peça no eixo do slot.");

const oldDocument = {
  schemaVersion: "1.0.0",
  id: "old-document",
  activePageId: "page-1",
  editor: { zoom: 0.7, gridVisible: true, snapEnabled: true, selectedComponentId: null },
  pages: [{
    id: "page-1",
    type: "page",
    name: "Página",
    size: { width: 794, height: 1123 },
    grid: { unit: 4 },
    children: [{
      id: "legacy-card",
      type: "product-card",
      name: "Card",
      frame: { x: 0, y: 0, width: 350, height: 260 },
      constraints: { minWidth: 270, minHeight: 190, gridUnit: 4, snapX: true, snapY: true, freeX: false, freeY: false },
      props: { number: "09", title: "Migrado", specOne: "A", specTwo: "B", code: "X", package: "Y", price: "Z" },
      style: { surface: "surface.paper", border: "border.default", radius: "radius.medium", accentColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.card-title" },
      children: []
    }]
  }]
};

const migrated = new CatalogDocumentStore(oldDocument);
const migratedCard = migrated.findComponent("legacy-card").component;
assert(migrated.getState().schemaVersion === "1.16.0", "O schema não foi migrado.");
assert(migrated.getState().numbering.cardNext === 10, "A migração não inferiu o próximo número do card legado.");
assert(migrated.getCollection("templates").label === "Meus componentes", "A coleção legada de templates não recebeu a categoria atual.");
assert(migrated.getCollection("subcatalogs").label === "Subcatálogos", "A migração não criou a coleção de subcatálogos.");
assert(migratedCard.reflow.mode === "auto", "Contêineres legados devem migrar para reflow Auto.");
assert(migratedCard.children.every(child => !child.slot || child.slot.span === 1), "A migração deve acrescentar span 1 aos slots legados.");
assert(migrated.getState().editor.zoomMode === "fit", "A migração deve ativar o ajuste automático da página.");
assert(migrated.getState().editor.leftPanelCollapsed === false && migrated.getState().editor.rightPanelCollapsed === false, "O estado inicial dos painéis não foi migrado.");
assert(migrated.getState().collections.length === 6, "As coleções não foram hidratadas na migração.");
assert(migratedCard.children.length === 5, "O card antigo não foi hidratado.");
assert(migratedCard.binding.productId === null && Object.values(migratedCard.binding.overrides).every(value => value === false), "O card legado não recebeu binding local normalizado.");
assert(migratedCard.children.find(child => child.type === "title-symbol").props.title === "Migrado", "O conteúdo antigo não foi preservado.");
const migratedArt = migratedCard.children.find(child => child.type === "art");
assert(migratedArt.props.focalX === 50 && migratedArt.props.focalY === 50, "A migração não acrescentou o ponto focal padrão.");
assert(migratedArt.props.vectorMode === "original", "A migração não acrescentou o modo vetorial.");
assert(migratedArt.props.caption === "" && migratedArt.props.captionPosition === "below", "A migração não acrescentou o contrato de legenda.");
const migratedTable = migratedCard.children.find(child => child.type === "data-table");
assert(migratedTable.props.rowIds.length === 1, "A tabela antiga não recebeu uma linha de coleção.");
assert(migrated.getTableRows(migratedTable)[0].metadata.values.code === "X", "A migração não preservou o código legado.");


store.setEditingContext(null);
const layout = store.addComponent("layout-container", { x: 20, y: 400, width: 360, height: 300 });
store.setEditingContext(layout.id);
const textOne = store.addComponent("text", { x: 10, y: 10 }, { parentId: layout.id, props: { content: "Primeiro" } });
const textTwo = store.addComponent("text", { x: 20, y: 20 }, { parentId: layout.id, props: { content: "Segundo" } });
store.updateComponent(layout.id, { layout: { mode: "row", responsive: { enabled: false } } });
assert(textOne.frame.x < textTwo.frame.x, "O auto-layout em linha não ordenou os filhos.");
assert(textOne.frame.y === textTwo.frame.y, "O auto-layout em linha deve alinhar o eixo Y.");
store.markLayoutFree(textOne.id);
const freeX = textOne.frame.x;
store.updateComponent(textOne.id, { frame: { x: freeX + 13 } });
assert(textOne.layoutItem.managed === false, "O override manual do auto-layout não foi preservado.");
store.fitComponentToAutoLayout(textOne.id);
assert(textOne.layoutItem.managed === true, "A reintegração ao auto-layout falhou.");

store.setEditingContext(null);
const nestedArea = store.addComponent("layout-container", { x: 24, y: 620, width: 730, height: 360 }, { layout: { mode: "row", responsive: { enabled: false } } });
store.setEditingContext(nestedArea.id);
const nestedCardOne = store.addComponent("product-card", { x: 0, y: 0 }, { parentId: nestedArea.id });
store.addComponent("product-card", { x: 0, y: 0 }, { parentId: nestedArea.id });
const nestedTable = nestedCardOne.children.find(child => child.type === "data-table");
store.addTableRow(nestedTable.id, { code: "02", package: "CX", price: "R$ 2" });
store.addTableRow(nestedTable.id, { code: "03", package: "CX", price: "R$ 3" });
store.addTableRow(nestedTable.id, { code: "04", package: "CX", price: "R$ 4" });
const nestedSpec = nestedCardOne.children.find(child => child.slot?.name === "specifications");
store.markSlotFree(nestedSpec.id);
store.updateComponent(nestedArea.id, { frame: { height: 120 } });
const recursiveMinimum = store.getReflowMinimum(nestedArea, nestedArea.frame);
assert(nestedArea.frame.height >= recursiveMinimum.height, "A Área de composição atravessou o mínimo vertical dos cards.");
assert(nestedSpec.slot.managed === false, "O reflow do pai apagou o override local do descendente.");
assert(nestedTable.frame.y + nestedTable.frame.height <= nestedCardOne.frame.height, "A tabela ficou fora do frame do card após o reflow.");
store.updateComponent(nestedArea.id, { reflow: { mode: "manual" } });
store.markSlotFree(nestedSpec.id);
store.updateComponent(nestedArea.id, { frame: { height: nestedArea.frame.height + 8 } });
assert(nestedSpec.slot.managed === false, "O modo Manual deveria preservar o override interno.");

const compositionStore = new CatalogDocumentStore(createBlankCatalogDocument());
const dynamicHeader = compositionStore.addComponent("catalog-header", { x: 24, y: 24, width: 746, height: 140 });
const dynamicTitle = dynamicHeader.children.find(child => child.slot?.name === "title");
const dynamicLogo = dynamicHeader.children.find(child => child.slot?.name === "logo");
const titleWidthWithLogo = dynamicTitle.frame.width;
compositionStore.deleteComponent(dynamicLogo.id);
assert(dynamicTitle.frame.x === 12 && dynamicTitle.frame.width > titleWidthWithLogo, "O conteúdo superior não ocupou o espaço liberado pela logo.");
assert(compositionStore.getMissingDefaultChildren(dynamicHeader.id).some(item => item.slotName === "logo" && item.type === "art"), "A peça removida não ficou disponível para restauração.");
const persistedWithoutLogo = new CatalogDocumentStore(JSON.parse(JSON.stringify(compositionStore.getState())));
assert(!persistedWithoutLogo.findComponent(dynamicHeader.id).component.children.some(child => child.slot?.name === "logo"), "Uma peça opcional removida reapareceu ao recarregar o schema atual.");
compositionStore.restoreDefaultChild(dynamicHeader.id, "logo", "art");
assert(dynamicHeader.children.some(child => child.slot?.name === "logo" && child.type === "art"), "A ação estrutural não restaurou a logo.");

const dynamicCard = compositionStore.addComponent("product-card", { x: 24, y: 180, width: 350, height: 300 });
const dynamicArt = dynamicCard.children.find(child => child.slot?.name === "art");
const dynamicSpecification = dynamicCard.children.find(child => child.slot?.name === "specifications");
const specificationWidthWithArt = dynamicSpecification.frame.width;
compositionStore.deleteComponent(dynamicArt.id);
assert(dynamicSpecification.frame.x === 12 && dynamicSpecification.frame.width > specificationWidthWithArt, "As especificações não ocuparam o espaço liberado pela arte.");
compositionStore.restoreDefaultChild(dynamicCard.id, "art", "art");

const contextualArea = compositionStore.addComponent("layout-container", { x: 24, y: 220, width: 600, height: 260 }, { layout: { mode: "row", gap: 6, responsive: { enabled: false } } });
const contextualOne = compositionStore.addComponent("text", { x: 0, y: 0 }, { parentId: contextualArea.id, props: { content: "A" } });
compositionStore.addComponent("text", { x: 0, y: 0 }, { parentId: contextualArea.id, props: { content: "B" } });
assert(compositionStore.getContextualSeparatorState(contextualArea.id).eligible === false, "A linha ficou disponível sem superar 3× a espessura mínima.");
compositionStore.updateComponent(contextualArea.id, { layout: { gap: 7 } });
assert(compositionStore.getContextualSeparatorState(contextualArea.id).eligible === true, "A linha contextual não ficou disponível após superar o limiar.");
const contextualWidth = contextualOne.frame.width;
const contextualSeparator = compositionStore.addContextualSeparator(contextualArea.id);
assert(contextualSeparator?.props.contextual === true && contextualSeparator.layoutItem.overlay === true, "A linha contextual não foi criada como sobreposição semântica.");
assert(contextualSeparator.props.orientation === "vertical" && contextualOne.frame.width === contextualWidth, "A linha contextual alterou a distribuição dos itens em linha.");

const atomicFooter = compositionStore.addComponent("catalog-footer", { x: 24, y: 900, width: 746, height: 100 });
const atomicFooterItem = atomicFooter.children[0];
assert(atomicFooterItem.children.length === 3 && atomicFooterItem.children.some(child => child.type === "icon") && atomicFooterItem.children.filter(child => child.type === "text").length === 2, "O item de rodapé não foi composto por átomos de ícone e texto.");
const atomicFooterIcon = atomicFooterItem.children.find(child => child.type === "icon");
const atomicFooterTitle = atomicFooterItem.children.find(child => child.slot?.name === "title");
const titleYWithIcon = atomicFooterTitle.frame.y;
compositionStore.deleteComponent(atomicFooterIcon.id);
assert(atomicFooterTitle.frame.y < titleYWithIcon && compositionStore.getMissingDefaultChildren(atomicFooterItem.id).some(item => item.slotName === "icon"), "Os textos do rodapé não ocuparam o espaço liberado pelo ícone.");
const restoredFooterIcon = compositionStore.restoreDefaultChild(atomicFooterItem.id, "icon", "icon");
assert(restoredFooterIcon, "O átomo de ícone do rodapé não foi restaurado.");
compositionStore.updateComponent(restoredFooterIcon.id, { style: { vectorColor: "text.primary" } });
assert(restoredFooterIcon.style.vectorColor === "text.primary", "A cor vetorial não pertence ao átomo de ícone do rodapé.");

store.setEditingContext(null);
const distributable = store.addComponent("text", { x: 400, y: 520, width: 120, height: 60 });
const series = store.duplicateComponentSeries(distributable.id, { direction: "left", mode: "gap", distance: 10, count: 1 });
assert(series.length === 1, "A duplicação direcional não criou a série.");
assert(series[0].frame.x === 270 && series[0].frame.y === distributable.frame.y, "A distribuição à esquerda não respeitou tamanho e espaçamento.");

console.log("✓ Store 05.2, composição dinâmica, inventário e migração validados.");
