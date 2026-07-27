/* Incremento 05.30 — card reduzido recupera o espaço de tipos removidos pela interface. */
"use strict";

const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor);

  const cardId = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    const card = store.addComponent("product-card", { x: 24, y: 24, width: 310, height: 360 });
    store.setComponentPresentation(card.id, { density: "compact", responsiveState: "compact" });
    card.children
      .filter(child => child.slot?.name === "art" || child.slot?.name === "specifications")
      .map(child => child.id)
      .forEach(componentId => store.deleteComponent(componentId));
    store.setSelection(card.id);
    return card.id;
  });

  const fitButton = page.locator("[data-fit-content-height]");
  await fitButton.waitFor({ state: "visible" });
  assert((await fitButton.textContent()).includes("190 px"), "A interface não antecipou a altura alcançável.");
  await fitButton.click();

  const result = await page.evaluate(id => {
    const card = CatalogEditor.store.findComponent(id).component;
    const table = card.children.find(child => child.slot?.name === "table");
    return {
      height: card.frame.height,
      tableBottom: table.frame.y + table.frame.height,
      status: document.getElementById("documentStatus")?.textContent,
      undoCount: CatalogEditor.store.getHistoryState().undoCount
    };
  }, cardId);
  assert(result.height === 190, `Altura inesperada: ${result.height}px.`);
  assert(result.tableBottom <= result.height, "A tabela foi cortada no navegador.");
  assert(result.status.includes("Altura ajustada"), "O comando não forneceu retorno visível.");

  await page.locator("#undoButton").click();
  const restoredHeight = await page.evaluate(id => CatalogEditor.store.findComponent(id).component.frame.height, cardId);
  assert(restoredHeight === 360, "Undo não restaurou a altura anterior.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ Card reduzido ajusta altura pelo painel e preserva tabela e undo.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
