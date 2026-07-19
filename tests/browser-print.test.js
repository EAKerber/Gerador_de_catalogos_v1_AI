/* Smoke test da preparação de impressão A4 pelo diálogo nativo do navegador. */
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

  const state = await page.evaluate(() => {
    let calls = 0;
    const originalPrint = window.print;
    window.print = () => { calls += 1; };
    CatalogEditor.store.addComponent("product-card", { x: 24, y: 180, width: 350, height: 260 });
    document.getElementById("printButton").click();
    const result = {
      calls,
      printing: document.documentElement.dataset.printing,
      title: document.title,
      pageWidth: getComputedStyle(document.getElementById("pageCanvas")).width
    };
    window.print = originalPrint;
    return result;
  });
  assert(state.calls === 1, "O botão Imprimir / PDF não abriu a impressão nativa.");
  assert(state.printing === "true" && state.title === "catalogo-a4", "A impressão não prepara o documento para a saída A4.");
  assert(Number.parseFloat(state.pageWidth) > 700, "A página de impressão não preserva a escala lógica A4.");
  await browser.close();
  console.log("✓ Botão Imprimir / PDF e preparação A4 validados no navegador.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
