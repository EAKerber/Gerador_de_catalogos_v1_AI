/* DB-05.20.3 — referências detalhadas através do store real. */
"use strict";

const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = process.env.CATALOG_REFERENCE_OUTPUT_DIR || path.join("audit-output", "db-05.20.3", "references");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;
let page;

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogDocumentValidator?.VERSION === "1.1.0");

  const result = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    const card = store.addComponent("product-card", { x: 24, y: 24, width: 350, height: 300 });
    const standaloneArt = store.addComponent("art", { x: 410, y: 24, width: 210, height: 160 }, { props: { role: "technical", assetId: null } });

    const baseDraft = store.getPublicationReport("draft");
    const basePublication = store.getPublicationReport("publication");
    const exported = store.getExportDocument();
    const clone = value => JSON.parse(JSON.stringify(value));
    const visit = (children, callback) => (children || []).forEach(component => {
      callback(component);
      visit(component.children, callback);
    });
    const find = (document, id) => {
      let found = null;
      (document.pages || []).forEach(pageItem => visit(pageItem.children, component => { if (component.id === id) found = component; }));
      return found;
    };

    const corrupted = clone(exported);
    find(corrupted, card.id).binding.productId = "product-404";
    find(corrupted, standaloneArt.id).props.assetId = "asset-404";
    const corruptedDraft = CatalogDocumentValidator.validate(corrupted, { target: "draft" });
    const corruptedPublication = CatalogDocumentValidator.validate(corrupted, { target: "publication" });

    const assetResolved = clone(corrupted);
    const assets = assetResolved.collections.find(collection => collection.id === "assets");
    assets.items.push({ id: "asset-404", label: "Asset de teste", metadata: { mimeType: "image/png", width: 10, height: 10 }, reference: null });
    const resolvedAssetPublication = CatalogDocumentValidator.validate(assetResolved, { target: "publication" });

    return {
      ids: { cardId: card.id, standaloneArtId: standaloneArt.id },
      validatorVersion: CatalogDocumentValidator.VERSION,
      schemaVersion: exported.schemaVersion,
      baseDraft,
      basePublication,
      corruptedDraft,
      corruptedPublication,
      resolvedAssetPublication
    };
  });

  const optionalKinds = result.basePublication.references.optional.map(item => `${item.kind}:${item.reason}`);
  assert(result.validatorVersion === "1.1.0", "O browser não carregou o validador 1.1.0.");
  assert(result.schemaVersion === "1.16.0", "A alteração de diagnóstico modificou o schema.");
  assert(result.baseDraft.summary.missingReferences === 0, "Card local foi contado como referência ausente no rascunho.");
  assert(result.basePublication.summary.missingReferences === 0, "Card local foi contado como referência ausente na publicação.");
  assert(result.baseDraft.ok === true && result.baseDraft.visualIntegrity?.summary.blockingIssues === 0, `Rascunho autônomo deveria permanecer exportável: ${JSON.stringify(result.baseDraft.issues)}`);
  assert(result.basePublication.ok === false, "A publicação deveria ser bloqueada pelos truncamentos renderizados do documento-base.");
  assert(result.basePublication.visualIntegrity?.summary.truncations >= 1, "O relatório de publicação não materializou o truncamento renderizado conhecido.");
  assert(result.basePublication.issues.some(issue => issue.code === "TEXT_ELLIPSIS_APPLIED" && issue.text === "Alta resistência"), "O diagnóstico não identificou a reticência real em Alta resistência.");
  assert(optionalKinds.filter(value => value === "product:local-content").length === 1, "O card local não aparece como vínculo opcional.");
  assert(optionalKinds.filter(value => value === "asset:placeholder-without-asset").length === 2, `Esperadas duas artes opcionais, obtido ${JSON.stringify(optionalKinds)}.`);

  assert(result.corruptedDraft.summary.missingReferences === 2, "IDs explícitos inexistentes não produziram duas referências ausentes.");
  assert(result.corruptedDraft.summary.missingReferences === result.corruptedDraft.references.missing.length, "Resumo e detalhes divergiram no browser.");
  const draftByKind = Object.fromEntries(result.corruptedDraft.references.missing.map(item => [item.kind, item]));
  assert(draftByKind.product.referenceId === "product-404" && draftByKind.product.severity === "error", "Produto ausente não foi identificado como bloqueante.");
  assert(draftByKind.asset.referenceId === "asset-404" && draftByKind.asset.severity === "warning", "Asset ausente não foi identificado como aviso no rascunho.");
  assert(result.corruptedPublication.references.missing.every(item => item.severity === "error"), "A publicação não tornou todas as referências obrigatórias bloqueantes.");

  assert(result.resolvedAssetPublication.summary.missingReferences === 1, "Registrar o asset não removeu somente a referência de asset.");
  assert(result.resolvedAssetPublication.references.missing[0].kind === "product", "A referência restante deveria ser exclusivamente o produto ausente.");

  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  fs.writeFileSync(path.join(outputDir, "reference-report.json"), `${JSON.stringify({ ...result, pageErrors, consoleErrors }, null, 2)}\n`);
  await page.screenshot({ path: path.join(outputDir, "reference-report-canvas.png"), fullPage: true });

  await browser.close();
  browser = null;
  console.log("✓ DB-05.20.3 validou cards locais, placeholders e IDs explicitamente ausentes no editor real.");
})().catch(async error => {
  fs.writeFileSync(path.join(outputDir, "reference-report-error.json"), `${JSON.stringify({ message: error.message, stack: error.stack }, null, 2)}\n`);
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
