/* DB-05.18.15 — section-heading como receita, não como novo tipo. */
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
  "app/catalog-validator.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const role = (component, name) => component.children.find(child => child.props?.recipeRole === name);
const treeCount = component => 1 + (component.children || []).reduce((total, child) => total + treeCount(child), 0);
const contained = component => (component.children || []).every(child => {
  const inside = child.frame.x >= 0
    && child.frame.y >= 0
    && child.frame.x + child.frame.width <= component.frame.width + 1
    && child.frame.y + child.frame.height <= component.frame.height + 1;
  return inside && contained(child);
});
const noSiblingOverlap = component => {
  const children = (component.children || []).filter(child => child.layoutItem?.overlay !== true);
  for (let left = 0; left < children.length; left += 1) {
    for (let right = left + 1; right < children.length; right += 1) {
      const a = children[left].frame;
      const b = children[right].frame;
      const overlaps = !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
      if (overlaps) return false;
    }
  }
  return children.every(noSiblingOverlap);
};

assert(Object.keys(CATALOG_COMPONENT_REGISTRY).length === 16, "O experimento alterou a quantidade de tipos registrados.");
assert(!CATALOG_COMPONENT_REGISTRY["section-heading"], "section-heading foi registrado prematuramente como componente.");
assert(CatalogSectionRecipes.VERSION === "1.3.0", `Versão inesperada das receitas: ${CatalogSectionRecipes.VERSION}.`);

