/* Contrato visual de linhas atômicas entre canvas e impressão A4. */
const fs = require("fs");
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];
const pdfPath = process.env.CATALOG_PDF || "/tmp/catalogo-print-fidelity.pdf";
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => {
    CatalogEditor.store.addComponent("catalog-header", { x: 24, y: 24, width: 746, height: 140 });
    CatalogEditor.store.addComponent("product-card", { x: 24, y: 190, width: 350, height: 280 });
    CatalogEditor.store.addComponent("catalog-footer", { x: 24, y: 999, width: 746, height: 100 });
  });

  const screen = await page.evaluate(() => Array.from(document.querySelectorAll(".editor-component--separator")).map(element => {
    const line = element.querySelector(".component-separator > span");
    const orientation = element.querySelector(".component-separator").dataset.orientation;
    return { orientation, color: getComputedStyle(line).backgroundColor, width: parseFloat(getComputedStyle(line).width), height: parseFloat(getComputedStyle(line).height), border: parseFloat(getComputedStyle(element).borderTopWidth) };
  }));
  assert(screen.length === 2, "O cabeçalho não usa dois átomos de linha.");
  assert(screen.every(item => item.color === "rgb(253, 8, 7)" && item.border === 0), "O canvas ainda mistura a linha vermelha com a borda cinza genérica.");

  if (process.env.CATALOG_SCREENSHOT) await page.locator("#pageCanvas").screenshot({ path: process.env.CATALOG_SCREENSHOT });
  await page.emulateMedia({ media: "print" });
  const printed = await page.evaluate(() => Array.from(document.querySelectorAll(".editor-component--separator")).map(element => {
    const line = element.querySelector(".component-separator > span");
    const orientation = element.querySelector(".component-separator").dataset.orientation;
    return { orientation, color: getComputedStyle(line).backgroundColor, width: parseFloat(getComputedStyle(line).width), height: parseFloat(getComputedStyle(line).height) };
  }));
  assert(printed.every(item => item.color === "rgb(253, 8, 7)"), "A impressão alterou a cor dos separadores.");
  assert(printed.find(item => item.orientation === "horizontal").height >= 2.2, "A linha horizontal perdeu espessura física na impressão.");
  assert(printed.find(item => item.orientation === "vertical").width >= 2.2, "A linha vertical perdeu espessura física na impressão.");

  await page.pdf({ path: pdfPath, format: "A4", printBackground: true, preferCSSPageSize: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
  assert(fs.statSync(pdfPath).size > 1000, "O PDF de comparação não foi gerado.");
  await browser.close();
  console.log("✓ Cores e espessuras físicas das linhas validadas no canvas e no PDF.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
