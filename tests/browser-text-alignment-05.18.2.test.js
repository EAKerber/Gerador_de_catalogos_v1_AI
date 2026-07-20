/* DB-05.18.2 — alinhamento exercitado pela interface real e mídia de impressão. */
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
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogTextAlignmentContract?.VERSION === "05.18.2");

  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    const standalone = CatalogEditor.store.addComponent("text", { x: 24, y: 24, width: 280, height: 96 });
    const footer = CatalogEditor.store.addComponent("footer-item", { x: 24, y: 150, width: 220, height: 112 });
    const title = footer.children.find(component => component.type === "text" && component.slot?.name === "title");
    CatalogEditor.store.selectComponentInContext(title.id);
    return { standaloneId: standalone.id, footerId: footer.id, titleId: title.id, initialFrame: { ...title.frame } };
  });

  const readText = async id => page.evaluate(componentId => {
    const component = CatalogEditor.store.findComponent(componentId)?.component;
    const shell = document.querySelector(`[data-component-id="${componentId}"] .component-text`);
    return {
      props: component ? JSON.parse(JSON.stringify(component.props)) : null,
      frame: component ? { ...component.frame } : null,
      textAlign: shell ? getComputedStyle(shell).textAlign : null,
      alignContent: shell ? getComputedStyle(shell).alignContent : null
    };
  }, id);

  let footerState = await readText(ids.titleId);
  assert(footerState.props.align === "center" && footerState.props.alignExplicit === false, "O texto padrão do rodapé não iniciou centralizado.");
  assert(footerState.textAlign === "center", `O default do rodapé não foi representado no canvas: ${footerState.textAlign}.`);

  await page.locator('[data-prop-path="align"]').selectOption("end");
  footerState = await readText(ids.titleId);
  assert(footerState.props.align === "end" && footerState.props.alignExplicit === true, "A interface não persistiu a escolha Fim como explícita.");
  assert(footerState.textAlign === "right", `A regra estrutural ainda mascarou Fim no canvas: ${footerState.textAlign}.`);
  assert(JSON.stringify(footerState.frame) === JSON.stringify(ids.initialFrame), "O alinhamento horizontal alterou o frame do texto.");

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printEnd = await readText(ids.titleId);
  assert(printEnd.textAlign === "right", `A impressão divergiu do canvas para Fim: ${printEnd.textAlign}.`);
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });

  await page.locator('[data-prop-path="align"]').selectOption("start");
  const startState = await readText(ids.titleId);
  assert(startState.props.align === "start" && startState.props.alignExplicit === true, "A interface não persistiu a escolha Início.");
  assert(startState.textAlign === "left", `A regra estrutural ainda mascarou Início: ${startState.textAlign}.`);

  assert(await page.evaluate(() => CatalogEditor.store.undo()), "O alinhamento não pôde ser desfeito.");
  const undone = await readText(ids.titleId);
  assert(undone.props.align === "center" && undone.textAlign === "center", "Desfazer não restaurou o default central do rodapé.");
  assert(await page.evaluate(() => CatalogEditor.store.redo()), "O alinhamento não pôde ser refeito.");
  const redone = await readText(ids.titleId);
  assert(redone.props.align === "start" && redone.textAlign === "left", "Refazer não restaurou a escolha explícita Início.");

  await page.evaluate(standaloneId => CatalogEditor.store.selectComponentInContext(standaloneId), ids.standaloneId);
  await page.locator('[data-prop-path="align"]').selectOption("center");
  await page.locator('[data-prop-path="verticalAlign"]').selectOption("start");
  let standaloneState = await readText(ids.standaloneId);
  assert(standaloneState.textAlign === "center" && standaloneState.alignContent === "start", "O texto autônomo não aplicou centro/topo.");

  await page.locator('[data-prop-path="verticalAlign"]').selectOption("end");
  standaloneState = await readText(ids.standaloneId);
  assert(standaloneState.alignContent === "end", `A interface não aplicou alinhamento vertical Base: ${standaloneState.alignContent}.`);
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const standalonePrint = await readText(ids.standaloneId);
  assert(standalonePrint.textAlign === "center" && standalonePrint.alignContent === "end", "Canvas e impressão divergiram no texto autônomo.");

  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.2 validou alinhamento, histórico e paridade de impressão pela interface real.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
