/* Smoke test real do fluxo de assets. Requer servidor em CATALOG_BASE_URL e Playwright. */
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const artId = await page.evaluate(() => {
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 160, width: 350, height: 260 });
    CatalogEditor.store.setEditingContext(card.id);
    return card.children.find(child => child.type === "art").id;
  });

  await page.locator(`[data-component-id="${artId}"] [data-open-asset-library]`).click();
  await page.locator("#assetLibraryDialog[open]").waitFor();
  const libraryOrder = await page.evaluate(() => {
    const grid = document.getElementById("assetLibraryGrid");
    const dropzone = document.getElementById("assetDropzone");
    return Boolean(grid.compareDocumentPosition(dropzone) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert(libraryOrder, "A biblioteca do projeto não aparece antes do upload.");

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120" viewBox="0 0 180 120"><rect width="180" height="120" rx="18" fill="#2255aa"/><circle cx="90" cy="60" r="32" fill="#ffffff"/></svg>';
  await page.locator("#assetFileInput").setInputFiles({ name: "produto.svg", mimeType: "image/svg+xml", buffer: Buffer.from(svg) });
  await page.waitForFunction(id => {
    const component = CatalogEditor.store.findComponent(id)?.component;
    return component?.props.assetId && document.querySelector(`[data-component-id="${id}"] [data-asset-preview]`)?.dataset.assetState === "ready";
  }, artId);

  const imported = await page.evaluate(id => {
    const component = CatalogEditor.store.findComponent(id).component;
    const asset = CatalogEditor.store.getAsset(component.props.assetId);
    return {
      schemaVersion: CatalogEditor.store.getState().schemaVersion,
      assetId: component.props.assetId,
      assetCount: CatalogEditor.store.getCollection("assets").items.length,
      metadata: asset.metadata,
      reference: asset.reference,
      serialized: JSON.stringify(CatalogEditor.store.getState())
    };
  }, artId);
  assert(imported.schemaVersion === "1.16.0", "O navegador não carregou o schema 1.16.0.");
  assert(imported.assetCount === 1 && imported.assetId, "O SVG não foi registrado e vinculado.");
  assert(imported.metadata.width === 180 && imported.metadata.height === 120, "As dimensões do SVG não foram registradas.");
  assert(imported.reference.provider === "indexeddb", "O blob não usa referência IndexedDB.");
  assert(!/data:[^;]+;base64/i.test(imported.serialized), "O documento contém base64.");

  await page.locator('[data-prop-path="fit"]').selectOption("cover");
  await page.locator('[data-prop-path="focalX"]').fill("25");
  await page.locator('[data-prop-path="focalX"]').press("Tab");
  await page.locator('[data-prop-path="focalY"]').fill("70");
  await page.locator('[data-prop-path="focalY"]').press("Tab");
  await page.locator('[data-prop-path="vectorMode"]').selectOption("token");
  await page.waitForFunction(id => document.querySelector(`[data-component-id="${id}"] [data-asset-preview]`)?.dataset.assetRender === "vector-token", artId);
  const presentation = await page.evaluate(id => {
    const component = CatalogEditor.store.findComponent(id).component;
    const preview = document.querySelector(`[data-component-id="${id}"] [data-asset-preview]`);
    return { fit: component.props.fit, focalX: component.props.focalX, focalY: component.props.focalY, render: preview.dataset.assetRender };
  }, artId);
  assert(presentation.fit === "cover" && presentation.focalX === 25 && presentation.focalY === 70, "Fit e ponto focal não foram persistidos.");
  assert(presentation.render === "vector-token", "O SVG não foi recolorido pelo token.");

  const secondArtId = await page.evaluate(() => {
    CatalogEditor.store.setEditingContext(null);
    return CatalogEditor.store.addComponent("art", { x: 410, y: 160, width: 220, height: 160 }, { props: { role: "logo" } }).id;
  });
  await page.locator(`[data-component-id="${secondArtId}"] [data-open-asset-library]`).click();
  await page.locator("#assetLibraryDialog[open] [data-use-asset]").click();
  await page.waitForFunction(id => CatalogEditor.store.findComponent(id)?.component.props.assetId, secondArtId);
  const reuse = await page.evaluate(assetId => ({ count: CatalogEditor.store.getCollection("assets").items.length, usage: CatalogEditor.store.getAssetUsage(assetId).length }), imported.assetId);
  assert(reuse.count === 1 && reuse.usage === 2, "O reuso criou outro asset ou não vinculou os dois componentes.");

  await page.evaluate(() => CatalogEditor.store.save());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelectorAll('[data-asset-preview][data-asset-state="ready"]').length >= 2);
  const restored = await page.evaluate(() => ({ assets: CatalogEditor.store.getCollection("assets").items.length, schemaVersion: CatalogEditor.store.getState().schemaVersion }));
  assert(restored.assets === 1 && restored.schemaVersion === "1.16.0", "Documento e blob não foram restaurados após recarregar.");
  assert(pageErrors.length === 0, `Erros no navegador: ${pageErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ Upload, IndexedDB, preview, fit, ponto focal, SVG por token, reuso e reload validados no navegador.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
