/* Incremento 05.53 — edição prática dos cabeçalhos pela aba Conteúdo. */
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });

  const tableId = await page.evaluate(() => {
    CatalogEditor.store.reset();
    const table = CatalogEditor.store.addComponent("data-table", { x: 24, y: 24, width: 420, height: 110 });
    const row = CatalogEditor.store.getTableRows(table)[0];
    CatalogEditor.store.updateTableRow(table.id, row.id, { code: "1176", package: "CX 1000", price: "R$ 35,90" });
    CatalogEditor.store.setSelection(table.id);
    return table.id;
  });

  assert(await page.locator('[data-inspector-tab="content"]').getAttribute("aria-selected") === "true", "A tabela não abriu na aba Conteúdo.");
  const editor = page.locator(".table-column-editor");
  await editor.locator(":scope > summary").click();
  assert(await editor.isVisible(), "O editor de cabeçalhos não está acessível em Conteúdo.");

  const packageCard = editor.locator('[data-table-column="package"]');
  await packageCard.locator('[data-table-column-path="label"]').fill("Caixa");
  await packageCard.locator('[data-table-column-move="-1"]').click();
  await packageCard.locator("[data-table-column-visibility]").uncheck();

  const result = await page.evaluate(id => {
    const table = CatalogEditor.store.findComponent(id).component;
    const row = CatalogEditor.store.getTableRows(table)[0];
    const rendered = document.querySelector(`[data-component-id="${id}"] .component-data-table`);
    return {
      columns: CatalogEditor.store.getTableColumns(table),
      visible: CatalogEditor.store.getVisibleTableColumns(table).map(column => column.key),
      values: row.metadata.values,
      header: [...rendered.querySelectorAll(".component-data-table__header span")].map(cell => cell.textContent.trim()),
      body: [...rendered.querySelectorAll(".component-data-table__row strong span")].map(cell => cell.textContent.trim()),
      history: CatalogEditor.store.getHistoryState(),
      exported: CatalogEditor.store.getExportDocument()
    };
  }, tableId);

  assert(result.columns.map(column => column.key).join(",") === "package,code,price", "Os botões não reordenaram a coluna.");
  assert(result.columns[0].label === "Caixa" && result.columns[0].visible === false, "Rótulo ou visibilidade não foram persistidos.");
  assert(result.visible.join(",") === "code,price", "A projeção visível não corresponde aos controles.");
  assert(result.values.package === "CX 1000", "Ocultar removeu a célula vinculada.");
  assert(result.header.join(",") === "Código,Preço" && result.body.join(",") === "1176,R$ 35,90", "Editor/PDF não projetam somente as colunas visíveis na ordem atual.");

  await page.evaluate(document => CatalogEditor.store.replaceDocument(document, { preserveEditor: false }), result.exported);
  const roundTrip = await page.evaluate(id => {
    const table = CatalogEditor.store.findComponent(id).component;
    return {
      columns: CatalogEditor.store.getTableColumns(table),
      package: CatalogEditor.store.getTableRows(table)[0].metadata.values.package,
      schemaVersion: CatalogEditor.store.getState().schemaVersion
    };
  }, tableId);
  assert(roundTrip.columns[0].key === "package" && roundTrip.columns[0].visible === false && roundTrip.package === "CX 1000", "Round-trip perdeu a edição do cabeçalho.");
  assert(roundTrip.schemaVersion === "1.16.0", "O fluxo alterou a versão do documento.");
  assert(pageErrors.length === 0, `Erros no navegador: ${pageErrors.join(" | ")}`);
  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });
  await browser.close();
  console.log("✓ Cabeçalhos 05.53 são editáveis, ordenáveis e ocultáveis pela aba Conteúdo.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
