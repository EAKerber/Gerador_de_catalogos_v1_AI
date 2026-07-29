"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const technical = read("tests/browser-reference-manual-audit-05.17.test.js");
const promotional = read("tests/browser-promotional-remediation-acceptance-05.20.10.test.js");
const assets = read("tests/browser-promotional-assets-05.20.16.test.js");
const runner = read("tools/run-catalog-tests.js");
const workflow = read(".github/workflows/catalog-integration.yml");

for (const contract of [
  "browser-reference-manual-audit-05.17.test.js",
  "browser-promotional-remediation-acceptance-05.20.10.test.js",
  "browser-promotional-assets-05.20.16.test.js"
]) {
  assert(runner.includes('file.endsWith(".test.js")'), "O runner deixou de usar descoberta integral.");
  assert(fs.existsSync(path.join(root, "tests", contract)), `Gate visual ausente: ${contract}.`);
}

assert(technical.includes("page.pdf(") && technical.includes("printBackground: true"), "A referência técnica não valida o PDF A4.");
assert(technical.includes("report.summary.collisions") && technical.includes("report.summary.overflows"), "A referência técnica não mede colisões e overflows.");
assert(promotional.includes("amountScrollWidth <= offer.amountClientWidth + 1"), "A referência promocional não bloqueia valores truncados.");
assert(promotional.includes('page.emulateMedia({ media: "print" })') && promotional.includes("validate(printed)"), "A referência promocional não repete o gate em impressão.");
assert(assets.includes("Documento com assets divergiu após pacote/reimportação."), "O benchmark promocional não preserva round-trip.");
assert(assets.includes("placeholderArts === 0"), "O benchmark promocional ainda aceita placeholders na evidência final.");
assert(workflow.includes("npm run test:browser"), "O workflow não executa a suíte visual integral.");
assert(!workflow.includes("continue-on-error"), "O workflow visual foi tornado informativo.");
assert(workflow.includes('CATALOG_PROMOTIONAL_REMEDIATION_ENFORCE: "1"'), "O gate promocional não é bloqueante no CI.");

console.log("✓ As referências técnica e promocional possuem gates bloqueantes de PDF, geometria, preço completo, assets e round-trip.");
