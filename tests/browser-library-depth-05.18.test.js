/* Incremento 05.18 — linguagem editorial exercitada pela interface real. */
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

  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    const text = CatalogEditor.store.addComponent("text", { x: 24, y: 40, width: 260, height: 90 });
    const card = CatalogEditor.store.addComponent("product-card", { x: 310, y: 40, width: 420, height: 300 });
    CatalogEditor.store.setSelection(text.id);
    return { textId: text.id, cardId: card.id };
  });

  await page.locator('[data-prop-path="align"]').selectOption("end");
  await page.locator('[data-prop-path="verticalAlign"]').selectOption("start");
  await page.locator('[data-prop-path="scale"]').selectOption("120");
  await page.locator('[data-prop-path="overflow"]').selectOption("ellipsis");
  const textState = await page.evaluate(textId => {
    const component = CatalogEditor.store.findComponent(textId).component;
    const shell = document.querySelector(`[data-component-id="${textId}"] .component-text`);
    const copy = shell.querySelector("p");
    return { props: component.props, align: getComputedStyle(shell).textAlign, whiteSpace: getComputedStyle(copy).whiteSpace, fontSize: getComputedStyle(copy).fontSize };
  }, ids.textId);
  assert(textState.props.align === "end" && textState.props.verticalAlign === "start" && textState.props.scale === 120, "A interface não persistiu a composição do texto.");
  assert(textState.align === "right" && textState.whiteSpace === "nowrap" && Number.parseFloat(textState.fontSize) > 14, "A representação visual do texto não corresponde aos controles.");

  await page.evaluate(cardId => CatalogEditor.store.setSelection(cardId), ids.cardId);
  await page.locator('[data-inspector-tab="content"]').click();
  await page.locator(".card-presentation-secondary > summary").click();
  await page.locator('[data-presentation-path="presetId"]').selectOption("product-hero");
  const hero = await page.evaluate(cardId => {
    const card = CatalogEditor.store.findComponent(cardId).component;
    return { presentation: card.presentation, art: CatalogComponentGeometry.slotFrame(card, "art"), specs: CatalogComponentGeometry.slotFrame(card, "specifications") };
  }, ids.cardId);
  await page.locator('[data-presentation-path="presetId"]').selectOption("product-technical");
  const technical = await page.evaluate(cardId => {
    const card = CatalogEditor.store.findComponent(cardId).component;
    const report = CatalogEditor.store.getPublicationReport("draft");
    return { presentation: card.presentation, art: CatalogComponentGeometry.slotFrame(card, "art"), specs: CatalogComponentGeometry.slotFrame(card, "specifications"), report: report.summary };
  }, ids.cardId);
  assert(hero.presentation.mode === "hero" && technical.presentation.mode === "technical", "Os presets não aplicaram modos distintos.");
  assert(hero.art.width > technical.art.width && technical.specs.width > hero.specs.width, "Destaque e Técnico não mudaram a prioridade geométrica.");
  assert(technical.report.collisions === 0 && technical.report.overflows === 0, "A mudança de modo produziu colisão ou overflow.");
  assert(errors.length === 0, `Erros de página: ${errors.join(" | ")}`);

  await browser.close();
  console.log("✓ Texto editorial e presets de produto 05.18 validados no navegador.");
})().catch(async error => { console.error(error); if (browser) await browser.close(); process.exitCode = 1; });
