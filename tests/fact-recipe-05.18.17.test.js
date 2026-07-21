/* DB-05.18.17 — fact como receita composta, não como novo tipo. */
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
      if (!(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y)) return false;
    }
  }
  return children.every(noSiblingOverlap);
};

assert(Object.keys(CATALOG_COMPONENT_REGISTRY).length === 16, "O experimento fact alterou a quantidade de tipos.");
assert(!CATALOG_COMPONENT_REGISTRY.fact, "fact foi registrado prematuramente como componente.");
assert(CatalogFactRecipeContract.VERSION === "05.18.17", "Versão inesperada do contrato fact.");
assert(CatalogSectionRecipes.VERSION === "1.4.0", `Versão inesperada do registro de receitas: ${CatalogSectionRecipes.VERSION}.`);

const recipe = CatalogSectionRecipes.get("fact");
assert(recipe?.component?.type === "layout-container", "fact não foi materializado com tipos existentes.");
assert(treeCount(recipe.component) === 5, `A receita deveria conter raiz e quatro átomos; recebeu ${treeCount(recipe.component)}.`);
assert(recipe.component.children.filter(child => child.type === "icon").length === 1, "A receita não possui ícone opcional independente.");
assert(recipe.component.children.filter(child => child.type === "text").length === 3, "A receita não separa rótulo, valor e unidade.");
assert(JSON.stringify(recipe.component.children.map(child => child.props?.recipeRole)) === JSON.stringify(["icon", "label", "value", "unit"]), "A ordem semântica da receita está incorreta.");

const textFields = CATALOG_COMPONENT_REGISTRY.text.contentFields.map(field => field.path);
const specificationFields = CATALOG_COMPONENT_REGISTRY.specification.contentFields.map(field => field.path);
const tableFields = CATALOG_COMPONENT_REGISTRY["data-table"].contentFields.map(field => field.path);
assert(textFields.includes("content") && !textFields.includes("value") && !textFields.includes("unit"), "A comparação com text perdeu sua limitação semântica.");
assert(specificationFields.includes("label") && specificationFields.includes("icon") && !specificationFields.includes("value") && !specificationFields.includes("unit"), "A comparação com specification perdeu sua limitação semântica.");
assert(tableFields.length === 0 && CATALOG_COMPONENT_REGISTRY["data-table"].defaultProps.collectionId === "tableRows", "A comparação com tabela não preserva seu custo estrutural.");

const scenarios = [
  { kind: "dimension", icon: "diameter", label: "DIÂMETRO", value: "8", unit: "mm", frame: { x: 24, y: 24, width: 240, height: 180 } },
  { kind: "weight", icon: "load-capacity", label: "CAPACIDADE", value: "120", unit: "kg", frame: { x: 276, y: 24, width: 160, height: 180 } },
  { kind: "material", icon: "layers", label: "MATERIAL", value: "AÇO CARBONO", unit: "", frame: { x: 448, y: 24, width: 160, height: 180 }, removeIcon: true, removeUnit: true },
  { kind: "compatibility", icon: "target", label: "COMPATIBILIDADE", value: "MDF 15–25", unit: "mm", frame: { x: 24, y: 216, width: 180, height: 180 } }
];

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const facts = [];
for (const scenario of scenarios) {
  store.setEditingContext(null);
  const historyBefore = store.getHistoryState().undoCount;
  const fact = store.insertComponentFromTemplate("fact");
  assert(store.getHistoryState().undoCount === historyBefore + 1, `${scenario.kind}: a receita não foi inserida em uma única ação.`);
  assert(store.getHistoryState().undoLabel === "Inserir estrutura pronta", `${scenario.kind}: rótulo de histórico inesperado.`);
  store.updateComponent(role(fact, "icon").id, { props: { icon: scenario.icon, iconScale: 120 } });
  store.updateComponent(role(fact, "label").id, { props: { content: scenario.label } });
  store.updateComponent(role(fact, "value").id, { props: { content: scenario.value } });
  store.updateComponent(role(fact, "unit").id, { props: { content: scenario.unit } });
  store.updateComponent(fact.id, { frame: scenario.frame });
  store.reflowComponentTree(fact.id);
  facts.push({ id: fact.id, scenario });
}

