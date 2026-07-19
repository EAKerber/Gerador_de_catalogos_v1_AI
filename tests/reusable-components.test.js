/* Incremento 05.0 — templates de subárvore, galerias e numeração assistida. */
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

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const cardNumber = card => card.children.find(child => child.type === "title-symbol" && child.slot?.name === "title")?.props.number;

const numberingStore = new CatalogDocumentStore(createBlankCatalogDocument());
const cards = Array.from({ length: 5 }, (_, index) => numberingStore.addComponent("product-card", { x: 24 + index * 12, y: 80 + index * 12, width: 350, height: 260 }));
assert(cards.map(cardNumber).join(",") === "01,02,03,04,05", "Cards novos não receberam numeração incremental.");
const thirdTitle = cards[2].children.find(child => child.type === "title-symbol");
assert(numberingStore.getCardNumberChangePlan(thirdTitle.id, "1").kind === "duplicate", "O conflito de numeração não foi identificado.");
numberingStore.updateCardNumber(thirdTitle.id, "1", { compact: true });
assert(cardNumber(cards[3]) === "03" && cardNumber(cards[4]) === "04", "A compactação não reajustou os cards posteriores.");
const afterCompaction = numberingStore.addComponent("product-card", { x: 24, y: 500, width: 350, height: 260 });
assert(cardNumber(afterCompaction) === "05", "A sequência não continuou após a compactação.");
const firstTitle = cards[0].children.find(child => child.type === "title-symbol");
assert(numberingStore.getCardNumberChangePlan(firstTitle.id, "20").kind === "above", "O salto acima da sequência não foi identificado.");
numberingStore.updateCardNumber(firstTitle.id, "20", { continueFrom: true });
const afterJump = numberingStore.addComponent("product-card", { x: 40, y: 520, width: 350, height: 260 });
assert(cardNumber(afterJump) === "21", "A sequência não continuou a partir do valor manual confirmado.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const source = store.addComponent("product-card", { x: 24, y: 80, width: 350, height: 300 });
const sourceTitle = source.children.find(child => child.type === "title-symbol");
store.updateComponent(sourceTitle.id, { props: { title: "CARD PERSONALIZADO" } });
const sourceTable = source.children.find(child => child.type === "data-table");
store.addTableRow(sourceTable.id, { code: "B-02", package: "CX 20", price: "R$ 17,90" });
const template = store.saveComponentAsTemplate(source.id, "Meu card técnico");
assert(template.metadata.rootType === "product-card", "O template não registrou o tipo raiz.");
assert(template.metadata.component.children.length === source.children.length, "A subárvore não foi salva integralmente.");
assert(template.metadata.tableRows.length === 2, "As dependências de tabela não acompanharam o template.");
assert(store.getCollection("templates").label === "Meus componentes", "A coleção reutilizável não está em categoria própria.");

const instance = store.addComponentFromTemplate(template.id, { x: 410, y: 80, width: 350, height: 300 });
assert(instance.id !== source.id && instance.children.every(child => !source.children.some(original => original.id === child.id)), "A instância reutilizada não recebeu novos IDs.");
assert(instance.children.find(child => child.type === "title-symbol").props.title === "CARD PERSONALIZADO", "O conteúdo editado não foi preservado.");
assert(cardNumber(instance) === "02", "A instância de card não entrou na sequência editorial.");
const instanceTable = instance.children.find(child => child.type === "data-table");
assert(store.getTableRows(instanceTable).length === 2, "As linhas da tabela não foram materializadas na instância.");
assert(instanceTable.props.rowIds.every(rowId => !sourceTable.props.rowIds.includes(rowId)), "A instância reutilizou rowIds mutáveis do componente de origem.");

const reloaded = new CatalogDocumentStore(JSON.parse(JSON.stringify(store.getState())));
assert(reloaded.getComponentTemplates().some(item => item.id === template.id), "Meus componentes não persistiram após migração/reload.");

const gallery = store.addComponent("art-gallery", { x: 24, y: 720, width: 300, height: 160 });
assert(gallery.children.length === 3 && gallery.children.every(child => child.type === "art"), "A galeria não nasceu como coleção de imagens.");
assert(gallery.children.map(child => child.props.caption).join(",") === "Variação 1,Variação 2,Variação 3", "Cada imagem da galeria deve possuir legenda própria.");
const fourth = store.addComponent("art", { x: 0, y: 0 }, { parentId: gallery.id, props: { caption: "Variação 4", galleryItem: true } });
assert(fourth.constraints.minWidth === 44 && fourth.constraints.minHeight === 44, "O item de galeria não recebeu mínimo adaptado.");
assert(new Set(gallery.children.map(child => child.props.caption)).size === 4, "As legendas da galeria não permaneceram independentes.");

const cardWithGallery = store.addComponent("product-card", { x: 380, y: 700, width: 370, height: 330 });
store.addComponent("art-gallery", { x: 0, y: 0 }, { parentId: cardWithGallery.id, slotName: "art", replace: true });
const galleryInCard = cardWithGallery.children.find(child => child.slot?.name === "art");
assert(galleryInCard.type === "art-gallery" && galleryInCard.children.length === 3, "O card não aceitou a composição multiarte no slot de arte.");

assert(store.removeComponentTemplate(template.id), "O componente salvo não pôde ser removido da biblioteca.");
assert(!store.getComponentTemplates().some(item => item.id === template.id), "A remoção do componente salvo não persistiu.");

console.log("✓ Templates reutilizáveis, galerias legendadas e numeração assistida validados.");
