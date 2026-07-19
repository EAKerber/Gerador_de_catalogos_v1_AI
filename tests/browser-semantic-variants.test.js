/* Interface real 05.10 — criação manual de variação com materialização vinculada. */
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const ids = await page.evaluate(() => {
    const product = CatalogEditor.store.createProduct({ title: "CANTONEIRA", code: "1037", package: "PCT 100", price: "R$ 22,90" });
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 120, width: 350, height: 300 });
    CatalogEditor.store.bindProduct(card.id, product.id);
    return { productId: product.id, cardId: card.id };
  });

  await page.locator('[data-left-panel-tab="products"]').click();
  await page.locator(`[data-product-edit="${ids.productId}"]`).click();
  await page.locator("[data-new-variant-label]").fill("Cromado");
  await page.locator('[data-new-variant-value="code"]').fill("1037-C");
  await page.locator('[data-new-variant-value="package"]').fill("PCT 100");
  await page.locator('[data-new-variant-value="price"]').fill("R$ 24,90");
  await page.locator("[data-variant-add]").click();

  const result = await page.evaluate(({ productId, cardId }) => {
    const product = CatalogEditor.store.getProduct(productId);
    const card = CatalogEditor.store.getProductCard(cardId);
    const variant = product.metadata.variants[0];
    const row = product.metadata.commercialRows.find(item => item.variantId === variant.id);
    const gallery = card.children.find(child => child.type === "art-gallery");
    const table = card.children.find(child => child.type === "data-table");
    return {
      variantCount: product.metadata.variants.length,
      linkedSourceRow: variant.commercialRowIds.includes(row?.id),
      linkedArt: gallery?.children.some(child => child.props?.variantId === variant.id),
      linkedTableRow: CatalogEditor.store.getTableRows(table).some(item => item.metadata?.sourceRowId === row?.id)
    };
  }, ids);
  assert(result.variantCount === 1 && result.linkedSourceRow && result.linkedArt && result.linkedTableRow, "A UI não materializou a variação vinculada em galeria e tabela.");
  assert(await page.locator("[data-product-variant]").count() === 1, "A variação criada não permaneceu editável no inventário.");
  assert(pageErrors.length === 0, `Erros no navegador: ${pageErrors.join(" | ")}`);
  await browser.close();
  console.log("✓ Variação semântica vinculada validada pela UI em 1366×768.");
})().catch(error => { console.error(error); process.exitCode = 1; });
