/* DB-05.20.2 — diagnóstico e regressão de seleção interna. */
const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = process.env.CATALOG_HIT_TEST_OUTPUT_DIR || path.join("audit-output", "db-05.20.2", "hit-testing");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;
let page;
const report = {
  suite: "DB-05.20.2 — hit testing interno",
  startedAt: new Date().toISOString(),
  scenarios: [],
  intentionalArtTriggers: [],
  alternations: { requested: 100, completed: 0 },
  failures: []
};

fs.mkdirSync(outputDir, { recursive: true });
const selector = id => `[data-component-id="${id}"]`;

async function closeAssetDialog() {
  const dialog = page.locator("#assetLibraryDialog");
  if (await dialog.getAttribute("open") !== null) {
    await dialog.locator("[data-close-asset-library]").first().click();
    await dialog.waitFor({ state: "hidden" });
  }
}

async function activateCard(cardId) {
  await closeAssetDialog();
  await page.evaluate(id => CatalogEditor.store.setEditingContext(id), cardId);
  await page.waitForFunction(id => CatalogEditor.store.getState().editor.editingContextId === id, cardId);
}

async function selectThroughLayers(componentId) {
  const layersTab = page.locator('[data-left-panel-tab="layers"]');
  if (await layersTab.getAttribute("aria-selected") !== "true") await layersTab.click();
  const layerItem = page.locator(`[data-layer-id="${componentId}"]`).first();
  await layerItem.waitFor({ state: "visible" });
  await layerItem.click();
  await page.waitForFunction(id => CatalogEditor.store.getSelected()?.id === id, componentId);
  const componentsTab = page.locator('[data-left-panel-tab="components"]');
  if (await componentsTab.getAttribute("aria-selected") !== "true") await componentsTab.click();
  const dialogOpen = await page.locator("#assetLibraryDialog").getAttribute("open") !== null;
  return { selectedId: await page.evaluate(() => CatalogEditor.store.getSelected()?.id || null), dialogOpen };
}

async function inspectPoint(targetId) {
  return page.evaluate(componentId => {
    const root = document.querySelector(`[data-component-id="${CSS.escape(componentId)}"]`);
    const content = root?.querySelector(":scope > .editor-component__content");
    const box = (content || root)?.getBoundingClientRect();
    if (!box) return null;
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const stack = document.elementsFromPoint(x, y).slice(0, 12).map(element => ({
      tag: element.tagName.toLowerCase(),
      className: typeof element.className === "string" ? element.className : "",
      componentId: element.closest?.("[data-component-id]")?.dataset?.componentId || null,
      componentType: element.closest?.("[data-component-id]")?.dataset?.componentType || null,
      opensAsset: Boolean(element.closest?.("[data-open-asset-library]")),
      zIndex: getComputedStyle(element).zIndex,
      pointerEvents: getComputedStyle(element).pointerEvents
    }));
    return { x, y, stack };
  }, targetId);
}

async function componentGeometry(ids) {
  return page.evaluate(componentIds => Object.fromEntries(componentIds.map(id => {
    const root = document.querySelector(`[data-component-id="${CSS.escape(id)}"]`);
    const rect = root?.getBoundingClientRect();
    return [id, rect ? {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      zIndex: getComputedStyle(root).zIndex,
      selected: root.dataset.selected
    } : null];
  })), ids);
}

async function clickTarget({ mode, targetKind, cardId, artId, targetId, record = true }) {
  await activateCard(cardId);
  const artSelection = await selectThroughLayers(artId);
  if (artSelection.dialogOpen || artSelection.selectedId !== artId) {
    report.failures.push({ mode, targetKind: "art-layer-selection", artId, ...artSelection });
  }

  const beforePoint = await inspectPoint(targetId);
  const geometry = record ? await componentGeometry([cardId, artId, targetId]) : null;
  await page.mouse.click(beforePoint.x, beforePoint.y);
  await page.waitForTimeout(20);
  const outcome = await page.evaluate(() => ({
    selectedId: CatalogEditor.store.getSelected()?.id || null,
    dialogOpen: document.getElementById("assetLibraryDialog")?.hasAttribute("open") === true
  }));
  if (record) report.scenarios.push({ mode, targetKind, cardId, artId, targetId, beforePoint, geometry, outcome });
  if (outcome.dialogOpen || outcome.selectedId !== targetId) {
    report.failures.push({
      mode,
      targetKind,
      targetId,
      selectedId: outcome.selectedId,
      dialogOpen: outcome.dialogOpen,
      intercepting: beforePoint?.stack?.[0] || null
    });
  }
  await closeAssetDialog();
  return outcome;
}

