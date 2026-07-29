/* DB-05.18.19 — callout auditado no manifesto, bootstrap e build. */
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
  "app/callout-recipe-contract.js",
  "app/project-package.js",
  "app/component-intent-manifest-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const versionAtLeast = (actual, minimum) => {
  const parts = value => String(value || "").split(".").map(part => Number(part) || 0);
  const left = parts(actual);
  const right = parts(minimum);
  const difference = Array.from({ length: Math.max(left.length, right.length) }, (_, index) => (left[index] || 0) - (right[index] || 0))
    .find(value => value !== 0) || 0;
  return difference >= 0;
};
CatalogFactRecipeContract.install();
CatalogCalloutRecipeContract.install();
CatalogComponentIntentManifestContract.install();

const manifest = CatalogProjectManifests.buildCapabilitiesManifest();
const fact = manifest.recipes.find(recipe => recipe.id === "fact");
const callout = manifest.recipes.find(recipe => recipe.id === "section-tip-callout");
assert(manifest.components.length === 16, `O manifesto deveria manter 16 componentes; recebeu ${manifest.components.length}.`);
assert(!manifest.components.some(component => component.type === "callout"), "callout apareceu como componente.");
assert(manifest.recipes.length === 7, `O manifesto deveria manter sete receitas; recebeu ${manifest.recipes.length}.`);
assert(fact?.version === "1.4.0", `A auditoria alterou a versão de fact: ${fact?.version}.`);
assert(versionAtLeast(callout?.version, "1.5.0"), `O callout regrediu para uma versão anterior à remediação promocional: ${callout?.version}.`);
assert(callout.rootType === "layout-container", `Raiz inesperada do callout: ${callout.rootType}.`);
assert(callout.description.includes("responsiva") && callout.description.includes("hierarquia"), "A descrição evoluída do callout não foi publicada.");
assert(JSON.stringify(callout.contexts) === JSON.stringify(["page", "layout-container"]), `Contextos inesperados: ${JSON.stringify(callout.contexts)}.`);

const rebuilt = CatalogProjectManifests.buildCapabilitiesManifest();
assert(JSON.stringify(rebuilt.recipes) === JSON.stringify(manifest.recipes), "A projeção auditada das receitas não é determinística.");
assert(manifest.editor.schemaVersion === "1.16.0", "A auditoria callout alterou o schema.");

const app = fs.readFileSync(path.join(root, "app", "callout-recipe-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "callout-recipe-contract.js"), "utf8");
assert(app === kit, "O contrato callout divergiu entre editor e AuthoringKit.");

const mainSource = fs.readFileSync(path.join(root, "app", "main.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const factLoad = indexSource.indexOf('src="app/fact-recipe-contract.js"');
const calloutLoad = indexSource.indexOf('src="app/callout-recipe-contract.js"');
const factInstall = mainSource.indexOf("CatalogFactRecipeContract?.install()");
const calloutInstall = mainSource.indexOf("CatalogCalloutRecipeContract?.install()");
const storeCreation = mainSource.indexOf("const store =");
assert(factLoad >= 0 && calloutLoad > factLoad, "A carga estática não posiciona fact antes de callout.");
assert(factInstall >= 0 && calloutInstall > factInstall && calloutInstall < storeCreation, "A ordem de instalação das receitas está incorreta.");

const buildSource = fs.readFileSync(path.join(root, "tools", "build-authoring-kit.js"), "utf8");
assert(buildSource.includes('"callout-recipe-contract.js"'), "O build não copia o contrato callout.");
assert(buildSource.includes("CatalogCalloutRecipeContract.install()"), "O build não instala a receita callout antes de projetar o manifesto.");
assert(buildSource.indexOf("CatalogFactRecipeContract.install()") < buildSource.indexOf("CatalogCalloutRecipeContract.install()"), "O build instala os contratos fora de ordem.");
assert(buildSource.includes("recipes: capabilities.recipes"), "O inventário não recebe as receitas auditadas.");

console.log("✓ DB-05.18.19 publicou callout responsivo, preservando fact, componentes e schema.");
