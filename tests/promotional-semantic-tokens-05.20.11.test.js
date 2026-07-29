/* DB-05.20.11 — vocabulário semântico promocional. */
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "promotional-remediation-contract-05.20.10.json"), "utf8"));

function load(relative) {
  const context = vm.createContext({ window: {}, console });
  vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, { filename: relative });
  return JSON.parse(JSON.stringify(context.window.CATALOG_EDITOR_TOKENS));
}

const app = load("app/tokens.js");
const kit = load("authoring-kit/runtime/tokens.js");
assert.deepStrictEqual(kit, app, "Editor e AuthoringKit divergiram nos tokens.");
assert.strictEqual(app.meta.version, "2.0.0-alpha.4", "Versão do guideline inesperada.");

for (const [group, ids] of Object.entries(contract.semanticTokens)) {
  for (const id of ids) assert(app[group]?.[id], `Token semântico ausente: ${group}.${id}`);
}

for (const surfaceId of contract.semanticTokens.surfaces) {
  const surface = app.surfaces[surfaceId];
  assert(app.colors[surface.colorToken], `${surfaceId} referencia cor inexistente: ${surface.colorToken}`);
}

assert.strictEqual(app.colors["promo.on-primary"].value.toLowerCase(), "#ffffff", "Contraste sobre superfície principal deveria ser claro.");
assert.strictEqual(app.colors["promo.on-secondary"].value.toLowerCase(), "#0a0909", "Contraste sobre superfície secundária deveria ser escuro.");
assert.strictEqual(app.colors["promo.on-dark"].value.toLowerCase(), "#ffffff", "Contraste sobre superfície escura deveria ser claro.");

const px = token => Number.parseFloat(String(token.size));
assert(px(app.typography["type.promo-price"]) >= px(app.typography["type.promo-meta"]) * 2, "Preço promocional não domina metadado em 2×.");
assert(px(app.typography["type.promo-price"]) >= px(app.typography["type.promo-qualifier"]) * 1.5, "Preço promocional não domina qualificador em 1,5×.");
assert(px(app.typography["type.promo-title"]) > px(app.typography["type.card-title"]), "Título promocional não supera título de card.");

const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-promo-token-readiness-"));
const readiness = spawnSync(process.execPath, [path.join(__dirname, "promotional-remediation-readiness-05.20.10.test.js")], {
  cwd: root,
  env: { ...process.env, CATALOG_PROMOTIONAL_REMEDIATION_OUTPUT_DIR: outputDir },
  encoding: "utf8"
});
assert.strictEqual(readiness.status, 0, readiness.stderr || readiness.stdout);
const report = JSON.parse(fs.readFileSync(path.join(outputDir, "promotional-remediation-readiness.json"), "utf8"));
const tokenDeficits = report.deficits.filter(item => item.code === "MISSING_SEMANTIC_TOKEN");
assert.strictEqual(tokenDeficits.length, 0, `Ainda há tokens ausentes: ${JSON.stringify(tokenDeficits)}`);
assert(report.deficits.every(item => item.code !== "MISSING_SEMANTIC_TOKEN"), "A evolução das receitas reintroduziu déficit de token.");
assert.strictEqual(report.currentInventory.colorTokens, 29, "Inventário de cores inesperado.");
assert.strictEqual(report.currentInventory.surfaceTokens, 15, "Inventário de superfícies inesperado.");
assert.strictEqual(report.currentInventory.typographyTokens, 14, "Inventário tipográfico inesperado.");

console.log(`✓ DB-05.20.11 preservou 13 tokens promocionais e zero déficit semântico; ${report.deficits.length} déficit(s) de receita permanecem fora do escopo.`);
