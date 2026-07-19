const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  const ids = await page.evaluate(() => {
    const area = CatalogEditor.store.addComponent("layout-container", { x: 24, y: 80, width: 500, height: 260 });
    const text = CatalogEditor.store.addComponent("text", { x: 0, y: 0 }, { parentId: area.id });
    const sibling = CatalogEditor.store.addComponent("text", { x: 180, y: 0 }, { parentId: area.id });
    CatalogEditor.store.setEditingContext(area.id);
    return { areaId: area.id, textId: text.id, siblingId: sibling.id };
  });
  await page.locator('[data-left-panel-tab="layers"]').click();
  await page.locator(`[data-layer-id="${ids.areaId}"]`).click();
  const selection = await page.evaluate(() => ({ selected: CatalogEditor.store.getState().editor.selectedComponentId, context: CatalogEditor.store.getState().editor.editingContextId }));
  assert(selection.selected === ids.areaId && selection.context === null, "A camada do pai não foi selecionada com transição de contexto.");

  await page.locator(`[data-layer-id="${ids.textId}"]`).click();
  const childSelection = await page.evaluate(() => ({ selected: CatalogEditor.store.getState().editor.selectedComponentId, context: CatalogEditor.store.getState().editor.editingContextId }));
  assert(childSelection.selected === ids.textId && childSelection.context === ids.areaId, "Selecionar o descendente não entrou no contexto na mesma ação.");
  await page.locator(`[data-layer-id="${ids.siblingId}"]`).click();
  const siblingSelection = await page.evaluate(() => ({ selected: CatalogEditor.store.getState().editor.selectedComponentId, context: CatalogEditor.store.getState().editor.editingContextId }));
  assert(siblingSelection.selected === ids.siblingId && siblingSelection.context === ids.areaId, "Alternar entre irmãos exigiu correção de contexto.");
  await page.locator(`[data-layer-id="${ids.textId}"]`).click();
  await page.locator('[data-inspector-tab="structure"]').click();
  await page.locator('.inspector-switch:has([data-layout-item-managed])').click();
  const independent = await page.evaluate(textId => CatalogEditor.store.findComponent(textId).component.layoutItem.managed, ids.textId);
  assert(independent === false, "O toggle não criou posição independente.");
  assert(await page.locator('[data-reintegrate-layout]').isVisible(), "A ação única de reintegração não apareceu.");
  await page.locator('[data-reintegrate-layout]').click();
  const managed = await page.evaluate(textId => CatalogEditor.store.findComponent(textId).component.layoutItem.managed, ids.textId);
  assert(managed === true, "A reintegração não devolveu autoridade ao layout.");
  await browser.close();
  console.log("✓ Seleção entre contextos e autoridade local validadas no Chromium.");
})().catch(error => { console.error(error); process.exitCode = 1; });
