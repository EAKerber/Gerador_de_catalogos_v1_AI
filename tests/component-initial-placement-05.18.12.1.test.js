/* DB-05.18.12.1 — sugestões de topo/base sem autoridade permanente. */
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
  "app/section-recipes.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/component-placement-registry.js",
  "app/component-initial-placement-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const installation = CatalogComponentInitialPlacementContract.install();
assert(installation.storeInstalled, "A integração canônica da store não foi detectada.");
assert(CatalogComponentPlacements.validate(CATALOG_COMPONENT_REGISTRY).ok, "O registro de posições prováveis é inválido.");
const insertComponentBeforeInstall = CatalogDocumentStore.prototype.insertComponent;
CatalogComponentInitialPlacementContract.install();
assert(CatalogDocumentStore.prototype.insertComponent === insertComponentBeforeInstall, "O contrato voltou a substituir métodos da store em runtime.");

const headerStore = new CatalogDocumentStore(createBlankCatalogDocument());
const header = headerStore.insertComponent("catalog-header");
assert(header.frame.x === 24 && header.frame.y === 24, `Cabeçalho não iniciou no topo seguro: ${JSON.stringify(header.frame)}.`);
assert(header.frame.width === 746, "Cabeçalho não ocupou a largura da área segura.");

const footerStore = new CatalogDocumentStore(createBlankCatalogDocument());
const footer = footerStore.insertComponent("catalog-footer");
assert(footer.frame.x === 24 && footer.frame.y === 999, `Rodapé não iniciou na base segura: ${JSON.stringify(footer.frame)}.`);
assert(footer.frame.width === 746, "Rodapé não ocupou a largura da área segura.");
assert(footerStore.getHistoryState().undoCount === 1, "A inserção provável não gerou uma única entrada de histórico.");

footerStore.updateComponent(footer.id, { frame: { y: 500 } });
assert(footerStore.findComponent(footer.id).component.frame.y === 500, "A sugestão virou trava depois da inserção.");
assert(footerStore.undo(), "Não foi possível desfazer a movimentação livre.");
assert(footerStore.findComponent(footer.id).component.frame.y === 999, "Desfazer não restaurou a posição inicial provável.");

const collisionStore = new CatalogDocumentStore(createBlankCatalogDocument());
collisionStore.addComponent("catalog-footer", { x: 24, y: 999, width: 746, height: 100 });
const secondFooter = collisionStore.insertComponent("catalog-footer");
assert(secondFooter.frame.y < 999, "O segundo rodapé não avançou para dentro da página ao encontrar colisão.");
assert(secondFooter.frame.x === 24 && secondFooter.frame.width === 746, "A busca interna perdeu a faixa segura.");

const genericStore = new CatalogDocumentStore(createBlankCatalogDocument());
const card = genericStore.insertComponent("product-card");
assert(card.frame.x === 24 && card.frame.y === 24 && card.frame.width === 350, "Um tipo sem hint deixou de usar o posicionamento genérico.");
assert(CatalogComponentInitialPlacementContract.probableFrame(genericStore, "catalog-footer", { width: 746, height: 100 }, card.id) === null, "Uma posição de página vazou para contexto interno.");
assert(genericStore.getState().schemaVersion === "1.16.0", "O contrato exigiu mudança de schema.");

console.log("✓ DB-05.18.12.1 posiciona cabeçalho no topo e rodapé na base sem restringir edições posteriores.");
