/* 05.51 — controles reais de densidade interna em 1366×768 e impressão. */
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
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });

  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    const card = CatalogEditor.store.addComponent("product-card", { x: 40, y: 40, width: 420, height: 320 });
    CatalogEditor.store.setComponentPresentation(card.id, { density: "compact", responsiveState: "wide" });
    const specifications = card.children.filter(component => component.type === "specification");
    CatalogEditor.store.selectComponentInContext(specifications[0].id);
    return { cardId: card.id, specificationIds: specifications.map(component => component.id), frames: specifications.map(component => ({ ...component.frame })) };
  });

  const density = page.locator('[data-prop-path="densityPreset"]');
  const gap = page.locator('[data-prop-path="gap"]');
  const padding = page.locator('[data-prop-path="padding"]');
  const scale = page.locator('[data-prop-path="iconScale"]');
  await density.waitFor();
  assert(await density.inputValue() === "auto", "Specification não abriu com densidade automática.");
  assert(await gap.inputValue() === "auto" && await padding.inputValue() === "auto", "Fallback automático não está explícito no inspetor.");

  const metrics = async id => page.evaluate(componentId => {
    const component = CatalogEditor.store.findComponent(componentId).component;
    const element = document.querySelector(`[data-component-id="${componentId}"] .component-specification`);
    const icon = element.querySelector(".component-specification__icon");
    const style = getComputedStyle(element);
    const box = node => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    return {
      props: { ...component.props },
      frame: { ...component.frame },
      molecule: box(element),
      icon: box(icon),
      gap: Number.parseFloat(style.columnGap),
      paddingLeft: Number.parseFloat(style.paddingLeft),
      paddingTop: Number.parseFloat(style.paddingTop)
    };
  }, id);

  const automatic = await metrics(ids.specificationIds[0]);
  assert(automatic.gap === 3 && automatic.paddingLeft === 3 && automatic.paddingTop === 1, "Automático não herdou a densidade compacta do card.");

  await density.selectOption("comfortable");
  const comfortable = await metrics(ids.specificationIds[0]);
  assert(comfortable.props.iconScale === 120 && comfortable.gap === 10 && comfortable.paddingLeft === 6 && comfortable.paddingTop === 3, "Preset confortável não prevaleceu sobre o fallback do card.");
  assert(JSON.stringify(comfortable.frame) === JSON.stringify(ids.frames[0]), "Preset confortável alterou o frame externo.");

  await gap.selectOption("7");
  const customized = await metrics(ids.specificationIds[0]);
  assert(customized.props.densityPreset === "custom" && customized.gap === 7 && customized.paddingLeft === 6, "Ajuste individual não preservou os outros valores nem marcou Personalizada.");
  assert(await density.inputValue() === "custom", "Inspetor não refletiu o ajuste personalizado.");

  await page.evaluate(specificationIds => {
    CatalogEditor.store.selectComponents(specificationIds);
  }, ids.specificationIds);
  await page.locator("[data-batch-specification-density]").selectOption("compact");
  await page.locator("[data-batch-specification-density-apply]").click();
  for (let index = 0; index < ids.specificationIds.length; index += 1) {
    const compact = await metrics(ids.specificationIds[index]);
    assert(compact.props.densityPreset === "compact" && compact.gap === 3 && compact.paddingLeft === 2, "Preset em lote não foi aplicado.");
    assert(JSON.stringify(compact.frame) === JSON.stringify(ids.frames[index]), "Preset em lote alterou um frame externo.");
  }

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const print = await metrics(ids.specificationIds[0]);
  assert(print.gap === 3 && print.paddingLeft === 2, "Impressão divergiu da densidade persistida.");
  const publication = await page.evaluate(() => CatalogEditor.store.getPublicationReport("draft").summary);
  assert((publication.collisions || 0) === 0 && (publication.overflows || 0) === 0, "Densidade interna introduziu colisão ou overflow externo.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ 05.51 validou automático, presets, ajuste direto, lote e impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
