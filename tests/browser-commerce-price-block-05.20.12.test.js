/* DB-05.20.12 — receita de preço no editor real. */
"use strict";

const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");

const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = process.env.CATALOG_PRICE_BLOCK_OUTPUT_DIR || path.join("audit-output", "db-05.20.12", "price-block");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor?.store && window.CatalogCommercePriceBlockRecipeContract?.VERSION === "05.20.12");

  const fixture = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false, snapEnabled: false, smartSnapEnabled: false });
    const before = store.getHistoryState();
    const inserted = store.insertComponentFromTemplate("commerce-price-block");
    const after = store.getHistoryState();
    const root = store.findComponent(inserted.id).component;
    const all = [];
    const visit = component => { all.push(component); (component.children || []).forEach(visit); };
    visit(root);
    const roles = Object.fromEntries(all.filter(component => component.props?.recipeRole).map(component => [component.props.recipeRole, component.id]));
    return { rootId: root.id, roles, before, after, frame: { ...root.frame } };
  });

  assert(fixture.after.undoCount === fixture.before.undoCount + 1, "Inserção da receita não criou exatamente uma entrada de histórico.");
  assert(fixture.after.undoLabel, "Inserção não publicou rótulo de histórico.");
  await page.waitForSelector(`[data-component-id="${fixture.rootId}"]`);

  async function measure(media) {
    return page.evaluate(({ fixture, media }) => {
      const rect = element => {
        const box = element?.getBoundingClientRect();
        return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height } : null;
      };
      const readText = role => {
        const id = fixture.roles[role];
        const root = id ? document.querySelector(`[data-component-id="${id}"]`) : null;
        const text = root?.querySelector(".component-text p");
        const style = text ? getComputedStyle(text) : null;
        return { id, root: rect(root), text: text?.textContent || "", fontSize: style ? Number.parseFloat(style.fontSize) : 0, color: style?.color || null };
      };
      const rootElement = document.querySelector(`[data-component-id="${fixture.rootId}"]`);
      const rootStyle = rootElement ? getComputedStyle(rootElement) : null;
      return {
        media,
        root: rect(rootElement),
        rootBackground: rootStyle?.backgroundColor || null,
        oldPrice: readText("old-price"),
        qualifier: readText("qualifier"),
        currency: readText("currency"),
        amount: readText("amount"),
        unit: readText("unit"),
        publication: CatalogEditor.store.getPublicationReport("draft").summary
      };
    }, { fixture, media });
  }

  function validate(snapshot) {
    assert(snapshot.root?.width > 0 && snapshot.root?.height > 0, "Bloco de preço não foi renderizado.");
    assert(snapshot.amount.fontSize >= snapshot.oldPrice.fontSize * 2, `Preço atual não domina preço antigo: ${snapshot.amount.fontSize}/${snapshot.oldPrice.fontSize}.`);
    assert(snapshot.amount.fontSize >= snapshot.qualifier.fontSize * 1.5, `Preço atual não domina qualificador: ${snapshot.amount.fontSize}/${snapshot.qualifier.fontSize}.`);
    assert(snapshot.currency.text === "R$" && snapshot.amount.text === "3,99", "Moeda ou valor padrão não foram preservados.");
    assert(snapshot.publication.collisions === 0, `Bloco introduziu colisões: ${JSON.stringify(snapshot.publication)}.`);
    assert(snapshot.publication.overflows === 0, `Bloco introduziu overflow: ${JSON.stringify(snapshot.publication)}.`);
    assert(snapshot.publication.missingReferences === 0, "Bloco introduziu referência obrigatória ausente.");
  }

  const screen = await measure("screen");
  validate(screen);
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await measure("print");
  validate(printed);
  for (const role of ["oldPrice", "qualifier", "currency", "amount", "unit"]) {
    assert(Math.abs(printed[role].fontSize - screen[role].fontSize) < 0.1, `${role}: impressão alterou tipografia.`);
  }

  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });
  assert(await page.evaluate(() => CatalogEditor.store.undo()), "Não foi possível desfazer a inserção.");
  assert(await page.evaluate(rootId => !CatalogEditor.store.findComponent(rootId), fixture.rootId), "Undo não removeu o bloco inteiro.");
  assert(await page.evaluate(() => CatalogEditor.store.redo()), "Não foi possível refazer a inserção.");
  await page.waitForSelector(`[data-component-id="${fixture.rootId}"]`);

  const optionalResult = await page.evaluate(rootId => {
    const store = CatalogEditor.store;
    const root = store.findComponent(rootId).component;
    const flatten = component => [component, ...(component.children || []).flatMap(flatten)];
    const roles = () => Object.fromEntries(flatten(store.findComponent(rootId).component).filter(item => item.props?.recipeRole).map(item => [item.props.recipeRole, item.id]));
    const before = roles();
    for (const role of ["old-price", "qualifier", "unit"]) {
      const current = roles();
      store.deleteComponent(current[role]);
      store.reflowComponentTree(rootId);
    }
    const after = roles();
    return {
      before,
      after,
      rootFrame: { ...store.findComponent(rootId).component.frame },
      publication: store.getPublicationReport("draft").summary
    };
  }, fixture.rootId);
  for (const role of ["price-block", "currency", "amount"]) assert(optionalResult.after[role], `Remoção opcional eliminou papel obrigatório ${role}.`);
  for (const role of ["old-price", "qualifier", "unit"]) assert(!optionalResult.after[role], `Papel opcional ${role} não foi removido.`);
  assert(optionalResult.publication.collisions === 0 && optionalResult.publication.overflows === 0, `Remoção opcional quebrou geometria: ${JSON.stringify(optionalResult.publication)}.`);

  const exported = await page.evaluate(() => CatalogEditor.store.getExportDocument());
  assert(exported.schemaVersion === "1.16.0", "A receita de preço alterou o schema.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  const report = { fixture, screen, printed, optionalResult, schemaVersion: exported.schemaVersion, pageErrors, consoleErrors };
  fs.writeFileSync(path.join(outputDir, "commerce-price-block-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await page.screenshot({ path: path.join(outputDir, "commerce-price-block.png"), fullPage: true });

  await browser.close();
  browser = null;
  console.log("✓ DB-05.20.12 validou inserção, hierarquia, opcionais, histórico e impressão do bloco de preço.");
})().catch(async error => {
  fs.writeFileSync(path.join(outputDir, "commerce-price-block-error.json"), `${JSON.stringify({ message: error.message, stack: error.stack }, null, 2)}\n`);
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
