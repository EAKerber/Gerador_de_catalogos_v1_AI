/* Smoke test de ocupação ponderada e controle slot.span no inspetor. */
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

  const ids = await page.evaluate(() => {
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 120, width: 350, height: 280 });
    CatalogEditor.store.setEditingContext(card.id);
    const specs = card.children.filter(child => child.slot?.name === "specifications");
    CatalogEditor.store.setSelection(specs[0].id);
    return { cardId: card.id, firstId: specs[0].id, secondId: specs[1].id };
  });

  await page.locator('[data-inspector-tab="structure"]').click();
  const spanInput = page.locator("[data-slot-span]");
  assert(await spanInput.count() === 1, "O inspetor não exibiu a ocupação do slot coletivo.");
  await spanInput.fill("2");
  await spanInput.press("Tab");

  const state = await page.evaluate(({ cardId, firstId, secondId }) => {
    const first = CatalogEditor.store.findComponent(firstId).component;
    const second = CatalogEditor.store.findComponent(secondId).component;
    return { span: first.slot.span, usage: CatalogEditor.store.getSlotUsage(cardId, "specifications"), firstHeight: first.frame.height, secondHeight: second.frame.height };
  }, ids);
  assert(state.span === 2 && state.usage === 3, "A ocupação ponderada não foi persistida como slot.span.");
  assert(state.firstHeight > state.secondHeight, "O item de span 2 não passou a ocupar múltiplas unidades.");
  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });

  await browser.close();
  console.log("✓ Ocupação múltipla de slots validada no inspetor e no canvas.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
