/* DB-05.20.16 — benchmark promocional V2 com assets reais e portáveis. */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const fflate = require(path.resolve(__dirname, "..", "vendor", "fflate.js"));

const root = path.resolve(__dirname, "..");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const outputRoot = path.resolve(process.env.CATALOG_ASSETS_OUTPUT_DIR || "/tmp/catalog-assets-05.20.16");
const baselineDir = path.join(outputRoot, "baseline");
const assetsDir = path.join(outputRoot, "assets");
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "promotional-assets-05.20.16.json"), "utf8"));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

fs.mkdirSync(baselineDir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });

function decodeFixtures() {
  const decoded = new Map();
  for (const asset of manifest.assets) {
    const target = path.join(assetsDir, asset.fileName);
    const bytes = Buffer.from(asset.dataBase64, "base64");
    const digest = crypto.createHash("sha256").update(bytes).digest("hex");
    assert(bytes.length === asset.size, `${asset.fileName}: tamanho do fixture divergiu (${bytes.length}/${asset.size}).`);
    assert(digest === asset.sha256, `${asset.fileName}: SHA-256 do fixture divergiu.`);
    fs.writeFileSync(target, bytes);
    decoded.set(asset.role, { ...asset, path: target });
  }
  return decoded;
}

function runBaseline() {
  const result = spawnSync(process.execPath, [path.join(__dirname, "browser-promotional-generalization-v2-05.20.14.test.js")], {
    cwd: root,
    env: { ...process.env, CATALOG_GENERALIZATION_OUTPUT_DIR: baselineDir },
    encoding: "utf8",
    stdio: "inherit"
  });
  assert(result.status === 0, `A reconstrução V2 de base falhou com status ${result.status}.`);
  const report = JSON.parse(fs.readFileSync(path.join(baselineDir, "promotional-generalization-report.json"), "utf8"));
  assert(["pass", "pass-with-findings"].includes(report.status), `Status inesperado do baseline: ${report.status}.`);
  assert(report.actionCount <= 190, `Baseline excedeu 190 ações: ${report.actionCount}.`);
  assert(report.metrics.offerUnits === 4 && report.metrics.priceContainers === 4 && report.metrics.tableRows === 0, "Baseline comercial V2 não foi preservado.");
  assert(report.metrics.placeholderArts === 5, `Baseline deveria conter cinco placeholders de arte; recebeu ${report.metrics.placeholderArts}.`);
  return report;
}

function cleanSnapshot(value) {
  if (Array.isArray(value)) return value.map(cleanSnapshot);
  if (!value || typeof value !== "object") return value;
  const ignored = new Set(["updatedAt", "lastSavedAt", "generatedAt", "editor", "session", "reference", "sha256"]);
  return Object.fromEntries(Object.keys(value).filter(key => !ignored.has(key)).sort().map(key => [key, cleanSnapshot(value[key])]));
}

const signature = value => JSON.stringify(cleanSnapshot(value));
const selectorForComponent = id => `[data-component-id="${id}"]`;

async function importDocument(page, filePath) {
  await page.locator("#importButton").click();
  await page.locator("#documentImportFileInput").setInputFiles(filePath);
  await page.locator("[data-document-import-analysis]").waitFor({ state: "visible" });
  await page.locator("[data-confirm-document-import]").waitFor({ state: "visible" });
  await page.locator("[data-confirm-document-import]").click();
  await page.locator("#importDocumentDialog").waitFor({ state: "hidden" });
}

async function pageAssetTargets(page) {
  return page.evaluate(() => {
    const flatten = component => [component, ...(component.children || []).flatMap(flatten)];
    const pageChildren = CatalogEditor.store.getPage().children;
    const logo = pageChildren.find(component => component.type === "art" && component.props?.role === "logo");
    const offers = pageChildren
      .filter(component => component.props?.recipeRole === "offer-unit")
      .sort((left, right) => left.frame.x - right.frame.x);
    const media = offers.map(offer => flatten(offer).find(component => component.type === "art" && component.props?.recipeRole === "media"));
    return { logoId: logo?.id || null, mediaIds: media.map(component => component?.id || null) };
  });
}

