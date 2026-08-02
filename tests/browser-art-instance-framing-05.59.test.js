/* Incremento 05.59 — UI, raster/SVG, viewport e impressão do enquadramento por instância. */
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
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const artId = await page.evaluate(() => CatalogEditor.store.addComponent("art", { x: 80, y: 120, width: 280, height: 150 }).id);
  await page.locator(`[data-component-id="${artId}"] [data-open-asset-library]`).click();
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100" viewBox="0 0 240 100"><rect width="240" height="100" fill="#fff"/><rect x="20" y="20" width="200" height="60" rx="12" fill="#d51f2b"/></svg>';
  await page.locator("#assetFileInput").setInputFiles({ name: "produto-enquadramento.svg", mimeType: "image/svg+xml", buffer: Buffer.from(svg) });
  await page.waitForFunction(id => document.querySelector(`[data-component-id="${id}"] [data-asset-preview]`)?.dataset.assetState === "ready", artId);

  const assetBefore = await page.evaluate(id => {
    const component = CatalogEditor.store.findComponent(id).component;
    const asset = CatalogEditor.store.getAsset(component.props.assetId);
    return { id: asset.id, metadata: JSON.stringify(asset.metadata), count: CatalogEditor.store.getCollection("assets").items.length };
  }, artId);

  for (const [pathName, value] of [["focalX", "30"], ["focalY", "65"], ["zoom", "180"], ["offsetX", "-12"], ["offsetY", "8"]]) {
    const input = page.locator(`[data-prop-path="${pathName}"]`);
    await input.fill(value);
    await input.press("Tab");
  }

  const screen = await page.evaluate(id => {
    const component = CatalogEditor.store.findComponent(id).component;
    const preview = document.querySelector(`[data-component-id="${id}"] [data-asset-preview]`);
    const image = preview.querySelector("[data-asset-image]");
    return {
      props: { ...component.props },
      dataset: { zoom: preview.dataset.zoom, offsetX: preview.dataset.offsetX, offsetY: preview.dataset.offsetY },
      overflow: getComputedStyle(preview).overflow,
      transform: getComputedStyle(image).transform
    };
  }, artId);
  assert(screen.props.zoom === 180 && screen.props.offsetX === -12 && screen.props.offsetY === 8, "A UI não persistiu zoom e deslocamento.");
  assert(screen.dataset.zoom === "180" && screen.dataset.offsetX === "-12" && screen.dataset.offsetY === "8", "O renderer não materializou o enquadramento.");
  assert(screen.overflow === "hidden" && screen.transform !== "none", "O viewport não recortou a transformação não destrutiva.");

  await page.emulateMedia({ media: "print" });
  const printTransform = await page.locator(`[data-component-id="${artId}"] [data-asset-image]`).evaluate(element => getComputedStyle(element).transform);
  assert(printTransform === screen.transform, "Tela e impressão aplicaram transformações diferentes.");
  await page.emulateMedia({ media: "screen" });

  const beforeFillHistory = await page.evaluate(() => CatalogEditor.store.getHistoryState().undoCount);
  await page.locator("[data-art-fill-focus]").click();
  const filled = await page.evaluate(id => ({ props: { ...CatalogEditor.store.findComponent(id).component.props }, history: CatalogEditor.store.getHistoryState().undoCount }), artId);
  assert(filled.props.fit === "cover" && filled.props.focalX === 30 && filled.props.focalY === 65, "Preencher não preservou o ponto focal.");
  assert(filled.props.zoom === 100 && filled.props.offsetX === 0 && filled.props.offsetY === 0, "Preencher não normalizou zoom e deslocamento.");
  assert(filled.history === beforeFillHistory + 1, "Preencher não formou uma única ação.");

  await page.evaluate(() => CatalogEditor.store.undo());
  const undone = await page.evaluate(id => CatalogEditor.store.findComponent(id).component.props, artId);
  assert(undone.zoom === 180 && undone.offsetX === -12 && undone.offsetY === 8, "Undo não recuperou o enquadramento manual.");

  await page.locator("[data-art-framing-reset]").click();
  const reset = await page.evaluate(id => CatalogEditor.store.findComponent(id).component.props, artId);
  assert(reset.fit === "contain" && reset.focalX === 50 && reset.focalY === 50 && reset.zoom === 100 && reset.offsetX === 0 && reset.offsetY === 0, "Redefinir não restaurou o enquadramento neutro.");

  const assetAfter = await page.evaluate(id => {
    const component = CatalogEditor.store.findComponent(id).component;
    const asset = CatalogEditor.store.getAsset(component.props.assetId);
    const exported = CatalogEditor.store.getExportDocument();
    const roundTrip = new CatalogDocumentStore(exported).findComponent(id).component;
    return { id: asset.id, metadata: JSON.stringify(asset.metadata), count: CatalogEditor.store.getCollection("assets").items.length, roundTrip: { ...roundTrip.props } };
  }, artId);
  assert(assetAfter.id === assetBefore.id && assetAfter.metadata === assetBefore.metadata && assetAfter.count === assetBefore.count, "O enquadramento alterou ou duplicou o asset original.");
  assert(assetAfter.roundTrip.zoom === 100 && assetAfter.roundTrip.offsetX === 0 && assetAfter.roundTrip.offsetY === 0, "O round-trip perdeu o enquadramento final.");
  assert(pageErrors.length === 0, `Erros no navegador: ${pageErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ 05.59 valida UI, recorte, impressão, comandos, undo e integridade do asset no Chromium.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
