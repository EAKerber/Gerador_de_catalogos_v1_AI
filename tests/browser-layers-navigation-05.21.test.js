/* Interface real 05.21 — árvore recolhível, estados inequívocos e revelação da seleção. */
"use strict";

const { chromium } = require("playwright");
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = require("assert");

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto("http://127.0.0.1:8080", { waitUntil: "networkidle" });
  await page.locator('[data-left-panel-tab="layers"]').click();

  const ids = await page.evaluate(() => {
    const store = CatalogEditor.store;
    const root = store.addComponent("layout-container", { x: 24, y: 24, width: 700, height: 900 }, { name: "Raiz da árvore" });
    const branch = store.addComponent("layout-container", { x: 12, y: 12, width: 650, height: 820 }, { parentId: root.id, name: "Ramo intermediário" });
    const leaf = store.addComponent("text", { x: 12, y: 12, width: 220, height: 48 }, { parentId: branch.id, name: "Folha selecionável" });
    return { root: root.id, branch: branch.id, leaf: leaf.id };
  });

  const rootToggle = page.locator(`[data-toggle-layer="${ids.root}"]`);
  await rootToggle.click();
  assert(await rootToggle.getAttribute("aria-expanded") === "false", "A raiz não foi recolhida.");
  assert(await page.locator(`[data-layer-id="${ids.leaf}"]`).count() === 0, "O descendente permaneceu renderizado sob a raiz recolhida.");

  await page.evaluate(leafId => CatalogEditor.store.selectComponentInContext(leafId), ids.leaf);
  const leaf = page.locator(`[data-layer-id="${ids.leaf}"]`);
  assert(await leaf.count() === 1, "Selecionar fora da árvore visível não reabriu os ancestrais necessários.");
  assert(await leaf.getAttribute("data-primary-selection") === "true", "A seleção primária não recebeu estado próprio.");
  assert(await page.locator(`[data-layer-id="${ids.branch}"]`).getAttribute("data-selection-ancestor") === "true", "O ancestral da seleção não foi identificado.");
  assert(await page.locator(`[data-layer-id="${ids.branch}"]`).getAttribute("data-active-context") === "true", "O contexto ativo divergiu da árvore.");

  await page.locator(`[data-toggle-layer="${ids.branch}"]`).click();
  assert(await page.locator(`[data-layer-id="${ids.leaf}"]`).count() === 0, "Recolher um ramo alterou incorretamente sua projeção.");
  const state = await page.evaluate(() => ({
    selected: CatalogEditor.store.getState().editor.selectedComponentId,
    context: CatalogEditor.store.getState().editor.editingContextId
  }));
  assert(state.selected === ids.leaf && state.context === ids.branch, "Recolher a árvore alterou seleção ou contexto.");

  await page.locator(`[data-toggle-layer="${ids.branch}"]`).click();
  const siblingIds = await page.evaluate(branchId => {
    const store = CatalogEditor.store;
    store.setEditingContext(branchId);
    const second = store.addComponent("text", { x: 12, y: 72, width: 220, height: 48 }, { parentId: branchId, name: "Segunda folha" });
    const third = store.addComponent("text", { x: 12, y: 132, width: 220, height: 48 }, { parentId: branchId, name: "Terceira folha" });
    return [store.findComponent(branchId).component.children[0].id, second.id, third.id];
  }, ids.branch);
  const historyBefore = await page.evaluate(() => CatalogEditor.store.getHistoryState().undoCount);
  const moveUp = page.locator(`[data-reorder-layer="${siblingIds[1]}"][data-reorder-direction="-1"]`);
  await moveUp.focus();
  await page.keyboard.press("Enter");
  const reordered = await page.evaluate(branchId => ({
    order: CatalogEditor.store.findComponent(branchId).component.children.map(component => component.id),
    undoCount: CatalogEditor.store.getHistoryState().undoCount
  }), ids.branch);
  assert.deepStrictEqual(reordered.order, [siblingIds[1], siblingIds[0], siblingIds[2]], "O controle de Camadas não alterou a ordem serializada.");
  assert(reordered.undoCount === historyBefore + 1, "A reordenação não criou exatamente uma ação no histórico.");
  assert(await page.locator(`[data-reorder-layer="${siblingIds[1]}"][data-reorder-direction="-1"]`).isDisabled(), "O novo primeiro irmão ainda pode subir.");
  await page.evaluate(() => CatalogEditor.store.undo());
  const restored = await page.evaluate(branchId => CatalogEditor.store.findComponent(branchId).component.children.map(component => component.id), ids.branch);
  assert.deepStrictEqual(restored, siblingIds, "Undo não restaurou a ordem anterior.");

  await browser.close();
  console.log("✓ Camadas recolhe, revela, seleciona e reordena irmãos com teclado e undo.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
