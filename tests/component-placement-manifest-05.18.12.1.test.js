/* DB-05.18.12.1 — manifesto e paridade do registro de posicionamento. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.CATALOG_SCHEMA_VERSION = "1.16.0";
global.CatalogEditorIcon = () => "";
[
  "app/tokens.js",
  "app/catalog-source.js",
  "app/table-schema-registry.js",
  "app/catalog-generation-plan.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/component-registry.js",
  "app/component-intent-registry.js",
  "app/component-placement-registry.js",
  "app/section-recipes.js",
  "app/project-package.js",
  "app/component-intent-manifest-contract.js",
  "app/component-placement-manifest-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
CatalogComponentIntentManifestContract.install();
CatalogComponentPlacementManifestContract.install();
const manifest = CatalogProjectManifests.buildCapabilitiesManifest();
const byType = Object.fromEntries(manifest.components.map(component => [component.type, component]));

assert(manifest.componentPlacements?.manifestVersion === "05.18.12.1", "Versão do manifesto de posições inesperada.");
assert(manifest.componentPlacements?.strength === "probable", "O manifesto não deixa explícito que a posição é apenas provável.");
assert(manifest.componentPlacements.hints.length === 2, "O manifesto deveria conter somente os dois padrões comprovados.");
assert(byType["catalog-header"].initialPlacement?.blockAnchor === "top", "Cabeçalho não foi projetado no topo.");
assert(byType["catalog-footer"].initialPlacement?.blockAnchor === "bottom", "Rodapé não foi projetado na base.");
assert(byType["product-card"].initialPlacement === null, "Card recebeu posição provável sem evidência.");
assert(manifest.editor.schemaVersion === "1.16.0", "A projeção alterou o schema declarado.");

for (const fileName of ["component-placement-registry.js", "component-placement-manifest-contract.js"]) {
  const app = fs.readFileSync(path.join(root, "app", fileName), "utf8");
  const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", fileName), "utf8");
  assert(app === kit, `${fileName} divergiu entre app e AuthoringKit.`);
}

console.log("✓ DB-05.18.12.1 publica duas posições prováveis sem transformar hints em schema ou restrição.");
