/* Interface real 05.21 — breadcrumb profundo, navegável e sem quebra. */
"use strict";

const { chromium } = require("playwright");
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const assert = require("assert");

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(baseURL, { waitUntil: "networkidle" });

  const ids = await page.evaluate(() => {
    const store = CatalogEditor.store;
    const first = store.addComponent("layout-container", { x: 24, y: 24, width: 700, height: 900 }, { name: "Área principal extensa" });
    const second = store.addComponent("layout-container", { x: 12, y: 12, width: 650, height: 820 }, { parentId: first.id, name: "Grupo intermediário extenso" });
    const third = store.addComponent("layout-container", { x: 12, y: 12, width: 600, height: 740 }, { parentId: second.id, name: "Seção imediatamente relevante" });
    const fourth = store.addComponent("layout-container", { x: 12, y: 12, width: 550, height: 660 }, { parentId: third.id, name: "Contexto atual extremamente longo para teste" });
    store.setEditingContext(fourth.id);
    return { first: first.id, second: second.id, third: third.id, fourth: fourth.id };
  });

  const breadcrumb = page.locator("#contextBreadcrumb");
  const rect = await breadcrumb.boundingBox();
  const viewport = page.viewportSize();
  assert(rect && rect.x >= 0 && rect.x + rect.width <= viewport.width, "O breadcrumb ultrapassou o viewport.");
  assert(await breadcrumb.locator(".context-breadcrumb__overflow").count() === 1, "A hierarquia profunda não condensou os ancestrais.");
  assert(await breadcrumb.locator('[data-context-id=""]').count() === 1, "A página raiz deixou de estar disponível.");
  assert(await breadcrumb.locator(`[data-context-id="${ids.third}"]`).count() === 1, "O pai imediato não permaneceu visível.");
  assert(await breadcrumb.locator(`[data-context-id="${ids.fourth}"][data-current="true"]`).count() === 1, "O contexto atual não permaneceu visível.");

  await breadcrumb.locator(".context-breadcrumb__overflow > summary").click();
  assert(await breadcrumb.locator(`.context-breadcrumb__menu [data-context-id="${ids.first}"]`).count() === 1, "O primeiro ancestral não apareceu no menu.");
  assert(await breadcrumb.locator(`.context-breadcrumb__menu [data-context-id="${ids.second}"]`).count() === 1, "O segundo ancestral não apareceu no menu.");
  await breadcrumb.locator(`.context-breadcrumb__menu [data-context-id="${ids.second}"]`).click();

  const state = await page.evaluate(() => ({
    contextId: CatalogEditor.store.getState().editor.editingContextId,
    selectedIds: CatalogEditor.store.getState().editor.selectedComponentIds
  }));
  assert(state.contextId === ids.second && state.selectedIds[0] === ids.second, "A navegação condensada não reutilizou a transição canônica.");

  await browser.close();
  console.log("✓ Breadcrumb profundo 05.21 permanece contido e navega pelos ancestrais condensados.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
