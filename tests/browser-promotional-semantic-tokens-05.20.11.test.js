/* DB-05.20.11 — tokens promocionais no editor real. */
"use strict";

const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");

const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = process.env.CATALOG_PROMOTIONAL_TOKEN_OUTPUT_DIR || path.join("audit-output", "db-05.20.11", "semantic-tokens");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

fs.mkdirSync(outputDir, { recursive: true });

function normalizeColor(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor?.store && window.CATALOG_EDITOR_TOKENS?.meta?.version === "2.0.0-alpha.4");

  const ids = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false, snapEnabled: false, smartSnapEnabled: false });
    const primary = store.addComponent("text", { x: 40, y: 40, width: 240, height: 100 }, {
      props: { content: "R$ 3,99" },
      style: { surface: "surface.paper", typography: "type.body", textColor: "text.primary" }
    });
    const secondary = store.addComponent("text", { x: 300, y: 40, width: 220, height: 100 }, {
      props: { content: "POR APENAS" },
      style: { surface: "surface.promo-secondary", typography: "type.promo-qualifier", textColor: "promo.on-secondary" }
    });
    const dark = store.addComponent("text", { x: 540, y: 40, width: 220, height: 100 }, {
      props: { content: "CÓD. 1123" },
      style: { surface: "surface.promo-dark", typography: "type.promo-meta", textColor: "promo.on-dark" }
    });
    store.selectComponentInContext(primary.id);
    return { primary: primary.id, secondary: secondary.id, dark: dark.id };
  });

  await page.waitForSelector(`[data-component-id="${ids.primary}"]`);
  await page.locator('[data-inspector-tab="style"]').click();
  await page.locator('[data-style-path="surface"]').waitFor({ state: "visible" });

  const inspectorAvailability = await page.evaluate(() => {
    const values = selector => [...document.querySelector(selector)?.options || []].map(option => option.value);
    return {
      surfaces: values('[data-style-path="surface"]'),
      typography: values('[data-style-path="typography"]'),
      textColors: values('[data-style-path="textColor"]')
    };
  });
  for (const id of ["surface.promo-primary", "surface.promo-secondary", "surface.promo-dark"]) {
    assert(inspectorAvailability.surfaces.includes(id), `Superfície não selecionável no inspetor: ${id}`);
  }
  for (const id of ["type.promo-title", "type.promo-price", "type.promo-qualifier", "type.promo-meta"]) {
    assert(inspectorAvailability.typography.includes(id), `Tipografia não selecionável no inspetor: ${id}`);
  }
  for (const id of ["promo.primary", "promo.secondary", "promo.dark", "promo.on-primary", "promo.on-secondary", "promo.on-dark"]) {
    assert(inspectorAvailability.textColors.includes(id), `Cor não selecionável no inspetor: ${id}`);
  }

  await page.locator('[data-style-path="surface"]').selectOption("surface.promo-primary");
  await page.locator('[data-style-path="typography"]').selectOption("type.promo-price");
  await page.locator('[data-style-path="textColor"]').selectOption("promo.on-primary");
  await page.waitForTimeout(40);

  async function measure(media) {
    return page.evaluate(({ ids, media }) => {
      const read = id => {
        const root = document.querySelector(`[data-component-id="${id}"]`);
        const text = root?.querySelector(".component-text p");
        const rootStyle = root ? getComputedStyle(root) : null;
        const textStyle = text ? getComputedStyle(text) : null;
        const component = CatalogEditor.store.findComponent(id)?.component;
        return {
          style: component ? { ...component.style } : null,
          backgroundColor: rootStyle?.backgroundColor || null,
          color: textStyle?.color || null,
          fontSize: textStyle ? Number.parseFloat(textStyle.fontSize) : 0,
          text: text?.textContent || ""
        };
      };
      return { media, primary: read(ids.primary), secondary: read(ids.secondary), dark: read(ids.dark) };
    }, { ids, media });
  }

  const screen = await measure("screen");
  assert(screen.primary.style.surface === "surface.promo-primary", "O inspetor não aplicou a superfície principal.");
  assert(screen.primary.style.typography === "type.promo-price", "O inspetor não aplicou a tipografia de preço.");
  assert(screen.primary.style.textColor === "promo.on-primary", "O inspetor não aplicou a cor de contraste.");
  assert(normalizeColor(screen.primary.backgroundColor) === "rgb(217,9,9)", `Superfície principal divergente: ${screen.primary.backgroundColor}`);
  assert(normalizeColor(screen.primary.color) === "rgb(255,255,255)", `Contraste principal divergente: ${screen.primary.color}`);
  assert(screen.primary.fontSize >= 37, `Preço promocional menor que o contrato: ${screen.primary.fontSize}px.`);
  assert(normalizeColor(screen.secondary.backgroundColor) === "rgb(255,196,0)", `Superfície secundária divergente: ${screen.secondary.backgroundColor}`);
  assert(normalizeColor(screen.secondary.color) === "rgb(10,9,9)", `Contraste secundário divergente: ${screen.secondary.color}`);
  assert(normalizeColor(screen.dark.backgroundColor) === "rgb(10,9,9)", `Superfície escura divergente: ${screen.dark.backgroundColor}`);
  assert(normalizeColor(screen.dark.color) === "rgb(255,255,255)", `Contraste escuro divergente: ${screen.dark.color}`);

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await measure("print");
  for (const key of ["primary", "secondary", "dark"]) {
    assert(normalizeColor(printed[key].backgroundColor) === normalizeColor(screen[key].backgroundColor), `${key}: impressão alterou a superfície.`);
    assert(normalizeColor(printed[key].color) === normalizeColor(screen[key].color), `${key}: impressão alterou o contraste.`);
    assert(Math.abs(printed[key].fontSize - screen[key].fontSize) < 0.1, `${key}: impressão alterou a tipografia.`);
  }

  const readiness = await page.evaluate(() => {
    const recipes = new Set(CatalogSectionRecipes.list().map(recipe => recipe.id));
    return {
      priceRecipe: recipes.has("commerce-price-block"),
      offerRecipe: recipes.has("commerce-offer-unit"),
      schemaVersion: CatalogEditor.store.getExportDocument().schemaVersion
    };
  });
  assert(readiness.schemaVersion === "1.16.0", "DB-05.20.11 alterou o schema.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  const report = { ids, inspectorAvailability, screen, printed, readiness, pageErrors, consoleErrors };
  fs.writeFileSync(path.join(outputDir, "promotional-semantic-tokens-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });
  await page.screenshot({ path: path.join(outputDir, "promotional-semantic-tokens.png"), fullPage: true });

  await browser.close();
  browser = null;
  console.log("✓ DB-05.20.11 validou tokens promocionais no inspetor, tela e impressão, com capacidades posteriores tratadas de forma aditiva.");
})().catch(async error => {
  fs.writeFileSync(path.join(outputDir, "promotional-semantic-tokens-error.json"), `${JSON.stringify({ message: error.message, stack: error.stack }, null, 2)}\n`);
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
