/* Incremento 05.56 — o gate mede texto no DOM e preserva os dez truncamentos do ensaio real. */
"use strict";

const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");

const root = path.resolve(__dirname, "..");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "tests", "fixtures", "text-integrity-blind-test-05.56.json"), "utf8"));
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor?.store && window.CatalogVisualTextIntegrity?.VERSION === "1.0.0");

  const result = await page.evaluate(async fixture => {
    const layer = document.getElementById("componentLayer");
    layer.innerHTML = `
      <section data-page-id="page-1" style="position:absolute;inset:0;display:grid;grid-template-columns:repeat(5,120px);grid-auto-rows:34px;gap:8px">
        ${fixture.cases.map(item => `<article data-component-id="${item.componentId}"><div class="editor-component__content"><p style="width:68px;height:18px;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px">${item.text}</p></div></article>`).join("")}
        <article data-component-id="collision-left" style="position:absolute;left:10px;top:120px"><div class="editor-component__content"><span style="font-size:12px">Texto esquerdo</span></div></article>
        <article data-component-id="collision-right" style="position:absolute;left:45px;top:120px"><div class="editor-component__content"><span style="font-size:12px">Texto direito</span></div></article>
        <article data-component-id="object-collision" style="position:absolute;left:10px;top:160px"><div class="editor-component__content" style="position:relative;width:120px;height:24px"><span style="position:absolute;left:0;top:0;font-size:12px">Texto no ícone</span><svg style="position:absolute;left:20px;top:0;width:24px;height:18px" viewBox="0 0 24 18"><rect width="24" height="18"/></svg></div></article>
        <article data-component-id="small-text" style="position:absolute;left:10px;top:200px"><div class="editor-component__content"><span style="font-size:7px">Fonte pequena</span></div></article>
      </section>`;
    const draft = CatalogVisualTextIntegrity.audit({ root: layer, target: "draft" });
    const publication = CatalogVisualTextIntegrity.audit({ root: layer, target: "publication" });
    const built = await CatalogEditor.projectPackage.buildPackage({ target: "draft" });
    let publicationBlocked = false;
    try { await CatalogEditor.projectPackage.buildPackage({ target: "publication" }); } catch (error) { publicationBlocked = error.code === "PUBLICATION_GATE"; }
    return { draft, publication, packageReport: built.report, publicationBlocked };
  }, fixture);
  await page.emulateMedia({ media: "print" });
  const print = await page.evaluate(() => CatalogVisualTextIntegrity.audit({ root: document.getElementById("componentLayer"), target: "draft", surface: "print" }));

  assert(result.draft.available, "O auditor não reconheceu a camada renderizada.");
  assert(result.draft.summary.truncations === fixture.cases.length, `Esperados ${fixture.cases.length} truncamentos; recebidos ${result.draft.summary.truncations}.`);
  assert(result.draft.issues.filter(issue => issue.code === "TEXT_ELLIPSIS_APPLIED").length === fixture.cases.length, "Reticências reais não foram classificadas individualmente.");
  fixture.cases.forEach(item => assert(result.draft.issues.some(issue => issue.componentId === item.componentId && issue.text === item.text), `${item.componentId}: caso real ausente do diagnóstico.`));
  assert(result.draft.summary.textCollisions >= 1, "A colisão texto–texto não foi detectada.");
  assert(result.draft.summary.textObjectCollisions >= 1, "A colisão texto–objeto não foi detectada.");
  assert(result.draft.summary.belowMinimum === 1, "Fonte abaixo de 6 pt não foi separada como aviso de legibilidade.");
  assert(result.draft.summary.blockingIssues === 0, "O rascunho transformou achados visuais em bloqueio.");
  assert(result.publication.summary.blockingIssues >= fixture.cases.length, "A publicação não promoveu truncamentos e colisões a erro.");
  assert(result.publicationBlocked, "O pacote de publicação ignorou a integridade textual renderizada.");
  assert(result.packageReport.summary.textTruncations === fixture.cases.length, "O export-report não materializou a contagem de truncamentos.");
  assert(result.packageReport.gate.visualIntegrity?.available === true, "O export-report não preservou a auditoria visual completa.");
  assert(result.packageReport.gate.visualIntegrity?.surface === "package-export", "O relatório não identifica a superfície de exportação medida.");
  assert(print.surface === "print" && print.summary.truncations === fixture.cases.length, "A renderização de impressão divergiu dos dez casos preservados.");

  console.log(`✓ Gate visual detectou ${fixture.cases.length} truncamentos reais, colisões e legibilidade mínima; publicação bloqueada.`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
});
