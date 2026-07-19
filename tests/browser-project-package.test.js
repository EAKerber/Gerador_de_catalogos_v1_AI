/* Interface real do Incremento 05.3: exportação e importação portátil em 1366×768. */
const { chromium } = require("playwright");

const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || "/usr/bin/chromium";
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const artId = await page.evaluate(() => CatalogEditor.store.addComponent("art", { x: 40, y: 40, width: 220, height: 150 }).id);
  await page.locator(`[data-component-id="${artId}"] [data-open-asset-library]`).click();
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="red"/></svg>';
  await page.locator("#assetFileInput").setInputFiles({ name: "produto.svg", mimeType: "image/svg+xml", buffer: Buffer.from(svg) });
  await page.waitForFunction(id => CatalogEditor.store.findComponent(id)?.component.props.assetId, artId);

  const exported = await page.evaluate(async () => {
    const result = await CatalogEditor.projectPackage.buildPackage();
    return { bytes: Array.from(result.bytes), assetCount: result.manifest.assets.length, policy: result.manifest.policy.assetMode };
  });
  assert(exported.assetCount === 1 && exported.policy === "assisted", "A exportação real não incluiu asset e política.");

  await page.evaluate(() => CatalogEditor.store.reset());
  await page.locator("#importButton").click();
  await page.locator("#documentImportFileInput").setInputFiles({ name: "projeto.catalogo.zip", mimeType: "application/zip", buffer: Buffer.from(exported.bytes) });
  await page.locator('[data-document-import-verdict][data-state="ready"]').waitFor();
  const report = await page.locator("[data-document-import-issues]").innerText();
  assert(report.includes("prontos para importação"), "O relatório real não confirmou a integridade do pacote.");
  await page.locator("[data-confirm-document-import]").click();
  await page.waitForFunction(() => CatalogEditor.store.getCollection("assets").items.length === 1);
  await page.waitForFunction(() => document.querySelector('[data-asset-preview][data-asset-state="ready"]'));

  const metrics = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    managerLoaded: Boolean(CatalogEditor.projectPackage),
    schema: CatalogEditor.store.getState().schemaVersion
  }));
  assert(metrics.bodyWidth <= metrics.viewportWidth, "A toolbar 05.3 criou overflow horizontal em 1366×768.");
  assert(metrics.managerLoaded && metrics.schema === "1.16.0", "O runtime portátil ou schema 1.16 não foi carregado.");

  await browser.close();
  console.log("✓ Pacote portátil 05.3 validado em navegador real.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
