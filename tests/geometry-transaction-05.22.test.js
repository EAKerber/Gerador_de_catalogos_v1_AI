/* Incremento 05.22 — planejamento e commit geométrico atômico sem locks. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
for (const file of ["app/layout-engine.js", "app/component-registry.js", "app/collection-registry.js", "app/document-store.js", "app/reflow-history-stability-contract.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const snapshot = store => JSON.stringify(store.getExportDocument());

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const area = store.addComponent("layout-container", { x: 24, y: 80, width: 500, height: 220 }, {
  layout: { mode: "row", padding: 8, gap: 8, responsive: { enabled: false } }
});
const first = store.addComponent("text", { x: 0, y: 0, width: 100, height: 40 }, { parentId: area.id });
const second = store.addComponent("text", { x: 0, y: 0, width: 100, height: 40 }, { parentId: area.id });
const live = componentId => store.findComponent(componentId).component;
const original = {
  first: { frame: { ...live(first.id).frame }, managed: live(first.id).layoutItem.managed },
  second: { frame: { ...live(second.id).frame }, managed: live(second.id).layoutItem.managed }
};

let emissions = 0;
const unsubscribe = store.subscribe((_state, change) => {
  if (change.type !== "init") emissions += 1;
});
const historyBeforePlan = store.getHistoryState().undoCount;
const documentBeforePlan = snapshot(store);
const planned = store.planGeometryTransaction([
  { componentId: first.id, frame: { x: original.first.frame.x + 17 }, releaseAuthority: true },
  { componentId: second.id, frame: { y: original.second.frame.y + 13 }, releaseAuthority: true }
], {
  change: { type: "components-transformed", componentIds: [first.id, second.id] }
});
assert(planned.status !== "blocked", "O planejamento válido foi bloqueado.");
assert(planned.authorityChanges.length === 2, "O plano não antecipou as duas liberações de autoridade.");
assert(snapshot(store) === documentBeforePlan, "Planejar alterou o documento real.");
assert(store.getHistoryState().undoCount === historyBeforePlan && emissions === 0, "Planejar criou histórico ou notificou a interface.");

const committed = store.applyGeometryTransaction([
  { componentId: first.id, frame: { x: original.first.frame.x + 17 }, releaseAuthority: true },
  { componentId: second.id, frame: { y: original.second.frame.y + 13 }, releaseAuthority: true }
], {
  change: { type: "components-transformed", componentIds: [first.id, second.id] },
  selection: { componentIds: [first.id, second.id], primaryId: second.id }
});
assert(committed.status !== "blocked", "O commit válido foi bloqueado.");
assert(
  live(first.id).frame.x === committed.resolved.find(entry => entry.componentId === first.id).frame.x
  && live(second.id).frame.y === committed.resolved.find(entry => entry.componentId === second.id).frame.y,
  "O commit não aplicou os frames resolvidos."
);
assert(live(first.id).layoutItem.managed === false && live(second.id).layoutItem.managed === false, "A autoridade não foi liberada junto do frame.");
assert(emissions === 1, "A transação notificou estados intermediários.");
assert(store.getHistoryState().undoCount === historyBeforePlan + 1, "A transação não criou exatamente uma entrada de histórico.");
assert(store.getLastGeometryTransaction()?.authorityChanges.length === 2, "O relatório final perdeu as alterações de autoridade.");

assert(store.undo(), "Não foi possível desfazer a transação geométrica.");
assert(live(first.id).frame.x === original.first.frame.x && live(second.id).frame.y === original.second.frame.y, "Undo não restaurou os dois frames.");
assert(live(first.id).layoutItem.managed === true && live(second.id).layoutItem.managed === true, "Undo não restaurou a autoridade gerenciada.");

const historyBeforeBlocked = store.getHistoryState().undoCount;
const emissionsBeforeBlocked = emissions;
const beforeBlocked = snapshot(store);
const blocked = store.applyGeometryTransaction([
  { componentId: first.id, frame: { x: original.first.frame.x + 40 }, releaseAuthority: true },
  { componentId: second.id, frame: { width: Number.POSITIVE_INFINITY }, releaseAuthority: true }
], {
  change: { type: "components-transformed", componentIds: [first.id, second.id] }
});
assert(blocked.status === "blocked" && blocked.reasons.includes("invalid-frame"), "O pedido sem solução numérica não foi formalmente bloqueado.");
assert(snapshot(store) === beforeBlocked, "O lote bloqueado deixou mutação parcial.");
assert(live(first.id).layoutItem.managed === true && live(second.id).layoutItem.managed === true, "O lote bloqueado liberou autoridade.");
assert(store.getHistoryState().undoCount === historyBeforeBlocked && emissions === emissionsBeforeBlocked, "O lote bloqueado criou histórico ou emissão.");

const derived = store.updateComponentGeometry(area.id, { width: area.frame.width + 80 }, { releaseAuthority: false });
assert(derived.status === "adjusted", "O resize do contêiner não distinguiu as mudanças derivadas.");
assert(derived.changes.some(change => change.componentId === area.id && change.direct), "O relatório perdeu a mudança solicitada.");
assert(derived.changes.some(change => [first.id, second.id].includes(change.componentId) && !change.direct), "O relatório não enumerou o reflow dos filhos.");
assert(derived.reasons.includes("derived-reflow"), "O motivo de reflow derivado não foi registrado.");

const interactions = fs.readFileSync(path.join(root, "app", "interactions.js"), "utf8");
const inspector = fs.readFileSync(path.join(root, "app", "inspector.js"), "utf8");
assert(interactions.includes("updateComponentGeometry(this.session.componentId") && !interactions.includes("this.session.wasSlotted"), "O canvas ainda libera autoridade fora da transação.");
assert(inspector.includes("updateComponentGeometry(component.id, { [key]: value })"), "O inspetor não usa a fronteira transacional.");

unsubscribe();
console.log("✓ Planejamento puro, commit único, rollback, autoridade e reflow derivado 05.22 validados.");