let material = store.findComponent(facts[2].id).component;
const materialIconId = role(material, "icon").id;
const materialUnitId = role(material, "unit").id;
store.deleteComponent(materialIconId);
assert(!store.findComponent(materialIconId), "Não foi possível remover o ícone opcional do material.");
const historyBeforeUnitDelete = store.getHistoryState().undoCount;
store.deleteComponent(materialUnitId);
assert(!store.findComponent(materialUnitId), "Não foi possível remover a unidade opcional do material.");
assert(store.getHistoryState().undoCount === historyBeforeUnitDelete + 1, "A remoção da unidade não foi uma ação única.");
material = store.findComponent(facts[2].id).component;
store.reflowComponentTree(material.id);
assert(!role(material, "icon") && !role(material, "unit"), "O material ainda possui peças opcionais removidas.");
assert(role(material, "label")?.props.content === "MATERIAL" && role(material, "value")?.props.content === "AÇO CARBONO", "A remoção opcional afetou o conteúdo essencial.");

assert(store.undo(), "Não foi possível desfazer a remoção da unidade.");
material = store.findComponent(facts[2].id).component;
assert(role(material, "unit")?.props.content === "", "Desfazer não restaurou a unidade vazia.");
assert(!role(material, "icon"), "Desfazer a unidade restaurou também o ícone de uma ação anterior.");
assert(store.redo(), "Não foi possível refazer a remoção da unidade.");
material = store.findComponent(facts[2].id).component;
assert(!role(material, "unit") && !role(material, "icon"), "Refazer não restaurou o estado opcional esperado.");

for (const { id, scenario } of facts) {
  const current = store.findComponent(id).component;
  assert(current.props?.recipeRole === "fact", `${scenario.kind}: papel da raiz perdido.`);
  assert(role(current, "label")?.props.content === scenario.label, `${scenario.kind}: rótulo perdido.`);
  assert(role(current, "value")?.props.content === scenario.value, `${scenario.kind}: valor perdido.`);
  if (!scenario.removeUnit) assert(role(current, "unit")?.props.content === scenario.unit, `${scenario.kind}: unidade perdida.`);
  if (!scenario.removeIcon) assert(role(current, "icon")?.props.icon === scenario.icon, `${scenario.kind}: ícone perdido.`);
  assert(contained(current), `${scenario.kind}: filho fora da raiz.`);
  assert(noSiblingOverlap(current), `${scenario.kind}: filhos sobrepostos.`);
}

const weight = store.findComponent(facts[1].id).component;
const weightUnitBefore = role(weight, "unit").props.content;
store.updateComponent(role(weight, "value").id, { props: { content: "150" } });
assert(role(store.findComponent(weight.id).component, "unit").props.content === weightUnitBefore, "Editar o valor alterou a unidade independente.");

const report = store.getPublicationReport("draft");
assert(report.summary.collisions === 0, `O experimento gerou colisões: ${report.summary.collisions}.`);
assert(report.summary.overflows === 0, `O experimento gerou overflows: ${report.summary.overflows}.`);
assert(store.getPage().children.length === 4, "A receita criou componentes externos inesperados.");
assert(treeCount(recipe.component) === 5, "A comparação de ações manuais foi alterada.");

const app = fs.readFileSync(path.join(root, "app", "fact-recipe-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "fact-recipe-contract.js"), "utf8");
assert(app === kit, "O contrato fact divergiu entre editor e AuthoringKit.");
assert(fs.readFileSync(path.join(root, "app", "main.js"), "utf8").includes('file: "fact-recipe-contract.js"'), "O editor não carrega o contrato fact.");
assert(fs.readFileSync(path.join(root, "tools", "build-developer-b-authoring-kit.js"), "utf8").includes('"fact-recipe-contract.js"'), "O build Developer B não copia o contrato fact.");
assert(store.getState().schemaVersion === "1.16.0", "O experimento fact alterou o schema.");

console.log("✓ DB-05.18.17 validou dimensão, carga, material e compatibilidade com peças opcionais, uma ação e sem novo tipo.");
