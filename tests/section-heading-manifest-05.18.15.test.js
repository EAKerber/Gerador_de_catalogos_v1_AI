/* DB-05.18.15 — section-heading como receita consumível pelo AuthoringKit. */
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
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/component-intent-registry.js",
  "app/section-recipes.js",
  "app/fact-recipe-contract.js",
  "app/project-package.js",
  "app/component-intent-manifest-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
CatalogFactRecipeContract.install();
CatalogComponentIntentManifestContract.install();
const manifest = CatalogProjectManifests.buildCapabilitiesManifest();
const recipe = manifest.recipes.find(item => item.id === "section-heading");

assert(manifest.components.length === 16, `O manifesto deveria manter 16 tipos; recebeu ${manifest.components.length}.`);
assert(!manifest.components.some(component => component.type === "section-heading"), "section-heading apareceu como componente no manifesto.");
assert(recipe, "A intenção section-heading não apareceu entre as receitas.");
assert(recipe.version === "1.3.0", `Versão inesperada da receita: ${recipe.version}.`);
assert(recipe.rootType === "layout-container", `Raiz inesperada da receita: ${recipe.rootType}.`);
assert(JSON.stringify(recipe.contexts) === JSON.stringify(["page", "layout-container"]), `Contextos inesperados: ${JSON.stringify(recipe.contexts)}.`);
assert(recipe.label === "Título de seção" && recipe.description.includes("Sobretítulo opcional"), "A receita não possui vocabulário suficiente para descoberta.");

const allRecipes = manifest.recipes.map(item => item.id).sort();
assert(allRecipes.includes("section-heading") && allRecipes.includes("fact") && allRecipes.length === 7, `O manifesto deveria publicar sete receitas: ${allRecipes.join(", ")}.`);
const rebuilt = CatalogProjectManifests.buildCapabilitiesManifest();
assert(JSON.stringify(rebuilt.recipes) === JSON.stringify(manifest.recipes), "A projeção das receitas não é determinística.");

const app = fs.readFileSync(path.join(root, "app", "section-recipes.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "section-recipes.js"), "utf8");
assert(app === kit, "A receita divergiu entre editor e AuthoringKit.");
assert(manifest.editor.schemaVersion === "1.16.0", "A receita alterou o schema do documento.");

console.log("✓ DB-05.18.15 publicou section-heading como receita, preservando os 16 tipos e convivendo com receitas posteriores.");