async function assertIntentionalArtTrigger(item) {
  await activateCard(item.cardId);
  const selected = await selectThroughLayers(item.artId);
  const trigger = page.locator(`${selector(item.artId)} [data-open-asset-library]`).first();
  await trigger.click();
  await page.waitForTimeout(20);
  const outcome = await page.evaluate(() => ({
    selectedId: CatalogEditor.store.getSelected()?.id || null,
    dialogOpen: document.getElementById("assetLibraryDialog")?.hasAttribute("open") === true
  }));
  report.intentionalArtTriggers.push({ mode: item.mode, artId: item.artId, selected, outcome });
  if (!outcome.dialogOpen || outcome.selectedId !== item.artId) {
    report.failures.push({ mode: item.mode, targetKind: "intentional-art-trigger", artId: item.artId, outcome });
  }
  await closeAssetDialog();
}

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor && window.CATALOG_COMPONENT_REGISTRY?.["product-card"]);

  const fixture = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false, snapEnabled: false, smartSnapEnabled: false });
    const modes = ["variants", "technical", "hero", "data-only"];
    return modes.map((mode, index) => {
      const card = store.addComponent("product-card", { x: 24 + (index % 2) * 390, y: 24 + Math.floor(index / 2) * 360, width: 360, height: 330 });
      store.setComponentPresentation(card.id, {
        mode,
        density: mode === "hero" ? "comfortable" : "compact",
        responsiveState: "wide"
      });
      const current = store.findComponent(card.id).component;
      const art = current.children.find(child => child.slot?.name === "art" && child.type === "art");
      const specifications = current.children.filter(child => child.slot?.name === "specifications" && child.type === "specification");
      const icon = store.addComponent("icon", { x: 0, y: 0, width: 48, height: 36 }, { parentId: card.id, slotName: "specifications" });
      store.reflowComponentTree(card.id);
      const refreshed = store.findComponent(card.id).component;
      return {
        mode,
        cardId: card.id,
        artId: refreshed.children.find(child => child.id === art.id).id,
        specificationId: refreshed.children.find(child => child.id === specifications[0].id).id,
        iconId: refreshed.children.find(child => child.id === icon.id).id
      };
    });
  });

  for (const item of fixture) {
    await clickTarget({ ...item, targetKind: "specification", targetId: item.specificationId });
    await clickTarget({ ...item, targetKind: "icon", targetId: item.iconId });
    await assertIntentionalArtTrigger(item);
  }

  const kinds = ["art", "specification", "icon"];
  for (let index = 0; index < report.alternations.requested; index += 1) {
    const item = fixture[index % fixture.length];
    const kind = kinds[index % kinds.length];
    if (kind === "art") {
      await activateCard(item.cardId);
      const outcome = await selectThroughLayers(item.artId);
      if (outcome.dialogOpen || outcome.selectedId !== item.artId) {
        report.failures.push({ mode: item.mode, targetKind: "art-alternation", artId: item.artId, ...outcome, iteration: index + 1 });
      }
    } else {
      const targetId = kind === "specification" ? item.specificationId : item.iconId;
      await clickTarget({ ...item, targetKind: `${kind}-alternation`, targetId, record: false });
    }
    report.alternations.completed += 1;
  }

  report.pageErrors = pageErrors;
  report.consoleErrors = consoleErrors;
  report.finishedAt = new Date().toISOString();
  report.status = report.failures.length || pageErrors.length || consoleErrors.length ? "fail" : "pass";
  fs.writeFileSync(path.join(outputDir, "hit-testing-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await page.screenshot({ path: path.join(outputDir, "hit-testing-canvas.png"), fullPage: true });

  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);
  assert(report.alternations.completed === 100, "A matriz de cem alternâncias não foi concluída.");
  assert(report.failures.length === 0, `Intercepções encontradas: ${JSON.stringify(report.failures)}`);

  await browser.close();
  browser = null;
  console.log("✓ DB-05.20.2 separou seleção de arte, seleção interna e abertura intencional da biblioteca em cem alternâncias.");
})().catch(async error => {
  report.status = "error";
  report.finishedAt = new Date().toISOString();
  report.fatalError = { message: error.message, stack: error.stack };
  fs.writeFileSync(path.join(outputDir, "hit-testing-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
