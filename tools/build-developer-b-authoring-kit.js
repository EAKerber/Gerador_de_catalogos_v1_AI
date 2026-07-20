#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

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
  "component-intent-registry.js",
  "component-intent-manifest-contract.js",
  "component-placement-registry.js",
  "component-placement-manifest-contract.js"
];

require("./build-authoring-kit.js");

for (const fileName of contractFiles) {
  const source = path.join(root, "app", fileName);
  if (!fs.existsSync(source)) throw new Error(`Contrato Developer B ausente: ${fileName}.`);
  fs.copyFileSync(source, path.join(runtimeRoot, fileName));
}

const capabilitiesPath = path.join(kitRoot, "capabilities.json");
const inventoryPath = path.join(kitRoot, "feature-inventory.json");
const capabilities = JSON.parse(fs.readFileSync(capabilitiesPath, "utf8"));
const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
inventory.summary.iconBatches = capabilities.iconBatches?.length || 0;
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
console.log(`✓ Build Developer B sincronizou ${contractFiles.length} contratos, ${inventory.summary.iconBatches} lote(s) de ícones e regenerou o bundle com ${Object.keys(files).length} arquivos.`);
