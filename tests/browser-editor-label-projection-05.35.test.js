"use strict";

const assert = require("assert");
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(baseURL, { waitUntil: "networkidle" });

  const ids = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "custom", gridVisible: false });
    const footer = store.addComponent("catalog-footer", { x: 24, y: 860, width: 746, height: 100 });
    const item = footer.children[0];
    const icon = item.children.find(child => child.slot?.name === "icon");
    const title = item.children.find(child => child.slot?.name === "title");
    store.setSelection(footer.id);
    return { footer: footer.id, item: item.id, icon: icon.id, title: title.id };
  });

  const visibleLabels = () => page.locator(".editor-component__label:visible");
  assert.strictEqual(await visibleLabels().count(), 1, "Selecionar o rodapé revelou rótulos descendentes recursivamente.");
  assert.strictEqual(
    await page.locator(`[data-component-id="${ids.footer}"] > .editor-component__label`).isVisible(),
    true,
    "O rótulo da seleção primária desapareceu."
  );

  await page.evaluate(footerId => CatalogEditor.store.setEditingContext(footerId), ids.footer);
  assert.strictEqual(
    await page.locator(`[data-component-id="${ids.item}"]`).getAttribute("data-direct-editable"),
    "true",
    "Entrar no rodapé não tornou o filho diretamente editável."
  );
  await page.locator(`[data-component-id="${ids.item}"]`).hover();
  assert.strictEqual(await visibleLabels().count(), 2, "Hover não revelou exatamente o filho em foco.");
  assert.strictEqual(
    await page.locator(`[data-component-id="${ids.icon}"] > .editor-component__label`).isVisible(),
    false,
    "Hover no filho revelou também um neto."
  );

  const parentLabel = page.locator(`[data-component-id="${ids.footer}"] > .editor-component__label`);
  const childLabel = page.locator(`[data-component-id="${ids.item}"] > .editor-component__label`);
  const [parentBox, childBox] = await Promise.all([parentLabel.boundingBox(), childLabel.boundingBox()]);
  const intersects = parentBox && childBox &&
    parentBox.x < childBox.x + childBox.width &&
    parentBox.x + parentBox.width > childBox.x &&
    parentBox.y < childBox.y + childBox.height &&
    parentBox.y + parentBox.height > childBox.y;
  assert.strictEqual(Boolean(intersects), false, "Os rótulos do pai e do filho ainda se sobrepõem.");

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  assert.strictEqual(await visibleLabels().count(), 0, "Rótulos do editor apareceram na projeção de impressão.");

  await browser.close();
  console.log("✓ Rodapé composto mantém um rótulo primário, revelação local e impressão limpa.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
