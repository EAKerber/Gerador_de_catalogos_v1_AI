/* DB-05.18.12 — plano puro da biblioteca por intenção. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.location = { href: "http://127.0.0.1:8080/index.html" };
global.document = {
  currentScript: { src: "http://127.0.0.1:8080/app/component-palette-intent-contract.js" },
  querySelector() { return null; },
  createElement() { return { dataset: {}, addEventListener() {}, appendChild() {} }; },
  head: { appendChild() {} }
};
global.CatalogEditorIcon = name => `<svg data-icon="${name}"></svg>`;
[
  "app/catalog-source.js",
  "app/presentation-registry.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/component-intent-registry.js",
  "app/component-palette-intent-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sorted = values => values.slice().sort().join(",");
const expectedPrimary = {
  page: ["catalog-footer", "catalog-header"],
  product: ["art", "art-gallery", "product-card"],
  data: ["legend-panel"],
  communication: ["icon", "separator", "text"]
};
const expectedAdvanced = ["data-table", "footer-item", "layout-container", "legend-group", "legend-item", "specification", "title-symbol"];

assert(CatalogComponentPaletteIntentContract.VERSION === "05.18.12", "Versão do contrato da biblioteca inesperada.");
const registrySnapshot = Object.fromEntries(Object.entries(CATALOG_COMPONENT_REGISTRY).map(([type, definition]) => [type, {
  category: definition.category,
  label: definition.label,
  accepts: definition.container?.accepts?.slice() || null
}]));
const semanticSnapshot = JSON.stringify(CatalogComponentIntents.grouped());

const pagePlan = CatalogComponentPaletteIntentContract.plan(CATALOG_COMPONENT_REGISTRY);
assert(pagePlan.primary.map(group => group.id).join(",") === "page,product,data,communication", "A camada inicial não segue Página, Produto, Dados e Comunicação.");
for (const [intentId, types] of Object.entries(expectedPrimary)) {
  const group = pagePlan.primary.find(item => item.id === intentId);
  assert(group, `Grupo primário ausente: ${intentId}.`);
  assert(sorted(group.componentTypes) === sorted(types), `Grupo primário ${intentId} divergente: ${group.componentTypes.join(",")}.`);
}
assert(sorted(pagePlan.advanced) === sorted(expectedAdvanced), `Caminho avançado divergente: ${pagePlan.advanced.join(",")}.`);
const allVisual = pagePlan.primary.flatMap(group => group.componentTypes).concat(pagePlan.advanced);
assert(allVisual.length === 16 && new Set(allVisual).size === 16, "A apresentação visual não cobre os 16 tipos exatamente uma vez.");
assert(sorted(allVisual) === sorted(Object.keys(CATALOG_COMPONENT_REGISTRY)), "A apresentação visual perdeu ou inventou tipos.");

for (const type of expectedAdvanced) assert(CatalogComponentPaletteIntentContract.isAdvancedType(type), `${type} deveria usar o caminho avançado.`);
for (const type of allVisual.filter(type => !expectedAdvanced.includes(type))) assert(!CatalogComponentPaletteIntentContract.isAdvancedType(type), `${type} foi movido indevidamente ao caminho avançado.`);
assert(CatalogComponentIntents.intentFor("data-table").id === "data", "Mover data-table visualmente alterou sua intenção semântica.");
assert(CatalogComponentIntents.intentFor("footer-item").id === "communication", "Mover footer-item visualmente alterou sua intenção semântica.");
assert(CatalogComponentIntents.intentFor("specification").id === "product", "Mover specification visualmente alterou sua intenção semântica.");

const cardAllowed = CATALOG_COMPONENT_REGISTRY["product-card"].container.accepts;
const cardPlan = CatalogComponentPaletteIntentContract.plan(CATALOG_COMPONENT_REGISTRY, cardAllowed);
const cardVisual = cardPlan.primary.flatMap(group => group.componentTypes).concat(cardPlan.advanced);
assert(sorted(cardVisual) === sorted(cardAllowed), "O filtro contextual do card perdeu tipos aceitos.");
assert(sorted(cardPlan.advanced) === sorted(["data-table", "specification", "title-symbol"]), "O card não expõe suas peças internas no caminho avançado.");
assert(sorted(cardPlan.primary.find(group => group.id === "product")?.componentTypes || []) === sorted(["art", "art-gallery"]), "O contexto do card não mantém artes no fluxo Produto.");
assert(sorted(cardPlan.primary.find(group => group.id === "communication")?.componentTypes || []) === sorted(["icon", "text"]), "O contexto do card não mantém comunicação acessível.");

const footerAllowed = CATALOG_COMPONENT_REGISTRY["footer-item"].container.accepts;
const footerPlan = CatalogComponentPaletteIntentContract.plan(CATALOG_COMPONENT_REGISTRY, footerAllowed);
assert(sorted(footerPlan.primary.flatMap(group => group.componentTypes)) === sorted(["icon", "text"]), "O contexto footer-item perdeu seus átomos editáveis.");
assert(footerPlan.advanced.length === 0, "O contexto footer-item criou infraestrutura avançada inexistente.");

assert(JSON.stringify(CatalogComponentIntents.grouped()) === semanticSnapshot, "O plano visual modificou a taxonomia semântica.");
const registryAfter = Object.fromEntries(Object.entries(CATALOG_COMPONENT_REGISTRY).map(([type, definition]) => [type, {
  category: definition.category,
  label: definition.label,
  accepts: definition.container?.accepts?.slice() || null
}]));
assert(JSON.stringify(registryAfter) === JSON.stringify(registrySnapshot), "O plano visual alterou o registro técnico.");

const main = fs.readFileSync(path.join(root, "app", "main.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles", "component-intents.css"), "utf8");
const build = fs.readFileSync(path.join(root, "tools", "build-authoring-kit.js"), "utf8");
const compiler = fs.readFileSync(path.join(root, "authoring-kit", "compiler", "compile-catalog.js"), "utf8");
assert(index.includes('src="app/component-palette-intent-contract.js"') && main.includes("CatalogComponentPaletteIntentContract?.install()"), "O editor não carrega e instala o contrato da biblioteca.");
assert(css.includes(".palette-group--advanced") && css.includes(".palette-intent-navigation"), "O estilo da navegação por intenção está incompleto.");
assert(!build.includes('"component-palette-intent-contract.js"'), "O contrato exclusivo da UI foi copiado indevidamente para o AuthoringKit.");
assert(!compiler.includes('"component-palette-intent-contract.js"'), "O compilador autocontido passou a depender da UI da biblioteca.");

console.log("✓ DB-05.18.12 planeja 9 escolhas primárias e 7 avançadas sem perder contexto, IDs ou semântica.");
