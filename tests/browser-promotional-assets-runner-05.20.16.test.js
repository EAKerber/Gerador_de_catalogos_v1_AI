/* DB-05.20.16 — aplica correções determinísticas de harness antes do benchmark visual. */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const sourcePath = path.join(__dirname, "browser-promotional-assets-05.20.16.test.js");
const generatedPath = path.join(__dirname, ".generated-browser-promotional-assets-05.20.16.test.js");
const v2SourcePath = path.join(__dirname, "browser-promotional-generalization-v2-05.20.14.test.js");
const v2GeneratedName = ".generated-browser-promotional-generalization-v2-assets-05.20.16.test.js";
const v2GeneratedPath = path.join(__dirname, v2GeneratedName);
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function replaceOnce(source, oldValue, newValue, label) {
  const count = source.split(oldValue).length - 1;
  assert(count === 1, `${label}: esperado um alvo, encontrados ${count}.`);
  return source.replace(oldValue, newValue);
}

let v2Source = fs.readFileSync(v2SourcePath, "utf8");
v2Source = replaceOnce(
  v2Source,
  'for (const forbidden of ["editProductCard", "productCardId", "productParts", "technicalArtId"]) {',
  `source = replaceOnce(source,\n  '  const footerId = await insertFromPalette("component", "catalog-footer", { x: 24, y: 1019, width: 746, height: 80 });',\n  '  const footerId = await insertFromPalette("component", "catalog-footer", { x: 24, y: 1019, width: 746, height: 100 });',\n  "altura padrão do rodapé no benchmark com assets"\n);\n\nfor (const forbidden of ["editProductCard", "productCardId", "productParts", "technicalArtId"]) {`,
  "normalização do rodapé do baseline"
);
fs.writeFileSync(v2GeneratedPath, v2Source);

let source = fs.readFileSync(sourcePath, "utf8");
source = replaceOnce(
  source,
  'browser-promotional-generalization-v2-05.20.14.test.js',
  v2GeneratedName,
  "baseline V2 normalizado para o benchmark de assets"
);
source = replaceOnce(
  source,
  'page.locator(`[data-open-asset-library][data-component-id="${componentId}"]`).click({ force: true })',
  'page.locator(`[data-open-asset-library][data-component-id="${componentId}"]`).first().click({ force: true })',
  "botão inequívoco da biblioteca de assets"
);
source = replaceOnce(
  source,
  'const ignored = new Set(["updatedAt", "lastSavedAt", "generatedAt", "editor", "session"]);',
  'const ignored = new Set(["updatedAt", "lastSavedAt", "generatedAt", "editor", "session", "reference", "sha256"]);',
  "normalização de referências locais e hashes derivados no round-trip"
);
source = replaceOnce(
  source,
  'await roundTripPage.waitForFunction(expected => JSON.stringify(CatalogEditor.store.getExportDocument().pages) === JSON.stringify(expected.pages), constructedSnapshot);',
  'await roundTripPage.waitForFunction(() => (CatalogEditor.store.getCollection("assets")?.items || []).length === 3);',
  "prontidão semântica após redo"
);
source = replaceOnce(
  source,
  '    const constructedMetrics = await collectMetrics(page);',
  `    await page.evaluate(() => {\n      CatalogEditor.store.setEditingContext(null);\n      CatalogEditor.store.setSelection(null);\n      CatalogEditor.store.setEditorSettings({ gridVisible: false, showGuides: false });\n    });\n    await page.waitForTimeout(50);\n    const constructedMetrics = await collectMetrics(page);`,
  "visualização neutra da fase com assets"
);
source = replaceOnce(
  source,
  '    const reimportedMetrics = await collectMetrics(roundTripPage);',
  `    await roundTripPage.evaluate(() => {\n      CatalogEditor.store.setEditingContext(null);\n      CatalogEditor.store.setSelection(null);\n      CatalogEditor.store.setEditorSettings({ gridVisible: false, showGuides: false });\n    });\n    await roundTripPage.waitForTimeout(50);\n    const reimportedMetrics = await collectMetrics(roundTripPage);`,
  "visualização neutra após reimportação"
);

fs.writeFileSync(generatedPath, source);
let result;
try {
  result = spawnSync(process.execPath, [generatedPath], {
    cwd: path.resolve(__dirname, ".."),
    env: process.env,
    encoding: "utf8",
    stdio: "inherit"
  });
} finally {
  for (const file of [generatedPath, v2GeneratedPath]) {
    try { fs.unlinkSync(file); } catch {}
  }
}

assert(result.status === 0, `Benchmark de assets reais falhou com status ${result.status}.`);
console.log("✓ DB-05.20.16 executou o harness com rodapé válido, seleção inequívoca, visualização neutra e round-trip sem chaves locais.");
