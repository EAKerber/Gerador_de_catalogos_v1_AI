/* Interface real 05.16 — continuidade de tarefa e ações sem efeito diagnosticadas. */
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

  const ids = await page.evaluate(() => {
    const area = CatalogEditor.store.addComponent("layout-container", { x: 24, y: 24, width: 746, height: 520 }, { layout: { mode: "grid", columns: 2, padding: 8, gap: 12 } });
    const cards = [0, 1].map(() => CatalogEditor.store.addComponent("product-card", { x: 0, y: 0, width: 300, height: 240 }, { parentId: area.id }));
    const tables = cards.map(card => card.children.find(child => child.type === "data-table"));
    CatalogEditor.store.selectComponentInContext(tables[0].id);
    return { first: tables[0].id, second: tables[1].id };
  });

  await page.locator(".table-column-editor > summary").click();
  await page.locator(".table-bulk-entry > summary").click();
  await page.evaluate(id => CatalogEditor.store.selectComponentInContext(id), ids.second);
  assert(await page.locator(".table-column-editor").getAttribute("open") !== null, "Configurar colunas foi fechado ao trocar por tabela equivalente.");
  assert(await page.locator(".table-bulk-entry").getAttribute("open") !== null, "Colar várias linhas foi fechado ao trocar por tabela equivalente.");

  await page.locator('[data-inspector-tab="style"]').click();
  await page.evaluate(id => CatalogEditor.store.selectComponentInContext(id), ids.first);
  assert(await page.locator('[data-inspector-tab="style"]').getAttribute("aria-selected") === "true", "A aba Visual não acompanhou a tarefa entre tabelas equivalentes.");

  await page.evaluate(() => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.insertComponent = "tipo-inexistente";
    button.textContent = "Ação inválida de teste";
    document.getElementById("componentPalette").append(button);
  });
  await page.locator('[data-insert-component="tipo-inexistente"]').click();
  const status = await page.locator("#documentStatus").textContent();
  assert(status.includes("não pode ser inserido"), "Uma ação sem resultado permaneceu silenciosa.");
  assert(errors.length === 0, `Erros no navegador: ${errors.join(" | ")}`);
  await browser.close();
  console.log("✓ Aba, disclosures e diagnóstico de ação sem efeito preservados entre tarefas equivalentes.");
})().catch(error => { console.error(error); process.exitCode = 1; });
