/* DB-05.20.10 — prontidão para remediação promocional. */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const contractPath = path.join(__dirname, "fixtures", "promotional-remediation-contract-05.20.10.json");
const outputDir = process.env.CATALOG_PROMOTIONAL_REMEDIATION_OUTPUT_DIR
  || path.join(root, "audit-output", "db-05.20.10", "readiness");
const enforce = process.env.CATALOG_PROMOTIONAL_REMEDIATION_ENFORCE === "1";
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

fs.mkdirSync(outputDir, { recursive: true });

function loadRuntime(files) {
  const context = vm.createContext({
    window: {},
    console,
    structuredClone: value => JSON.parse(JSON.stringify(value))
  });
  for (const relative of files) {
    const source = fs.readFileSync(path.join(root, relative), "utf8");
    vm.runInContext(source, context, { filename: relative });
  }
  return context.window;
}

function collectRoles(component, roles = new Set()) {
  if (!component) return roles;
  if (component.props?.recipeRole) roles.add(component.props.recipeRole);
  for (const child of component.children || []) collectRoles(child, roles);
  return roles;
}

function evaluateTokens(tokens) {
  const groups = ["colors", "surfaces", "typography"];
  const result = {};
  for (const group of groups) {
    const required = contract.semanticTokens[group] || [];
    const available = new Set(Object.keys(tokens?.[group] || {}));
    result[group] = {
      required,
      present: required.filter(id => available.has(id)),
      missing: required.filter(id => !available.has(id))
    };
  }
  return result;
}

function evaluateRecipes(api) {
  const available = new Set((api?.list?.() || []).map(recipe => recipe.id));
  const result = {};
  for (const [recipeId, definition] of Object.entries(contract.recipes)) {
    const recipe = api?.get?.(recipeId) || null;
    const roles = [...collectRoles(recipe?.component)];
    const requiredRoles = [definition.rootRole, ...(definition.requiredRoles || [])];
    result[recipeId] = {
      available: available.has(recipeId),
      roles,
      requiredRoles,
      missingRoles: requiredRoles.filter(role => !roles.includes(role)),
      optionalRolesPresent: (definition.optionalRoles || []).filter(role => roles.includes(role))
    };
  }
  return result;
}

function flattenDeficits(tokenResult, recipeResult) {
  const deficits = [];
  for (const [group, result] of Object.entries(tokenResult)) {
    for (const id of result.missing) deficits.push({ code: "MISSING_SEMANTIC_TOKEN", group, id });
  }
  for (const [recipeId, result] of Object.entries(recipeResult)) {
    if (!result.available) deficits.push({ code: "MISSING_PROMOTIONAL_RECIPE", recipeId });
    for (const role of result.missingRoles) deficits.push({ code: "MISSING_RECIPE_ROLE", recipeId, role });
  }
  return deficits;
}

const runtimeFiles = ["app/tokens.js", "app/section-recipes.js"];
for (const relative of ["app/commerce-price-block-recipe-contract.js", "app/commerce-offer-unit-recipe-contract.js"]) {
  if (fs.existsSync(path.join(root, relative))) runtimeFiles.push(relative);
}
const runtime = loadRuntime(runtimeFiles);
runtime.CatalogCommercePriceBlockRecipeContract?.install();
runtime.CatalogCommerceOfferUnitRecipeContract?.install();
const tokenResult = evaluateTokens(runtime.CATALOG_EDITOR_TOKENS);
const recipeResult = evaluateRecipes(runtime.CatalogSectionRecipes);
const deficits = flattenDeficits(tokenResult, recipeResult);
const report = {
  contractVersion: contract.version,
  status: deficits.length ? "not-ready" : "ready",
  enforcement: enforce ? "blocking" : "informational",
  policy: contract.policy,
  tokens: tokenResult,
  recipes: recipeResult,
  deficits,
  acceptance: contract.acceptance,
  currentInventory: {
    colorTokens: Object.keys(runtime.CATALOG_EDITOR_TOKENS?.colors || {}).length,
    surfaceTokens: Object.keys(runtime.CATALOG_EDITOR_TOKENS?.surfaces || {}).length,
    typographyTokens: Object.keys(runtime.CATALOG_EDITOR_TOKENS?.typography || {}).length,
    recipes: runtime.CatalogSectionRecipes?.list?.().map(recipe => recipe.id) || []
  }
};

fs.writeFileSync(
  path.join(outputDir, "promotional-remediation-readiness.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

if (enforce && deficits.length) {
  throw new Error(`Remediação promocional incompleta: ${deficits.map(item => item.id || item.recipeId || item.role).join(", ")}`);
}

console.log(`✓ DB-05.20.10 prontidão promocional: ${report.status}; ${deficits.length} déficit(s) registrado(s).`);
