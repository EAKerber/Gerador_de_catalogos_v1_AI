"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const main = fs.readFileSync(path.join(root, "app", "main.js"), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const contracts = [
  "reflow-history-stability-contract.js",
  "component-intent-registry.js",
  "component-intent-manifest-contract.js",
  "component-placement-registry.js",
  "component-placement-manifest-contract.js",
  "component-palette-intent-contract.js",
  "component-initial-placement-contract.js",
  "fact-recipe-contract.js",
  "commerce-price-block-recipe-contract.js",
  "commerce-offer-unit-recipe-contract.js",
  "callout-recipe-contract.js",
  "text-alignment-contract.js",
  "text-scale-contract.js",
  "text-overflow-contract.js",
  "product-hero-contract.js",
  "product-technical-contract.js",
  "product-variants-contract.js",
  "product-data-only-contract.js"
];

let previous = -1;
for (const fileName of contracts) {
  const position = index.indexOf(`src="app/${fileName}"`);
  assert(position > previous, `Contrato ausente ou fora de ordem: ${fileName}.`);
  previous = position;
}
assert(previous < index.indexOf('src="app/main.js"'), "main.js deve executar somente depois dos contratos obrigatórios.");
assert(main.includes("const succeeded = result") && main.includes("!succeeded(installed)"), "A instalação não verifica o resultado de todos os contratos.");
assert(main.includes("showStartupFailure(error)"), "A inicialização não possui estado de falha explícito.");
assert(main.includes('state: "failed"') && main.includes('state: "ready"'), "Os estados de inicialização não são observáveis.");
assert(!main.includes("iniciando editor com os contratos disponíveis"), "A inicialização ainda tolera conjunto parcial de contratos.");
assert(!main.includes("document.head.appendChild(script)"), "A inicialização ainda injeta contratos dinamicamente.");

console.log("✓ A inicialização é estática, ordenada e bloqueia o editor quando um contrato obrigatório falha.");
