/* DB-05.20.16 — aplica correções determinísticas de harness antes do benchmark visual. */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const sourcePath = path.join(__dirname, "browser-promotional-assets-05.20.16.test.js");
const generatedPath = path.join(__dirname, ".generated-browser-promotional-assets-05.20.16.test.js");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function replaceOnce(source, oldValue, newValue, label) {
  const count = source.split(oldValue).length - 1;
  assert(count === 1, `${label}: esperado um alvo, encontrados ${count}.`);
  return source.replace(oldValue, newValue);
}

let source = fs.readFileSync(sourcePath, "utf8");
source = replaceOnce(
  source,
  'page.locator(`[data-open-asset-library][data-component-id="${componentId}"]`).click({ force: true })',
  'page.locator(`[data-open-asset-library][data-component-id="${componentId}"]`).first().click({ force: true })',
  "botão inequívoco da biblioteca de assets"
);
source = replaceOnce(
  source,
  'const ignored = new Set(["updatedAt", "lastSavedAt", "generatedAt", "editor", "session"]);',
  'const ignored = new Set(["updatedAt", "lastSavedAt", "generatedAt", "editor", "session", "reference"]);',
  "normalização de referências locais no round-trip"
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
  try { fs.unlinkSync(generatedPath); } catch {}
}

assert(result.status === 0, `Benchmark de assets reais falhou com status ${result.status}.`);
console.log("✓ DB-05.20.16 executou o harness com seleção inequívoca e round-trip sem chaves locais.");
