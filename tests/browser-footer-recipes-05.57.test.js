/* Incremento 05.57A — seletor de receita e quantidade do footer na interface real. */
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser = null;

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  const fixture = await page.evaluate(() => {
    CatalogEditor.store.reset();
    const footer = CatalogEditor.store.insertComponent("catalog-footer");
    CatalogEditor.store.setSelection(footer.id);
    return { footerId: footer.id, history: CatalogEditor.store.getHistoryState().undoCount };
  });

  await page.locator('[data-inspector-tab="content"]').click();
  await page.locator("[data-footer-recipe]").selectOption("informative");
  await page.locator("[data-footer-count]").selectOption("5");
  await page.locator("[data-footer-recipe-apply]").click();
  await page.waitForFunction(id => CatalogEditor.store.findComponent(id)?.component.children.filter(child => child.type === "footer-item").length === 5, fixture.footerId);

  const applied = await page.evaluate(id => {
    const footer = CatalogEditor.store.findComponent(id).component;
    return {
      recipeId: footer.props.recipeId,
      count: footer.children.filter(child => child.type === "footer-item").length,
      roles: footer.children.filter(child => child.type === "footer-item").map(child => child.props.role),
      pending: footer.children.filter(child => child.props.placeholder === true).length,
      history: CatalogEditor.store.getHistoryState()
    };
  }, fixture.footerId);
  assert(applied.recipeId === "informative" && applied.count === 5, `Receita ou quantidade não foram aplicadas: ${JSON.stringify(applied)}.`);
  assert(applied.roles.includes("contact") && applied.roles.includes("page") && applied.pending >= 4, "Papéis ou pendências factualmente inertes foram perdidos.");
  assert(applied.history.undoCount === fixture.history + 1 && applied.history.undoLabel === "Ajustar receita do rodapé", "A interface fragmentou a troca em mais de uma ação.");

  await page.evaluate(() => CatalogEditor.store.undo());
  assert(await page.evaluate(id => CatalogEditor.store.findComponent(id).component.children.length, fixture.footerId) === 3, "Desfazer não restaurou a receita de contato.");
  assert(await page.locator(".inspector-section--footer").getByText("Faixa recomendada: 2–5").count() === 1, "A recomendação de densidade não está visível.");
  assert(errors.length === 0, `Erros de página: ${errors.join(" | ")}`);
  console.log("✓ 05.57A expõe receitas, quantidade recomendada e undo único no footer.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await browser?.close();
});
