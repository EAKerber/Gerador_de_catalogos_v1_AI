/* Smoke test do reflow recursivo Auto/Manual e do mínimo vertical estabilizado. */
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const ids = await page.evaluate(() => {
    const area = CatalogEditor.store.addComponent("layout-container", { x: 24, y: 100, width: 730, height: 360 }, { layout: { mode: "row", responsive: { enabled: false } } });
    const first = CatalogEditor.store.addComponent("product-card", { x: 0, y: 0 }, { parentId: area.id });
    CatalogEditor.store.addComponent("product-card", { x: 0, y: 0 }, { parentId: area.id });
    const table = first.children.find(child => child.type === "data-table");
    CatalogEditor.store.addTableRow(table.id, { code: "02", package: "CX", price: "R$ 2" });
    CatalogEditor.store.addTableRow(table.id, { code: "03", package: "CX", price: "R$ 3" });
    CatalogEditor.store.addTableRow(table.id, { code: "04", package: "CX", price: "R$ 4" });
    const spec = first.children.find(child => child.slot?.name === "specifications");
    CatalogEditor.store.markSlotFree(spec.id);
    CatalogEditor.store.updateComponent(area.id, { frame: { height: 100 } });
    CatalogEditor.store.setSelection(area.id);
    return { areaId: area.id, cardId: first.id, tableId: table.id, specId: spec.id };
  });

  const automatic = await page.evaluate(({ areaId, cardId, tableId, specId }) => {
    const area = CatalogEditor.store.findComponent(areaId).component;
    const card = CatalogEditor.store.findComponent(cardId).component;
    const table = CatalogEditor.store.findComponent(tableId).component;
    const spec = CatalogEditor.store.findComponent(specId).component;
    const minimum = CatalogEditor.store.getReflowMinimum(area, area.frame);
    return {
      mode: area.reflow.mode,
      areaHeight: area.frame.height,
      minimumHeight: minimum.height,
      tableBottom: table.frame.y + table.frame.height,
      cardHeight: card.frame.height,
      slotManaged: spec.slot.managed
    };
  }, ids);
  assert(automatic.mode === "auto" && automatic.slotManaged === false, "O reflow do pai apagou a posição independente do descendente.");
  assert(automatic.areaHeight >= automatic.minimumHeight, "A Área de composição ficou abaixo do mínimo recursivo.");
  assert(automatic.tableBottom <= automatic.cardHeight, "A tabela atravessou o limite inferior do card.");
  await page.evaluate(specId => CatalogEditor.store.selectComponentInContext(specId), ids.specId);
  const structureTab = page.locator('[data-inspector-tab="structure"]').first();
  if (await structureTab.getAttribute("aria-selected") !== "true") await structureTab.click();
  const reintegrate = page.locator('[data-reintegrate-layout]').first();
  await reintegrate.waitFor({ state: "visible" });
  await reintegrate.click();
  const managed = await page.evaluate(specId => CatalogEditor.store.findComponent(specId).component.slot.managed, ids.specId);
  assert(managed === true, "Reintegrar ao layout não devolveu a autoridade ao slot.");
  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });

  await browser.close();
  console.log("✓ Autoridade local, reintegração explícita e mínimo vertical validados no navegador.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close().catch(() => {});
  process.exitCode = 1;
});
