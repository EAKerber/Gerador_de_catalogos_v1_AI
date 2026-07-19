/* Interface real do Incremento 05.1 em 1366×768. */
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
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const cardId = await page.evaluate(() => {
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 120, width: 350, height: 300 });
    CatalogEditor.store.setSelection(card.id);
    return card.id;
  });

  await page.locator('[data-left-panel-tab="products"]').click();
  assert(await page.locator("#productCatalogRoot [data-product-form]").isVisible(), "A aba Produtos não abriu o formulário do inventário.");
  await page.locator('[name="title"]').fill("PARAFUSO OVAL PHS");
  await page.locator('[name="code"]').fill("1176");
  await page.locator('[name="package"]').fill("CX 1000 UNID.");
  await page.locator('[name="price"]').fill("R$ 35,90");
  await page.locator('[name="specOne"]').fill("Cabeça oval");
  await page.locator('[name="specTwo"]').fill("Aço cromado");
  await page.locator("[data-product-form] [type=submit]").click();

  const productItem = page.locator("[data-product-id]").filter({ hasText: "PARAFUSO OVAL PHS" });
  assert(await productItem.isVisible(), "O produto cadastrado não apareceu no inventário.");
  await productItem.locator("[data-product-bind]").click();
  const bound = await page.evaluate(cardId => {
    const card = CatalogEditor.store.findComponent(cardId).component;
    const table = card.children.find(child => child.type === "data-table");
    return { productId: card.binding.productId, title: card.children.find(child => child.type === "title-symbol").props.title, rowId: table.props.rowIds[0] };
  }, cardId);
  assert(bound.productId && bound.title === "PARAFUSO OVAL PHS", "O botão Vincular não aplicou o produto ao card selecionado.");

  await productItem.locator("[data-product-edit]").click();
  await page.locator('[name="price"]').fill("R$ 31,50");
  await page.locator("[data-product-form] [type=submit]").click();
  const priceUpdate = await page.evaluate(({ cardId, rowId }) => {
    const card = CatalogEditor.store.findComponent(cardId).component;
    const table = card.children.find(child => child.type === "data-table");
    return { rowId: table.props.rowIds[0], price: CatalogEditor.store.getTableRows(table)[0].metadata.values.price };
  }, { cardId, rowId: bound.rowId });
  assert(priceUpdate.rowId === bound.rowId && priceUpdate.price === "R$ 31,50", "Atualizar preço pela interface reconstruiu a linha ou não sincronizou o card.");

  await page.locator('[data-left-panel-tab="components"]').click();
  await page.locator('[data-inspector-tab="content"]').click();
  assert(await page.locator('[data-product-binding-state="linked"]').isVisible(), "O inspetor não exibiu o estado sincronizado.");
  const priceOverride = page.locator('[data-product-override="price"]');
  await priceOverride.check();
  const overrideState = await page.evaluate(cardId => CatalogEditor.store.findComponent(cardId).component.binding.overrides.price, cardId);
  assert(overrideState === true, "O toggle de override não atualizou o contrato do card.");

  const templateId = await page.evaluate(cardId => {
    const source = CatalogEditor.store.addComponent("product-card", { x: 410, y: 120, width: 350, height: 300 });
    CatalogEditor.store.updateComponent(source.id, { style: { accentColor: "text.primary" } });
    const template = CatalogEditor.store.saveComponentAsTemplate(source.id, "Apresentação técnica");
    CatalogEditor.store.setSelection(cardId);
    return template.id;
  }, cardId);
  await page.locator('[data-inspector-tab="content"]').click();
  await page.locator("[data-card-template-id]").selectOption(templateId);
  const presentation = await page.evaluate(cardId => {
    const card = CatalogEditor.store.findComponent(cardId).component;
    return { id: card.id, productId: card.binding.productId, templateId: card.binding.templateId, accent: card.style.accentColor };
  }, cardId);
  assert(presentation.id === cardId && presentation.productId && presentation.templateId === templateId && presentation.accent === "text.primary", "Aplicar o template perdeu identidade, produto ou apresentação.");

  await page.locator('[data-left-panel-tab="products"]').click();
  page.once("dialog", dialog => dialog.accept("Fixação principal"));
  await page.locator("[data-subcatalog-create]").click();
  assert(await page.locator("[data-subcatalog-filter]").inputValue() !== "all", "O subcatálogo não foi criado a partir da seleção.");

  const bodyOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  assert(bodyOverflow, "A interface 05.1 criou overflow horizontal global em 1366×768.");

  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });
  await browser.close();
  console.log("✓ Inventário, binding, overrides e subcatálogo validados no navegador.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
