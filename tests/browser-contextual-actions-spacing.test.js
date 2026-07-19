/* Interface real 05.10 — + contextual, espaçamento, separadores e nova hierarquia do inspetor. */
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const visualizationMenu = page.locator("#visualizationMenu");
  if (!await visualizationMenu.evaluate(element => element.open)) {
    await page.locator("#visualizationMenu > summary").click();
  }

  const chrome = await page.evaluate(() => {
    const toolbarIds = ["gridToggle", "snapToggle", "smartSnapToggle", "equalSpacingToggle", "showGuidesToggle", "snapToleranceSelect", "zoomSelect"];
    const toolbar = toolbarIds.map(id => {
      const control = document.getElementById(id);
      const element = control?.closest("label") || control;
      const rect = element?.getBoundingClientRect();
      return { id, visible: Boolean(rect && rect.width && rect.right <= innerWidth && rect.left >= 0), left: rect?.left, right: rect?.right };
    });
    const tabs = [...document.querySelectorAll("[data-left-panel-tab]")].map(element => ({
      label: element.textContent.trim(),
      clipped: element.scrollWidth > element.clientWidth,
      left: element.getBoundingClientRect().left,
      right: element.getBoundingClientRect().right
    }));
    return { toolbar, tabs };
  });
  assert(chrome.toolbar.every(item => item.visible), `Controles da toolbar ficaram ocultos: ${JSON.stringify(chrome.toolbar)}`);
  assert(chrome.toolbar.every((item, index, all) => !index || item.left >= all[index - 1].right), `Controles da toolbar se sobrepõem: ${JSON.stringify(chrome.toolbar)}`);
  assert(chrome.tabs.every(item => !item.clipped), `Abas do painel esquerdo truncadas: ${JSON.stringify(chrome.tabs)}`);

  await page.evaluate(() => {
    const table = CatalogEditor.store.addComponent("data-table", { x: 24, y: 24, width: 320, height: 80 });
    CatalogEditor.store.setSelection(table.id);
  });
  await page.locator('[data-context-action="add-table-row"]').click();
  assert(await page.evaluate(() => CatalogEditor.store.getTableRows(CatalogEditor.store.getSelected()).length) === 2, "O + contextual não adicionou a linha da tabela.");

  await page.evaluate(() => {
    CatalogEditor.store.reset();
    const art = CatalogEditor.store.addComponent("art", { x: 40, y: 40, width: 260, height: 150 }, { props: { caption: "Original" } });
    CatalogEditor.store.setSelection(art.id);
  });
  await page.locator('[data-context-action="convert-art-gallery"]').click();
  const gallery = await page.evaluate(() => {
    const root = CatalogEditor.store.getPage().children[0];
    return { type: root.type, children: root.children.length, context: CatalogEditor.store.getState().editor.editingContextId, id: root.id };
  });
  assert(gallery.type === "art-gallery" && gallery.children === 2 && gallery.context === gallery.id, "A variação de imagem não criou e abriu a galeria.");
  const tabs = await page.locator(".inspector-tabs button").allTextContents();
  assert(tabs.some(label => label.includes("Conteúdo")) && tabs.some(label => label.includes("Layout")) && tabs.some(label => label.includes("Visual")), "O novo vocabulário das abas não apareceu.");

  await page.evaluate(() => {
    CatalogEditor.store.reset();
    const items = [
      CatalogEditor.store.addComponent("text", { x: 24, y: 100, width: 80, height: 40 }),
      CatalogEditor.store.addComponent("text", { x: 150, y: 100, width: 90, height: 40 }),
      CatalogEditor.store.addComponent("text", { x: 310, y: 100, width: 100, height: 40 })
    ];
    CatalogEditor.store.setSelection(items[0].id);
    CatalogEditor.store.setSelection(items[1].id, { toggle: true });
    CatalogEditor.store.setSelection(items[2].id, { toggle: true });
  });
  await page.locator('[data-batch-gap-preset]').selectOption('20');
  await page.locator('.inspector-switch:has([data-batch-separators])').click();
  await page.locator('[data-batch-separator-preset]').selectOption('solid-dot');
  await page.locator('[data-batch-spacing-apply]').click();
  const spacing = await page.evaluate(() => {
    const children = CatalogEditor.store.getPage().children;
    const texts = children.filter(item => item.type === "text").sort((a, b) => a.frame.x - b.frame.x);
    return {
      gaps: texts.slice(1).map((item, index) => item.frame.x - (texts[index].frame.x + texts[index].frame.width)),
      separators: children.filter(item => item.type === "separator").map(item => ({ marker: item.props.marker, orientation: item.props.orientation })),
      history: CatalogEditor.store.getHistoryState()
    };
  });
  assert(spacing.gaps.every(value => value === 20) && spacing.separators.length === 2, "Gap ou separadores não foram aplicados pela interface.");
  assert(spacing.separators.every(item => item.marker === "solid" && item.orientation === "vertical") && spacing.history.undoLabel === "Ajustar espaçamento", "Preset ou histórico do lote divergiu.");

  await page.locator('[data-batch-delete]').first().focus();
  assert(errors.length === 0, `Erros no navegador: ${errors.join(" | ")}`);
  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });
  await browser.close();
  console.log("✓ + contextual, galeria, gap, separadores e vocabulário do inspetor 05.10 validados em 1366×768.");
})().catch(error => { console.error(error); process.exitCode = 1; });
