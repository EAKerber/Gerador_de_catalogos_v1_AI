/* DB-05.18.19 / DB-05.20.15 — auditoria aditiva de reuso, responsividade e legibilidade do callout. */
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
  "app/callout-recipe-contract.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/catalog-validator.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));
CatalogFactRecipeContract.install();
CatalogCalloutRecipeContract.install();

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const role = (component, name) => {
  if (component.props?.recipeRole === name) return component;
  for (const child of component.children || []) {
    const found = role(child, name);
    if (found) return found;
  }
  return null;
};
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

assert(Object.keys(CATALOG_COMPONENT_REGISTRY).length === 16, "A auditoria alterou a quantidade de tipos.");
assert(!CATALOG_COMPONENT_REGISTRY.callout, "callout foi registrado como tipo durante uma auditoria.");
assert(CatalogCalloutRecipeContract.VERSION === "05.20.15", "Versão inesperada do contrato callout.");
assert(CatalogSectionRecipes.VERSION === "1.5.0", `Versão inesperada do registro final de receitas: ${CatalogSectionRecipes.VERSION}.`);
assert(CATALOG_COMPONENT_REGISTRY.icon.recommendedSize.width === 96 && CATALOG_COMPONENT_REGISTRY.icon.recommendedSize.height === 72, "Tamanho recomendável do benefício não foi atualizado.");

const recipe = CatalogSectionRecipes.get("section-tip-callout");
assert(recipe.version === "1.5.0", `Versão inesperada da receita auditada: ${recipe.version}.`);
assert(recipe.component.type === "layout-container", "A receita deixou de ser uma composição canônica.");
assert(recipe.component.frame.width === 330 && recipe.component.frame.height === 150, `Frame amplo não foi normalizado: ${JSON.stringify(recipe.component.frame)}.`);
assert(recipe.component.style.border === "border.none" && recipe.component.style.radius === "radius.none", "A receita depende de infraestrutura visual que desaparece no PDF.");
assert(recipe.component.layout.responsive.enabled === true, "A responsividade continua desativada.");
assert(recipe.component.layout.responsive.breakpoint === 260 && recipe.component.layout.responsive.mode === "column", "Breakpoint responsivo inesperado.");
assert(recipe.component.props.contextual === true, "A receita não publicou marcador contextual para sua hierarquia visual.");
assert(treeCount(recipe.component) === 5, `A receita deveria conter cinco componentes; recebeu ${treeCount(recipe.component)}.`);
assert(role(recipe.component, "icon")?.type === "icon", "O papel de ícone não foi declarado.");
assert(role(recipe.component, "content")?.type === "layout-container", "O papel de conteúdo não foi declarado.");
assert(role(recipe.component, "title")?.type === "text" && role(recipe.component, "body")?.type === "text", "Título ou corpo não foram classificados.");
assert(role(recipe.component, "title").style.surface === "surface.promo-dark", "Título não usa superfície promocional escura.");
assert(role(recipe.component, "title").style.textColor === "promo.on-dark", "Título não usa contraste semântico.");
assert(role(recipe.component, "icon").style.vectorColor === "promo.secondary", "Ícone não usa contraste promocional secundário.");

const scenarios = [
  {
    kind: "technical",
    icon: "torque",
    title: "DICA DE INSTALAÇÃO",
    body: "Aplique o torque recomendado para evitar deformação da ferragem.",
    frame: { x: 24, y: 24, width: 430, height: 150 },
    expectedMode: "row"
  },
  {
    kind: "commercial",
    icon: "payment",
    title: "CONDIÇÃO COMERCIAL",
    body: "Consulte disponibilidade, prazo e condições de pagamento para o seu pedido.",
    frame: { x: 466, y: 24, width: 220, height: 210 },
    expectedMode: "column"
  }
];

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const callouts = [];
for (const scenario of scenarios) {
  store.setEditingContext(null);
  const historyBefore = store.getHistoryState().undoCount;
  const callout = store.insertComponentFromTemplate("section-tip-callout");
  assert(store.getHistoryState().undoCount === historyBefore + 1, `${scenario.kind}: a receita não foi uma transação única.`);
  assert(store.getHistoryState().undoLabel === "Inserir estrutura pronta", `${scenario.kind}: rótulo de histórico inesperado.`);
  store.updateComponent(role(callout, "icon").id, { props: { icon: scenario.icon, iconScale: 120 } });
  store.updateComponent(role(callout, "title").id, { props: { content: scenario.title } });
  store.updateComponent(role(callout, "body").id, { props: { content: scenario.body } });
  store.updateComponent(callout.id, { frame: scenario.frame });
  store.reflowComponentTree(callout.id);
  callouts.push({ id: callout.id, scenario });
}

for (const { id, scenario } of callouts) {
  const current = store.findComponent(id).component;
  assert(current.props?.recipeRole === "callout", `${scenario.kind}: papel da raiz perdido.`);
  assert(current.props?.contextual === true, `${scenario.kind}: marcador contextual perdido.`);
  assert(role(current, "icon")?.props.icon === scenario.icon, `${scenario.kind}: ícone não persistiu.`);
  assert(role(current, "title")?.props.content === scenario.title, `${scenario.kind}: título não persistiu.`);
  assert(role(current, "body")?.props.content === scenario.body, `${scenario.kind}: corpo não persistiu.`);
  assert(CatalogLayoutEngine.effectiveMode(current) === scenario.expectedMode, `${scenario.kind}: modo responsivo inesperado (${CatalogLayoutEngine.effectiveMode(current)}).`);
  assert(contained(current), `${scenario.kind}: filho fora da composição.`);
  assert(noSiblingOverlap(current), `${scenario.kind}: filhos sobrepostos.`);
}

const wide = store.findComponent(callouts[0].id).component;
const compact = store.findComponent(callouts[1].id).component;
assert(wide.id !== compact.id && role(wide, "title").id !== role(compact, "title").id, "As duas instâncias compartilharam IDs.");
const compactBodyBefore = role(compact, "body").props.content;
store.updateComponent(role(wide, "body").id, { props: { content: "Use chave calibrada e confirme o aperto final." } });
assert(role(store.findComponent(compact.id).component, "body").props.content === compactBodyBefore, "Editar um callout alterou a outra instância.");

const report = store.getPublicationReport("draft");
assert(report.summary.collisions === 0, `A auditoria gerou colisões: ${report.summary.collisions}.`);
assert(report.summary.overflows === 0, `A auditoria gerou overflows: ${report.summary.overflows}.`);
assert(store.getPage().children.length === 2, "A receita criou raízes externas inesperadas.");
assert(treeCount(recipe.component) === 5, "A contagem usada para medir ações manuais foi alterada.");

const app = fs.readFileSync(path.join(root, "app", "callout-recipe-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "callout-recipe-contract.js"), "utf8");
assert(app === kit, "O contrato callout divergiu entre editor e AuthoringKit.");
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes('src="app/callout-recipe-contract.js"'), "O editor não carrega o contrato callout estaticamente.");
assert(fs.readFileSync(path.join(root, "tools", "build-authoring-kit.js"), "utf8").includes('"callout-recipe-contract.js"'), "O build canônico não copia o contrato callout.");
assert(CATALOG_SCHEMA_VERSION === "1.16.0", "A auditoria callout alterou o schema.");

console.log("✓ DB-05.20.15 validou callout amplo/compacto, vocabulário promocional, benefício recomendável, uma ação e ausência de novo tipo.");