const recipe = CatalogSectionRecipes.get("section-heading");
assert(recipe?.component?.type === "layout-container", "A intenção não foi representada por uma composição existente.");
assert(recipe.contexts.includes("page") && recipe.contexts.includes("layout-container"), "A receita não declara os dois contextos editoriais esperados.");
assert(treeCount(recipe.component) === 5, `A composição deveria conter raiz e quatro peças; recebeu ${treeCount(recipe.component)}.`);
assert(recipe.component.children.filter(child => child.type === "text").length === 3, "A receita não possui os três textos editáveis.");
assert(recipe.component.children.filter(child => child.type === "separator").length === 1, "A receita não possui o divisor editável.");
assert(new Set(recipe.component.children.map(child => child.type)).size === 2, "A receita introduziu um tipo inesperado.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const insertBeforeFirst = store.getHistoryState().undoCount;
const first = store.insertComponentFromTemplate("section-heading");
assert(store.getHistoryState().undoCount === insertBeforeFirst + 1, "A primeira composição não foi inserida em uma única transação.");
assert(store.getHistoryState().undoLabel === "Inserir estrutura pronta", "O histórico não identifica a inserção como estrutura pronta.");
assert(treeCount(first) === 5, "A instância perdeu peças durante a materialização.");

store.setEditingContext(null);
const insertBeforeSecond = store.getHistoryState().undoCount;
const second = store.insertComponentFromTemplate("section-heading");
assert(store.getHistoryState().undoCount === insertBeforeSecond + 1, "A segunda composição não foi inserida em uma única transação.");
assert(first.id !== second.id, "As duas instâncias reutilizaram o mesmo ID de raiz.");
assert(new Set([...first.children, ...second.children].map(child => child.id)).size === 8, "As instâncias compartilharam IDs internos.");

const scenarioOne = {
  kicker: "LINHA TÉCNICA",
  title: "FIXADORES PARA MADEIRA",
  support: "Parafusos, buchas e acessórios para montagem profissional."
};
const scenarioTwo = {
  kicker: "COLEÇÃO 2026",
  title: "ILUMINAÇÃO LINEAR",
  support: "Perfis, difusores e acessórios para projetos arquitetônicos."
};

for (const [component, scenario] of [[first, scenarioOne], [second, scenarioTwo]]) {
  store.updateComponent(role(component, "kicker").id, { props: { content: scenario.kicker } });
  store.updateComponent(role(component, "title").id, { props: { content: scenario.title } });
  store.updateComponent(role(component, "support").id, { props: { content: scenario.support } });
}
store.updateComponent(first.id, { frame: { width: 620, height: 124 } });
store.updateComponent(second.id, { frame: { width: 300, height: 124 } });
store.reflowComponentTree(first.id);
store.reflowComponentTree(second.id);

let firstCurrent = store.findComponent(first.id).component;
let secondCurrent = store.findComponent(second.id).component;
assert(role(firstCurrent, "title").props.content === scenarioOne.title, "O primeiro cenário não persistiu.");
assert(role(secondCurrent, "title").props.content === scenarioTwo.title, "O segundo cenário não persistiu.");
assert(role(firstCurrent, "title").props.content !== role(secondCurrent, "title").props.content, "Os cenários foram acoplados indevidamente.");
assert(firstCurrent.frame.width === 620 && secondCurrent.frame.width === 300, "As larguras ampla e compacta não foram preservadas.");
assert(contained(firstCurrent) && contained(secondCurrent), "Uma peça ultrapassou a composição após o redimensionamento.");
assert(noSiblingOverlap(firstCurrent) && noSiblingOverlap(secondCurrent), "A composição criou sobreposição interna.");

const secondKickerId = role(secondCurrent, "kicker").id;
const historyBeforeDelete = store.getHistoryState().undoCount;
store.deleteComponent(secondKickerId);
assert(!store.findComponent(secondKickerId), "Não foi possível remover o sobretítulo opcional.");
assert(store.getHistoryState().undoCount === historyBeforeDelete + 1, "A remoção opcional não gerou uma única entrada de histórico.");
secondCurrent = store.findComponent(second.id).component;
store.reflowComponentTree(secondCurrent.id);
assert(!role(secondCurrent, "kicker"), "O sobretítulo continuou materializado após a remoção.");
assert(role(secondCurrent, "title") && role(secondCurrent, "support") && role(secondCurrent, "divider"), "Remover o sobretítulo afetou peças obrigatórias da composição.");
assert(contained(secondCurrent) && noSiblingOverlap(secondCurrent), "A composição compacta ficou inválida sem o sobretítulo.");

assert(store.undo(), "Não foi possível desfazer a remoção do sobretítulo.");
secondCurrent = store.findComponent(second.id).component;
assert(role(secondCurrent, "kicker")?.props.content === scenarioTwo.kicker, "Desfazer não restaurou o sobretítulo e seu conteúdo.");
assert(store.redo(), "Não foi possível refazer a remoção do sobretítulo.");
secondCurrent = store.findComponent(second.id).component;
assert(!role(secondCurrent, "kicker"), "Refazer não removeu novamente o sobretítulo.");
assert(role(secondCurrent, "title").props.content === scenarioTwo.title, "O histórico perdeu o título do segundo cenário.");

const report = store.getPublicationReport("draft");
assert(report.summary.collisions === 0, `O experimento gerou colisões: ${report.summary.collisions}.`);
assert(report.summary.overflows === 0, `O experimento gerou overflows: ${report.summary.overflows}.`);
assert(store.getPage().children.length === 2, "A receita materializou componentes externos inesperados.");
firstCurrent = store.findComponent(first.id).component;
assert(treeCount(firstCurrent) === 5 && treeCount(secondCurrent) === 4, "A contagem de peças não acompanha a opcionalidade do kicker.");
assert(1 < treeCount(recipe.component), "A receita não reduz ações em relação à montagem manual.");

const appSource = fs.readFileSync(path.join(root, "app", "section-recipes.js"), "utf8");
const kitSource = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "section-recipes.js"), "utf8");
assert(appSource === kitSource, "As receitas divergiram entre editor e AuthoringKit.");
assert(store.getState().schemaVersion === "1.16.0", "O experimento alterou o schema do documento.");

console.log("✓ DB-05.18.15 validou dois títulos de seção, uma ação de inserção, opcionalidade, responsividade, histórico e paridade do kit.");
