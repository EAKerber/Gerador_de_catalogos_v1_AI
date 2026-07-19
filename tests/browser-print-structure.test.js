/* Garante que estruturas auxiliares sejam invisíveis no PDF sem ocultar seus filhos. */
const fs = require("fs");
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];
const pdfPath = process.env.CATALOG_PDF || "/tmp/catalogo-print-structure.pdf";
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const ids = await page.evaluate(() => {
    CatalogEditor.store.addComponent("catalog-header", { x: 24, y: 24, width: 746, height: 140 });
    const area = CatalogEditor.store.addComponent("layout-container", { x: 24, y: 190, width: 746, height: 420 }, { layout: { mode: "row", gap: 16, responsive: { enabled: false } } });
    const first = CatalogEditor.store.addComponent("product-card", { x: 0, y: 0 }, { parentId: area.id });
    const art = first.children.find(child => child.slot?.name === "art");
    CatalogEditor.store.deleteComponent(art.id);
    const gallery = CatalogEditor.store.addComponent("art-gallery", { x: 0, y: 0 }, { parentId: first.id, slotName: "art" });
    CatalogEditor.store.addComponent("product-card", { x: 0, y: 0 }, { parentId: area.id });
    CatalogEditor.store.addComponent("catalog-footer", { x: 24, y: 999, width: 746, height: 100 });
    return { areaId: area.id, cardId: first.id, galleryId: gallery.id, galleryChildId: gallery.children[0].id };
  });

  if (process.env.CATALOG_SCREENSHOT) await page.locator("#pageCanvas").screenshot({ path: process.env.CATALOG_SCREENSHOT });
  await page.emulateMedia({ media: "print" });
  const printState = await page.evaluate(({ areaId, cardId, galleryId, galleryChildId }) => {
    const area = document.querySelector(`[data-component-id="${areaId}"]`);
    const content = area.querySelector(":scope > .editor-component__content");
    const card = document.querySelector(`[data-component-id="${cardId}"]`);
    const areaStyle = getComputedStyle(area);
    const cardStyle = getComputedStyle(card);
    const gallery = document.querySelector(`[data-component-id="${galleryId}"]`);
    const galleryChild = document.querySelector(`[data-component-id="${galleryChildId}"]`);
    const galleryStyle = getComputedStyle(gallery);
    return {
      background: areaStyle.backgroundColor,
      border: areaStyle.borderTopColor,
      contentOpacity: getComputedStyle(content).opacity,
      cardDisplay: cardStyle.display,
      cardOpacity: cardStyle.opacity,
      galleryBackground: galleryStyle.backgroundColor,
      galleryBorder: galleryStyle.borderTopColor,
      galleryContentOpacity: getComputedStyle(gallery.querySelector(":scope > .editor-component__content")).opacity,
      galleryChildDisplay: getComputedStyle(galleryChild).display,
      galleryChildOpacity: getComputedStyle(galleryChild).opacity
    };
  }, ids);
  assert(printState.background === "rgba(0, 0, 0, 0)" && printState.border === "rgba(0, 0, 0, 0)" && printState.contentOpacity === "0", "A Área de composição ainda possui projeção visual na impressão.");
  assert(printState.cardDisplay !== "none" && printState.cardOpacity === "1", "Ocultar a Área de composição também ocultou seus componentes.");
  assert(printState.galleryBackground === "rgba(0, 0, 0, 0)" && printState.galleryBorder === "rgba(0, 0, 0, 0)" && printState.galleryContentOpacity === "0", "A Galeria de imagens ainda possui envelope visual na impressão.");
  assert(printState.galleryChildDisplay !== "none" && printState.galleryChildOpacity === "1", "Ocultar o envelope da galeria também ocultou suas imagens.");

  await page.pdf({ path: pdfPath, format: "A4", printBackground: true, preferCSSPageSize: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
  assert(fs.statSync(pdfPath).size > 1000, "O PDF estrutural não foi gerado.");
  await browser.close();
  console.log("✓ Área de composição e galeria ausentes no PDF, com filhos preservados.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
