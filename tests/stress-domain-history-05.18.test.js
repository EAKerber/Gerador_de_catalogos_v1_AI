/* Auditoria 05.18 — estresse determinístico de domínio, limites e histórico. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const outputDir = path.resolve(process.env.CATALOG_STRESS_OUTPUT_DIR || "/tmp/catalog-developer-b-stress", "domain");
const seed = Number(process.env.CATALOG_STRESS_SEED || 5182026);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));
const stableSnapshot = state => {
  const snapshot = clone(state);
  delete snapshot.editor;
  delete snapshot.updatedAt;
  return snapshot;
};
const canonicalize = value => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  return value;
};
const signature = state => JSON.stringify(canonicalize(stableSnapshot(state)));

fs.mkdirSync(outputDir, { recursive: true });
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {}, clear() {} };
global.CatalogEditorIcon = () => "";

[
  "app/tokens.js",
  "app/catalog-source.js",
  "app/table-schema-registry.js",
  "app/catalog-generation-plan.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/icon-library.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/component-intent-registry.js",
  "app/section-recipes.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/catalog-validator.js",
  "app/fact-recipe-contract.js",
  "app/callout-recipe-contract.js",
  "app/component-initial-placement-contract.js",
  "app/text-alignment-contract.js",
  "app/text-scale-contract.js",
  "app/text-overflow-contract.js",
  "app/footer-item-containment-contract.js",
  "app/icon-scale-contract.js",
  "app/product-hero-contract.js",
  "app/product-technical-contract.js",
  "app/product-variants-contract.js",
  "app/product-data-only-contract.js",
  "app/reflow-history-stability-contract.js",
  "app/table-binding-overrides-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

[
  CatalogFactRecipeContract,
  CatalogCalloutRecipeContract,
  CatalogComponentInitialPlacementContract,
  CatalogTextAlignmentContract,
  CatalogTextScaleContract,
  CatalogTextOverflowContract,
  CatalogFooterItemContainmentContract,
  CatalogIconScaleContract,
  CatalogProductHeroContract,
  CatalogProductTechnicalContract,
  CatalogProductVariantsContract,
  CatalogProductDataOnlyContract,
  CatalogTableBindingOverridesContract
].forEach(contract => {
  if (contract?.install && contract.install() === false) throw new Error(`Contrato não instalado: ${contract.VERSION || "sem versão"}.`);
});

function mulberry32(value) {
  let state = value >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let result = state;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}

function visit(children, callback, parent = null) {
  (children || []).forEach(component => {
    callback(component, parent);
    visit(component.children, callback, component);
  });
}

function components(store) {
  const result = [];
  visit(store.getPage().children, component => result.push(component));
  return result;
}

function descendant(rootComponent, predicate) {
  let match = null;
  visit(rootComponent?.children, component => { if (!match && predicate(component)) match = component; });
  return match;
}

function validateState(store, label) {
  const nodes = components(store);
  const ids = nodes.map(component => component.id);
  assert(new Set(ids).size === ids.length, `${label}: IDs duplicados.`);
  for (const component of nodes) {
    for (const key of ["x", "y", "width", "height"]) {
      assert(Number.isFinite(Number(component.frame?.[key])), `${label}/${component.id}: frame ${key} não finito.`);
    }
    assert(component.frame.width > 0 && component.frame.height > 0, `${label}/${component.id}: dimensão não positiva.`);
    assert(component.frame.x >= 0 && component.frame.y >= 0, `${label}/${component.id}: posição negativa após clamp.`);
  }
  const selectedIds = store.getSelectedIds();
  assert(selectedIds.every(id => store.findComponent(id)), `${label}: seleção contém IDs removidos.`);
  assert(store.getState().schemaVersion === "1.16.0", `${label}: schema alterado.`);
  return { components: nodes.length, uniqueIds: ids.length, selection: selectedIds.length };
}

const expectedFailures = [];
const unexpectedFailures = [];
function expectFailure(name, operation, accepted = () => true) {
  try {
    operation();
    unexpectedFailures.push({ name, reason: "operação não falhou" });
  } catch (error) {
    const outcome = { name, code: error.code || null, message: error.message };
    if (accepted(error)) expectedFailures.push(outcome);
    else unexpectedFailures.push(outcome);
  }
}

const random = mulberry32(seed);
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const initialSignature = signature(store.getState());
const timeline = [];
const record = (name, operation) => {
  const before = store.getHistoryState().undoCount;
  const result = operation();
  timeline.push({ name, before, after: store.getHistoryState().undoCount, componentCount: components(store).length });
  return result;
};

const area = record("criar área raiz", () => store.addComponent("layout-container", { x: 24, y: 24, width: 746, height: 900 }, {
  parentId: null,
  props: { label: "STRESS ROOT" },
  layout: { mode: "grid", columns: 4, padding: 4, gap: 2, align: "stretch", distribution: "fill", responsive: { enabled: true, breakpoint: 320, mode: "column" } }
}));

const freeItems = [];
for (let index = 0; index < 12; index += 1) {
  const type = index % 2 ? "icon" : "text";
  freeItems.push(record(`adicionar ${type} ${index + 1}`, () => store.addComponent(type, { x: 0, y: 0, width: 100, height: 48 }, {
    parentId: area.id,
    props: type === "text"
      ? { content: `${"CONTEÚDO MUITO LONGO ".repeat(8)}#${index}`, overflow: index % 3 === 0 ? "clip" : index % 3 === 1 ? "ellipsis" : "wrap", scale: [80, 100, 120][index % 3] }
      : { icon: ["load-capacity", "corrosion-resistant", "phone", "payment"][index % 4], iconScale: [80, 100, 120][index % 3], label: `Ícone ${index}` }
  })));
}

const card = record("adicionar card", () => store.addComponent("product-card", { x: 0, y: 0, width: 280, height: 240 }, { parentId: area.id }));
const table = descendant(card, component => component.type === "data-table");
const art = descendant(card, component => component.type === "art");
assert(table && art, "O card de estresse não possui tabela ou arte padrão.");

record("forçar frame mínimo", () => store.updateComponent(card.id, { frame: { x: -5000, y: -5000, width: 1, height: 1 } }));
record("forçar frame máximo", () => store.updateComponent(card.id, { frame: { x: 99999, y: 99999, width: 99999, height: 99999 } }));
record("foco da arte fora da faixa", () => store.updateComponent(art.id, { props: { focalX: -1000, focalY: 5000 } }));

for (const mode of ["hero", "technical", "variants", "data-only", "standard"]) {
  record(`alternar modo ${mode}`, () => store.setComponentPresentation(card.id, { mode, density: mode === "technical" ? "comfortable" : "compact", responsiveState: random() > 0.5 ? "wide" : "compact" }));
}

const bulkRows = Array.from({ length: 20 }, (_, index) => ({
  code: `COD-${String(index + 1).padStart(3, "0")}`,
  package: `CX ${index + 1}`,
  price: `R$ ${(index + 1) * 9},90`
}));
record("substituir tabela acima do limite", () => store.replaceTableRowsBulk(table.id, bulkRows, { mode: "replace" }));
assert(store.getTableRows(table.id).length === 12, `A tabela deveria limitar o lote a 12 linhas; recebeu ${store.getTableRows(table.id).length}.`);

const gallery = record("converter arte em galeria", () => store.addArtVariation(art.id));
const galleryEntries = Array.from({ length: 30 }, (_, index) => ({ caption: `Variação extrema ${index + 1}` }));
record("preencher galeria acima do limite", () => store.applyGalleryItemsBulk(gallery.id, galleryEntries, { mode: "replace" }));
assert(gallery.children.filter(component => component.type === "art").length === 24, `A galeria deveria limitar o lote a 24 artes; recebeu ${gallery.children.length}.`);

const source = freeItems.find(component => component.type === "text");
const copies = record("duplicar série", () => store.duplicateComponentSeries(source.id, { direction: "right", mode: "gap", distance: 0, count: 5 }));
assert(copies.length === 5, `A série deveria criar cinco cópias; criou ${copies.length}.`);
for (const copy of copies.slice(0, 2)) record(`excluir cópia ${copy.id}`, () => store.deleteComponent(copy.id));

record("layout extremo", () => store.updateComponent(area.id, { layout: { mode: "grid", columns: 12, padding: 0, gap: 0, responsive: { enabled: true, breakpoint: 760, mode: "column" } } }));
record("reflow final", () => store.reflowComponentTree(area.id));

const cardAfterClamp = store.findComponent(card.id).component;
const artAfterClamp = store.findComponent(art.id)?.component || descendant(gallery, component => component.id === art.id);
assert(cardAfterClamp.frame.x >= 0 && cardAfterClamp.frame.y >= 0, "O card não foi contido após posições extremas.");
assert(artAfterClamp.props.focalX === 0 && artAfterClamp.props.focalY === 100, `Foco da arte não foi limitado: ${JSON.stringify(artAfterClamp.props)}.`);

expectFailure("slot de título cheio", () => store.addComponent("title-symbol", { x: 0, y: 0, width: 100, height: 40 }, { parentId: card.id, slotName: "title" }), error => error.code === "SLOT_FULL" || /slot/i.test(error.message));
expectFailure("linha em componente não tabela", () => store.addTableRow(source.id, {}), error => /não é uma tabela/i.test(error.message));
expectFailure("tipo desconhecido", () => store.addComponent("unknown-stress-type", { x: 0, y: 0, width: 10, height: 10 }), error => /não é aceito|desconhecido/i.test(error.message));

const fullStore = new CatalogDocumentStore(createBlankCatalogDocument());
fullStore.addComponent("layout-container", { x: 24, y: 24, width: 746, height: 1075 }, { parentId: null, layout: { mode: "free", padding: 0, gap: 0, columns: 1, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 300, mode: "column" } } });
expectFailure("inserção automática sem espaço", () => fullStore.insertComponent("text", { parentId: null }), error => error.code === "NO_AUTOMATIC_PLACEMENT");

const invalidBase = clone(store.getState());
delete invalidBase.editor;
const firstTwo = [];
visit(invalidBase.pages[0].children, component => { if (firstTwo.length < 2) firstTwo.push(component); });
assert(firstTwo.length === 2, "Fixture insuficiente para análise de IDs duplicados.");
firstTwo[1].id = firstTwo[0].id;
const duplicateAnalysis = store.analyzeDocument(invalidBase);
assert(!duplicateAnalysis.ok && duplicateAnalysis.issues.some(issue => issue.code === "DUPLICATE_COMPONENT_ID"), "Documento com ID duplicado não foi rejeitado.");

const futureDocument = clone(store.getState());
futureDocument.schemaVersion = "99.0.0";
const futureAnalysis = store.analyzeDocument(futureDocument);
assert(!futureAnalysis.ok && futureAnalysis.issues.some(issue => issue.code === "FUTURE_SCHEMA"), "Schema futuro não foi rejeitado.");

const invalidFrameDocument = clone(store.getState());
invalidFrameDocument.pages[0].children[0].frame.width = 0;
const invalidFrameAnalysis = store.analyzeDocument(invalidFrameDocument);
assert(!invalidFrameAnalysis.ok && invalidFrameAnalysis.issues.some(issue => issue.code === "INVALID_FRAME"), "Frame inválido não foi rejeitado.");

const finalValidation = validateState(store, "estado final");
const finalSignature = signature(store.getState());
const finalHistory = store.getHistoryState();
assert(finalHistory.undoCount > 0 && finalHistory.undoCount < 100, `O cenário reversível usou ${finalHistory.undoCount} entradas; deveria ficar abaixo do limite.`);

let undoCount = 0;
while (store.undo()) undoCount += 1;
assert(signature(store.getState()) === initialSignature, `Undo completo não restaurou o estado inicial após ${undoCount} passos.`);
let redoCount = 0;
while (store.redo()) redoCount += 1;
assert(signature(store.getState()) === finalSignature, `Redo completo não restaurou o estado final após ${redoCount} passos.`);
const redoValidation = validateState(store, "estado refeito");

const cappedStore = new CatalogDocumentStore(createBlankCatalogDocument());
for (let index = 0; index < 125; index += 1) {
  cappedStore.addComponent("text", { x: index % 25, y: Math.floor(index / 25), width: 80, height: 34 }, { props: { content: `Histórico ${index}` } });
}
assert(cappedStore.getHistoryState().undoCount === 100, `O limite de histórico deveria ser 100; recebeu ${cappedStore.getHistoryState().undoCount}.`);
let cappedUndo = 0;
while (cappedStore.undo()) cappedUndo += 1;
assert(cappedUndo === 100, `O histórico limitado deveria desfazer 100 entradas; desfez ${cappedUndo}.`);
assert(cappedStore.getPage().children.length === 25, `Após expulsar as 25 entradas antigas deveriam restar 25 componentes; restaram ${cappedStore.getPage().children.length}.`);
let cappedRedo = 0;
while (cappedStore.redo()) cappedRedo += 1;
assert(cappedRedo === 100 && cappedStore.getPage().children.length === 125, "Redo após saturação não restaurou o estado terminal.");

const coalescedStore = new CatalogDocumentStore(createBlankCatalogDocument());
const coalescedText = coalescedStore.addComponent("text", { x: 24, y: 24, width: 180, height: 50 }, { props: { content: "Inicial" } });
const beforeCoalescedUpdates = coalescedStore.getHistoryState().undoCount;
for (let index = 0; index < 20; index += 1) coalescedStore.updateComponent(coalescedText.id, { props: { content: `Edição rápida ${index}` } });
assert(coalescedStore.getHistoryState().undoCount === beforeCoalescedUpdates + 1, "Edições rápidas do mesmo campo não foram coalescidas.");
coalescedStore.undo();
assert(coalescedStore.findComponent(coalescedText.id).component.props.content === "Inicial", "Undo da edição coalescida não restaurou o conteúdo inicial.");
coalescedStore.redo();
assert(coalescedStore.findComponent(coalescedText.id).component.props.content === "Edição rápida 19", "Redo da edição coalescida não restaurou o último conteúdo.");

assert(unexpectedFailures.length === 0, `Falhas inesperadas: ${JSON.stringify(unexpectedFailures)}.`);
assert(expectedFailures.length === 4, `Eram esperadas quatro falhas controladas; foram registradas ${expectedFailures.length}.`);

const publication = store.getPublicationReport("draft");
const report = {
  suite: "Developer B 05.18 — domain/history stress",
  seed,
  generatedAt: new Date().toISOString(),
  schemaVersion: store.getState().schemaVersion,
  reversibleScenario: {
    timeline,
    historyEntries: finalHistory.undoCount,
    undoCount,
    redoCount,
    finalValidation,
    redoValidation,
    publication: publication.summary
  },
  limits: {
    tableRowsRequested: bulkRows.length,
    tableRowsAccepted: store.getTableRows(table.id).length,
    galleryItemsRequested: galleryEntries.length,
    galleryItemsAccepted: gallery.children.filter(component => component.type === "art").length,
    historyRequested: 125,
    historyRetained: 100,
    historyResidualAfterUndo: 25,
    coalescedRapidUpdates: 20
  },
  expectedFailures,
  unexpectedFailures,
  analyses: {
    duplicateId: duplicateAnalysis.issues,
    futureSchema: futureAnalysis.issues,
    invalidFrame: invalidFrameAnalysis.issues
  },
  status: "pass"
};
fs.writeFileSync(path.join(outputDir, `stress-domain-${seed}.json`), `${JSON.stringify(report, null, 2)}\n`);
console.log(`✓ Estresse de domínio concluído: ${finalValidation.components} componentes, ${undoCount} undo, ${redoCount} redo, quatro falhas controladas. Relatório: ${outputDir}`);
