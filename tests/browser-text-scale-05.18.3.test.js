/* DB-05.18.3 — escala 80/100/120 exercitada na interface real. */
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
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor
    && window.CatalogTextAlignmentContract?.VERSION === "05.18.2"
    && window.CatalogTextScaleContract?.VERSION === "05.18.3");

  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    const standalone = CatalogEditor.store.addComponent("text", { x: 24, y: 24, width: 280, height: 96 });
    CatalogEditor.store.updateComponent(standalone.id, { props: { content: "Escala tipográfica observável" } });
    const footer = CatalogEditor.store.addComponent("footer-item", { x: 24, y: 150, width: 220, height: 112 });
    const title = footer.children.find(component => component.type === "text" && component.slot?.name === "title");
    CatalogEditor.store.selectComponentInContext(title.id);
    return { standaloneId: standalone.id, titleId: title.id, titleFrame: { ...title.frame } };
  });

  const readText = async id => page.evaluate(componentId => {
    const component = CatalogEditor.store.findComponent(componentId)?.component;
    const shell = document.querySelector(`[data-component-id="${componentId}"] .component-text`);
    const copy = shell?.querySelector("p");
    return {
      scale: component?.props?.scale,
      frame: component ? { ...component.frame } : null,
      fontSize: copy ? Number.parseFloat(getComputedStyle(copy).fontSize) : 0
    };
  }, id);

  const footer100 = await readText(ids.titleId);
  assert(footer100.scale === 100 && footer100.fontSize > 0, "O título do rodapé não iniciou em 100%.");

  await page.locator('[data-prop-path="scale"]').selectOption("80");
  const footer80 = await readText(ids.titleId);
  assert(footer80.scale === 80 && footer80.fontSize < footer100.fontSize, `80% não reduziu o título do rodapé: ${footer80.fontSize} vs ${footer100.fontSize}.`);
  assert(JSON.stringify(footer80.frame) === JSON.stringify(ids.titleFrame), "80% modificou o frame do título do rodapé.");

  await page.locator('[data-prop-path="scale"]').selectOption("120");
  const footer120 = await readText(ids.titleId);
  assert(footer120.scale === 120 && footer120.fontSize > footer100.fontSize, `120% não ampliou o título do rodapé: ${footer120.fontSize} vs ${footer100.fontSize}.`);
  assert(JSON.stringify(footer120.frame) === JSON.stringify(ids.titleFrame), "120% modificou o frame do título do rodapé.");

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const footerPrint = await readText(ids.titleId);
  assert(Math.abs(footerPrint.fontSize - footer120.fontSize) < 0.01, `A impressão divergiu da escala 120%: ${footerPrint.fontSize} vs ${footer120.fontSize}.`);
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });

  assert(await page.evaluate(() => CatalogEditor.store.undo()), "A escala do rodapé não pôde ser desfeita.");
  const footerUndo = await readText(ids.titleId);
  assert(footerUndo.scale === 100 && Math.abs(footerUndo.fontSize - footer100.fontSize) < 0.01, "Desfazer não restaurou a escala 100% do rodapé.");
  assert(await page.evaluate(() => CatalogEditor.store.redo()), "A escala do rodapé não pôde ser refeita.");
  const footerRedo = await readText(ids.titleId);
  assert(footerRedo.scale === 120 && Math.abs(footerRedo.fontSize - footer120.fontSize) < 0.01, "Refazer não restaurou 120%.");

  await page.evaluate(standaloneId => CatalogEditor.store.selectComponentInContext(standaloneId), ids.standaloneId);
  const standalone100 = await readText(ids.standaloneId);
  await page.locator('[data-prop-path="scale"]').selectOption("80");
  const standalone80 = await readText(ids.standaloneId);
  await page.locator('[data-prop-path="scale"]').selectOption("120");
  const standalone120 = await readText(ids.standaloneId);
  assert(standalone80.fontSize < standalone100.fontSize && standalone120.fontSize > standalone100.fontSize, "O texto autônomo não diferenciou 80/100/120%.");
  assert(JSON.stringify(standalone80.frame) === JSON.stringify(standalone100.frame) && JSON.stringify(standalone120.frame) === JSON.stringify(standalone100.frame), "A escala do texto autônomo alterou seu frame.");

  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.3 validou escala discreta, frame e impressão pela interface real.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
