/* DB-05.18.11 — classificação exclusiva dos 16 tipos por intenção. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.CatalogEditorIcon = () => "";
[
  "app/tokens.js",
  "app/catalog-source.js",
  "app/table-schema-registry.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/icon-library.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/component-intent-registry.js",
  "app/section-recipes.js",
  "app/project-package.js",
  "app/component-intent-manifest-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const expected = {
  page: ["catalog-footer", "catalog-header"],
  product: ["art", "art-gallery", "product-card", "specification", "title-symbol"],
  data: ["data-table", "legend-group", "legend-item", "legend-panel"],
  communication: ["footer-item", "icon", "separator", "text"],
  advanced: ["layout-container"]
};

assert(CatalogComponentIntents.VERSION === "05.18.11", "Versão da classificação inesperada.");
const validation = CatalogComponentIntents.validate(CATALOG_COMPONENT_REGISTRY);
assert(validation.ok, `Classificação incompleta: ${JSON.stringify(validation)}.`);
assert(validation.registryTypes.length === 16, `O registro deveria conter 16 tipos, mas contém ${validation.registryTypes.length}.`);
assert(validation.assignmentTypes.length === 16, `A taxonomia deveria classificar 16 tipos, mas classifica ${validation.assignmentTypes.length}.`);
assert(new Set(validation.assignmentTypes).size === 16, "Um tipo foi classificado mais de uma vez.");

for (const [intentId, types] of Object.entries(expected)) {
  const actual = CatalogComponentIntents.typesFor(intentId).sort();
  assert(actual.join(",") === types.slice().sort().join(","), `Grupo ${intentId} divergente: ${actual.join(",")}.`);
}

const groups = CatalogComponentIntents.grouped();
assert(groups.length === 5, "A taxonomia não publicou cinco grupos.");
assert(groups.map(group => group.id).join(",") === "page,product,data,communication,advanced", "A ordem dos grupos não acompanha a progressão editorial.");
assert(groups.filter(group => group.tier === "primary").length === 4, "A camada inicial deveria conter quatro intenções.");
assert(groups.find(group => group.id === "advanced")?.tier === "advanced", "Estrutura avançada não foi marcada como camada avançada.");
assert(groups.flatMap(group => group.componentTypes).length === 16, "Os grupos não cobrem os 16 tipos.");
assert(new Set(groups.flatMap(group => group.componentTypes)).size === 16, "A classificação agrupada duplicou tipos.");

const legacyCategories = new Set(Object.values(CATALOG_COMPONENT_REGISTRY).map(definition => definition.category));
assert([...legacyCategories].sort().join(",") === ["Elementos", "Estruturas", "Peças internas"].sort().join(","), "As categorias legadas foram alteradas durante a classificação.");
assert(Object.values(CATALOG_COMPONENT_REGISTRY).every(definition => !("intent" in definition)), "A taxonomia foi duplicada dentro do registro de componentes.");

assert(CatalogComponentIntentManifestContract.install(), "O contrato do manifesto não foi instalado.");
const manifest = CatalogProjectManifests.buildCapabilitiesManifest();
assert(manifest.componentIntents?.manifestVersion === "05.18.11", "O manifesto não declara a versão da taxonomia.");
assert(manifest.componentIntents.groups.length === 5, "O manifesto não contém os cinco grupos.");
assert(manifest.components.length === 16, "O manifesto perdeu tipos de componente.");
assert(manifest.components.every(component => component.intent?.id && component.intent?.label && Number.isFinite(component.intent?.order)), "Um componente do manifesto não possui intenção consumível.");
assert(manifest.components.map(component => component.type).sort().join(",") === validation.registryTypes.join(","), "Os IDs do manifesto divergem do registro técnico.");
assert(manifest.components.find(component => component.type === "layout-container")?.intent?.tier === "advanced", "O manifesto não identifica layout-container como avançado.");
assert(manifest.components.find(component => component.type === "product-card")?.intent?.id === "product", "O card de produto não foi classificado como Produto.");

const rebuilt = CatalogProjectManifests.buildCapabilitiesManifest();
assert(JSON.stringify(rebuilt.componentIntents) === JSON.stringify(manifest.componentIntents), "A projeção da taxonomia não é determinística.");
assert(manifest.editor?.schemaVersion === "1.16.0", "A classificação alterou o schema do documento.");

console.log("✓ DB-05.18.11 classifica 16 tipos em cinco intenções sem duplicar registros ou alterar categorias legadas.");
