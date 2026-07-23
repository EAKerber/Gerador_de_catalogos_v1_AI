/* DB-05.20.12 — contrato da receita commerce-price-block. */
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const appPath = path.join(root, "app", "commerce-price-block-recipe-contract.js");
const kitPath = path.join(root, "authoring-kit", "runtime", "commerce-price-block-recipe-contract.js");
assert(fs.existsSync(appPath), "Contrato ausente no editor.");
assert(fs.existsSync(kitPath), "Contrato ausente no AuthoringKit.");
assert.strictEqual(fs.readFileSync(appPath, "utf8"), fs.readFileSync(kitPath, "utf8"), "Contrato divergente entre editor e AuthoringKit.");

function load() {
  const context = vm.createContext({ window: {}, console, Object, Array, JSON });
  context.window.window = context.window;
  for (const relative of ["app/tokens.js", "app/section-recipes.js", "app/commerce-price-block-recipe-contract.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, { filename: relative });
  }
  assert(context.window.CatalogCommercePriceBlockRecipeContract.install(), "Contrato não foi instalado.");
  return context.window;
}

function flatten(component, result = []) {
  result.push(component);
  for (const child of component.children || []) flatten(child, result);
  return result;
}

const runtime = load();
assert.strictEqual(runtime.CatalogCommercePriceBlockRecipeContract.VERSION, "05.20.12");
assert.strictEqual(runtime.CatalogCommercePriceBlockRecipeContract.RECIPE_VERSION, "1.0.0");
const recipe = runtime.CatalogSectionRecipes.get("commerce-price-block");
assert(recipe, "Receita commerce-price-block não foi publicada.");
assert.strictEqual(recipe.component.type, "layout-container", "A receita não deveria criar novo tipo.");
assert.deepStrictEqual([...recipe.contexts], ["page", "layout-container"], "Contextos inesperados.");

const all = flatten(recipe.component);
const types = new Set(all.map(component => component.type));
assert.deepStrictEqual([...types].sort(), ["layout-container", "text"], "A receita usa tipos fora do escopo permitido.");
assert(!types.has("data-table"), "O bloco de preço não pode depender de tabela.");
const roles = new Map(all.filter(component => component.props?.recipeRole).map(component => [component.props.recipeRole, component]));
for (const role of ["price-block", "current-price", "currency", "amount"]) assert(roles.has(role), `Papel obrigatório ausente: ${role}.`);
for (const role of ["old-price", "qualifier", "unit"]) assert(roles.has(role), `Papel opcional ausente: ${role}.`);
assert(roles.get("price-block").style.surface === "surface.promo-primary", "A raiz não usa superfície promocional semântica.");
assert(roles.get("old-price").style.surface === "surface.promo-secondary", "Preço antigo não usa superfície secundária.");
assert(roles.get("qualifier").style.surface === "surface.promo-dark", "Qualificador não usa superfície escura.");
assert(roles.get("amount").style.typography === "type.promo-price", "Valor atual não usa tipografia promocional de preço.");
assert(roles.get("currency").style.textColor === "promo.on-primary", "Moeda não usa contraste semântico.");
assert(roles.get("current-price").layout.mode === "free", "Moeda e valor não preservam a proporção editorial explícita.");
assert(roles.get("currency").layoutItem.managed === false && roles.get("amount").layoutItem.managed === false, "O auto layout ainda iguala a largura de moeda e valor.");
assert(roles.get("currency").frame.x + roles.get("currency").frame.width <= roles.get("amount").frame.x, "Moeda e valor se sobrepõem.");
assert(roles.get("amount").frame.x + roles.get("amount").frame.width <= roles.get("current-price").frame.width, "O valor excede seu contêiner.");

const rendererSource = fs.readFileSync(path.join(root, "app", "renderer.js"), "utf8");
const componentCSS = fs.readFileSync(path.join(root, "styles", "components.css"), "utf8");
assert(rendererSource.includes("data-recipe-role="), "O DOM não expõe o papel semântico usado pelo gate visual.");
assert(componentCSS.includes('[data-recipe-role="amount"]') && componentCSS.includes('[data-recipe-role="currency"]'), "A moeda e o valor não possuem padding contextual.");

const tokens = runtime.CATALOG_EDITOR_TOKENS;
const size = role => Number.parseFloat(tokens.typography[roles.get(role).style.typography].size);
assert(size("amount") >= size("old-price") * 2, "Valor atual não domina preço antigo em 2×.");
assert(size("amount") >= size("qualifier") * 1.5, "Valor atual não domina qualificador em 1,5×.");

const first = runtime.CatalogSectionRecipes.get("commerce-price-block");
first.component.children.length = 0;
const second = runtime.CatalogSectionRecipes.get("commerce-price-block");
assert(second.component.children.length > 0, "A API de receitas não devolve clones independentes.");
assert(runtime.CatalogSectionRecipes.list().filter(item => item.id === "commerce-price-block").length === 1, "Receita duplicada no registro.");

const buildSource = fs.readFileSync(path.join(root, "tools", "build-authoring-kit.js"), "utf8");
const mainSource = fs.readFileSync(path.join(root, "app", "main.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert(buildSource.includes('"commerce-price-block-recipe-contract.js"'), "O build canônico não sincroniza o contrato.");
assert(buildSource.includes("CatalogCommercePriceBlockRecipeContract.install()"), "O build canônico não instala a receita antes do manifesto.");
assert(indexSource.includes('src="app/commerce-price-block-recipe-contract.js"'), "Editor não carrega o contrato estaticamente.");
assert(mainSource.includes("CatalogCommercePriceBlockRecipeContract?.install()"), "Editor não instala o contrato.");

console.log("✓ DB-05.20.12 validou estrutura, papéis, hierarquia, paridade e integração da receita de preço.");
