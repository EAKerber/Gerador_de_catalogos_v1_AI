/* Auditoria 05.18 — estresse visual, interação repetida e round-trip de histórico. */
const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");

const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const seed = Number(process.env.CATALOG_STRESS_SEED || 5182026);
const outputDir = path.resolve(process.env.CATALOG_STRESS_OUTPUT_DIR || "/tmp/catalog-developer-b-stress", `browser-${seed}`);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  const requestFailures = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("requestfailed", request => requestFailures.push({ url: request.url(), failure: request.failure()?.errorText || "unknown" }));
  page.on("dialog", dialog => dialog.accept());

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor
    && window.CatalogComponentPaletteIntentContract
    && window.CatalogFactRecipeContract
    && window.CatalogCalloutRecipeContract);

  await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false, snapEnabled: true, smartSnapEnabled: true });
  });

  const pageRecipeButton = page.locator('[data-insert-template="page-catalog-base"]');
  assert(await pageRecipeButton.count() === 1, "A receita base não está acessível pela interface.");
  await pageRecipeButton.click();
  await page.waitForFunction(() => CatalogEditor.store.getPage().children.some(component => component.name === "Página de catálogo"));

  const fixture = await page.evaluate(() => {
    const store = CatalogEditor.store;
    const clone = value => JSON.parse(JSON.stringify(value));
    const visit = (children, callback, parent = null) => (children || []).forEach(component => {
      callback(component, parent);
      visit(component.children, callback, component);
    });
    const findIn = (root, predicate) => {
      let result = null;
      visit(root?.children, component => { if (!result && predicate(component)) result = component; });
      return result;
    };
    const scaffold = store.getPage().children.find(component => component.name === "Página de catálogo");
    const content = findIn(scaffold, component => component.props?.recipeRole === "primary-content");
    const footer = findIn(scaffold, component => component.type === "catalog-footer");
    if (!content || !footer) throw new Error("A receita base não materializou conteúdo e rodapé.");

    const products = store.createProductsBulk(Array.from({ length: 12 }, (_, index) => ({
      title: `${"PRODUTO DE TESTE EXTREMAMENTE LONGO ".repeat(index % 3 + 1)}${index + 1}`,
      code: `ST-${String(index + 1).padStart(4, "0")}`,
      package: `CAIXA COM DESCRIÇÃO ${index + 1}`,
      price: `R$ ${(index + 1) * 111},99`,
      specOne: `${"ESPECIFICAÇÃO A ".repeat(4)}${index}`,
      specTwo: `${"ESPECIFICAÇÃO B ".repeat(4)}${index}`
    })));
    const created = store.createCardsForProducts(products.map(product => product.id), { parentId: content.id, columns: 4, density: "compact" });
    const cards = created.cards;
    if (cards.length !== 12) throw new Error(`A carga esperava 12 cards; recebeu ${cards.length}.`);

    const primaryCard = cards[0];
    const table = findIn(primaryCard, component => component.type === "data-table");
    const art = findIn(primaryCard, component => component.type === "art");
    if (!table || !art) throw new Error("O card principal não possui tabela ou arte.");
    store.setComponentPresentation(primaryCard.id, { mode: "variants", density: "compact", responsiveState: "compact" });
    const gallery = store.addArtVariation(art.id);
    store.applyGalleryItemsBulk(gallery.id, Array.from({ length: 30 }, (_, index) => ({ caption: `${"VARIAÇÃO COM LEGENDA LONGA ".repeat(2)}${index + 1}` })), { mode: "replace" });
    store.replaceTableRowsBulk(table.id, Array.from({ length: 20 }, (_, index) => ({
      code: `VAR-${String(index + 1).padStart(3, "0")}`,
      package: `PACOTE ${index + 1}`,
      price: `R$ ${(index + 1) * 17},00`
    })), { mode: "replace" });

    cards.slice(1, 5).forEach((card, index) => store.setComponentPresentation(card.id, {
      mode: ["hero", "technical", "data-only", "standard"][index],
      density: ["comfortable", "compact", "compact", "standard"][index],
      responsiveState: index % 2 ? "compact" : "wide"
    }));

    store.updateComponent(footer.id, { frame: { height: 80 } });
    const footerItems = footer.children.filter(component => component.type === "footer-item");
    footerItems.forEach((item, index) => {
      const subtitle = item.children.find(component => component.slot?.name === "subtitle");
      const title = item.children.find(component => component.slot?.name === "title");
      if (title) store.updateComponent(title.id, { props: { content: `${"TÍTULO MUITO LONGO ".repeat(3)}${index}` } });
      if (subtitle) store.updateComponent(subtitle.id, { props: { content: `${"SUBTÍTULO QUE TENTA VAZAR ".repeat(5)}${index}`, overflow: index % 2 ? "ellipsis" : "wrap" } });
    });
    store.reflowComponentTree(footer.id);

    const fact = store.insertComponentFromTemplate("fact", { parentId: content.id });
    const callout = store.insertComponentFromTemplate("section-tip-callout", { parentId: content.id });
    const nested = store.addComponent("layout-container", { x: 0, y: 0, width: 300, height: 260 }, {
      parentId: content.id,
      props: { label: "NESTED STRESS" },
      layout: { mode: "grid", columns: 6, padding: 0, gap: 0, align: "stretch", distribution: "fill", responsive: { enabled: true, breakpoint: 220, mode: "column" } }
    });
    const nestedIds = [];
    for (let index = 0; index < 24; index += 1) {
      const type = index % 3 === 0 ? "icon" : "text";
      const item = store.addComponent(type, { x: 0, y: 0, width: 80, height: 34 }, {
        parentId: nested.id,
        props: type === "text"
          ? { content: `${"TEXTO SEM ESPAÇO ".repeat(6)}${index}`, scale: [80, 100, 120][index % 3], overflow: ["wrap", "ellipsis", "clip"][index % 3] }
          : { icon: ["torque", "diameter", "email", "warranty"][index % 4], iconScale: [80, 100, 120][index % 3], label: `Stress ${index}` }
      });
      nestedIds.push(item.id);
    }
    store.updateComponent(nested.id, { frame: { width: 160, height: 120 }, layout: { columns: 12, gap: 0, padding: 0 } });
    store.reflowComponentTree(nested.id);

    const allIds = [];
    visit(store.getPage().children, component => allIds.push(component.id));
    for (let index = 0; index < 80; index += 1) store.setSelection(allIds[index % allIds.length]);
    store.setSelection(primaryCard.id);

    let expectedPlacementFailure = null;
    try {
      store.insertComponent("product-card", { parentId: null });
    } catch (error) {
      expectedPlacementFailure = { code: error.code || null, message: error.message };
    }

    return {
      scaffoldId: scaffold.id,
      contentId: content.id,
      footerId: footer.id,
      footerItemIds: footerItems.map(component => component.id),
      cardIds: cards.map(component => component.id),
      primaryCardId: primaryCard.id,
      tableId: table.id,
      galleryId: gallery.id,
      factId: fact?.id || null,
      calloutId: callout?.id || null,
      nestedId: nested.id,
      nestedIds,
      expectedPlacementFailure,
      initialModelCount: allIds.length,
      limits: {
        tableRows: store.getTableRows(table.id).length,
        galleryItems: gallery.children.filter(component => component.type === "art").length
      }
    };
  });

  assert(fixture.expectedPlacementFailure?.code === "NO_AUTOMATIC_PLACEMENT", `A saturação da página deveria falhar de forma controlada: ${JSON.stringify(fixture.expectedPlacementFailure)}.`);
  assert(fixture.limits.tableRows === 12, `A interface aceitou ${fixture.limits.tableRows} linhas; o limite esperado é 12.`);
  assert(fixture.limits.galleryItems === 24, `A interface aceitou ${fixture.limits.galleryItems} artes; o limite esperado é 24.`);

  for (let index = 0; index < 8; index += 1) {
    await page.locator('[data-toggle-panel="left"]').click({ force: true });
    await page.locator('[data-toggle-panel="right"]').click({ force: true });
  }
  for (let index = 0; index < 6; index += 1) {
    for (const tab of ["products", "layers", "components"]) {
      await page.locator(`[data-left-panel-tab="${tab}"]`).click({ force: true });
    }
  }

  const search = page.locator("[data-palette-intent-search]");
  for (const term of ["tabela", "rodapé", "ícone", "produto", "zzzz-sem-resultado", ""]) {
    await search.fill(term);
    await page.waitForTimeout(10);
  }
  await search.press("Escape");

  await page.evaluate(() => { document.getElementById("visualizationMenu").open = true; });
  for (const value of ["0.55", "1", "fit", "0.7", "fit"]) await page.locator("#zoomSelect").selectOption(value);
  for (const selector of ["#gridToggle", "#snapToggle", "#smartSnapToggle", "#equalSpacingToggle", "#showGuidesToggle"]) {
    await page.locator(selector).click({ force: true });
    await page.locator(selector).click({ force: true });
  }

  const modelSignature = () => page.evaluate(() => {
    const snapshot = JSON.parse(JSON.stringify(CatalogEditor.store.getState()));
    delete snapshot.editor;
    delete snapshot.updatedAt;
    return JSON.stringify(snapshot);
  });

  const beforeButtonHistory = await modelSignature();
  const addedByHistory = await page.evaluate(contentId => {
    const ids = [];
    for (let index = 0; index < 8; index += 1) {
      ids.push(CatalogEditor.store.addComponent("text", { x: 0, y: 0, width: 100, height: 34 }, {
        parentId: contentId,
        props: { content: `UNDO BUTTON ${index}`, overflow: "ellipsis" }
      }).id);
    }
    return ids;
  }, fixture.contentId);
  const afterButtonHistory = await modelSignature();
  for (let index = 0; index < addedByHistory.length; index += 1) await page.locator("#undoButton").click();
  assert(await modelSignature() === beforeButtonHistory, "Os botões de undo não restauraram o estado anterior às oito inserções.");
  for (let index = 0; index < addedByHistory.length; index += 1) await page.locator("#redoButton").click();
  assert(await modelSignature() === afterButtonHistory, "Os botões de redo não restauraram as oito inserções.");

  const keyboardTargets = fixture.nestedIds.filter((_, index) => index % 3 !== 0).slice(0, 4);
  const beforeKeyboardHistory = await modelSignature();
  await page.evaluate(ids => ids.forEach((id, index) => CatalogEditor.store.updateComponent(id, { props: { content: `ALTERAÇÃO POR ATALHO ${index}` } })), keyboardTargets);
  const afterKeyboardHistory = await modelSignature();
  await page.locator("#pageCanvas").focus();
  for (let index = 0; index < keyboardTargets.length; index += 1) await page.keyboard.press("Control+z");
  assert(await modelSignature() === beforeKeyboardHistory, "Ctrl+Z não restaurou as quatro edições independentes.");
  for (let index = 0; index < keyboardTargets.length; index += 1) await page.keyboard.press("Control+Shift+z");
  assert(await modelSignature() === afterKeyboardHistory, "Ctrl+Shift+Z não restaurou as quatro edições independentes.");

  async function collectMetrics(label) {
    return page.evaluate(labelValue => {
      const visit = (children, callback) => (children || []).forEach(component => {
        callback(component);
        visit(component.children, callback);
      });
      const model = [];
      visit(CatalogEditor.store.getPage().children, component => model.push(component));
      const modelIds = model.map(component => component.id);
      const dom = Array.from(document.querySelectorAll(".editor-component[data-component-id]"));
      const domIds = dom.map(element => element.dataset.componentId);
      const nonFiniteFrames = model.filter(component => ["x", "y", "width", "height"].some(key => !Number.isFinite(Number(component.frame?.[key])) || (key === "width" || key === "height") && Number(component.frame?.[key]) <= 0)).map(component => component.id);
      const invalidStyles = dom.filter(element => /NaN|Infinity|undefinedpx/.test(element.getAttribute("style") || "")).map(element => element.dataset.componentId);
      const missingDOM = modelIds.filter(id => !domIds.includes(id));
      const duplicateDOM = domIds.filter((id, index) => domIds.indexOf(id) !== index);
      const parentLeaks = [];
      dom.forEach(element => {
        const parentId = element.dataset.parentId;
        if (!parentId) return;
        const parent = document.querySelector(`.editor-component[data-component-id="${parentId}"]`);
        if (!parent) return;
        const childRect = element.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        if (childRect.left < parentRect.left - 1 || childRect.top < parentRect.top - 1 || childRect.right > parentRect.right + 1 || childRect.bottom > parentRect.bottom + 1) {
          parentLeaks.push({ id: element.dataset.componentId, parentId, child: { left: childRect.left, top: childRect.top, right: childRect.right, bottom: childRect.bottom }, parent: { left: parentRect.left, top: parentRect.top, right: parentRect.right, bottom: parentRect.bottom } });
        }
      });
      const footerLeaks = [];
      document.querySelectorAll('.editor-component[data-component-type="footer-item"]').forEach(item => {
        const itemRect = item.getBoundingClientRect();
        item.querySelectorAll(':scope > .component-children-layer > .editor-component').forEach(child => {
          const rect = child.getBoundingClientRect();
          if (rect.left < itemRect.left - 1 || rect.top < itemRect.top - 1 || rect.right > itemRect.right + 1 || rect.bottom > itemRect.bottom + 1) footerLeaks.push({ itemId: item.dataset.componentId, childId: child.dataset.componentId });
        });
      });
      const selectedIds = CatalogEditor.store.getSelectedIds();
      const selectedMissing = selectedIds.filter(id => !CatalogEditor.store.findComponent(id));
      const shell = document.querySelector(".editor-shell")?.getBoundingClientRect();
      const workspace = document.querySelector(".workspace")?.getBoundingClientRect();
      const leftPanel = document.querySelector(".side-panel--left")?.getBoundingClientRect();
      const rightPanel = document.querySelector(".side-panel--right")?.getBoundingClientRect();
      const pageCanvas = document.getElementById("pageCanvas")?.getBoundingClientRect();
      return {
        label: labelValue,
        viewport: { width: innerWidth, height: innerHeight },
        modelCount: model.length,
        domCount: dom.length,
        uniqueModelIds: new Set(modelIds).size,
        uniqueDOMIds: new Set(domIds).size,
        nonFiniteFrames,
        invalidStyles,
        missingDOM,
        duplicateDOM,
        parentLeaks,
        footerLeaks,
        selectedMissing,
        documentOverflow: { horizontal: document.documentElement.scrollWidth - innerWidth, vertical: document.documentElement.scrollHeight - innerHeight },
        geometry: {
          shell: shell ? { width: shell.width, height: shell.height } : null,
          workspace: workspace ? { width: workspace.width, height: workspace.height } : null,
          leftPanel: leftPanel ? { width: leftPanel.width, height: leftPanel.height } : null,
          rightPanel: rightPanel ? { width: rightPanel.width, height: rightPanel.height } : null,
          pageCanvas: pageCanvas ? { width: pageCanvas.width, height: pageCanvas.height } : null
        },
        publication: CatalogEditor.store.getPublicationReport("draft").summary,
        history: CatalogEditor.store.getHistoryState(),
        schemaVersion: CatalogEditor.store.getState().schemaVersion
      };
    }, label);
  }

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });
  const supportedScreen = await collectMetrics("supported-screen");
  await page.screenshot({ path: path.join(outputDir, "supported-full.png"), fullPage: true });
  await page.locator("#pageCanvas").screenshot({ path: path.join(outputDir, "supported-canvas.png") });

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const supportedPrint = await collectMetrics("supported-print");
  await page.locator("#pageCanvas").screenshot({ path: path.join(outputDir, "supported-print.png") });

  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });
  await page.setViewportSize({ width: 1100, height: 650 });
  const undersizedScreen = await collectMetrics("undersized-screen");
  await page.screenshot({ path: path.join(outputDir, "undersized-full.png"), fullPage: true });

  const blockers = [];
  if (pageErrors.length) blockers.push({ kind: "page-errors", items: pageErrors });
  if (consoleErrors.length) blockers.push({ kind: "console-errors", items: consoleErrors });
  if (requestFailures.length) blockers.push({ kind: "request-failures", items: requestFailures });
  for (const metrics of [supportedScreen, supportedPrint, undersizedScreen]) {
    if (metrics.nonFiniteFrames.length) blockers.push({ kind: "non-finite-frame", label: metrics.label, items: metrics.nonFiniteFrames });
    if (metrics.invalidStyles.length) blockers.push({ kind: "invalid-style", label: metrics.label, items: metrics.invalidStyles });
    if (metrics.missingDOM.length || metrics.duplicateDOM.length) blockers.push({ kind: "model-dom-divergence", label: metrics.label, missing: metrics.missingDOM, duplicates: metrics.duplicateDOM });
    if (metrics.selectedMissing.length) blockers.push({ kind: "stale-selection", label: metrics.label, items: metrics.selectedMissing });
    if (metrics.schemaVersion !== "1.16.0") blockers.push({ kind: "schema-change", label: metrics.label, value: metrics.schemaVersion });
    if (!metrics.geometry.pageCanvas || metrics.geometry.pageCanvas.width <= 0 || metrics.geometry.pageCanvas.height <= 0) blockers.push({ kind: "missing-canvas", label: metrics.label });
  }
  if (supportedScreen.modelCount !== supportedScreen.domCount || supportedPrint.modelCount !== supportedPrint.domCount) blockers.push({ kind: "render-count", screen: supportedScreen, print: supportedPrint });
  if (supportedScreen.footerLeaks.length || supportedPrint.footerLeaks.length) blockers.push({ kind: "footer-containment", screen: supportedScreen.footerLeaks, print: supportedPrint.footerLeaks });
  if (supportedScreen.documentOverflow.horizontal > 2) blockers.push({ kind: "supported-viewport-horizontal-overflow", value: supportedScreen.documentOverflow.horizontal });

  const expectedFindings = {
    automaticPlacement: fixture.expectedPlacementFailure,
    publicationGeometry: {
      supportedScreen: supportedScreen.publication,
      supportedPrint: supportedPrint.publication,
      undersizedScreen: undersizedScreen.publication
    },
    containedButCrowded: {
      parentLeaksScreen: supportedScreen.parentLeaks,
      parentLeaksPrint: supportedPrint.parentLeaks,
      parentLeaksUndersized: undersizedScreen.parentLeaks
    },
    unsupportedViewportPressure: {
      viewport: undersizedScreen.viewport,
      documentOverflow: undersizedScreen.documentOverflow,
      geometry: undersizedScreen.geometry
    }
  };

  const report = {
    suite: "Developer B 05.18 — browser/interface stress",
    seed,
    generatedAt: new Date().toISOString(),
    baseURL,
    fixture,
    historyRoundTrips: {
      button: { operations: addedByHistory.length, restoredBefore: true, restoredAfter: true },
      keyboard: { operations: keyboardTargets.length, restoredBefore: true, restoredAfter: true }
    },
    supportedScreen,
    supportedPrint,
    undersizedScreen,
    expectedFindings,
    blockers,
    pageErrors,
    consoleErrors,
    requestFailures,
    screenshots: ["supported-full.png", "supported-canvas.png", "supported-print.png", "undersized-full.png"],
    status: blockers.length ? "blocked" : "pass-with-findings"
  };
  fs.writeFileSync(path.join(outputDir, "stress-interface-report.json"), `${JSON.stringify(report, null, 2)}\n`);

  assert(blockers.length === 0, `Estresse visual encontrou bloqueadores: ${JSON.stringify(blockers)}.`);
  await browser.close();
  console.log(`✓ Estresse visual concluído com ${supportedScreen.modelCount} componentes e achados geométricos registrados. Evidências: ${outputDir}`);
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
