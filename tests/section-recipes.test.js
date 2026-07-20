/* Incremento 05.8 — receitas oficiais e inserção contextual. */
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
  "app/fact-recipe-contract.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/catalog-validator.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));
CatalogFactRecipeContract.install();

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const recipeIds = store.getSectionRecipes().map(recipe => recipe.id).sort();
const expectedRecipeIds = [
  "fact",
  "page-catalog-base",
  "section-applications",
  "section-heading",
  "section-hero-grid-strip",
  "section-packaging-legend",
  "section-tip-callout"
].sort();
assert(JSON.stringify(recipeIds) === JSON.stringify(expectedRecipeIds), `A página vazia não expôs as sete estruturas oficiais: ${recipeIds.join(", ")}.`);

const historyBefore = store.getHistoryState().undoCount;
const scaffold = store.insertComponentFromTemplate("page-catalog-base");
const header = scaffold.children.find(component => component.type === "catalog-header");
const content = scaffold.children.find(component => component.props?.recipeRole === "primary-content");
const footer = scaffold.children.find(component => component.type === "catalog-footer");
assert(scaffold.frame.x === 24 && scaffold.frame.y === 24 && scaffold.frame.width === 746 && scaffold.frame.height === 1075, "A página-base não ocupou a área segura da A4.");
assert(header?.children.length === 5 && footer?.children.length === 6, "Cabeçalho ou rodapé da receita não foi hidratado como estrutura composta.");
assert(content?.type === "layout-container" && store.getState().editor.editingContextId === content.id, "A receita não abriu o conteúdo principal para a próxima intenção.");
assert(store.getHistoryState().undoCount === historyBefore + 1 && store.getHistoryState().undoLabel === "Inserir estrutura pronta", "A página-base não foi uma transação única.");
assert(store.getComponentTemplates().length === 0, "Receitas oficiais foram misturadas com Meus componentes.");

const products = Array.from({ length: 7 }, (_, index) => store.createProduct({
  title: `PRODUTO ${index + 1}`,
  code: String(1001 + index),
  package: "CX 100",
  price: `R$ ${index + 1}0,00`
}));
const created = store.createCardsForProducts(products.map(product => product.id), { columns: 3, density: "compact" });
assert(created.area.id === content.id && created.cards.length === 7, "Os cards não reutilizaram o conteúdo principal aberto pela receita.");
const report = store.getPublicationReport("draft");
assert(report.ok && report.summary.collisions === 0 && report.summary.overflows === 0, "Página-base com sete cards não permaneceu geometricamente válida.");

const beforeApplication = store.getHistoryState().undoCount;
const application = store.insertComponentFromTemplate("section-applications");
assert(application.children.length === 3 && application.children.every(component => component.type === "specification"), "A faixa de aplicações não materializou peças editáveis.");
assert(store.getHistoryState().undoCount === beforeApplication + 1, "A faixa pronta não gerou uma única entrada de histórico.");
store.undo();
assert(!store.findComponent(application.id), "Desfazer não removeu toda a faixa pronta.");

store.reset();
const firstText = store.insertComponent("text");
const secondText = store.insertComponent("text");
assert(firstText && secondText && (firstText.frame.x !== secondText.frame.x || firstText.frame.y !== secondText.frame.y), "A inserção rápida não encontrou posições livres distintas.");
assert(store.getPublicationReport("draft").summary.collisions === 0, "O posicionamento automático criou colisão.");

const card = store.insertComponent("product-card");
store.setEditingContext(card.id);
const specification = store.insertComponent("specification");
assert(specification.slot?.name === "specifications" && store.getSlotUsage(card.id, "specifications") === 3, "A inserção contextual não escolheu o slot compatível disponível.");

console.log("✓ Sete receitas oficiais, foco contextual, hidratação, posicionamento livre, slot preferencial e histórico validados.");
