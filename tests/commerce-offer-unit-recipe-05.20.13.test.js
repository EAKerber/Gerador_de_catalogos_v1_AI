/* DB-05.20.13 — contrato da receita commerce-offer-unit. */
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const appPath = path.join(root, "app", "commerce-offer-unit-recipe-contract.js");
const kitPath = path.join(root, "authoring-kit", "runtime", "commerce-offer-unit-recipe-contract.js");
assert(fs.existsSync(appPath), "Contrato ausente no editor.");
assert(fs.existsSync(kitPath), "Contrato ausente no AuthoringKit.");
assert.strictEqual(fs.readFileSync(appPath, "utf8"), fs.readFileSync(kitPath, "utf8"), "Contrato divergente entre editor e AuthoringKit.");

function load() {
  const context = vm.createContext({ window: {}, console, Object, Array, JSON });
  context.window.window = context.window;
  for (const relative of [
    "app/tokens.js",
    "app/section-recipes.js",
    "app/commerce-price-block-recipe-contract.js",
    "app/commerce-offer-unit-recipe-contract.js"
  ]) vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, { filename: relative });
  assert(context.window.CatalogCommercePriceBlockRecipeContract.install(), "Bloco de preço não foi instalado.");
  assert(context.window.CatalogCommerceOfferUnitRecipeContract.install(), "Unidade de oferta não foi instalada.");
  return context.window;
}

function flatten(component, result = []) {
  result.push(component);
  for (const child of component.children || []) flatten(child, result);
  return result;
}

const runtime = load();
assert.strictEqual(runtime.CatalogCommerceOfferUnitRecipeContract.VERSION, "05.20.13");
assert.strictEqual(runtime.CatalogCommerceOfferUnitRecipeContract.RECIPE_VERSION, "1.0.0");
const recipe = runtime.CatalogSectionRecipes.get("commerce-offer-unit");
assert(recipe, "Receita commerce-offer-unit não foi publicada.");
assert.strictEqual(recipe.component.type, "layout-container", "A unidade não deveria criar novo tipo.");
assert.deepStrictEqual([...recipe.contexts], ["page", "layout-container"], "Contextos inesperados.");

const all = flatten(recipe.component);
const types = new Set(all.map(component => component.type));
assert.deepStrictEqual([...types].sort(), ["art", "layout-container", "text"], "A unidade usa tipos fora do escopo permitido.");
assert(!types.has("data-table"), "A unidade de oferta não pode depender de tabela.");
const ids = all.map(component => component.id);
assert.strictEqual(new Set(ids).size, ids.length, "A receita contém IDs internos duplicados.");
const roles = new Map(all.filter(component => component.props?.recipeRole).map(component => [component.props.recipeRole, component]));
for (const role of ["offer-unit", "media", "code", "measure", "price-block", "currency", "amount"]) {
  assert(roles.has(role), `Papel obrigatório ausente: ${role}.`);
}
assert.strictEqual(all.filter(component => component.props?.recipeRole === "price-block").length, 1, "A unidade deveria conter exatamente um bloco de preço.");
assert(roles.get("media").type === "art", "Mídia da oferta não é arte substituível.");
assert.strictEqual(recipe.component.layout.mode, "free", "A unidade redistribui a mídia e perde a hierarquia promocional autoral.");
assert.strictEqual(roles.get("media").frame.height, 220, "A mídia não preserva a área dominante do produto.");
assert(roles.get("code").style.surface === "surface.promo-dark", "Código não usa superfície promocional escura.");
assert(roles.get("measure").style.surface === "surface.promo-secondary", "Medida não usa superfície promocional secundária.");
assert(roles.get("price-block").style.surface === "surface.promo-primary", "Preço não usa superfície promocional principal.");

const first = runtime.CatalogSectionRecipes.get("commerce-offer-unit");
first.component.children.length = 0;
const second = runtime.CatalogSectionRecipes.get("commerce-offer-unit");
assert(second.component.children.length === 4, "A API não devolve clones independentes da unidade.");
assert(runtime.CatalogSectionRecipes.list().filter(item => item.id === "commerce-offer-unit").length === 1, "Unidade duplicada no registro.");

const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-promo-offer-readiness-"));
const readiness = spawnSync(process.execPath, [path.join(__dirname, "promotional-remediation-readiness-05.20.10.test.js")], {
  cwd: root,
  env: { ...process.env, CATALOG_PROMOTIONAL_REMEDIATION_OUTPUT_DIR: outputDir },
  encoding: "utf8"
});
assert.strictEqual(readiness.status, 0, readiness.stderr || readiness.stdout);
const report = JSON.parse(fs.readFileSync(path.join(outputDir, "promotional-remediation-readiness.json"), "utf8"));
assert.strictEqual(report.status, "ready", `Prontidão deveria estar completa: ${JSON.stringify(report.deficits)}`);
assert.strictEqual(report.deficits.length, 0, "Ainda existem déficits contratuais.");

const buildSource = fs.readFileSync(path.join(root, "tools", "build-authoring-kit.js"), "utf8");
const mainSource = fs.readFileSync(path.join(root, "app", "main.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert(buildSource.includes('"commerce-offer-unit-recipe-contract.js"'), "Build não sincroniza a unidade.");
assert(buildSource.includes("CatalogCommerceOfferUnitRecipeContract.install()"), "O build não instala a unidade antes de projetar o manifesto.");
assert(indexSource.includes('src="app/commerce-offer-unit-recipe-contract.js"'), "Editor não carrega a unidade estaticamente.");
assert(mainSource.includes("CatalogCommerceOfferUnitRecipeContract?.install()"), "Editor não instala a unidade.");

console.log("✓ DB-05.20.13 validou papéis, independência, ausência de tabela, prontidão e integração da unidade de oferta.");
