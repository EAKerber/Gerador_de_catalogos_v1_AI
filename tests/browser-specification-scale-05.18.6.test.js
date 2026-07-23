/* DB-05.18.6 — escala interna de specification em apresentações reais. */
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
  await page.waitForFunction(() => {
    const definition = window.CATALOG_COMPONENT_REGISTRY?.specification;
    return Boolean(
      window.CatalogEditor
      && definition?.contentFields?.some(field => field.path === "iconScale")
    );
  });

  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    const standalone = CatalogEditor.store.addComponent("specification", { x: 24, y: 24, width: 180, height: 58 });
    const card = CatalogEditor.store.addComponent("product-card", { x: 240, y: 24, width: 420, height: 340 });
    const cardSpecification = card.children.find(component => component.type === "specification");
    CatalogEditor.store.selectComponentInContext(standalone.id);
    return {
      standaloneId: standalone.id,
      cardId: card.id,
      cardSpecificationId: cardSpecification.id,
      standaloneFrame: { ...standalone.frame },
      cardFrame: { ...card.frame }
    };
  });

  const readSpecification = async id => page.evaluate(componentId => {
    const component = CatalogEditor.store.findComponent(componentId)?.component;
    const root = document.querySelector(`[data-component-id="${componentId}"]`);
    const molecule = root?.querySelector(".component-specification");
    const iconShell = root?.querySelector(".component-specification__icon");
    const svg = iconShell?.querySelector("svg");
    const label = root?.querySelector(".component-specification > span:last-child");
    const rect = element => element ? (() => {
      const box = element.getBoundingClientRect();
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
    })() : null;
    return {
      scale: component?.props?.iconScale,
      frame: component ? { ...component.frame } : null,
      molecule: rect(molecule),
      iconShell: rect(iconShell),
      svg: rect(svg),
      label: rect(label),
      labelFontSize: label ? Number.parseFloat(getComputedStyle(label).fontSize) : 0
    };
  }, id);

  const inside = (inner, outer, tolerance = 1) => inner && outer
    && inner.left >= outer.left - tolerance
    && inner.top >= outer.top - tolerance
    && inner.right <= outer.right + tolerance
    && inner.bottom <= outer.bottom + tolerance;

  const standaloneStates = {};
  for (const scale of [80, 100, 120]) {
    await page.locator('[data-prop-path="iconScale"]').selectOption(String(scale));
    const state = await readSpecification(ids.standaloneId);
    standaloneStates[scale] = state;
    assert(state.scale === scale, `Specification autônoma não persistiu ${scale}%.`);
    assert(JSON.stringify(state.frame) === JSON.stringify(ids.standaloneFrame), `${scale}% alterou o frame da molécula autônoma.`);
    assert(inside(state.svg, state.iconShell), `${scale}% escapou do invólucro circular autônomo.`);
  }
  assert(standaloneStates[80].svg.width < standaloneStates[100].svg.width && standaloneStates[100].svg.width < standaloneStates[120].svg.width, "A specification autônoma não diferenciou 80/100/120%.");
  assert(Math.abs(standaloneStates[80].labelFontSize - standaloneStates[120].labelFontSize) < 0.01, "A escala de ícone alterou implicitamente o texto da molécula.");

  const presentations = [
    { mode: "standard", density: "standard", responsiveState: "wide" },
    { mode: "hero", density: "comfortable", responsiveState: "wide" },
    { mode: "technical", density: "compact", responsiveState: "wide" },
    { mode: "variants", density: "compact", responsiveState: "compact" },
    { mode: "data-only", density: "compact", responsiveState: "wide" }
  ];
  const matrix = [];
  for (const presentation of presentations) {
    await page.evaluate(({ cardId, presentation }) => CatalogEditor.store.setComponentPresentation(cardId, presentation), { cardId: ids.cardId, presentation });
    await page.evaluate(specificationId => CatalogEditor.store.selectComponentInContext(specificationId), ids.cardSpecificationId);
    const states = {};
    for (const scale of [80, 100, 120]) {
      await page.locator('[data-prop-path="iconScale"]').selectOption(String(scale));
      const state = await readSpecification(ids.cardSpecificationId);
      states[scale] = state;
      assert(state.scale === scale, `${presentation.mode} não persistiu ${scale}%.`);
      assert(inside(state.svg, state.iconShell), `${presentation.mode}/${scale}% escapou do círculo.`);
      assert(inside(state.iconShell, state.molecule), `${presentation.mode}/${scale}% deslocou o ícone para fora da molécula.`);
    }
    assert(states[80].svg.width < states[100].svg.width && states[100].svg.width < states[120].svg.width, `${presentation.mode} não diferenciou as três escalas.`);
    assert(Math.abs(states[80].labelFontSize - states[120].labelFontSize) < 0.01, `${presentation.mode} escalou o rótulo junto com o ícone.`);
    const cardFrame = await page.evaluate(cardId => ({ ...CatalogEditor.store.findComponent(cardId).component.frame }), ids.cardId);
    assert(JSON.stringify(cardFrame) === JSON.stringify(ids.cardFrame), `${presentation.mode} alterou o frame externo durante a escala interna.`);
    matrix.push({ presentation, states });
  }

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printState = await readSpecification(ids.cardSpecificationId);
  const lastScreen = matrix[matrix.length - 1].states[120];
  assert(Math.abs(printState.svg.width - lastScreen.svg.width) < 0.01, "A impressão divergiu da escala 120% de specification.");
  assert(inside(printState.svg, printState.iconShell), "O SVG escapou do círculo na impressão.");

  const publication = await page.evaluate(() => CatalogEditor.store.getPublicationReport("draft").summary);
  assert((publication.collisions || 0) === 0 && (publication.overflows || 0) === 0, "A escala de specification introduziu colisão ou overflow externo.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.6 validou specification em cinco apresentações, três escalas e impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
