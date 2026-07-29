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
    const area = CatalogEditor.store.addComponent("layout-container", { x: 24, y: 100, width: 720, height: 380 });
    const card = CatalogEditor.store.addComponent("product-card", { x: 0, y: 0, width: 320, height: 300 }, { parentId: area.id });
    CatalogEditor.store.setEditingContext(area.id);
    CatalogEditor.store.setSelection(card.id);
    return { areaId: area.id, cardId: card.id };
  });

  await page.locator('[data-insert-component="specification"]').click();
  const clickResult = await page.evaluate(() => {
    const selected = CatalogEditor.store.getSelected();
    return { type: selected.type, parentId: CatalogEditor.store.getParentId(selected.id), contextId: CatalogEditor.store.getState().editor.editingContextId };
  });
  assert(clickResult.type === "specification" && clickResult.parentId === ids.cardId && clickResult.contextId === ids.cardId, "O + não inseriu e abriu o card selecionado.");

  await page.evaluate(({ areaId, cardId }) => { CatalogEditor.store.setEditingContext(areaId); CatalogEditor.store.setSelection(cardId); }, ids);
  await page.locator('[data-insert-component="specification"]').click({ modifiers: ["Shift"] });
  const shiftResult = await page.evaluate(() => {
    const selected = CatalogEditor.store.getSelected();
    return { parentId: CatalogEditor.store.getParentId(selected.id), contextId: CatalogEditor.store.getState().editor.editingContextId };
  });
  assert(shiftResult.parentId === ids.areaId && shiftResult.contextId === ids.areaId, "Shift não preservou a inserção sobre o contexto atual.");

  await page.evaluate(areaId => CatalogEditor.store.setEditingContext(areaId), ids.areaId);
  await page.locator('#componentPalette [data-component-type="specification"]').dragTo(page.locator(`[data-component-id="${ids.cardId}"]`));
  const dragResult = await page.evaluate(() => {
    const selected = CatalogEditor.store.getSelected();
    return { type: selected.type, parentId: CatalogEditor.store.getParentId(selected.id), contextId: CatalogEditor.store.getState().editor.editingContextId };
  });
  assert(dragResult.type === "specification" && dragResult.parentId === ids.cardId && dragResult.contextId === ids.cardId, "O arraste não usou o card sob o ponteiro como destino.");
  await browser.close();
  console.log("✓ Inserção contextual e override por Shift validados no Chromium.");
})().catch(error => { console.error(error); process.exitCode = 1; });
