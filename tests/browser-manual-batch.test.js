/* Interface real 05.7 — multisseleção e refinamento manual em lote. */
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const products = [
    "Título\tCódigo\tEmbalagem\tPreço",
    "PRODUTO 1\t1001\tCX 100\tR$ 10,00",
    "PRODUTO 2\t1002\tCX 100\tR$ 20,00",
    "PRODUTO 3\t1003\tCX 100\tR$ 30,00",
    "PRODUTO 4\t1004\tCX 100\tR$ 40,00",
    "PRODUTO 5\t1005\tCX 100\tR$ 50,00",
    "PRODUTO 6\t1006\tCX 100\tR$ 60,00",
    "PRODUTO 7\t1007\tCX 100\tR$ 70,00"
  ].join("\n");

  await page.locator('[data-left-panel-tab="products"]').click();
  await page.locator(".product-bulk-entry > summary").click();
  await page.locator("[data-products-bulk-text]").fill(products);
  await page.locator("[data-products-bulk-add]").click();
  await page.locator("[data-products-create-cards]").click();
  await page.waitForFunction(() => CatalogEditor.store.getProducts().length === 7);

  await page.keyboard.press("Control+a");
  const selectedCards = await page.evaluate(() => ({
    ids: CatalogEditor.store.getSelectedIds(),
    types: CatalogEditor.store.getSelectedComponents().map(component => component.type),
    densities: CatalogEditor.store.getSelectedComponents().map(component => component.presentation?.density),
    history: CatalogEditor.store.getHistoryState()
  }));
  assert(selectedCards.ids.length === 7 && selectedCards.types.every(type => type === "product-card"), "Ctrl+A não selecionou os sete irmãos do contexto.");
  assert(await page.locator('[data-batch-presentation="density"]').count() === 1, "O inspetor em lote não expôs densidade para os cards.");
  if (process.env.CATALOG_BATCH_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_BATCH_SCREENSHOT, fullPage: true });

  await page.locator('[data-batch-presentation="density"]').selectOption("comfortable");
  const compactState = await page.evaluate(() => ({
    densities: CatalogEditor.store.getSelectedComponents().map(component => component.presentation?.density),
    history: CatalogEditor.store.getHistoryState()
  }));
  assert(compactState.densities.length === 7 && compactState.densities.every(value => value === "comfortable"), "Uma decisão de densidade não alcançou os sete cards.");
  assert(compactState.history.undoCount === selectedCards.history.undoCount + 1 && compactState.history.undoLabel === "Editar apresentação da seleção", "A apresentação em lote não foi uma ação reversível única.");
  await page.keyboard.press("Control+z");
  assert(await page.evaluate(expected => CatalogEditor.store.getSelectedComponents().every((component, index) => component.presentation?.density === expected[index]), selectedCards.densities), "Desfazer não restaurou todos os cards.");

  await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.addComponent("text", { x: 40, y: 100, width: 100, height: 40 }, { props: { content: "A" } });
    CatalogEditor.store.addComponent("text", { x: 220, y: 150, width: 100, height: 40 }, { props: { content: "B" } });
    CatalogEditor.store.addComponent("text", { x: 430, y: 210, width: 100, height: 40 }, { props: { content: "C" } });
    CatalogEditor.store.setSelection(null);
  });
  const ids = await page.evaluate(() => CatalogEditor.store.getPage().children.map(component => component.id));
  await page.locator('[data-left-panel-tab="layers"]').click();
  await page.locator(`[data-layer-id="${ids[0]}"]`).click();
  await page.locator(`[data-layer-id="${ids[1]}"]`).click({ modifiers: ["Shift"] });
  await page.locator(`[data-layer-id="${ids[2]}"]`).click({ modifiers: ["Control"] });
  assert(await page.evaluate(() => CatalogEditor.store.getSelectedIds().length) === 3, "Shift/Ctrl+clique nas camadas não formou a seleção aditiva.");

  const historyBeforeAlign = await page.evaluate(() => CatalogEditor.store.getHistoryState().undoCount);
  await page.locator('[data-batch-align="top"]').click();
  const aligned = await page.evaluate(() => ({
    y: CatalogEditor.store.getPage().children.map(component => component.frame.y),
    history: CatalogEditor.store.getHistoryState()
  }));
  assert(new Set(aligned.y).size === 1 && aligned.history.undoCount === historyBeforeAlign + 1, "O comando visual de alinhamento não operou como uma transação.");

  await page.locator("[data-batch-duplicate]").last().click();
  const duplicated = await page.evaluate(() => ({ children: CatalogEditor.store.getPage().children.length, selected: CatalogEditor.store.getSelectedIds().length, history: CatalogEditor.store.getHistoryState() }));
  assert(duplicated.children === 6 && duplicated.selected === 3 && duplicated.history.undoLabel === "Duplicar seleção", "Duplicar conjunto não criou e focou três cópias em uma ação.");
  await page.keyboard.press("Control+z");
  assert(await page.evaluate(() => CatalogEditor.store.getPage().children.length) === 3, "Desfazer não removeu o conjunto duplicado.");

  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  assert(await page.evaluate(() => CatalogEditor.store.getPage().children.length) === 0, "Delete não removeu a seleção múltipla.");
  await page.keyboard.press("Control+z");
  assert(await page.evaluate(() => CatalogEditor.store.getPage().children.length) === 3, "Desfazer não restaurou a seleção excluída.");
  assert(errors.length === 0, `Erros no navegador: ${errors.join(" | ")}`);

  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });
  await browser.close();
  console.log("✓ Sete cards refinados em duas ações, seleção aditiva, alinhamento, duplicação, exclusão e desfazer validados na interface real.");
})().catch(error => { console.error(error); process.exitCode = 1; });
