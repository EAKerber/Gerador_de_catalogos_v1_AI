/* Interface real do Incremento 05.2: histórico e importação segura em 1366×768. */
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const originalId = await page.evaluate(() => {
    const component = CatalogEditor.store.addComponent("text", { x: 24, y: 24, width: 180, height: 60 }, { props: { content: "Histórico" } });
    return component.id;
  });
  assert(await page.locator("#undoButton").isEnabled(), "Adicionar componente não habilitou Desfazer.");
  await page.locator("#undoButton").click();
  assert(await page.evaluate(id => !CatalogEditor.store.findComponent(id), originalId), "O botão Desfazer não restaurou o estado anterior.");
  assert(await page.locator("#redoButton").isEnabled(), "Desfazer não habilitou Refazer.");
  await page.keyboard.press("Control+y");
  assert(await page.evaluate(id => Boolean(CatalogEditor.store.findComponent(id)), originalId), "Ctrl+Y não refez a ação.");

  const importDocument = await page.evaluate(() => {
    const document = CatalogEditor.store.getExportDocument();
    document.schemaVersion = "1.11.0";
    document.id = "browser-imported-document";
    document.title = "Importado pelo navegador";
    return document;
  });
  await page.locator("#importButton").click();
  await page.locator("#documentImportFileInput").setInputFiles({
    name: "catalogo-importado.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(importDocument))
  });
  await page.locator("[data-document-import-analysis]").waitFor({ state: "visible" });
  assert(await page.locator("[data-document-import-verdict]").textContent() === "Pronto para importar", "Documento válido não recebeu parecer positivo.");
  assert(await page.locator("[data-confirm-document-import]").isEnabled(), "Documento válido não habilitou o commit.");
  await page.locator("[data-confirm-document-import]").click();
  assert(await page.evaluate(() => CatalogEditor.store.getState().id) === "browser-imported-document", "O commit não substituiu o documento analisado.");

  await page.keyboard.press("Control+z");
  assert(await page.evaluate(() => CatalogEditor.store.getState().id) !== "browser-imported-document", "Ctrl+Z não recuperou o documento anterior à importação.");

  const invalidDocument = JSON.parse(JSON.stringify(importDocument));
  invalidDocument.pages[0].children.push({ id: "invalid-component", type: "not-registered", children: [] });
  const beforeInvalid = await page.evaluate(() => CatalogEditor.store.getState().id);
  await page.locator("#importButton").click();
  await page.locator("#documentImportFileInput").setInputFiles({
    name: "catalogo-invalido.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(invalidDocument))
  });
  await page.locator("[data-document-import-analysis]").waitFor({ state: "visible" });
  assert(await page.locator("[data-confirm-document-import]").isDisabled(), "Tipo desconhecido não bloqueou o commit.");
  assert((await page.locator('[data-severity="error"]').count()) > 0, "O relatório não mostrou o erro estrutural.");
  assert(await page.evaluate(() => CatalogEditor.store.getState().id) === beforeInvalid, "A análise inválida modificou o documento aberto.");
  await page.locator("[data-close-document-import]").first().click();

  const metrics = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    toolbarHeight: document.querySelector(".app-toolbar").getBoundingClientRect().height,
    importLoaded: Boolean(CatalogEditor.documentImporter)
  }));
  assert(metrics.pageWidth <= metrics.viewportWidth, "A toolbar 05.2 criou overflow horizontal em 1366×768.");
  assert(metrics.toolbarHeight <= 56 && metrics.importLoaded, "A interface adaptável ou o importador não foram inicializados.");

  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });
  await browser.close();
  console.log("✓ Histórico, atalhos, análise e importação atômica validados no navegador.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
