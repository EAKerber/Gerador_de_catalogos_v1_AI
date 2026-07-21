#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const kitRoot = path.join(root, "authoring-kit");
const runtimeRoot = path.join(kitRoot, "runtime");
const contractFiles = [
  "text-alignment-contract.js",
  "text-scale-contract.js",
  "text-overflow-contract.js",
  "footer-item-containment-contract.js",
  "icon-scale-contract.js",
  "product-hero-contract.js",
  "product-technical-contract.js",
  "product-variants-contract.js",
  "product-data-only-contract.js",
  "reflow-history-stability-contract.js",
  "component-intent-registry.js",
  "component-intent-manifest-contract.js",
  "component-placement-registry.js",
  "component-placement-manifest-contract.js",
  "fact-recipe-contract.js",
  "callout-recipe-contract.js"
];

require("./build-authoring-kit.js");

for (const fileName of contractFiles) {
  const source = path.join(root, "app", fileName);
  if (!fs.existsSync(source)) throw new Error(`Contrato Developer B ausente: ${fileName}.`);
  fs.copyFileSync(source, path.join(runtimeRoot, fileName));
}

const recipeWindow = {};
const recipeSandbox = { window: recipeWindow, console, Object, Array, JSON };
recipeWindow.window = recipeWindow;
vm.createContext(recipeSandbox);
for (const fileName of ["section-recipes.js", "fact-recipe-contract.js", "callout-recipe-contract.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, "app", fileName), "utf8"), recipeSandbox, { filename: fileName });
}
if (!recipeWindow.CatalogFactRecipeContract.install()) throw new Error("O contrato da receita fact não foi instalado no build.");
if (!recipeWindow.CatalogCalloutRecipeContract.install()) throw new Error("O contrato da receita callout não foi instalado no build.");

const recipeManifestEntry = recipe => ({
  id: recipe.id,
  version: recipe.version,
  label: recipe.label,
  description: recipe.description,
  icon: recipe.icon,
  rootType: recipe.component?.type || null,
  contexts: recipe.contexts || [],
  focusRole: recipe.focusRole || null
});
const developerRecipes = ["fact", "section-tip-callout"]
  .map(recipeId => recipeWindow.CatalogSectionRecipes.get(recipeId))
  .map(recipeManifestEntry);
const developerRecipeIds = new Set(developerRecipes.map(recipe => recipe.id));

const capabilitiesPath = path.join(kitRoot, "capabilities.json");
const inventoryPath = path.join(kitRoot, "feature-inventory.json");
const capabilities = JSON.parse(fs.readFileSync(capabilitiesPath, "utf8"));
capabilities.recipes = [
  ...(capabilities.recipes || []).filter(recipe => !developerRecipeIds.has(recipe.id)),
  ...developerRecipes
].sort((left, right) => left.id.localeCompare(right.id));
fs.writeFileSync(capabilitiesPath, `${JSON.stringify(capabilities, null, 2)}\n`);

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
inventory.summary.iconBatches = capabilities.iconBatches?.length || 0;
inventory.summary.recipes = capabilities.recipes.length;
inventory.iconBatches = capabilities.iconBatches || [];
inventory.icons = (capabilities.icons || []).map(icon => ({
  id: icon.id,
  label: icon.label,
  category: icon.category,
  ...(icon.batch ? { batch: icon.batch } : {}),
  ...(icon.contexts ? { contexts: icon.contexts } : {}),
  ...(icon.keywords ? { keywords: icon.keywords } : {}),
  ...(icon.examples ? { examples: icon.examples } : {})
}));
inventory.recipes = capabilities.recipes;
fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);

function walk(directory, prefix = "") {
  const result = {};
  fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .forEach(entry => {
      const absolute = path.join(directory, entry.name);
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) Object.assign(result, walk(absolute, relative));
      else result[relative] = fs.readFileSync(absolute, "utf8");
    });
  return result;
}

const files = walk(kitRoot);
const output = `(function () {\n  "use strict";\n  window.CATALOG_AUTHORING_KIT_FILES = Object.freeze(${JSON.stringify(files, null, 2)});\n})();\n`;
fs.writeFileSync(path.join(root, "app", "authoring-kit-files.js"), output);
console.log(`✓ Build Developer B sincronizou ${contractFiles.length} contratos, ${inventory.summary.iconBatches} lote(s) de ícones, ${inventory.summary.recipes} receitas e regenerou o bundle com ${Object.keys(files).length} arquivos.`);
