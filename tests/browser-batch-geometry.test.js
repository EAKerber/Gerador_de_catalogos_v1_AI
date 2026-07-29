/* Incremento 05.17 — geometria exata e relacional aplicada à multisseleção. */
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
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.CatalogEditor?.store));
  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    return [
      CatalogEditor.store.addComponent("text", { x: 40, y: 80, width: 100, height: 40 }).id,
      CatalogEditor.store.addComponent("text", { x: 190, y: 120, width: 140, height: 50 }).id,
      CatalogEditor.store.addComponent("text", { x: 390, y: 170, width: 80, height: 60 }).id
    ];
  });
  await page.locator('[data-left-panel-tab="layers"]').click();
  await page.locator(`[data-layer-id="${ids[0]}"]`).click();
  await page.locator(`[data-layer-id="${ids[1]}"]`).click({ modifiers: ["Control"] });
  await page.locator(`[data-layer-id="${ids[2]}"]`).click({ modifiers: ["Control"] });
  assert(await page.locator('[data-batch-frame-apply="height"]').count() === 1, "A seleção não expôs geometria numérica integrada.");

  await page.evaluate(componentIds => CatalogEditor.store.transformComponents(componentIds, {
    kind: "set",
    values: { x: 53, y: 83, width: 103, height: 43 }
  }), ids);
  assert((await page.locator("[data-batch-grid-preview]").textContent()).includes("3 item(ns)"), "O preview não antecipou os três ajustes.");
  const historyBeforeGrid = await page.evaluate(() => CatalogEditor.store.getHistoryState().undoCount);
  await page.locator("[data-batch-grid-apply]").click();
  const normalized = await page.evaluate(componentIds => ({
    frames: componentIds.map(id => CatalogEditor.store.findComponent(id).component.frame),
    history: CatalogEditor.store.getHistoryState()
  }), ids);
  assert(normalized.frames.every(frame => [frame.x, frame.y, frame.width, frame.height].every(value => value % 4 === 0)), "A interface não normalizou posições e dimensões à grade.");
  assert(normalized.history.undoCount === historyBeforeGrid + 1 && normalized.history.undoLabel === "Normalizar seleção à grade", "A normalização não foi uma ação única.");
  await page.keyboard.press("Control+z");
  await page.keyboard.press("Control+z");

  await page.locator('[data-batch-equalize="width"]').click();
  await page.locator('[data-batch-frame-value="height"]').fill("72");
  await page.locator('[data-batch-frame-apply="height"]').click();
  await page.locator('[data-batch-delta="x"]').fill("16");
  await page.locator('[data-batch-delta="y"]').fill("-8");
  const historyBeforeDelta = await page.evaluate(() => CatalogEditor.store.getHistoryState().undoCount);
  await page.locator('[data-batch-delta-apply]').click();
  const transformed = await page.evaluate(componentIds => ({
    frames: componentIds.map(id => CatalogEditor.store.findComponent(id).component.frame),
    history: CatalogEditor.store.getHistoryState()
  }), ids);
  assert(transformed.frames.every(frame => frame.width === 80 && frame.height === 72), "Equalização ou valor exato divergiram.");
  assert(transformed.frames[0].x === 56 && transformed.frames[0].y === 72, "O delta relativo não foi aplicado aos dois eixos.");
  assert(transformed.history.undoCount === historyBeforeDelta + 1 && transformed.history.undoLabel === "Transformar seleção", "O delta não foi uma transação única.");
  await page.keyboard.press("Control+z");
  const undone = await page.evaluate(id => CatalogEditor.store.findComponent(id).component.frame, ids[0]);
  assert(undone.x === 40 && undone.y === 80 && undone.height === 72, "Desfazer não reverteu somente o último comando geométrico.");
  await page.locator(".batch-frame-list > summary").click();
  const frameText = ["ID\tX\tY\tLARGURA\tALTURA", `${ids[0]}\t24\t40\t120\t64`, `${ids[1]}\t156\t40\t120\t64`, `${ids[2]}\t288\t40\t120\t64`].join("\n");
  const historyBeforeMap = await page.evaluate(() => CatalogEditor.store.getHistoryState().undoCount);
  await page.locator("[data-batch-frames-text]").fill(frameText);
  await page.locator("[data-batch-frames-apply]").click();
  const mapped = await page.evaluate(componentIds => ({ frames: componentIds.map(id => CatalogEditor.store.findComponent(id).component.frame), history: CatalogEditor.store.getHistoryState() }), ids);
  assert(mapped.frames.map(frame => frame.x).join(",") === "24,156,288" && mapped.frames.every(frame => frame.height === 64), "A grade heterogênea não aplicou caixas distintas.");
  assert(mapped.history.undoCount === historyBeforeMap + 1 && mapped.history.undoLabel === "Aplicar geometria da seleção", "A grade não foi uma ação única.");
  assert(errors.length === 0, `Erros de página: ${errors.join(" | ")}`);
  await browser.close();
  browser = null;
  console.log("✓ Geometria relacional, exata e por delta validada em multisseleção real.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close().catch(() => {});
  process.exitCode = 1;
});
