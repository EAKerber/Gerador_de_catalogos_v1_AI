/* Interface real 05.15 — esquema em lote e composição hero + grade + faixa. */
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

  const products = [
    "Título\tCódigo\tEmbalagem\tPreço",
    ...Array.from({ length: 7 }, (_, index) => `PRODUTO ${index + 1}\t${1001 + index}\tCX 100\tR$ ${index + 1},00`)
  ].join("\n");
  let actions = 0;
  await page.locator('[data-left-panel-tab="products"]').click(); actions += 1;
  await page.locator(".product-bulk-entry > summary").click(); actions += 1;
  await page.locator("[data-products-bulk-text]").fill(products); actions += 1;
  await page.locator("[data-products-bulk-add]").click(); actions += 1;
  await page.locator("[data-product-card-organization]").selectOption("hero-grid-strip"); actions += 1;
  await page.locator("[data-products-create-cards]").click(); actions += 1;

  const structure = await page.evaluate(() => {
    const composition = CatalogEditor.store.getPage().children.find(component => component.props?.recipeRole === "product-composition");
    const hero = composition?.children.find(component => component.props?.recipeRole === "hero");
    const grid = composition?.children.find(component => component.props?.recipeRole === "grid");
    const strip = composition?.children.find(component => component.props?.recipeRole === "strip");
    const report = CatalogEditor.store.getPublicationReport("draft");
    return { compositionId: composition?.id, hero: hero?.children.length, grid: grid?.children.length, strip: strip?.children.length, contextId: CatalogEditor.store.getState().editor.editingContextId, gridId: grid?.id, history: CatalogEditor.store.getHistoryState(), collisions: report.summary.collisions, overflows: report.summary.overflows };
  });
  assert(structure.hero === 1 && structure.grid === 6 && structure.strip === 3 && structure.contextId === structure.gridId, "A interface não materializou ou focou as três regiões esperadas.");
  assert(structure.collisions === 0 && structure.overflows === 0, "A receita focal nasceu geometricamente inválida.");
  assert(structure.history.undoLabel === "Criar hero, grade e faixa", "A receita focal não foi registrada como uma ação.");

  await page.keyboard.press("Control+a"); actions += 1;
  assert(await page.locator("[data-batch-table-schema]").count() === 1, "Cards selecionados não expuseram o esquema de tabela em lote.");
  await page.locator("[data-batch-table-schema]").selectOption("measured"); actions += 1;
  await page.locator("[data-batch-table-schema-apply]").click(); actions += 1;
  const batch = await page.evaluate(() => {
    const cards = CatalogEditor.store.getSelectedComponents();
    const tables = CatalogEditor.store.getTablesForComponents(cards);
    return { cards: cards.length, tables: tables.length, schemas: tables.map(table => table.props.tableSchemaId), columns: tables.map(table => CatalogEditor.store.getTableColumns(table).length), history: CatalogEditor.store.getHistoryState() };
  });
  assert(batch.cards === 6 && batch.tables === 6 && batch.schemas.every(value => value === "measured") && batch.columns.every(value => value === 4), "A ação em lote não alcançou as seis tabelas da grade.");
  assert(batch.history.undoLabel === "Aplicar esquema às tabelas", "A aplicação visual não gerou histórico atômico.");
  assert(actions === 9, "O recorte mensurado excedeu nove ações observáveis.");
  assert(errors.length === 0, `Erros no navegador: ${errors.join(" | ")}`);
  await browser.close();
  console.log("✓ Hero + grade + faixa e esquema de seis tabelas validados em 1366×768.");
})().catch(error => { console.error(error); process.exitCode = 1; });
