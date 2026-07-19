/* Smoke test real de linhas repetíveis, legenda e duplicação distribuída. */
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

  const ids = await page.evaluate(() => {
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 120, width: 350, height: 260 });
    CatalogEditor.store.setEditingContext(card.id);
    const table = card.children.find(child => child.type === "data-table");
    const art = card.children.find(child => child.type === "art");
    CatalogEditor.store.setSelection(table.id);
    return { cardId: card.id, tableId: table.id, artId: art.id };
  });

  await page.locator("[data-table-row-add]").click();
  await page.locator("[data-table-row-add]").click();
  const secondRow = page.locator("[data-table-row-card]").nth(1);
  await secondRow.locator('[data-table-row-path="code"]').fill("B-204");
  await secondRow.locator('[data-table-row-path="code"]').press("Tab");
  await secondRow.locator('[data-table-row-path="price"]').fill("R$ 24,90");
  await secondRow.locator('[data-table-row-path="price"]').press("Tab");

  const tableState = await page.evaluate(({ cardId, tableId }) => {
    const card = CatalogEditor.store.findComponent(cardId).component;
    const table = CatalogEditor.store.findComponent(tableId).component;
    return {
      rowCount: CatalogEditor.store.getTableRows(table).length,
      secondCode: CatalogEditor.store.getTableRows(table)[1].metadata.values.code,
      tableHeight: table.frame.height,
      cardHeight: card.frame.height,
      renderedRows: document.querySelectorAll(`[data-component-id="${tableId}"] .component-data-table__row`).length
    };
  }, ids);
  assert(tableState.rowCount === 3 && tableState.renderedRows === 3, "As três linhas não foram persistidas e renderizadas.");
  assert(tableState.secondCode === "B-204", "A edição da linha não chegou à coleção.");
  assert(tableState.tableHeight >= 104 && tableState.cardHeight >= 278, "Tabela e card não acompanharam o conteúdo repetível.");

  await page.evaluate(artId => CatalogEditor.store.setSelection(artId), ids.artId);
  await page.locator('[data-prop-path="caption"]').fill("Produto em embalagem comercial");
  await page.locator('[data-prop-path="caption"]').press("Tab");
  await page.locator('[data-prop-path="captionPosition"]').selectOption("overlay");
  const caption = await page.evaluate(artId => {
    const art = CatalogEditor.store.findComponent(artId).component;
    const element = document.querySelector(`[data-component-id="${artId}"] .component-art`);
    return { value: art.props.caption, position: element.dataset.captionPosition, text: element.querySelector("figcaption")?.textContent };
  }, ids.artId);
  assert(caption.value === caption.text && caption.position === "overlay", "A legenda vinculada não foi projetada corretamente.");

  await page.evaluate(cardId => CatalogEditor.store.setSelection(cardId), ids.cardId);
  await page.locator("[data-duplicate-direction]").selectOption("right");
  await page.locator("[data-duplicate-mode]").selectOption("gap");
  await page.locator("[data-duplicate-distance]").fill("10");
  await page.locator("[data-duplicate-count]").fill("1");
  await page.locator("[data-duplicate-series]").click();
  const duplication = await page.evaluate(cardId => {
    const source = CatalogEditor.store.findComponent(cardId).component;
    const cards = CatalogEditor.store.getPage().children.filter(component => component.type === "product-card");
    const copy = cards.find(component => component.id !== cardId);
    const sourceTable = source.children.find(child => child.type === "data-table");
    const copyTable = copy.children.find(child => child.type === "data-table");
    return {
      count: cards.length,
      sourceX: source.frame.x,
      copyX: copy.frame.x,
      width: source.frame.width,
      rowsIndependent: copyTable.props.rowIds.every(rowId => !sourceTable.props.rowIds.includes(rowId)),
      copiedCaption: copy.children.find(child => child.type === "art").props.caption
    };
  }, ids.cardId);
  assert(duplication.count === 2 && duplication.copyX === duplication.sourceX + duplication.width + 10, "A cópia não respeitou o espaçamento à direita.");
  assert(duplication.rowsIndependent, "A tabela duplicada compartilha linhas com a origem.");
  assert(duplication.copiedCaption === "Produto em embalagem comercial", "A legenda não foi preservada na cópia.");
  assert(pageErrors.length === 0, `Erros no navegador: ${pageErrors.join(" | ")}`);
  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });

  await browser.close();
  console.log("✓ Linhas repetíveis, legenda e duplicação distribuída validadas no navegador.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
