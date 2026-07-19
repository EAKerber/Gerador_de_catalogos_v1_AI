/* Incremento 05.7 — seleção contextual e refinamento manual em lote. */
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
  "app/collection-registry.js",
  "app/manual-entry.js",
  "app/document-store.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const first = store.addComponent("text", { x: 40, y: 80, width: 100, height: 40 });
const second = store.addComponent("text", { x: 190, y: 120, width: 120, height: 40 });
const third = store.addComponent("text", { x: 390, y: 170, width: 80, height: 40 });
const live = component => store.findComponent(component.id)?.component;

store.setSelection(first.id);
store.setSelection(second.id, { toggle: true });
store.setSelection(third.id, { toggle: true });
assert(store.getSelectedIds().join(",") === [first.id, second.id, third.id].join(","), "A seleção aditiva não preservou os três irmãos.");

const beforeAlign = store.getHistoryState().undoCount;
assert(store.alignComponents(store.getSelectedIds(), "top"), "O alinhamento da seleção foi recusado.");
assert([first, second, third].every(component => component.frame.y === 80), "Alinhar ao topo não aplicou a mesma coordenada aos componentes.");
assert(store.getHistoryState().undoCount === beforeAlign + 1 && store.getHistoryState().undoLabel === "Alinhar seleção", "O alinhamento não gerou uma única entrada de histórico.");
store.undo();
assert(live(second).frame.y === 120 && live(third).frame.y === 170, "Desfazer não restaurou a geometria anterior ao alinhamento.");

assert(store.distributeComponents(store.getSelectedIds(), "horizontal"), "A distribuição horizontal foi recusada.");
const centers = [first, second, third].map(component => live(component).frame.x + live(component).frame.width / 2);
assert(Math.abs((centers[1] - centers[0]) - (centers[2] - centers[1])) < 0.001, "A distribuição não igualou a distância entre centros.");

const historyBeforeTransform = store.getHistoryState().undoCount;
assert(store.transformComponents(store.getSelectedIds(), { kind: "equalize", path: "width", referenceId: second.id }), "Igualar larguras foi recusado.");
assert([first, second, third].every(component => live(component).frame.width === live(second).frame.width), "A equalização não usou a largura da referência.");
assert(store.getHistoryState().undoCount === historyBeforeTransform + 1, "A equalização criou mais de uma entrada de histórico.");
assert(store.transformComponents(store.getSelectedIds(), { kind: "delta", values: { x: 12, y: -8 } }), "O deslocamento conjunto foi recusado.");
assert(live(first).frame.x === 52 && live(first).frame.y === 72, "O delta não foi aplicado aos dois eixos.");
assert(store.transformComponents(store.getSelectedIds(), { kind: "set", path: "height", value: 64 }), "A altura exata em lote foi recusada.");
assert([first, second, third].every(component => live(component).frame.height === 64), "A altura exata não foi aplicada ao conjunto.");
store.undo();
assert([first, second, third].every(component => live(component).frame.height === 40), "Desfazer não restaurou a altura do conjunto.");

const frameList = CatalogManualEntry.parseFrames(["ID\tX\tY\tLARGURA\tALTURA", `${first.id}\t24\t32\t110\t50`, `${second.id}\t146\t32\t120\t50`, `${third.id}\t278\t32\t130\t50`].join("\n"));
const historyBeforeFrames = store.getHistoryState().undoCount;
const framed = store.applyComponentFramesBulk(frameList.rows);
assert(framed.map(component => component.frame.x).join(",") === "24,146,278" && framed.every(component => component.frame.height === 50), "A grade de caixas não aplicou geometrias distintas atomicamente.");
assert(store.getHistoryState().undoCount === historyBeforeFrames + 1 && store.getHistoryState().undoLabel === "Aplicar geometria da seleção", "A grade de caixas não gerou uma entrada única.");
store.undo();
assert(live(first).frame.x === 52 && live(first).frame.height === 40, "Desfazer não restaurou o conjunto anterior à grade de caixas.");

const historyBeforeStyle = store.getHistoryState().undoCount;
const styled = store.setStyleBatch(store.getSelectedIds(), { textColor: "brand.secondary" });
assert(styled.length === 3 && styled.every(component => component.style.textColor === "brand.secondary"), "O token visual não foi aplicado aos itens elegíveis.");
assert(store.getHistoryState().undoCount === historyBeforeStyle + 1 && store.getHistoryState().undoLabel === "Editar estilo da seleção", "O estilo em lote não foi transacional.");

const historyBeforeCopies = store.getHistoryState().undoCount;
const copies = store.duplicateComponents(store.getSelectedIds());
assert(copies.length === 3 && store.getSelectedIds().every(componentId => copies.some(copy => copy.id === componentId)), "Duplicar seleção não focou o novo conjunto.");
assert(store.getHistoryState().undoCount === historyBeforeCopies + 1 && store.getHistoryState().undoLabel === "Duplicar seleção", "Duplicar o conjunto criou mais de uma entrada no histórico.");
store.undo();
assert(copies.every(copy => !store.findComponent(copy.id)), "Desfazer não removeu todas as cópias do lote.");

store.selectContextChildren();
const selectedBeforeDelete = store.getSelectedIds().slice();
assert(store.deleteComponents(selectedBeforeDelete), "Excluir seleção foi recusado.");
assert(store.getPage().children.length === 0 && store.getSelectedIds().length === 0, "Excluir seleção deixou componentes ou seleção residual.");
store.undo();
assert(store.getPage().children.length === 3, "Desfazer não restaurou o conjunto excluído.");

const area = store.addComponent("layout-container", { x: 24, y: 240, width: 746, height: 300 }, { layout: { mode: "row", columns: 3, padding: 8, gap: 8 } });
const cards = [0, 1, 2].map(() => store.addComponent("product-card", { x: 0, y: 0, width: 230, height: 240 }, { parentId: area.id }));
store.setSelection(cards[0].id);
store.setSelection(cards[1].id, { toggle: true });
store.setSelection(cards[2].id, { toggle: true });
const historyBeforePresentation = store.getHistoryState().undoCount;
const presented = store.setPresentationBatch(store.getSelectedIds(), { density: "compact", responsiveState: "compact" });
assert(presented.length === 3 && presented.every(card => card.presentation.density === "compact"), "A densidade não foi aplicada a todos os cards.");
assert(store.getHistoryState().undoCount === historyBeforePresentation + 1 && store.getHistoryState().undoLabel === "Editar apresentação da seleção", "A apresentação em lote não foi uma ação única.");

console.log("✓ Multisseleção, alinhamento, distribuição, tokens, apresentação, duplicação e exclusão em lote validados com histórico atômico.");