async function collectMetrics(page) {
  return page.evaluate(async () => {
    const flatten = components => components.flatMap(component => [component, ...flatten(component.children || [])]);
    const components = flatten(CatalogEditor.store.getPage().children);
    const arts = components.filter(component => component.type === "art");
    const offerUnits = components.filter(component => component.props?.recipeRole === "offer-unit");
    const priceBlocks = components.filter(component => component.props?.recipeRole === "price-block");
    const tableRows = components.filter(component => component.type === "data-table")
      .reduce((total, table) => total + CatalogEditor.store.getTableRows(table).length, 0);
    const ids = components.map(component => component.id);
    const domIds = Array.from(document.querySelectorAll("#componentLayer .editor-component[data-component-id]")).map(element => element.dataset.componentId);
    const assets = CatalogEditor.store.getCollection("assets")?.items || [];
    const usages = arts.filter(component => component.props?.assetId);
    const publication = CatalogEditor.store.getPublicationReport("draft");
    const digests = [];
    for (const asset of assets) {
      const blob = await CatalogEditor.assetStorage.get(asset.reference?.key);
      const bytes = blob ? await blob.arrayBuffer() : null;
      const hash = bytes ? await crypto.subtle.digest("SHA-256", bytes) : null;
      digests.push({
        id: asset.id,
        fileName: asset.metadata?.fileName || null,
        reference: asset.reference || null,
        byteLength: bytes?.byteLength || 0,
        sha256: hash ? Array.from(new Uint8Array(hash)).map(value => value.toString(16).padStart(2, "0")).join("") : null
      });
    }
    return {
      schemaVersion: CatalogEditor.store.getState().schemaVersion,
      modelCount: components.length,
      domCount: domIds.length,
      uniqueModelIds: new Set(ids).size,
      uniqueDOMIds: new Set(domIds).size,
      missingDOM: ids.filter(id => !domIds.includes(id)),
      offerUnits: offerUnits.length,
      priceBlocks: priceBlocks.length,
      tableRows,
      assetCollectionCount: assets.length,
      assetUsages: usages.length,
      placeholderArts: arts.filter(component => !component.props?.assetId).length,
      artDetails: arts.map(component => ({
        id: component.id,
        recipeRole: component.props?.recipeRole || null,
        role: component.props?.role || null,
        assetId: component.props?.assetId || null,
        fit: component.props?.fit || null,
        focalX: Number(component.props?.focalX ?? 50),
        focalY: Number(component.props?.focalY ?? 50),
        alt: component.props?.alt || ""
      })),
      assetDigests: digests,
      publication: publication.summary,
      references: publication.references
    };
  });
}

async function exportJSON(page, targetPath) {
  await page.locator("#exportMenu > summary").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportButton").click();
  const download = await downloadPromise;
  await download.saveAs(targetPath);
}

async function exportPackage(page, targetPath) {
  await page.locator("#exportMenu > summary").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportPackageButton").click();
  const download = await downloadPromise;
  await download.saveAs(targetPath);
}

