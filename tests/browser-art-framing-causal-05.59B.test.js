/* Incremento 05.59B — ensaio causal das quatro condições de enquadramento factual. */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const fflate = require(path.resolve(__dirname, "..", "vendor", "fflate.js"));

const root = path.resolve(__dirname, "..");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const outputRoot = path.resolve(process.env.CATALOG_ART_FRAMING_OUTPUT_DIR || path.join(root, "audit-output", "visual-review", "art-framing-causal"));
const evidenceRoot = path.join(root, "docs", "evidence", "05.59B", "art-framing-causal");
const packagePath = path.join(root, "docs", "evidence", "05.52", "practical-flow-2026-07-30", "revised", "catalog-project-package.zip");
const protocol = JSON.parse(fs.readFileSync(path.join(evidenceRoot, "protocol.json"), "utf8"));
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const round = value => Math.round(value * 10000) / 10000;

fs.mkdirSync(outputRoot, { recursive: true });
fs.mkdirSync(path.join(outputRoot, "screen"), { recursive: true });
fs.mkdirSync(path.join(outputRoot, "print"), { recursive: true });
fs.mkdirSync(path.join(outputRoot, "pdf"), { recursive: true });

const packageBytes = fs.readFileSync(packagePath);
const archive = fflate.unzipSync(packageBytes);
const sourceBytes = Buffer.from(archive[protocol.source.packageEntry]);
assert(sourceBytes.length > 0, "O asset factual não foi encontrado no pacote 05.52.");
assert(sha256(sourceBytes) === protocol.source.sha256, "O asset factual divergiu do hash preservado.");

const conditionFiles = new Map();
for (const condition of protocol.conditions) {
  if (condition.asset === "source") continue;
  const bytes = fs.readFileSync(path.join(evidenceRoot, condition.asset));
  assert(sha256(bytes) === condition.sha256, `${condition.id}: o derivado externo divergiu do protocolo.`);
  conditionFiles.set(condition.id, { bytes, path: path.join(evidenceRoot, condition.asset) });
}

async function importPackage(page) {
  await page.locator("#importButton").click();
  await page.locator("#documentImportFileInput").setInputFiles(packagePath);
  await page.locator("[data-document-import-analysis]").waitFor({ state: "visible" });
  await page.locator("[data-confirm-document-import]").waitFor({ state: "visible" });
  await page.locator("[data-confirm-document-import]").click();
  await page.locator("#importDocumentDialog").waitFor({ state: "hidden" });
  await page.waitForFunction(id => CatalogEditor.store.findComponent(id)?.component?.props?.assetId, protocol.target.componentId);
  await page.waitForFunction(id => document.querySelector(`[data-component-id="${id}"] [data-asset-preview]`)?.dataset.assetState === "ready", protocol.target.componentId);
}

async function selectArt(page) {
  await page.evaluate(id => CatalogEditor.store.setSelection(id), protocol.target.componentId);
  await page.waitForFunction(id => CatalogEditor.store.getSelected()?.id === id, protocol.target.componentId);
  const contentTab = page.locator('[data-inspector-tab="content"]').first();
  if (await contentTab.count() && await contentTab.getAttribute("aria-selected") !== "true") await contentTab.click();
}

async function uploadDerivative(page, condition) {
  const fixture = conditionFiles.get(condition.id);
  const fileName = path.basename(condition.asset);
  const assetId = `asset-05-59b-${condition.id}`;
  await page.evaluate(async ({ componentId, assetId, fileName, base64, width, height, sourceAssetId, method }) => {
    const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
    const blob = new Blob([bytes], { type: "image/png" });
    await CatalogEditor.assetStorage.put(assetId, blob);
    CatalogEditor.store.upsertCollectionItem("assets", {
      id: assetId,
      label: fileName.replace(/\.[^.]+$/, ""),
      metadata: {
        fileName,
        mimeType: "image/png",
        size: blob.size,
        width,
        height,
        createdAt: "2026-08-01T00:00:00.000Z",
        isVector: false,
        provenance: {
          origin: "derived",
          role: "product",
          relatedProductIds: [],
          sourceAssetIds: [sourceAssetId],
          method,
          fidelity: "product-faithful",
          generator: null
        },
        approval: { status: "review-required", publishAllowed: false, reviewedAt: null }
      },
      reference: { provider: "indexeddb", key: assetId }
    });
    CatalogEditor.store.setComponentAsset(componentId, assetId);
  }, {
    componentId: protocol.target.componentId,
    assetId,
    fileName,
    base64: fixture.bytes.toString("base64"),
    width: condition.width,
    height: condition.height,
    sourceAssetId: protocol.source.assetId,
    method: condition.derivation.operation
  });
  await page.waitForFunction(({ id, assetId, fileName }) => {
    const component = CatalogEditor.store.findComponent(id)?.component;
    const asset = component?.props?.assetId ? CatalogEditor.store.getAsset(component.props.assetId) : null;
    const preview = document.querySelector(`[data-component-id="${id}"] [data-asset-preview]`);
    return component?.props?.assetId === assetId && asset?.metadata?.fileName === fileName && preview?.dataset.assetState === "ready";
  }, { id: protocol.target.componentId, assetId, fileName });
}

