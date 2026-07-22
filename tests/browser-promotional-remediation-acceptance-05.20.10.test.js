/* DB-05.20.10 — aceitação futura da remediação promocional. */
"use strict";

const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");

const root = path.resolve(__dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "promotional-remediation-contract-05.20.10.json"), "utf8"));
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = process.env.CATALOG_PROMOTIONAL_REMEDIATION_OUTPUT_DIR
  || path.join(root, "audit-output", "db-05.20.10", "readiness");
const enforce = process.env.CATALOG_PROMOTIONAL_REMEDIATION_ENFORCE === "1";
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

fs.mkdirSync(outputDir, { recursive: true });

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

function comparableDocument(value) {
  const copy = JSON.parse(JSON.stringify(value));
  delete copy.editor;
  delete copy.updatedAt;
  return canonical(copy);
}

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor?.store && window.CatalogSectionRecipes?.list);

  const readiness = await page.evaluate(contract => {
    const tokens = window.CATALOG_EDITOR_TOKENS || {};
    const recipes = window.CatalogSectionRecipes?.list?.() || [];
    const recipeIds = new Set(recipes.map(recipe => recipe.id));
    const missingTokens = [];
    for (const group of ["colors", "surfaces", "typography"]) {
      for (const id of contract.semanticTokens[group] || []) {
        if (!tokens[group]?.[id]) missingTokens.push({ group, id });
      }
    }
    const missingRecipes = Object.keys(contract.recipes).filter(id => !recipeIds.has(id));
    return { missingTokens, missingRecipes, recipeIds: [...recipeIds] };
  }, contract);

  const baselineReport = {
    contractVersion: contract.version,
    status: readiness.missingTokens.length || readiness.missingRecipes.length ? "not-ready" : "ready",
    enforcement: enforce ? "blocking" : "informational",
    readiness,
    acceptance: contract.acceptance,
    pageErrors,
    consoleErrors
  };

  if (baselineReport.status === "not-ready") {
    fs.writeFileSync(
      path.join(outputDir, "promotional-remediation-browser-readiness.json"),
      `${JSON.stringify(baselineReport, null, 2)}\n`
    );
    assert(pageErrors.length === 0, `Erros de página durante a prontidão: ${pageErrors.join(" | ")}`);
    assert(consoleErrors.length === 0, `Erros de console durante a prontidão: ${consoleErrors.join(" | ")}`);
    if (enforce) throw new Error(`Capacidades promocionais ainda ausentes: ${JSON.stringify(readiness)}`);
    await browser.close();
    browser = null;
    console.log("✓ DB-05.20.10 registrou prontidão visual promocional ainda incompleta.");
    return;
  }

  const fixture = await page.evaluate(contract => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false, snapEnabled: false, smartSnapEnabled: false });
    const ids = [];
    for (let index = 0; index < contract.acceptance.minimumOfferUnits; index += 1) {
      const inserted = store.addComponentFromTemplate("commerce-offer-unit", {
        x: 24 + index * 183,
        y: 180,
        width: 171,
        height: 500
      }, { parentId: null });
      ids.push(inserted.id);
    }
    return { ids, document: JSON.parse(JSON.stringify(store.getState())) };
  }, contract);

  await page.waitForFunction(ids => ids.every(id => document.querySelector(`[data-component-id="${id}"]`)), fixture.ids);

  async function measure(media) {
    return page.evaluate(({ ids, media }) => {
      const store = CatalogEditor.store;
      const rect = element => {
        const box = element?.getBoundingClientRect();
        return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height } : null;
      };
      const collect = root => {
        const items = [];
        const visit = component => {
          items.push(component);
          (component.children || []).forEach(visit);
        };
        visit(root);
        return items;
      };
      const offers = ids.map(id => {
        const root = store.findComponent(id).component;
        const all = collect(root);
        const roleMap = Object.fromEntries(all.filter(item => item.props?.recipeRole).map(item => [item.props.recipeRole, item]));
        const dom = role => roleMap[role] ? document.querySelector(`[data-component-id="${roleMap[role].id}"]`) : null;
        const text = role => dom(role)?.querySelector("p, strong, span:last-child") || null;
        const amountText = text("amount");
        const codeText = text("code");
        const measureText = text("measure");
        const priceRoot = dom("price-block");
        const surfaces = all
          .filter(item => item.style?.surface?.startsWith("surface.promo-"))
          .map(item => item.style.surface);
        return {
          id,
          root: rect(document.querySelector(`[data-component-id="${id}"]`)),
          priceRoot: rect(priceRoot),
          roles: Object.keys(roleMap),
          amountFontSize: amountText ? Number.parseFloat(getComputedStyle(amountText).fontSize) : 0,
          codeFontSize: codeText ? Number.parseFloat(getComputedStyle(codeText).fontSize) : 0,
          measureFontSize: measureText ? Number.parseFloat(getComputedStyle(measureText).fontSize) : 0,
          promoSurfaces: [...new Set(surfaces)]
        };
      });
      const publication = store.getPublicationReport("draft").summary;
      return { media, offers, publication };
    }, { ids: fixture.ids, media });
  }

  function validate(snapshot) {
    assert(snapshot.offers.length >= contract.acceptance.minimumOfferUnits, "Quantidade insuficiente de ofertas independentes.");
    const priceContainers = snapshot.offers.filter(item => item.priceRoot?.width > 0 && item.priceRoot?.height > 0);
    assert(priceContainers.length >= contract.acceptance.minimumPriceContainers, "Contêineres visuais de preço insuficientes.");
    snapshot.offers.forEach((offer, index) => {
      const expectedRoles = ["offer-unit", "media", "code", "measure", "price-block", "currency", "amount"];
      expectedRoles.forEach(role => assert(offer.roles.includes(role), `Oferta ${index + 1} sem papel ${role}.`));
      assert(offer.amountFontSize >= offer.codeFontSize * contract.acceptance.minimumPriceToMetaFontRatio, `Oferta ${index + 1}: preço não domina o código.`);
      assert(offer.amountFontSize >= offer.measureFontSize * contract.acceptance.minimumPriceToMeasureFontRatio, `Oferta ${index + 1}: preço não domina a medida.`);
      assert(offer.promoSurfaces.length >= 2, `Oferta ${index + 1}: vocabulário de superfícies promocionais insuficiente.`);
    });
    assert(snapshot.publication.collisions <= contract.acceptance.maximumUnexpectedCollisions, "A remediação introduziu colisões.");
    assert(snapshot.publication.overflows <= contract.acceptance.maximumUnexpectedOverflows, "A remediação introduziu overflow.");
    assert(snapshot.publication.missingReferences <= contract.acceptance.maximumMissingReferences, "A remediação introduziu referência obrigatória ausente.");
  }

  const screen = await measure("screen");
  validate(screen);
  await page.emulateMedia({ media: "print" });
  const printed = await measure("print");
  validate(printed);
  await page.emulateMedia({ media: "screen" });

  const historySteps = contract.acceptance.minimumOfferUnits;
  const history = await page.evaluate(count => {
    const store = CatalogEditor.store;
    for (let index = 0; index < count; index += 1) store.undo();
    const afterUndo = JSON.parse(JSON.stringify(store.getState()));
    for (let index = 0; index < count; index += 1) store.redo();
    const afterRedo = JSON.parse(JSON.stringify(store.getState()));
    return { afterUndo, afterRedo };
  }, historySteps);
  const expected = comparableDocument(fixture.document);
  const redone = comparableDocument(history.afterRedo);
  assert(JSON.stringify(redone) === JSON.stringify(expected), "Undo/redo não restaurou as ofertas promocionais.");

  const report = {
    ...baselineReport,
    status: "accepted",
    screen,
    printed,
    history: { undoCount: historySteps, redoEquivalent: true },
    pageErrors,
    consoleErrors
  };
  fs.writeFileSync(
    path.join(outputDir, "promotional-remediation-browser-readiness.json"),
    `${JSON.stringify(report, null, 2)}\n`
  );
  await page.screenshot({ path: path.join(outputDir, "promotional-remediation-acceptance.png"), fullPage: true });
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);
  await browser.close();
  browser = null;
  console.log("✓ DB-05.20.10 validou a aceitação visual da remediação promocional.");
})().catch(async error => {
  fs.writeFileSync(path.join(outputDir, "promotional-remediation-browser-error.json"), `${JSON.stringify({ message: error.message, stack: error.stack }, null, 2)}\n`);
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
