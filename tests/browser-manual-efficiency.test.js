/* Interface real 05.6 — redução de ações na construção manual. */
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const products = [
    "Título\tCódigo\tEmbalagem\tPreço\tEspecificação 1\tEspecificação 2",
    "PARAFUSO OVAL\t1176\tCX 1000\tR$ 35,90\tCabeça oval\tAço cromado",
    "PARAFUSO CHIPBOARD\t1197\tCX 250\tR$ 48,80\tCabeça flangeada\tMadeira e MDF",
    "CANTONEIRA ZAMAC\t1037\tPCT 100\tR$ 22,90\tAlta resistência\tZamac",
    "PINO METALIZADO\t1056\tPCT 100\tR$ 19,90\tAço metalizado\tFácil instalação",
    "PINO INVISÍVEL\t1369\tPCT 10\tR$ 49,00\tFixação oculta\tAço",
    "L CAPA DE FIXAÇÃO\t1042\tPCT 100\tR$ 1,69\tCinco cores\tAcabamento",
    "BUCHA NYLON\t2040\tPCT 100\tR$ 12,50\tAlta resistência\tNylon branco"
  ].join("\n");

  let actions = 0;
  await page.locator('[data-left-panel-tab="products"]').click(); actions += 1;
  await page.locator(".product-bulk-entry > summary").click(); actions += 1;
  await page.locator("[data-products-bulk-text]").fill(products); actions += 1;
  await page.locator("[data-products-bulk-add]").click(); actions += 1;
  await page.locator("[data-products-create-cards]").click(); actions += 1;

  await page.waitForFunction(() => CatalogEditor.store.getProducts().length === 7);
  const state = await page.evaluate(() => {
    const pageState = CatalogEditor.store.getPage();
    const area = pageState.children.find(component => component.type === "layout-container");
    const cards = area?.children.filter(component => component.type === "product-card") || [];
    const report = CatalogEditor.store.getPublicationReport("draft");
    return {
      areaId: area?.id,
      cardId: cards[cards.length - 1]?.id,
      tableId: cards[cards.length - 1]?.children.find(child => child.type === "data-table")?.id,
      products: CatalogEditor.store.getProducts().length,
      cards: cards.length,
      bindings: cards.filter(card => card.binding?.productId).length,
      editingContextId: CatalogEditor.store.getState().editor.editingContextId,
      report,
      history: CatalogEditor.store.getHistoryState()
    };
  });
  assert(actions === 5, `A entrada manual assistida exigiu ${actions} ações, esperado: 5.`);
  assert(state.products === 7 && state.cards === 7 && state.bindings === 7, "A colagem manual não criou e vinculou todos os produtos/cards.");
  assert(state.editingContextId === state.areaId && state.report.ok && state.report.summary.collisions === 0 && state.report.summary.overflows === 0, "A grade manual assistida não nasceu pronta para refinamento.");
  assert(state.history.undoCount === 2 && state.history.undoLabel === "Criar cards da seleção", "As duas operações compostas não produziram duas entradas de histórico.");

  await page.locator(`[data-component-id="${state.cardId}"] > [data-enter-container]`).click();
  await page.locator(`[data-component-id="${state.tableId}"]`).click();
  await page.locator('details.table-bulk-entry:has([data-table-bulk-text]) > summary').click();
  await page.locator("[data-table-bulk-text]").fill("Código\tEmbalagem\tPreço\n1042\tPCT 100\tR$ 1,69\n1145\tPCT 100\tR$ 1,90\n1144\tPCT 100\tR$ 1,90\n1111\tPCT 100\tR$ 1,90\n1371\tPCT 100\tR$ 1,90");
  await page.locator("[data-table-bulk-apply]").click();
  const tableState = await page.evaluate(tableId => ({
    rows: CatalogEditor.store.getTableRows(tableId).length,
    history: CatalogEditor.store.getHistoryState(),
    report: CatalogEditor.store.getPublicationReport("draft")
  }), state.tableId);
  assert(tableState.rows === 5 && tableState.history.undoLabel === "Colar linhas da tabela", "A colagem manual não materializou cinco linhas como uma ação.");
  assert(tableState.report.ok && tableState.report.summary.collisions === 0 && tableState.report.summary.overflows === 0, "O crescimento tabular criou geometria inválida.");

  await page.keyboard.press("Control+z");
  assert(await page.evaluate(tableId => CatalogEditor.store.getTableRows(tableId).length, state.tableId) === 1, "Desfazer não recuperou a tabela anterior.");
  await page.keyboard.press("Control+z");
  const afterCardsUndo = await page.evaluate(() => ({ products: CatalogEditor.store.getProducts().length, cards: CatalogEditor.store.getPage().children.flatMap(component => component.children || []).filter(component => component.type === "product-card").length }));
  assert(afterCardsUndo.products === 7 && afterCardsUndo.cards === 0, "Desfazer a operação de cards removeu dados ou deixou cópias parciais.");
  assert(errors.length === 0, `Erros no navegador: ${errors.join(" | ")}`);

  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });
  await browser.close();
  console.log("✓ Construção manual: sete produtos e sete cards em cinco ações, tabela em lote e desfazer transacional validados.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close().catch(() => {});
  process.exitCode = 1;
});
