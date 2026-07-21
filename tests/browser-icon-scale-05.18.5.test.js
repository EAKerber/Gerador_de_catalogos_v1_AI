/* DB-05.19.6 — escala interna de icon validada sem shim de runtime. */
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
  await page.waitForFunction(() => window.CatalogEditor && window.CATALOG_COMPONENT_REGISTRY?.icon?.contentFields?.some(field => field.path === "iconScale"));

  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    const standalone = CatalogEditor.store.addComponent("icon", { x: 24, y: 24, width: 56, height: 56 });
    const footer = CatalogEditor.store.addComponent("footer-item", { x: 24, y: 120, width: 180, height: 96 });
    const footerIcon = footer.children.find(component => component.type === "icon" && component.slot?.name === "icon");
    CatalogEditor.store.selectComponentInContext(footerIcon.id);
    return { standaloneId: standalone.id, footerIconId: footerIcon.id, footerFrame: { ...footerIcon.frame } };
  });

  const readIcon = async id => page.evaluate(componentId => {
    const component = CatalogEditor.store.findComponent(componentId)?.component;
    const root = document.querySelector(`[data-component-id="${componentId}"]`);
    const content = root?.querySelector(".component-icon");
    const wrapper = root?.querySelector(".component-icon__svg");
    const svg = wrapper?.querySelector("svg");
    const rect = element => element ? (() => {
      const box = element.getBoundingClientRect();
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
    })() : null;
    return {
      scale: component?.props?.iconScale,
      frame: component ? { ...component.frame } : null,
      content: rect(content),
      wrapper: rect(wrapper),
      svg: rect(svg)
    };
  }, id);

  const inside = (inner, outer, tolerance = 1) => inner && outer
    && inner.left >= outer.left - tolerance
    && inner.top >= outer.top - tolerance
    && inner.right <= outer.right + tolerance
    && inner.bottom <= outer.bottom + tolerance;

  const footerStates = {};
  for (const scale of [80, 100, 120]) {
    await page.locator('[data-prop-path="iconScale"]').selectOption(String(scale));
    const state = await readIcon(ids.footerIconId);
    footerStates[scale] = state;
    assert(state.scale === scale, `O rodapé não persistiu ${scale}%.`);
    assert(JSON.stringify(state.frame) === JSON.stringify(ids.footerFrame), `${scale}% alterou o frame do ícone do rodapé.`);
    assert(inside(state.svg, state.content), `${scale}% escapou da caixa interna do rodapé: ${JSON.stringify(state)}.`);
  }
  assert(footerStates[80].svg.width < footerStates[100].svg.width && footerStates[100].svg.width < footerStates[120].svg.width, "O rodapé não diferenciou visualmente 80/100/120%.");

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const footerPrint = await readIcon(ids.footerIconId);
  assert(Math.abs(footerPrint.svg.width - footerStates[120].svg.width) < 0.01, "A impressão divergiu da escala 120% do rodapé.");
  assert(inside(footerPrint.svg, footerPrint.content), "O ícone escapou da caixa na impressão.");
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });

  assert(await page.evaluate(() => CatalogEditor.store.undo()), "Não foi possível desfazer a escala do ícone.");
  const footerUndo = await readIcon(ids.footerIconId);
  assert(footerUndo.scale === 100, "Desfazer não restaurou 100%.");
  assert(await page.evaluate(() => CatalogEditor.store.redo()), "Não foi possível refazer a escala do ícone.");
  const footerRedo = await readIcon(ids.footerIconId);
  assert(footerRedo.scale === 120, "Refazer não restaurou 120%.");

  await page.evaluate(standaloneId => CatalogEditor.store.selectComponentInContext(standaloneId), ids.standaloneId);
  const standaloneStates = {};
  for (const scale of [80, 100, 120]) {
    await page.locator('[data-prop-path="iconScale"]').selectOption(String(scale));
    const state = await readIcon(ids.standaloneId);
    standaloneStates[scale] = state;
    assert(inside(state.svg, state.content), `Ícone autônomo ${scale}% escapou da caixa.`);
  }
  assert(standaloneStates[80].svg.width < standaloneStates[100].svg.width && standaloneStates[100].svg.width < standaloneStates[120].svg.width, "O ícone autônomo não diferenciou as três escalas.");

  const runtimeState = await page.evaluate(() => ({
    contractGlobal: typeof window.CatalogIconScaleContract,
    canonicalStyle: Array.from(document.styleSheets).some(sheet => {
      let rules;
      try { rules = sheet.cssRules; } catch { return false; }
      return Array.from(rules || []).some(rule => rule.selectorText?.includes('.editor-component--footer-item') && rule.selectorText?.includes('.component-icon__svg'));
    })
  }));
  assert(runtimeState.contractGlobal === "undefined", "O global removido reapareceu no editor.");
  assert(runtimeState.canonicalStyle, "A contenção do ícone do rodapé não foi encontrada no CSS carregado.");

  const publication = await page.evaluate(() => CatalogEditor.store.getPublicationReport("draft").summary);
  assert((publication.collisions || 0) === 0 && (publication.overflows || 0) === 0, "A escala de ícone introduziu colisão ou overflow externo.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.19.6 validou escala de ícones, contenção e impressão sem shim de runtime.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
