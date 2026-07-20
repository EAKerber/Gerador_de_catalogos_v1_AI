/* DB-05.18.17 — fact no manifesto, runtime e build Developer B. */
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
assert(CatalogFactRecipeContract.install(), "O contrato fact não foi instalado.");
assert(CatalogFactRecipeContract.install(), "A instalação do contrato fact não é idempotente.");
CatalogComponentIntentManifestContract.install();

const manifest = CatalogProjectManifests.buildCapabilitiesManifest();
const fact = manifest.recipes.find(recipe => recipe.id === "fact");
assert(manifest.components.length === 16, `O manifesto deveria manter 16 componentes; recebeu ${manifest.components.length}.`);
assert(!manifest.components.some(component => component.type === "fact"), "fact apareceu prematuramente como componente.");
assert(manifest.recipes.length === 7, `O manifesto deveria publicar sete receitas; recebeu ${manifest.recipes.length}.`);
assert(fact, "A receita fact não foi publicada.");
assert(fact.version === "1.4.0", `Versão inesperada da receita: ${fact.version}.`);
assert(fact.rootType === "layout-container", `Raiz inesperada: ${fact.rootType}.`);
assert(fact.label === "Dado destacado" && fact.description.includes("Ícone opcional") && fact.description.includes("unidade"), "A descrição não orienta descoberta humana ou automatizada.");
assert(JSON.stringify(fact.contexts) === JSON.stringify(["page", "layout-container"]), `Contextos inesperados: ${JSON.stringify(fact.contexts)}.`);

const rebuilt = CatalogProjectManifests.buildCapabilitiesManifest();
assert(JSON.stringify(rebuilt.recipes) === JSON.stringify(manifest.recipes), "A projeção da receita fact não é determinística.");
assert(manifest.editor.schemaVersion === "1.16.0", "A receita fact alterou o schema do documento.");

const appContract = fs.readFileSync(path.join(root, "app", "fact-recipe-contract.js"), "utf8");
const kitContract = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "fact-recipe-contract.js"), "utf8");
assert(appContract === kitContract, "O contrato fact divergiu entre editor e AuthoringKit.");
const mainSource = fs.readFileSync(path.join(root, "app", "main.js"), "utf8");
assert(mainSource.includes('{ file: "fact-recipe-contract.js", globalName: "CatalogFactRecipeContract" }'), "O bootstrap não carrega o contrato fact.");
assert(mainSource.indexOf("CatalogFactRecipeContract?.install()") < mainSource.indexOf("const store ="), "A receita é instalada depois da criação da store.");

const buildSource = fs.readFileSync(path.join(root, "tools", "build-developer-b-authoring-kit.js"), "utf8");
assert(buildSource.includes('"fact-recipe-contract.js"'), "O build Developer B não copia o contrato fact.");
assert(buildSource.includes("factManifestEntry") && buildSource.includes("capabilities.recipes"), "O build não projeta fact em capabilities.json.");
assert(buildSource.includes("inventory.recipes = capabilities.recipes"), "O inventário não preserva a receita fact.");

console.log("✓ DB-05.18.17 publicou fact como receita determinística, sem novo tipo ou schema.");
