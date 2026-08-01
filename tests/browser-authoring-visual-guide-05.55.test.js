/* Incremento 05.55 — o botão de kit autônomo reúne núcleo e complemento visual com integridade. */
"use strict";

const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = process.env.CATALOG_VISUAL_GUIDE_OUTPUT_DIR || path.join("audit-output", "visual-guide-05.55");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor?.projectPackage && window.fflate?.unzipSync);

  const result = await page.evaluate(async () => {
    const bytes = await CatalogEditor.projectPackage.buildCompleteAuthoringKit();
    const archive = fflate.unzipSync(bytes);
    const names = Object.keys(archive).sort();
    const root = "CatalogAuthoringKit-1.7.1/";
    const visualManifest = JSON.parse(new TextDecoder().decode(archive[`${root}visual-guide/manifest.json`]));
    return {
      bytes: bytes.byteLength,
      entries: names.length,
      hasCore: names.includes(`${root}GUIDE.md`) && names.includes(`${root}capabilities.json`),
      hasVisualStart: names.includes(`${root}visual-guide/START-HERE.md`),
      hasTechnical: names.includes(`${root}visual-guide/case-studies/catalogo-tecnico/reference.jpeg`),
      hasPromotional: names.includes(`${root}visual-guide/case-studies/promocional/reference.jpeg`),
      visualFiles: visualManifest.files.length,
      policy: visualManifest.policy
    };
  });

  assert(result.bytes > 0 && result.entries > 47, "O ZIP autônomo não reúne os dois artefatos.");
  assert(result.hasCore && result.hasVisualStart && result.hasTechnical && result.hasPromotional, "O ZIP completo perdeu núcleo, entrada visual ou referências.");
  assert(result.visualFiles >= 37 && result.policy.embeddedInCatalogPackages === false, "O manifesto visual exportado diverge da política.");
  assert(pageErrors.length === 0 && consoleErrors.length === 0, `Erros no browser: ${[...pageErrors, ...consoleErrors].join(" | ")}`);

  fs.writeFileSync(path.join(outputDir, "export-summary.json"), `${JSON.stringify({ result, pageErrors, consoleErrors }, null, 2)}\n`);
  await browser.close();
  browser = null;
  console.log(`✓ AuthoringKit completo exportado com ${result.entries} entradas e ${result.visualFiles} arquivos visuais.`);
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