async function useExistingAsset(page, assetId) {
  await page.evaluate(({ id, expected }) => CatalogEditor.store.setComponentAsset(id, expected), { id: protocol.target.componentId, expected: assetId });
  await page.waitForFunction(({ id, expected }) => {
    const component = CatalogEditor.store.findComponent(id)?.component;
    const preview = document.querySelector(`[data-component-id="${id}"] [data-asset-preview]`);
    return component?.props?.assetId === expected && preview?.dataset.assetState === "ready";
  }, { id: protocol.target.componentId, expected: assetId });
}

async function setNumericControl(page, property, value) {
  await selectArt(page);
  const input = page.locator(`[data-prop-path="${property}"]`).first();
  await input.fill(String(value));
  await input.press("Tab");
  await page.waitForFunction(({ id, property, expected }) => Number(CatalogEditor.store.findComponent(id)?.component?.props?.[property]) === expected, {
    id: protocol.target.componentId,
    property,
    expected: Number(value)
  });
}

async function applyProps(page, condition) {
  await selectArt(page);
  if (condition.id === "editor-framed") {
    await setNumericControl(page, "focalY", condition.props.focalY);
    await page.locator("[data-art-fill-focus]").click();
    await page.waitForFunction(id => CatalogEditor.store.findComponent(id)?.component?.props?.fit === "cover", protocol.target.componentId);
    await setNumericControl(page, "zoom", condition.props.zoom);
    return;
  }
  await page.evaluate(({ id, props }) => CatalogEditor.store.updateComponent(id, { props }), { id: protocol.target.componentId, props: condition.props });
  await page.waitForFunction(({ id, expected }) => {
    const props = CatalogEditor.store.findComponent(id)?.component?.props;
    return Object.entries(expected).every(([key, value]) => props?.[key] === value);
  }, { id: protocol.target.componentId, expected: condition.props });
}

async function analyzePng(page, bytes) {
  return page.evaluate(async base64 => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let usefulPixels = 0;
    let neutralPixels = 0;
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;
    const total = canvas.width * canvas.height;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const byteIndex = (y * canvas.width + x) * 4;
        const red = pixels[byteIndex];
        const green = pixels[byteIndex + 1];
        const blue = pixels[byteIndex + 2];
        const alpha = pixels[byteIndex + 3];
        const minimum = Math.min(red, green, blue);
        const maximum = Math.max(red, green, blue);
        const useful = alpha > 220 && (minimum < 236 || maximum - minimum > 18);
        const highConfidenceFactual = alpha > 220 && (minimum < 205 || maximum - minimum > 25);
        const neutral = alpha > 220 && minimum >= 246 && maximum - minimum <= 8;
        if (neutral) neutralPixels += 1;
        if (useful) usefulPixels += 1;
        if (!highConfidenceFactual) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    const bounds = maxX >= 0 ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null;
    return {
      width: canvas.width,
      height: canvas.height,
      usefulPixels,
      usefulPixelRatio: usefulPixels / total,
      usefulBounds: bounds,
      usefulBoundsRatio: bounds ? (bounds.width * bounds.height) / total : 0,
      neutralBackgroundRatio: neutralPixels / total,
      clipped: bounds ? bounds.x <= 1 || bounds.y <= 1 || bounds.x + bounds.width >= canvas.width - 1 || bounds.y + bounds.height >= canvas.height - 1 : true
    };
  }, bytes.toString("base64"));
}

