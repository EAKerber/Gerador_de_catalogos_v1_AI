/* Interface real 05.5 — CatalogSource para página pronta em três ações. */
const fs = require("fs");
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  let actions = 0;
  await page.locator("#importButton").click(); actions += 1;
  const source = fs.readFileSync(path.resolve(__dirname, "../authoring-kit/examples/reference-catalog-source.json"));
  await page.locator("#documentImportFileInput").setInputFiles({ name: "catalog-source-referencia.json", mimeType: "application/json", buffer: source }); actions += 1;
  await page.locator("[data-document-import-analysis]").waitFor({ state: "visible" });
  assert(await page.locator("[data-document-import-verdict]").textContent() === "Pronto para gerar", "CatalogSource não recebeu parecer de geração positivo.");
  assert(await page.locator("[data-confirm-document-import]").textContent() === "Gerar catálogo", "A ação principal não foi contextualizada.");
  assert((await page.locator("[data-document-import-summary]").textContent()).includes("Ações"), "O preview não informou a redução de ações.");
  await page.locator("[data-confirm-document-import]").click(); actions += 1;

  await page.waitForFunction(() => CatalogEditor.store.getProducts().length === 7);
  const metrics = await page.evaluate(() => {
    const document = CatalogEditor.store.getExportDocument();
    const pageState = CatalogEditor.store.getPage();
    const cards = pageState.children.filter(component => component.type === "product-card");
    const rows = document.collections.find(collection => collection.id === "tableRows")?.items.length || 0;
    const report = CatalogEditor.store.getPublicationReport("draft");
    return {
      schemaVersion: document.schemaVersion,
      products: CatalogEditor.store.getProducts().length,
      cards: cards.length,
      rows,
      generation: document.generation,
      report,
      history: CatalogEditor.store.getHistoryState()
    };
  });
  assert(actions === 3, `O fluxo exigiu ${actions} ações, esperado: 3.`);
  assert(metrics.schemaVersion === "1.16.0" && metrics.products === 7 && metrics.cards === 7 && metrics.rows === 16, "A compilação não materializou o documento esperado.");
  assert(metrics.generation?.plan?.planFormat === "CatalogGenerationPlan", "Plano e decisões não acompanharam o documento.");
  assert(metrics.report.ok && metrics.report.summary.collisions === 0 && metrics.report.summary.overflows === 0, "O documento gerado falhou no gate geométrico.");
  assert(metrics.history.canUndo && metrics.history.undoLabel === "Gerar catálogo por dados", "A geração não foi registrada como uma transação reversível.");

  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });
  const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  assert(pdf.subarray(0, 4).toString() === "%PDF" && pdf.length > 30000, "A página compilada não produziu um PDF A4 válido.");

  await page.keyboard.press("Control+z");
  assert(await page.evaluate(() => CatalogEditor.store.getProducts().length) === 0, "Ctrl+Z não recuperou o documento anterior à geração.");
  assert(pageErrors.length === 0 && consoleErrors.length === 0, `Erros no navegador: ${[...pageErrors, ...consoleErrors].join(" | ")}`);

  await browser.close();
  console.log("✓ CatalogSource compilado em três ações, sem colisões, com PDF e Desfazer validados no navegador.");
})().catch(error => { console.error(error); process.exitCode = 1; });
