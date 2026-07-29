/* DB-05.18.1 — linha de base visual e contratual, sem alterar o runtime. */
const fs = require("fs");
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = path.resolve(process.env.CATALOG_DEVELOPER_B_OUTPUT_DIR || "/tmp/catalog-developer-b-05.18.1");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const round = (value, digits = 4) => Number(Number(value || 0).toFixed(digits));
const modes = ["standard", "hero", "technical", "variants", "data-only"];
const sizes = {
  wide: { width: 420, height: 320, responsiveState: "wide" },
  compact: { width: 280, height: 390, responsiveState: "compact" }
};
const presetFor = mode => mode === "data-only" ? "product-standard" : `product-${mode}`;
let browser;

function maximumRectDelta(left, right) {
  const keys = ["x", "y", "width", "height"];
  if (!left || !right) return 1;
  return Math.max(...keys.map(key => Math.abs(Number(left[key] || 0) - Number(right[key] || 0))));
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("dialog", dialog => dialog.accept());

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "custom", gridVisible: false });
    const text = CatalogEditor.store.addComponent("text", { x: 24, y: 24, width: 260, height: 80 });
    const icon = CatalogEditor.store.addComponent("icon", { x: 300, y: 24, width: 56, height: 56 });
    const specification = CatalogEditor.store.addComponent("specification", { x: 372, y: 24, width: 150, height: 54 });
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 130, width: 420, height: 320 });
    return { textId: text.id, iconId: icon.id, specificationId: specification.id, cardId: card.id };
  });

  const defaults = await page.evaluate(({ textId, iconId, specificationId }) => {
    const find = id => CatalogEditor.store.findComponent(id)?.component;
    return {
      schemaVersion: CatalogEditor.store.getState().schemaVersion,
      text: find(textId)?.props || null,
      icon: find(iconId)?.props || null,
      specification: find(specificationId)?.props || null
    };
  }, ids);

  async function configureCase(mode, sizeName) {
    const size = sizes[sizeName];
    await page.emulateMedia({ media: "screen" });
    await page.evaluate(() => { delete document.documentElement.dataset.printing; });
    await page.evaluate(({ cardId, mode, size, presetId }) => {
      CatalogEditor.store.updateComponent(cardId, {
        frame: { x: 24, y: 130, width: size.width, height: size.height }
      });
      CatalogEditor.store.setComponentPresentation(cardId, {
        presetId,
        mode,
        responsiveState: size.responsiveState
      });
      CatalogEditor.store.setSelection(cardId);
    }, { cardId: ids.cardId, mode, size, presetId: presetFor(mode) });
    await page.waitForTimeout(40);
  }

  async function capture(cardId) {
    return page.evaluate(cardIdValue => {
      const card = CatalogEditor.store.findComponent(cardIdValue)?.component;
      const cardElement = document.querySelector(`[data-component-id="${cardIdValue}"]`);
      if (!card || !cardElement) return null;
      const cardRect = cardElement.getBoundingClientRect();
      const slotNames = ["title", "art", "specifications", "table"];
      const normalizeModel = frame => frame ? {
        x: frame.x / card.frame.width,
        y: frame.y / card.frame.height,
        width: frame.width / card.frame.width,
        height: frame.height / card.frame.height
      } : null;
      const normalizeDOM = rect => ({
        x: (rect.left - cardRect.left) / cardRect.width,
        y: (rect.top - cardRect.top) / cardRect.height,
        width: rect.width / cardRect.width,
        height: rect.height / cardRect.height
      });
      const union = rects => {
        if (!rects.length) return null;
        const left = Math.min(...rects.map(rect => rect.left));
        const top = Math.min(...rects.map(rect => rect.top));
        const right = Math.max(...rects.map(rect => rect.right));
        const bottom = Math.max(...rects.map(rect => rect.bottom));
        return { left, top, right, bottom, width: right - left, height: bottom - top };
      };
      const slots = {};
      slotNames.forEach(slotName => {
        const model = CatalogComponentGeometry.slotFrame(card, slotName);
        const elements = Array.from(document.querySelectorAll(`[data-parent-id="${cardIdValue}"][data-slot-name="${slotName}"]`));
        const dom = union(elements.map(element => element.getBoundingClientRect()));
        slots[slotName] = {
          model,
          normalizedModel: normalizeModel(model),
          normalizedDOM: dom ? normalizeDOM(dom) : null,
          occupants: elements.length
        };
      });
      return {
        frame: { ...card.frame },
        presentation: JSON.parse(JSON.stringify(card.presentation || {})),
        renderedMode: cardElement.dataset.presentationMode,
        renderedDensity: cardElement.dataset.presentationDensity,
        cardRect: { width: cardRect.width, height: cardRect.height },
        slots
      };
    }, cardId);
  }

  const cases = [];
  const divergences = [];
  for (const sizeName of Object.keys(sizes)) {
    for (const mode of modes) {
      await configureCase(mode, sizeName);
      const screen = await capture(ids.cardId);
      const screenshotPath = path.join(outputDir, `${sizeName}-${mode}.png`);
      await page.locator(`[data-component-id="${ids.cardId}"]`).screenshot({ path: screenshotPath });

      await page.emulateMedia({ media: "print" });
      await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
      await page.waitForTimeout(20);
      const print = await capture(ids.cardId);
      await page.emulateMedia({ media: "screen" });
      await page.evaluate(() => { delete document.documentElement.dataset.printing; });

      const publication = await page.evaluate(() => CatalogEditor.store.getPublicationReport("draft").summary);
      const slotParity = {};
      for (const slotName of ["title", "art", "specifications", "table"]) {
        const delta = maximumRectDelta(screen?.slots?.[slotName]?.normalizedDOM, print?.slots?.[slotName]?.normalizedDOM);
        slotParity[slotName] = round(delta);
        if (delta > 0.015) divergences.push({ kind: "screen-print-parity", mode, size: sizeName, slot: slotName, delta: round(delta) });
      }
      if ((publication.collisions || 0) > 0 || (publication.overflows || 0) > 0) {
        divergences.push({ kind: "publication-geometry", mode, size: sizeName, summary: publication });
      }
      if (!screen || !print) divergences.push({ kind: "missing-render", mode, size: sizeName });
      if (screen?.presentation?.mode !== mode || screen?.renderedMode !== mode) {
        divergences.push({ kind: "mode-not-rendered", mode, size: sizeName, presentation: screen?.presentation, renderedMode: screen?.renderedMode });
      }
      cases.push({ mode, size: sizeName, screen, print, slotParity, publication, screenshot: path.basename(screenshotPath) });
    }
  }

  const wide = Object.fromEntries(cases.filter(item => item.size === "wide").map(item => [item.mode, item]));
  const distinctions = {
    heroArtVsStandard: wide.hero.screen.slots.art.model.width > wide.standard.screen.slots.art.model.width,
    technicalSpecsVsStandard: wide.technical.screen.slots.specifications.model.width > wide.standard.screen.slots.specifications.model.width,
    dataSpecsVsTechnical: wide["data-only"].screen.slots.specifications.model.width > wide.technical.screen.slots.specifications.model.width,
    variantsStacked: wide.variants.screen.slots.specifications.model.y > wide.variants.screen.slots.art.model.y
      && wide.variants.screen.slots.specifications.model.width === wide.variants.screen.slots.art.model.width
  };
  Object.entries(distinctions).forEach(([name, passed]) => {
    if (!passed) divergences.push({ kind: "mode-distinction", name });
  });

  const defaultChecks = {
    schemaVersion: defaults.schemaVersion === "1.16.0",
    text: defaults.text?.align === "start" && defaults.text?.verticalAlign === "center" && defaults.text?.scale === 100 && defaults.text?.overflow === "wrap",
    icon: defaults.icon?.iconScale === 100,
    specification: defaults.specification?.iconScale === 100
  };
  Object.entries(defaultChecks).forEach(([name, passed]) => {
    if (!passed) divergences.push({ kind: "default-contract", name, defaults });
  });

  const persisted = await page.evaluate(({ textId, iconId, specificationId, cardId }) => {
    const clone = value => JSON.parse(JSON.stringify(value));
    const find = id => CatalogEditor.store.findComponent(id)?.component;
    return {
      schemaVersion: CatalogEditor.store.getState().schemaVersion,
      text: clone(find(textId)?.props || {}),
      icon: clone(find(iconId)?.props || {}),
      specification: clone(find(specificationId)?.props || {}),
      card: {
        frame: clone(find(cardId)?.frame || {}),
        presentation: clone(find(cardId)?.presentation || {})
      },
      history: CatalogEditor.store.getHistoryState()
    };
  }, ids);

  const metrics = {
    audit: "DB-05.18.1 — linha de base visual e contratual",
    generatedAt: new Date().toISOString(),
    viewport: { width: 1366, height: 768 },
    source: { branch: "agent/developer-b-05.18", catalogDocument: "1.16.0", catalogAuthoringKit: "1.6.0" },
    defaults,
    defaultChecks,
    distinctions,
    cases,
    persisted,
    divergences,
    pageErrors,
    consoleErrors,
    status: divergences.length || pageErrors.length || consoleErrors.length ? "divergence" : "pass"
  };
  fs.writeFileSync(path.join(outputDir, "baseline.metrics.json"), `${JSON.stringify(metrics, null, 2)}\n`);

  assert(cases.length === 10, `A matriz deveria conter 10 casos, mas contém ${cases.length}.`);
  assert(defaultChecks.schemaVersion, `Schema inesperado: ${defaults.schemaVersion}.`);
  assert(cases.every(item => item.screen && item.print), "Ao menos um caso não pôde ser medido em tela e impressão.");
  assert(cases.every(item => item.screen.presentation.mode === item.mode && item.screen.renderedMode === item.mode), "Ao menos um modo não foi persistido ou renderizado.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log(`✓ DB-05.18.1 registrou 10 casos; status ${metrics.status}; ${divergences.length} divergência(s). Evidência: ${outputDir}`);
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