(async () => {
  const baseline = runBaseline();
  const fixtures = decodeFixtures();
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const pageErrors = [];
  const consoleErrors = [];
  const responseErrors = [];
  const assetActions = [];
  let page;
  let roundTripPage;

  const act = async (label, operation) => {
    const startedAt = Date.now();
    const result = await operation();
    assetActions.push({ index: assetActions.length + 1, label, durationMs: Date.now() - startedAt });
    return result;
  };

  try {
    page = await browser.newPage({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("response", response => { if (response.status() >= 400) responseErrors.push({ status: response.status(), url: response.url() }); });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.CatalogEditor?.store && window.CatalogEditor?.assetLibrary && window.CatalogEditor?.projectPackage);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => window.CatalogEditor?.store && window.CatalogEditor?.assetLibrary);

    const baselineDocumentPath = path.join(baselineDir, "promotional-generalization-document.json");
    await importDocument(page, baselineDocumentPath);
    await page.waitForFunction(() => CatalogEditor.store.getPage().children.some(component => component.props?.recipeRole === "offer-unit"));
    const targets = await pageAssetTargets(page);
    assert(targets.logoId && targets.mediaIds.length === 4 && targets.mediaIds.every(Boolean), `Slots de asset inesperados: ${JSON.stringify(targets)}.`);

    const layersTab = page.locator('[data-left-panel-tab="layers"]');
    if (await layersTab.getAttribute("aria-selected") !== "true") await act("Abrir Camadas para vincular assets", () => layersTab.click());

    async function selectArt(componentId) {
      const item = page.locator(`[data-layer-id="${componentId}"]`).first();
      await item.waitFor({ state: "visible" });
      await act(`Selecionar arte ${componentId}`, () => item.click());
      await page.waitForFunction(id => CatalogEditor.store.getSelected()?.id === id, componentId);
    }

    async function setRole(componentId, role) {
      await selectArt(componentId);
      const contentTab = page.locator('[data-inspector-tab="content"]').first();
      if (await contentTab.count() && await contentTab.getAttribute("aria-selected") !== "true") await act(`Abrir conteúdo de ${componentId}`, () => contentTab.click());
      const control = page.locator('[data-prop-path="role"]').first();
      await control.waitFor({ state: "visible" });
      await act(`Definir papel ${role} em ${componentId}`, () => control.selectOption(role));
      await page.waitForFunction(({ id, role: expected }) => CatalogEditor.store.findComponent(id)?.component?.props?.role === expected, { id: componentId, role });
    }

    async function openAssetLibrary(componentId) {
      await selectArt(componentId);
      await act(`Abrir biblioteca para ${componentId}`, () => page.locator(`[data-open-asset-library][data-component-id="${componentId}"]`).first().click({ force: true }));
      await page.locator("#assetLibraryDialog").waitFor({ state: "visible" });
    }

    async function importAsset(componentId, fixture) {
      await openAssetLibrary(componentId);
      await act(`Importar ${fixture.fileName}`, () => page.locator("#assetFileInput").setInputFiles(fixture.path));
      await page.locator("#assetLibraryDialog").waitFor({ state: "hidden" });
      await page.waitForFunction(({ id, fileName }) => {
        const component = CatalogEditor.store.findComponent(id)?.component;
        const asset = component?.props?.assetId ? CatalogEditor.store.getAsset(component.props.assetId) : null;
        return asset?.metadata?.fileName === fileName;
      }, { id: componentId, fileName: fixture.fileName });
      return page.evaluate(id => CatalogEditor.store.findComponent(id).component.props.assetId, componentId);
    }

    async function useAsset(componentId, assetId) {
      await openAssetLibrary(componentId);
      await act(`Vincular asset existente a ${componentId}`, () => page.locator(`[data-use-asset="${assetId}"]`).click());
      await page.locator("#assetLibraryDialog").waitFor({ state: "hidden" });
      await page.waitForFunction(({ id, assetId: expected }) => CatalogEditor.store.findComponent(id)?.component?.props?.assetId === expected, { id: componentId, assetId });
    }

    await setRole(targets.logoId, "logo");
    const logoAssetId = await importAsset(targets.logoId, fixtures.get("logo"));
    await setRole(targets.mediaIds[0], "product");
    const productAssetId = await importAsset(targets.mediaIds[0], fixtures.get("product"));
    for (const mediaId of targets.mediaIds.slice(1, 3)) {
      await setRole(mediaId, "product");
      await useAsset(mediaId, productAssetId);
    }
    await setRole(targets.mediaIds[3], "technical");
    const technicalAssetId = await importAsset(targets.mediaIds[3], fixtures.get("technical"));

    const importedIds = { logoAssetId, productAssetId, technicalAssetId };
    assert(new Set(Object.values(importedIds)).size === 3, `Assets importados não são independentes: ${JSON.stringify(importedIds)}.`);
    await page.waitForFunction(() => {
      const ready = Array.from(document.querySelectorAll("#pageCanvas [data-asset-preview][data-asset-id]"))
        .filter(element => element.dataset.assetId && element.dataset.assetState === "ready");
      return ready.length === 5;
    });

    await page.evaluate(() => {
      CatalogEditor.store.setEditingContext(null);
      CatalogEditor.store.setSelection(null);
      CatalogEditor.store.setEditorSettings({ gridVisible: false, showGuides: false });
    });
    await page.waitForTimeout(50);
    const constructedMetrics = await collectMetrics(page);
    assert(constructedMetrics.assetCollectionCount === 3, `Esperados três assets; recebidos ${constructedMetrics.assetCollectionCount}.`);
    assert(constructedMetrics.assetUsages === 5 && constructedMetrics.placeholderArts === 0, `Vinculação incompleta: ${JSON.stringify({ usages: constructedMetrics.assetUsages, placeholders: constructedMetrics.placeholderArts })}.`);
    assert(constructedMetrics.offerUnits === 4 && constructedMetrics.priceBlocks === 4 && constructedMetrics.tableRows === 0, "Assets alteraram a estrutura comercial independente.");
    assert(constructedMetrics.schemaVersion === "1.16.0", `Assets alteraram o schema: ${constructedMetrics.schemaVersion}.`);
    assert(constructedMetrics.modelCount === constructedMetrics.domCount && constructedMetrics.uniqueModelIds === constructedMetrics.uniqueDOMIds && constructedMetrics.missingDOM.length === 0, "Modelo e DOM divergiram após assets.");
    assert(constructedMetrics.publication.collisions === 0 && constructedMetrics.publication.overflows === 0 && constructedMetrics.publication.missingReferences === 0, `Assets introduziram problemas de publicação: ${JSON.stringify(constructedMetrics.publication)}.`);

    const expectedHashes = new Set(manifest.assets.map(asset => asset.sha256));
    assert(constructedMetrics.assetDigests.every(item => expectedHashes.has(item.sha256) && item.byteLength > 0), `Bytes locais divergiram: ${JSON.stringify(constructedMetrics.assetDigests)}.`);

    await page.screenshot({ path: path.join(assetsDir, "constructed-full.png"), fullPage: true });
    await page.locator("#pageCanvas").screenshot({ path: path.join(assetsDir, "constructed-canvas.png") });
    const documentPath = path.join(assetsDir, "promotional-generalization-document.json");
    await exportJSON(page, documentPath);
    const constructedSnapshot = await page.evaluate(() => CatalogEditor.store.getExportDocument());

    const packagePath = path.join(assetsDir, "promotional-assets-project.zip");
    await exportPackage(page, packagePath);
    const packageEntries = fflate.unzipSync(fs.readFileSync(packagePath));
    const packageManifest = JSON.parse(new TextDecoder().decode(packageEntries["catalog-project.json"]));
    assert(packageManifest.assets.length === 3, `Pacote contém ${packageManifest.assets.length} assets.`);
    assert(packageManifest.assets.every(asset => expectedHashes.has(asset.sha256)), "O pacote não preservou os SHA-256 dos fixtures.");

    roundTripPage = await browser.newPage({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
    roundTripPage.on("pageerror", error => pageErrors.push(error.message));
    roundTripPage.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
    roundTripPage.on("response", response => { if (response.status() >= 400) responseErrors.push({ status: response.status(), url: response.url() }); });
    await roundTripPage.goto(baseURL, { waitUntil: "networkidle" });
    await roundTripPage.waitForFunction(() => window.CatalogEditor?.store && window.CatalogEditor?.projectPackage);
    await roundTripPage.evaluate(() => localStorage.clear());
    await roundTripPage.reload({ waitUntil: "networkidle" });
    await roundTripPage.waitForFunction(() => window.CatalogEditor?.store && window.CatalogEditor?.projectPackage);
    const blankSnapshot = await roundTripPage.evaluate(() => CatalogEditor.store.getExportDocument());
    await importDocument(roundTripPage, packagePath);
    await roundTripPage.waitForFunction(() => (CatalogEditor.store.getCollection("assets")?.items || []).length === 3);
    await roundTripPage.waitForFunction(() => Array.from(document.querySelectorAll("#pageCanvas [data-asset-preview][data-asset-id]")).filter(element => element.dataset.assetState === "ready").length === 5);

    await roundTripPage.evaluate(() => {
      CatalogEditor.store.setEditingContext(null);
      CatalogEditor.store.setSelection(null);
      CatalogEditor.store.setEditorSettings({ gridVisible: false, showGuides: false });
    });
    await roundTripPage.waitForTimeout(50);
    const reimportedMetrics = await collectMetrics(roundTripPage);
    const reimportedSnapshot = await roundTripPage.evaluate(() => CatalogEditor.store.getExportDocument());
    assert(signature(reimportedSnapshot) === signature(constructedSnapshot), "Documento com assets divergiu após pacote/reimportação.");
    assert(reimportedMetrics.assetDigests.every(item => expectedHashes.has(item.sha256) && item.reference?.provider === "indexeddb"), `Bytes reimportados ou referências divergiram: ${JSON.stringify(reimportedMetrics.assetDigests)}.`);
    assert(reimportedMetrics.assetUsages === 5 && reimportedMetrics.placeholderArts === 0, "A reimportação perdeu vínculos de asset.");
    assert(reimportedMetrics.publication.collisions === 0 && reimportedMetrics.publication.overflows === 0 && reimportedMetrics.publication.missingReferences === 0, "A reimportação introduziu problemas de publicação.");

    await roundTripPage.locator("#pageCanvas").screenshot({ path: path.join(assetsDir, "reimported-canvas.png") });
    assert(await roundTripPage.locator("#undoButton").isEnabled(), "Importação do pacote não criou histórico reversível.");
    await roundTripPage.locator("#undoButton").click();
    await roundTripPage.waitForFunction(expected => JSON.stringify(CatalogEditor.store.getExportDocument().pages) === JSON.stringify(expected.pages), blankSnapshot);
    await roundTripPage.locator("#redoButton").click();
    await roundTripPage.waitForFunction(() => {
      const assets = CatalogEditor.store.getCollection("assets")?.items || [];
      const offers = CatalogEditor.store.getPage().children.filter(component => component.props?.recipeRole === "offer-unit");
      const readyPreviews = Array.from(document.querySelectorAll("#pageCanvas [data-asset-preview][data-asset-id]"))
        .filter(element => element.dataset.assetState === "ready");
      return assets.length === 3 && offers.length === 4 && readyPreviews.length === 5;
    });
    const redoSnapshot = await roundTripPage.evaluate(() => CatalogEditor.store.getExportDocument());
    assert(signature(redoSnapshot) === signature(constructedSnapshot), "Redo não restaurou o pacote com assets.");

    assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
    assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);
    assert(responseErrors.length === 0, `Respostas HTTP com erro: ${JSON.stringify(responseErrors)}.`);

    const report = {
      suite: "Developer B 05.20.16 — promotional benchmark with real assets",
      reference: baseline.reference,
      status: "pass",
      policy: {
        wholeReferenceUsedAsAsset: false,
        commercialDataEmbeddedInAssets: false,
        nativeCommercialStructurePreserved: true,
        assetRoles: ["logo", "product", "technical"]
      },
      baseline: {
        status: baseline.status,
        actionCount: baseline.actionCount,
        metrics: baseline.metrics
      },
      assetPhase: {
        actionCount: assetActions.length,
        actions: assetActions,
        importedAssetIds: importedIds,
        usagePlan: { logo: 1, product: 3, technical: 1 }
      },
      actionCount: baseline.actionCount + assetActions.length,
      constructed: constructedMetrics,
      reimported: reimportedMetrics,
      package: {
        fileName: path.basename(packagePath),
        packageFormat: packageManifest.packageFormat,
        assetCount: packageManifest.assets.length,
        hashes: packageManifest.assets.map(asset => asset.sha256)
      },
      errors: { pageErrors, consoleErrors, responseErrors }
    };
    fs.writeFileSync(path.join(assetsDir, "promotional-generalization-report.json"), `${JSON.stringify(report, null, 2)}\n`);
    console.log(`✓ DB-05.20.16 vinculou três assets em cinco usos com ${assetActions.length} ações adicionais e round-trip portátil íntegro.`);
  } finally {
    if (roundTripPage) await roundTripPage.close().catch(() => {});
    if (page) await page.close().catch(() => {});
    await browser.close();
  }
})().catch(error => {
  fs.writeFileSync(path.join(assetsDir, "promotional-assets-error.json"), `${JSON.stringify({ message: error.message, stack: error.stack }, null, 2)}\n`);
  console.error(error);
  process.exitCode = 1;
});
