/* DB-05.20.5 — posição e tamanho aplicados em uma única transação. */
"use strict";

const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = process.env.CATALOG_FRAME_OUTPUT_DIR || path.join("audit-output", "db-05.20.5", "frame-application");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sameFrame = (left, right) => ["x", "y", "width", "height"].every(key => Math.abs(Number(left[key]) - Number(right[key])) < .01);
let browser;
let page;

fs.mkdirSync(outputDir, { recursive: true });

async function history() {
  return page.evaluate(() => CatalogEditor.store.getHistoryState());
}

async function frame(id) {
  return page.evaluate(componentId => ({ ...CatalogEditor.store.findComponent(componentId).component.frame }), id);
}

async function fillDraft(values) {
  for (const [key, value] of Object.entries(values)) await page.locator(`[data-frame-draft-path="${key}"]`).fill(String(value));
}

async function applyFrame() {
  await page.locator("[data-frame-apply-all]").click();
  await page.waitForTimeout(30);
}

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogInspectorPanel);

  const id = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false, snapEnabled: true });
    return store.addComponent("text", { x: 40, y: 60, width: 180, height: 70 }, { props: { content: "Geometria conjunta" } }).id;
  });
  await page.waitForSelector(`[data-component-id="${id}"]`);
  await page.locator("[data-toggle-all-properties]").first().click();
  await page.locator('[data-frame-draft-path="x"]').waitFor({ state: "visible" });

  const initialFrame = await frame(id);
  const initialHistory = await history();
  const requested = { x: 120, y: 160, width: 240, height: 90 };
  await fillDraft(requested);
  assert(sameFrame(await frame(id), initialFrame), "Editar o rascunho alterou o frame antes da confirmação.");
  assert((await history()).undoCount === initialHistory.undoCount, "Editar o rascunho criou histórico antes da confirmação.");

  await applyFrame();
  const applied = await frame(id);
  const appliedHistory = await history();
  assert(sameFrame(applied, requested), `Frame conjunto divergente: ${JSON.stringify(applied)}.`);
  assert(appliedHistory.undoCount === initialHistory.undoCount + 1, "A aplicação conjunta não criou exatamente uma entrada de histórico.");
  assert(appliedHistory.undoLabel === "Aplicar geometria da seleção", `Rótulo de histórico inesperado: ${appliedHistory.undoLabel}.`);

  await page.locator("#undoButton").click();
  await page.waitForTimeout(30);
  assert(sameFrame(await frame(id), initialFrame), "Undo não restaurou o frame anterior.");
  await page.locator("#redoButton").click();
  await page.waitForTimeout(30);
  assert(sameFrame(await frame(id), applied), "Redo não restaurou o frame aplicado.");

  const beforeMinimum = await history();
  await fillDraft({ x: 790, y: 1120, width: 1, height: 1 });
  await applyFrame();
  const minimumApplied = await frame(id);
  const technical = await page.evaluate(componentId => CatalogEditor.store.getMinimumProfile(componentId).technical, id);
  assert(minimumApplied.width >= technical.width && minimumApplied.height >= technical.height, "A aplicação conjunta ignorou o mínimo técnico.");
  assert(minimumApplied.x + minimumApplied.width <= 794 && minimumApplied.y + minimumApplied.height <= 1123, "A aplicação conjunta escapou da página.");
  assert((await history()).undoCount === beforeMinimum.undoCount + 1, "Clamp de mínimo/limite fragmentou o histórico.");

  const beforePresetFrame = await frame(id);
  const beforePresetHistory = await history();
  await page.locator("[data-frame-preset]").selectOption("full-width");
  await page.waitForTimeout(20);
  const draftFullWidth = await page.evaluate(() => Object.fromEntries(["x", "y", "width", "height"].map(key => [key, Number(document.querySelector(`[data-frame-draft-path="${key}"]`).value)])));
  assert(sameFrame(await frame(id), beforePresetFrame), "Selecionar preset alterou o documento antes da confirmação.");
  assert((await history()).undoCount === beforePresetHistory.undoCount, "Selecionar preset criou histórico.");
  assert(draftFullWidth.x === 24 && draftFullWidth.width === 746, `Preset faixa total incorreto: ${JSON.stringify(draftFullWidth)}.`);
  await applyFrame();
  const fullWidth = await frame(id);
  assert(fullWidth.x === 24 && fullWidth.width === 746, `Faixa total não foi aplicada: ${JSON.stringify(fullWidth)}.`);

  const beforeBottom = await history();
  await page.locator("[data-frame-preset]").selectOption("safe-bottom");
  const draftBottom = Number(await page.locator('[data-frame-draft-path="y"]').inputValue());
  assert((await history()).undoCount === beforeBottom.undoCount, "Preset base segura criou histórico antes da aplicação.");
  await applyFrame();
  const bottom = await frame(id);
  assert(bottom.y === draftBottom && bottom.y + bottom.height === 1123 - 24, `Base segura incorreta: ${JSON.stringify(bottom)}.`);

  const exported = await page.evaluate(() => CatalogEditor.store.getExportDocument());
  assert(exported.schemaVersion === "1.16.0", "A aplicação conjunta alterou o schema.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  const report = { id, initialFrame, requested, applied, minimumApplied, technical, draftFullWidth, fullWidth, draftBottom, bottom, history: await history(), pageErrors, consoleErrors };
  fs.writeFileSync(path.join(outputDir, "frame-application-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await page.screenshot({ path: path.join(outputDir, "frame-application.png"), fullPage: true });

  await browser.close();
  browser = null;
  console.log("✓ DB-05.20.5 aplicou frame, presets, limites e undo/redo em transações únicas.");
})().catch(async error => {
  fs.writeFileSync(path.join(outputDir, "frame-application-error.json"), `${JSON.stringify({ message: error.message, stack: error.stack }, null, 2)}\n`);
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
