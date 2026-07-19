/* Incremento 05.2 — histórico transacional, documento autoral e análise de importação. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
let savedValue = null;
global.window = global;
global.localStorage = { getItem() { return savedValue; }, setItem(_key, value) { savedValue = value; } };
global.CatalogEditorIcon = () => "";
global.document = { createElement() { return { click() {} }; } };
global.URL = { createObjectURL() { return ""; }, revokeObjectURL() {} };
global.Blob = class Blob {};

for (const file of ["app/layout-engine.js", "app/component-registry.js", "app/collection-registry.js", "app/document-store.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };

const store = new CatalogDocumentStore(createBlankCatalogDocument());
assert(store.getHistoryState().canUndo === false && store.isDirty() === false, "Um documento recém-aberto não deve iniciar sujo.");

const text = store.addComponent("text", { x: 24, y: 24, width: 160, height: 60 }, { props: { content: "Original" } });
assert(store.getHistoryState().canUndo && store.isDirty(), "Adicionar componente não entrou no histórico.");
const countAfterAdd = store.getHistoryState().undoCount;
store.setSelection(text.id);
store.setEditorSetting("gridVisible", false);
assert(store.getHistoryState().undoCount === countAfterAdd, "Seleção e preferências visuais não podem poluir o histórico.");

assert(store.undo(), "Desfazer não encontrou a adição.");
assert(!store.findComponent(text.id) && store.getHistoryState().canRedo, "Desfazer não removeu o componente adicionado.");
assert(store.redo(), "Refazer não encontrou a adição desfeita.");
assert(store.findComponent(text.id), "Refazer não restaurou o componente com o mesmo ID.");

store.save();
assert(store.isDirty() === false && savedValue, "Salvar não limpou o estado sujo nem persistiu o documento.");
const beforeCoalesced = store.getHistoryState().undoCount;
store.updateComponent(text.id, { props: { content: "Primeira edição" } });
store.updateComponent(text.id, { props: { content: "Segunda edição" } });
assert(store.getHistoryState().undoCount === beforeCoalesced + 1, "Edições consecutivas do mesmo campo não foram agrupadas.");
assert(store.undo(), "A edição agrupada não pôde ser desfeita.");
assert(store.findComponent(text.id).component.props.content === "Original", "Desfazer edição agrupada não restaurou o valor salvo.");
assert(store.isDirty() === false, "Voltar exatamente ao snapshot salvo deveria limpar o estado sujo.");
store.updateComponent(text.id, { frame: { x: 80 } });
assert(store.getHistoryState().canRedo === false, "Uma nova mutação após undo não invalidou a pilha de redo.");

const product = store.createProduct({ title: "PRODUTO", code: "100", package: "CX", price: "R$ 10,00" });
const card = store.addComponent("product-card", { x: 220, y: 80, width: 350, height: 280 });
store.bindProduct(card.id, product.id);
store.save();
const beforeProductUpdate = store.getHistoryState().undoCount;
store.updateProduct(product.id, { price: "R$ 12,00" });
assert(store.getHistoryState().undoCount === beforeProductUpdate + 1, "Produto e propagação vinculada não formaram uma ação única.");
assert(store.undo(), "A atualização vinculada não pôde ser desfeita.");
const restoredProduct = store.getProduct(product.id);
const restoredCard = store.findComponent(card.id).component;
const restoredTable = restoredCard.children.find(child => child.type === "data-table");
assert(restoredProduct.metadata.values.price === "R$ 10,00", "Undo não restaurou o preço da entidade de produto.");
assert(store.getTableRows(restoredTable)[0].metadata.values.price === "R$ 10,00", "Undo não restaurou o card vinculado na mesma transação.");

const authoringDocument = store.getExportDocument();
assert(authoringDocument.schemaVersion === "1.16.0" && !Object.hasOwn(authoringDocument, "editor"), "A exportação autoral ainda exige estado efêmero do editor.");
const authoringAnalysis = store.analyzeDocument(authoringDocument);
assert(authoringAnalysis.ok && authoringAnalysis.document.editor, "Documento sem sessão de editor não foi normalizado para importação.");
assert(authoringAnalysis.issues.some(issue => issue.code === "EDITOR_SESSION_DEFAULTED"), "A análise não informou o preenchimento local da sessão.");

const oldDocument = JSON.parse(JSON.stringify(authoringDocument));
oldDocument.schemaVersion = "1.11.0";
const oldAnalysis = store.analyzeDocument(oldDocument);
assert(oldAnalysis.ok && oldAnalysis.document.schemaVersion === "1.16.0", "Documento 1.11.0 não foi analisado e migrado em memória.");
assert(store.getState().schemaVersion === "1.16.0", "A análise de importação alterou indevidamente o store atual.");

const unknownType = JSON.parse(JSON.stringify(authoringDocument));
unknownType.pages[0].children.push({ id: "bad", type: "unknown-widget", children: [] });
const invalidAnalysis = store.analyzeDocument(unknownType);
assert(!invalidAnalysis.ok && invalidAnalysis.issues.some(issue => issue.code === "UNKNOWN_COMPONENT"), "Tipo desconhecido não bloqueou a importação.");

const futureDocument = JSON.parse(JSON.stringify(authoringDocument));
futureDocument.schemaVersion = "9.0.0";
assert(store.analyzeDocument(futureDocument).ok === false, "Schema futuro foi aceito sem compatibilidade conhecida.");

const replacement = createBlankCatalogDocument();
replacement.id = "imported-document";
replacement.title = "Documento importado";
const previousId = store.getState().id;
store.replaceDocument(replacement, { changeType: "document-imported" });
assert(store.getState().id === "imported-document", "O commit atômico não substituiu o documento.");
assert(store.undo() && store.getState().id === previousId, "Desfazer não recuperou o documento anterior à importação.");

console.log("✓ Histórico, estado salvo, documento autoral e importação segura 05.2 validados.");