async function currentAsset(page) {
  return page.evaluate(async id => {
    const component = CatalogEditor.store.findComponent(id).component;
    const asset = CatalogEditor.store.getAsset(component.props.assetId);
    const blob = await CatalogEditor.assetStorage.get(asset.reference.key);
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    return {
      componentProps: { ...component.props },
      assetId: asset.id,
      fileName: asset.metadata?.fileName || null,
      sha256: Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join(""),
      provenance: asset.provenance || asset.metadata?.provenance || null,
      reference: { ...asset.reference }
    };
  }, protocol.target.componentId);
}

async function captureCondition(page, condition) {
  await page.evaluate(() => CatalogEditor.store.setSelection(null));
  await page.waitForFunction(() => CatalogEditor.store.getSelected() === null);
  const preview = page.locator(`[data-component-id="${protocol.target.componentId}"] [data-asset-preview]`);
  const card = page.locator(`[data-component-id="${protocol.target.parentId}"]`);
  await preview.waitFor({ state: "visible" });
  await page.waitForFunction(id => document.querySelector(`[data-component-id="${id}"] [data-asset-preview]`)?.dataset.assetState === "ready", protocol.target.componentId);

  await page.emulateMedia({ media: "screen" });
  const screenBytes = await preview.screenshot({ path: path.join(outputRoot, "screen", `${condition.id}-preview.png`) });
  await card.screenshot({ path: path.join(outputRoot, "screen", `${condition.id}-card.png`) });
  const screen = await analyzePng(page, screenBytes);
  const screenStyle = await preview.evaluate(element => {
    const image = element.querySelector("[data-asset-image]");
    return {
      preview: { width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height },
      objectFit: getComputedStyle(image).objectFit,
      objectPosition: getComputedStyle(image).objectPosition,
      transform: getComputedStyle(image).transform,
      overflow: getComputedStyle(element).overflow
    };
  });

  await page.emulateMedia({ media: "print" });
  const printBytes = await preview.screenshot({ path: path.join(outputRoot, "print", `${condition.id}-preview.png`) });
  const print = await analyzePng(page, printBytes);
  const printStyle = await preview.evaluate(element => {
    const image = element.querySelector("[data-asset-image]");
    return { objectFit: getComputedStyle(image).objectFit, objectPosition: getComputedStyle(image).objectPosition, transform: getComputedStyle(image).transform };
  });
  await page.pdf({ path: path.join(outputRoot, "pdf", `${condition.id}.pdf`), format: "A4", printBackground: true, preferCSSPageSize: true });
  await page.emulateMedia({ media: "screen" });

  const asset = await currentAsset(page);
  return {
    id: condition.id,
    label: condition.label,
    screen: { ...screen, style: screenStyle },
    print: { ...print, style: printStyle },
    asset,
    screenImage: screenBytes.toString("base64")
  };
}

function metricDelta(left, right, key) {
  return Math.abs(left[key] - right[key]);
}

