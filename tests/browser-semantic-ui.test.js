/* Interface real 05.4 — semântica, tabela, legenda, apresentação e divulgação progressiva. */
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
    const product = CatalogEditor.store.createProduct({ title: "PRODUTO SEMÂNTICO", attributesText: "Material: Aço", highlightsText: "Alta resistência" });
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 120, width: 350, height: 300 });
    CatalogEditor.store.bindProduct(card.id, product.id);
    const table = card.children.find(child => child.type === "data-table");
    CatalogEditor.store.setEditingContext(card.id);
    CatalogEditor.store.setSelection(table.id);
    return { productId: product.id, cardId: card.id, tableId: table.id };
  });

  assert(await page.locator('[data-inspector-tab="content"]').textContent().then(text => text.includes("Conteúdo")), "A aba Conteúdo não está visível.");
  await page.locator(".table-column-editor > summary").click();
  await page.locator("[data-table-column-add]").click();
  const lastColumn = page.locator("[data-table-column]").last();
  await lastColumn.locator('[data-table-column-path="label"]').fill("Medida");
  await lastColumn.locator('[data-table-column-path="label"]').press("Tab");
  await page.locator(".semantic-legend-editor > summary").click();
  await page.locator("[data-new-legend-label]").fill("CX 250");
  await page.locator("[data-color-legend-add]").click();
  const legendSelect = page.locator("[data-table-cell-legend]").first();
  await legendSelect.selectOption({ label: "CX 250" });

  const semantic = await page.evaluate(({ productId, tableId }) => {
    const product = CatalogEditor.store.getProduct(productId);
    const table = CatalogEditor.store.findComponent(tableId).component;
    const row = CatalogEditor.store.getTableRows(table)[0];
    return { attributes: product.metadata.attributes.length, columns: table.props.columns.length, legend: row.metadata.legendKeys[table.props.columns[0].key] };
  }, ids);
  assert(semantic.attributes === 1 && semantic.columns === 4 && semantic.legend === "cx-250", "A UI não materializou semântica, coluna e legenda.");
  assert(await page.evaluate(() => CatalogEditor.store.getLegendPanels().some(panel => panel.children.some(group => group.children?.some(item => item.props?.legendKey === "cx-250")))), "A legenda criada pela UI não materializou painel, grupo e item por default.");

  await page.evaluate(cardId => {
    CatalogEditor.store.setEditingContext(null);
    CatalogEditor.store.setSelection(cardId);
  }, ids.cardId);
  await page.locator('[data-inspector-tab="content"]').click();
  await page.locator(".card-presentation-secondary > summary").click();
  await page.locator('[data-presentation-path="presetId"]').selectOption("product-technical");
  const presentation = await page.evaluate(cardId => CatalogEditor.store.findComponent(cardId).component.presentation, ids.cardId);
  assert(presentation.mode === "technical" && presentation.density === "compact", "O preset não atualizou modo e densidade.");

  await page.locator('[data-inspector-tab="style"]').click();
  await page.locator('[data-toggle-all-properties]').first().click();
  await page.locator("[data-custom-minimum-enabled]").locator("xpath=..").click();
  assert(await page.locator("[data-custom-minimum-path]").first().isEnabled(), "O recomendado customizado não foi habilitado.");
  assert(await page.locator("#exportPublicationPackageButton").count() === 1, "A exportação para publicação não está exposta.");
  assert(pageErrors.length === 0, `Erros no navegador: ${pageErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ Semântica, tabela, legenda, apresentação e mínimos 05.4 validados no navegador.");
})().catch(error => { console.error(error); process.exitCode = 1; });
