/* Incremento 05.41 — registro canônico de receitas independente da ordem. */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const contractFiles = [
  "app/fact-recipe-contract.js",
  "app/commerce-price-block-recipe-contract.js",
  "app/commerce-offer-unit-recipe-contract.js",
  "app/callout-recipe-contract.js"
];
const contractNames = {
  fact: "CatalogFactRecipeContract",
  price: "CatalogCommercePriceBlockRecipeContract",
  offer: "CatalogCommerceOfferUnitRecipeContract",
  callout: "CatalogCalloutRecipeContract"
};
const expectedIds = [
  "page-catalog-base",
  "section-applications",
  "section-packaging-legend",
  "section-tip-callout",
  "section-heading",
  "section-hero-grid-strip",
  "fact",
  "commerce-price-block",
  "commerce-offer-unit"
];

function load(order) {
  const context = vm.createContext({ window: {}, console, Object, Array, JSON });
  context.window.window = context.window;
  vm.runInContext(read("app/section-recipes.js"), context, { filename: "app/section-recipes.js" });
  contractFiles.forEach(file => vm.runInContext(read(file), context, { filename: file }));

  const api = context.window.CatalogSectionRecipes;
  const registry = context.window.CATALOG_SECTION_RECIPES;
  for (const key of order) {
    const contract = context.window[contractNames[key]];
    assert(contract.install() === true, `Falha ao instalar ${key} na ordem ${order.join(" → ")}.`);
  }
  for (const key of [...order].reverse()) {
    assert(context.window[contractNames[key]].install() === true, `A reinstalação de ${key} deixou de ser idempotente.`);
  }

  assert(context.window.CatalogSectionRecipes === api, "A instalação substituiu a API canônica de receitas.");
  assert(context.window.CATALOG_SECTION_RECIPES === registry, "A instalação substituiu o registro canônico de receitas.");
  assert(api.VERSION === "1.5.0", `Versão final inesperada: ${api.VERSION}.`);
  assert(JSON.stringify(api.list().map(recipe => recipe.id)) === JSON.stringify(expectedIds), `Ordem final divergente em ${order.join(" → ")}.`);
  assert(api.get("fact")?.version === "1.4.0", "A receita fact perdeu sua versão.");
  assert(api.get("section-tip-callout")?.version === "1.5.0", "A receita callout perdeu sua remediação.");
  assert(api.get("commerce-price-block")?.version === "1.0.0", "O bloco de preço perdeu sua versão.");
  assert(api.get("commerce-offer-unit")?.component?.children?.length === 4, "A unidade comercial perdeu sua composição.");
}

load(["fact", "price", "offer", "callout"]);
load(["callout", "offer", "price", "fact"]);
load(["offer", "fact", "callout", "price"]);

const factSource = read("app/fact-recipe-contract.js");
const priceSource = read("app/commerce-price-block-recipe-contract.js");
const offerSource = read("app/commerce-offer-unit-recipe-contract.js");
const calloutSource = read("app/callout-recipe-contract.js");
for (const [name, source] of Object.entries({ factSource, priceSource, offerSource, calloutSource })) {
  assert(!source.includes("window.CatalogSectionRecipes ="), `${name} voltou a substituir a API canônica.`);
  assert(!source.includes("window.CATALOG_SECTION_RECIPES ="), `${name} voltou a substituir o registro canônico.`);
}

console.log("✓ Registro canônico preserva nove receitas, identidade, ordem e reinstalação em qualquer sequência.");