let activeBrowser = null;

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"] });
  activeBrowser = browser;
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await importPackage(page);
  await page.addStyleTag({ content: "#pageCanvas [data-open-asset-library]{display:none!important}" });
  await page.evaluate(() => CatalogEditor.store.setEditorSettings({ zoomMode: "manual", zoom: 1 }));
  await page.waitForFunction(() => CatalogEditor.store.getState().editor.zoomMode === "manual" && CatalogEditor.store.getState().editor.zoom === 1);
  await page.evaluate(({ parentId, componentId, height }) => {
    const store = CatalogEditor.store;
    const card = store.findComponent(parentId).component;
    for (const child of [...card.children]) if (child.id !== componentId) store.deleteComponent(child.id);
    store.updateComponent(parentId, { frame: { ...card.frame, height } });
  }, { parentId: protocol.target.parentId, componentId: protocol.target.componentId, height: protocol.target.controlledSetup.cardHeight });

  const target = await page.evaluate(id => {
    const found = CatalogEditor.store.findComponent(id);
    return { type: found?.component?.type, parentId: found?.parent?.id || null, parentType: found?.parent?.type, slot: found?.component?.slot?.name, frame: found?.component?.frame };
  }, protocol.target.componentId);
  assert(target.type === protocol.target.componentType && target.parentType === protocol.target.parentType && target.slot === protocol.target.slot, "O alvo não preservou componente, card e slot do protocolo.");
  assert(target.parentId === protocol.target.parentId, "O ensaio não preservou o mesmo card do protocolo.");
  assert(target.frame.width === protocol.target.width && target.frame.height === protocol.target.height, "O slot factual mudou de dimensão.");

  const initialAssetId = await page.evaluate(id => CatalogEditor.store.findComponent(id).component.props.assetId, protocol.target.componentId);
  assert(initialAssetId === protocol.source.assetId, "O pacote não vinculou o asset original esperado.");

  const results = [];
  for (const condition of protocol.conditions) {
    if (condition.id === "original-contain") {
      await useExistingAsset(page, initialAssetId);
    } else if (condition.id === "neutral-expanded" || condition.id === "external-crop") {
      await uploadDerivative(page, condition);
    } else if (condition.id === "editor-framed") {
      await useExistingAsset(page, initialAssetId);
    }
    await applyProps(page, condition);
    results.push(await captureCondition(page, condition));
  }

  const byId = Object.fromEntries(results.map(result => [result.id, result]));
  const original = byId["original-contain"];
  const expanded = byId["neutral-expanded"];
  const cropped = byId["external-crop"];
  const framed = byId["editor-framed"];

  fs.writeFileSync(path.join(outputRoot, "metrics.observed.json"), `${JSON.stringify({
    experimentFormat: protocol.experimentFormat,
    experimentVersion: protocol.experimentVersion,
    id: protocol.id,
    observedAt: new Date().toISOString(),
    target,
    results: results.map(({ screenImage, ...result }) => result),
    pageErrors
  }, null, 2)}\n`);

  assert(original.asset.assetId === framed.asset.assetId, "Original e enquadramento do editor não reutilizaram a mesma identidade de asset.");
  assert(original.asset.sha256 === protocol.source.sha256 && framed.asset.sha256 === protocol.source.sha256, "O enquadramento do editor alterou os bytes do asset original.");
  assert(expanded.asset.sha256 === protocol.conditions.find(condition => condition.id === "neutral-expanded").sha256, "O editor não preservou o derivado de canvas neutro.");
  assert(cropped.asset.sha256 === protocol.conditions.find(condition => condition.id === "external-crop").sha256, "O editor não preservou o derivado recortado.");

  const expandedOccupancyDelta = metricDelta(original.screen, expanded.screen, "usefulBoundsRatio");
  assert(expandedOccupancyDelta <= 0.04, `Expandir somente o canvas alterou demais a ocupação factual (${expandedOccupancyDelta}).`);
  assert(expanded.screen.neutralBackgroundRatio >= original.screen.neutralBackgroundRatio + 0.18, "O canvas expandido não aumentou materialmente a continuidade do fundo neutro.");
  assert(cropped.screen.usefulPixelRatio >= original.screen.usefulPixelRatio * 1.8, "O recorte externo não aumentou a ocupação útil em 80%.");
  assert(framed.screen.usefulPixelRatio >= original.screen.usefulPixelRatio * 1.8, "O enquadramento do editor não aumentou a ocupação útil em 80%.");
  assert(Math.abs(framed.screen.usefulPixelRatio - cropped.screen.usefulPixelRatio) <= cropped.screen.usefulPixelRatio * 0.15, "O editor ficou mais de 15% distante do recorte externo.");
  assert(!cropped.screen.clipped && !framed.screen.clipped, "Uma condição ampliada cortou pixels factuais no viewport.");

  for (const result of results) {
    assert(result.screen.width === protocol.target.renderedViewport.screen.width && result.screen.height === protocol.target.renderedViewport.screen.height, `${result.id}: captura de tela divergiu do viewport interno.`);
    assert(result.print.width === protocol.target.renderedViewport.print.width && result.print.height === protocol.target.renderedViewport.print.height, `${result.id}: captura de impressão divergiu do viewport interno.`);
    assert(metricDelta(result.screen, result.print, "usefulBoundsRatio") <= 0.02, `${result.id}: tela e impressão divergiram na ocupação delimitada.`);
    assert(metricDelta(result.screen, result.print, "usefulPixelRatio") <= 0.02, `${result.id}: tela e impressão divergiram nos pixels factuais.`);
    assert(result.screen.style.objectFit === result.print.style.objectFit && result.screen.style.transform === result.print.style.transform, `${result.id}: tela e impressão materializaram transformações diferentes.`);
  }

  const schemaVersion = await page.evaluate(() => CatalogEditor.store.getState().schemaVersion);
  const report = {
    experimentFormat: protocol.experimentFormat,
    experimentVersion: protocol.experimentVersion,
    id: protocol.id,
    executedAt: new Date().toISOString(),
    trialIncrement: "05.59B",
    editorIncrement: "05.59",
    schemaVersion,
    target,
    thresholds: { usefulGainMetric: "usefulPixelRatio", usefulGainMinimum: 1.8, framedVsCropMaximumDelta: 0.15, screenPrintMaximumDelta: 0.02 },
    results: results.map(({ screenImage, ...result }) => ({
      ...result,
      screen: { ...result.screen, usefulPixelRatio: round(result.screen.usefulPixelRatio), usefulBoundsRatio: round(result.screen.usefulBoundsRatio), neutralBackgroundRatio: round(result.screen.neutralBackgroundRatio) },
      print: { ...result.print, usefulPixelRatio: round(result.print.usefulPixelRatio), usefulBoundsRatio: round(result.print.usefulBoundsRatio), neutralBackgroundRatio: round(result.print.neutralBackgroundRatio) }
    })),
    conclusion: {
      neutralCanvasEffect: "background-continuity-only",
      externalCropEffect: "material-useful-occupancy-gain",
      editorFramingEffect: "material-useful-occupancy-gain",
      editorMatchesExternalCrop: true,
      assetIntegrityPreserved: true,
      screenPrintParity: true,
      responsibility: "A falha observada era predominantemente autoral/descoberta do kit; o editor 05.59 oferece correção equivalente ao recorte externo para este caso."
    },
    pageErrors
  };
  fs.writeFileSync(path.join(outputRoot, "metrics.actual.json"), `${JSON.stringify(report, null, 2)}\n`);

  const overview = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const cards = results.map(result => {
    const gain = result.screen.usefulPixelRatio / original.screen.usefulPixelRatio;
    return `<article><h2>${result.label}</h2><img src="data:image/png;base64,${result.screenImage}" alt="${result.label}"><dl><dt>Ocupação útil</dt><dd>${(result.screen.usefulPixelRatio * 100).toFixed(1)}%</dd><dt>Ganho relativo</dt><dd>${gain.toFixed(2)}×</dd><dt>Fundo neutro</dt><dd>${(result.screen.neutralBackgroundRatio * 100).toFixed(1)}%</dd><dt>Corte factual</dt><dd>${result.screen.clipped ? "sim" : "não"}</dd></dl></article>`;
  }).join("");
  await overview.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{margin:0;padding:28px;background:#f3f4f6;color:#202124;font-family:Arial,sans-serif}header{margin-bottom:20px}h1{margin:0 0 6px;font-size:26px}header p{margin:0;color:#5f6368}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}article{padding:16px;border:1px solid #d8dadd;border-radius:12px;background:#fff}h2{margin:0 0 12px;font-size:16px}img{display:block;width:100%;aspect-ratio:349/202;object-fit:contain;border:1px solid #e0e0e0;background:#f5f6f7}dl{display:grid;grid-template-columns:1fr auto;gap:6px 16px;margin:12px 0 0;font-size:12px}dt{color:#5f6368}dd{margin:0;font-weight:700}</style></head><body><header><h1>Ensaio causal de enquadramento · 05.59B</h1><p>Mesmo asset factual, card e slot controlado 351×204 (viewport interno 349×202); sem pixels generativos.</p></header><main class="grid">${cards}</main></body></html>`, { waitUntil: "load" });
  await overview.screenshot({ path: path.join(outputRoot, "comparison.png"), fullPage: true });
  await overview.pdf({ path: path.join(outputRoot, "comparison.pdf"), format: "A4", landscape: true, printBackground: true });

  assert(pageErrors.length === 0, `Erros no navegador: ${pageErrors.join(" | ")}`);
  await browser.close();
  activeBrowser = null;
  console.log("✓ 05.59B isola canvas neutro, recorte externo e enquadramento do editor com paridade de impressão.");
})().catch(async error => {
  if (activeBrowser) await activeBrowser.close().catch(() => {});
  console.error(error);
  process.exitCode = 1;
});
