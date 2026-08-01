/* Interface real 05.8 — estruturas prontas e inserção contextual de um clique. */
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  let actions = 0;
  await page.locator('[data-insert-template="page-catalog-base"]').click(); actions += 1;
  const scaffold = await page.evaluate(() => {
    const root = CatalogEditor.store.getPage().children[0];
    const content = root?.children.find(component => component.props?.recipeRole === "primary-content");
    return {
      rootId: root?.id,
      contentId: content?.id,
      headerChildren: root?.children.find(component => component.type === "catalog-header")?.children.length,
      footerChildren: root?.children.find(component => component.type === "catalog-footer")?.children.length,
      contextId: CatalogEditor.store.getState().editor.editingContextId,
      history: CatalogEditor.store.getHistoryState()
    };
  });
  assert(actions === 1 && scaffold.headerChildren === 5 && scaffold.footerChildren === 3 && scaffold.contextId === scaffold.contentId, "A página-base não ficou pronta e focada em uma ação.");
  assert(scaffold.history.undoCount === 1 && scaffold.history.undoLabel === "Inserir estrutura pronta", "A página-base não foi registrada como uma transação.");

  const products = [
    "Título\tCódigo\tEmbalagem\tPreço",
    "PRODUTO 1\t1001\tCX 100\tR$ 10,00",
    "PRODUTO 2\t1002\tCX 100\tR$ 20,00",
    "PRODUTO 3\t1003\tCX 100\tR$ 30,00",
    "PRODUTO 4\t1004\tCX 100\tR$ 40,00",
    "PRODUTO 5\t1005\tCX 100\tR$ 50,00",
    "PRODUTO 6\t1006\tCX 100\tR$ 60,00",
    "PRODUTO 7\t1007\tCX 100\tR$ 70,00"
  ].join("\n");
  await page.locator('[data-left-panel-tab="products"]').click(); actions += 1;
  await page.locator(".product-bulk-entry > summary").click(); actions += 1;
  await page.locator("[data-products-bulk-text]").fill(products); actions += 1;
  await page.locator("[data-products-bulk-add]").click(); actions += 1;
  await page.locator("[data-products-create-cards]").click(); actions += 1;
  await page.waitForFunction(() => CatalogEditor.store.getProducts().length === 7);
  const ready = await page.evaluate(contentId => {
    const content = CatalogEditor.store.findComponent(contentId)?.component;
    const report = CatalogEditor.store.getPublicationReport("draft");
    return {
      cards: content?.children.filter(component => component.type === "product-card").length,
      pageRoots: CatalogEditor.store.getPage().children.length,
      contextId: CatalogEditor.store.getState().editor.editingContextId,
      report,
      history: CatalogEditor.store.getHistoryState()
    };
  }, scaffold.contentId);
  assert(actions === 6 && ready.cards === 7 && ready.pageRoots === 1 && ready.contextId === scaffold.contentId, "Página-base e sete cards não foram concluídos em seis ações.");
  assert(ready.report.ok && ready.report.summary.collisions === 0 && ready.report.summary.overflows === 0, "A página pronta com cards nasceu geometricamente inválida.");

  await page.locator('[data-left-panel-tab="components"]').click();
  assert(await page.locator('[data-insert-template="page-catalog-base"]').count() === 0, "A receita exclusiva de página apareceu dentro do conteúdo.");
  await page.locator('[data-insert-template="section-applications"]').click();
  const application = await page.evaluate(contentId => {
    const content = CatalogEditor.store.findComponent(contentId)?.component;
    const section = content?.children.find(component => component.name === "Faixa de aplicações");
    return { id: section?.id, children: section?.children.length, history: CatalogEditor.store.getHistoryState() };
  }, scaffold.contentId);
  assert(application.children === 3 && application.history.undoLabel === "Inserir estrutura pronta", "A faixa pronta não foi inserida como uma composição editável.");
  await page.keyboard.press("Control+z");
  assert(!await page.evaluate(id => Boolean(CatalogEditor.store.findComponent(id)), application.id), "Desfazer não removeu a faixa completa.");

  await page.locator('[data-insert-component="text"]').click();
  const quickText = await page.evaluate(contentId => {
    const content = CatalogEditor.store.findComponent(contentId)?.component;
    const text = content?.children.find(component => component.type === "text");
    return { exists: Boolean(text), parent: CatalogEditor.store.getParentId(text?.id), history: CatalogEditor.store.getHistoryState() };
  }, scaffold.contentId);
  assert(quickText.exists && quickText.parent === scaffold.contentId && quickText.history.undoLabel === "Adicionar componente", "O botão + não inseriu o componente comum no contexto atual.");
  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });

  assert(errors.length === 0, `Erros no navegador: ${errors.join(" | ")}`);
  await browser.close();
  console.log("✓ Página-base + sete cards em seis ações, receitas contextuais, inserção rápida e desfazer validados na interface real.");
})().catch(error => { console.error(error); process.exitCode = 1; });
