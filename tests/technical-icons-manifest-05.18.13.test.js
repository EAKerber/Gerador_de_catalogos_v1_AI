/* DB-05.18.13 — projeção da governança dos ícones no manifesto. */
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
assert(CatalogComponentIntentManifestContract.VERSION === "05.18.13", "Versão do enriquecimento de manifesto inesperada.");
assert(CatalogComponentIntentManifestContract.install(), "O contrato de manifesto não foi instalado.");

const manifest = CatalogProjectManifests.buildCapabilitiesManifest();
const batch = manifest.iconBatches?.find(item => item.id === "technical-performance");
const expectedIds = ["corrosion-resistant", "diameter", "load-capacity", "torque"];
assert(batch, "O lote technical-performance não foi publicado.");
assert(batch.version === "05.18.13", `Versão inesperada do lote: ${batch.version}.`);
assert(JSON.stringify(batch.iconIds) === JSON.stringify(expectedIds), `IDs inesperados no lote: ${JSON.stringify(batch.iconIds)}.`);
assert(JSON.stringify(batch.requiredContexts) === JSON.stringify(["icon", "specification"]), `Contextos inesperados: ${JSON.stringify(batch.requiredContexts)}.`);

const icons = manifest.icons.filter(icon => icon.batch === "technical-performance");
assert(icons.length === 4, `O manifesto deveria conter quatro ícones governados; recebeu ${icons.length}.`);
for (const icon of icons) {
  assert(icon.label && icon.category && icon.svgBody, `${icon.id}: campos canônicos ausentes.`);
  assert(icon.contexts?.includes("icon") && icon.contexts?.includes("specification"), `${icon.id}: contextos não projetados.`);
  assert(icon.examples?.length >= 2, `${icon.id}: exemplos não projetados.`);
  assert(icon.keywords?.length >= 4, `${icon.id}: palavras-chave não projetadas.`);
}

const rebuilt = CatalogProjectManifests.buildCapabilitiesManifest();
assert(JSON.stringify(rebuilt.iconBatches) === JSON.stringify(manifest.iconBatches), "A projeção dos lotes não é determinística.");
assert(JSON.stringify(rebuilt.icons.filter(icon => icon.batch)) === JSON.stringify(icons), "Os metadados dos ícones não são determinísticos.");
assert(manifest.editor.schemaVersion === "1.16.0", "A iconografia alterou o schema do documento.");

const appManifestContract = fs.readFileSync(path.join(root, "app", "component-intent-manifest-contract.js"), "utf8");
const kitManifestContract = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "component-intent-manifest-contract.js"), "utf8");
assert(appManifestContract === kitManifestContract, "O contrato de manifesto divergiu entre editor e AuthoringKit.");

console.log("✓ DB-05.18.13 publicou lote, contextos, exemplos e palavras-chave sem alterar o schema.");
