/* Incremento 05.22 — fronteira geométrica transacional no runtime completo. */
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
let browser;

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.CatalogEditor?.store));

  const fixture = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    const area = store.addComponent("layout-container", { x: 24, y: 80, width: 500, height: 220 }, {
      layout: { mode: "row", padding: 8, gap: 8, responsive: { enabled: false } }
    });
    const first = store.addComponent("text", { x: 0, y: 0, width: 100, height: 40 }, { parentId: area.id });
    store.addComponent("text", { x: 0, y: 0, width: 100, height: 40 }, { parentId: area.id });
    store.setEditingContext(area.id);
    store.setSelection(first.id);
    return {
      areaId: area.id,
      firstId: first.id,
      before: { ...store.findComponent(first.id).component.frame },
      history: store.getHistoryState().undoCount
    };
  });

  const target = page.locator(`[data-component-id="${fixture.firstId}"] .component-text`).first();
  await target.waitFor({ state: "visible" });
  const box = await target.boundingBox();
  assert(box, "O texto gerenciado não ficou disponível para o gesto.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 28, box.y + box.height / 2 + 12, { steps: 4 });
  await page.mouse.up();

  const gesture = await page.evaluate(({ firstId, history }) => {
    const store = CatalogEditor.store;
    const component = store.findComponent(firstId).component;
    return {
      frame: { ...component.frame },
      managed: component.layoutItem.managed,
      report: store.getLastGeometryTransaction(),
      historyDelta: store.getHistoryState().undoCount - history
    };
  }, fixture);
  assert(gesture.frame.x !== fixture.before.x || gesture.frame.y !== fixture.before.y, "O gesto não alterou a posição do componente.");
  assert(gesture.managed === false, "O gesto não liberou a autoridade junto do frame.");
  assert(gesture.report?.status !== "blocked" && gesture.report?.authorityChanges.length === 1, "O runtime não registrou a transação do gesto.");
  assert(gesture.historyDelta === 1, "O gesto criou mais de uma ação de histórico.");

  const blocked = await page.evaluate(firstId => {
    const store = CatalogEditor.store;
    const before = JSON.stringify(store.getExportDocument());
    const history = store.getHistoryState().undoCount;
    const report = store.applyGeometryTransaction([
      { componentId: firstId, frame: { width: Number.POSITIVE_INFINITY }, releaseAuthority: true }
    ]);
    return {
      report,
      unchanged: before === JSON.stringify(store.getExportDocument()),
      historyUnchanged: history === store.getHistoryState().undoCount
    };
  }, fixture.firstId);
  assert(blocked.report.status === "blocked" && blocked.unchanged && blocked.historyUnchanged, "O runtime completo não rejeitou o pedido inválido atomicamente.");
  assert(errors.length === 0, `Erros de página: ${errors.join(" | ")}`);

  await browser.close();
  browser = null;
  console.log("✓ Gesto, autoridade, histórico e bloqueio transacional 05.22 validados no Chromium.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close().catch(() => {});
  process.exitCode = 1;
});
