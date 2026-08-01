/* Smoke test real de estruturas compostas, abas, ênfase e zoom lógico. */
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];

const assert = (condition, message) => { if (!condition) throw new Error(message); };

let browser = null;

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const ids = await page.evaluate(() => {
    const header = CatalogEditor.store.addComponent("catalog-header", { x: 24, y: 24, width: 746, height: 130 }, { props: { kicker: "CATÁLOGO 2026", title: "FERRAGENS" } });
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 180, width: 350, height: 260 });
    const footer = CatalogEditor.store.addComponent("catalog-footer", { x: 24, y: 999, width: 746, height: 100 });
    CatalogEditor.store.setEditingContext(header.id);
    const kicker = header.children.find(child => child.slot?.name === "kicker");
    CatalogEditor.store.setSelection(kicker.id);
    return { headerId: header.id, cardId: card.id, footerId: footer.id, kickerId: kicker.id };
  });

  assert(await page.locator('[data-inspector-tab="content"]').getAttribute("aria-selected") === "true", "Peças de conteúdo devem abrir na aba Conteúdo.");
  await page.locator('[data-prop-path="content"]').fill("LINHA PROFISSIONAL");
  await page.locator('[data-prop-path="content"]').press("Tab");
  const headerState = await page.evaluate(({ headerId, kickerId }) => ({
    childCount: CatalogEditor.store.findComponent(headerId).component.children.length,
    text: CatalogEditor.store.findComponent(kickerId).component.props.content,
    rendered: document.querySelector(`[data-component-id="${kickerId}"] .component-text`)?.textContent.trim()
  }), ids);
  assert(headerState.childCount === 5 && headerState.text === "LINHA PROFISSIONAL" && headerState.rendered === headerState.text, "O cabeçalho composto não permaneceu editável.");

  await page.locator('[data-left-panel-tab="layers"]').click();
  assert(await page.locator('[data-left-panel-content="layers"]').isVisible(), "A aba Camadas não foi exibida.");
  assert(await page.locator('[data-left-panel-content="components"]').isHidden(), "A aba Componentes deveria estar oculta.");
  assert(await page.locator(`[data-layer-id="${ids.headerId}"]`).count() === 1 && await page.locator(`[data-layer-id="${ids.kickerId}"]`).count() === 1, "A árvore não lista a estrutura composta.");

  const footerState = await page.evaluate(footerId => {
    CatalogEditor.store.setEditingContext(footerId);
    const previousCount = CatalogEditor.store.findComponent(footerId).component.children.length;
    const item = CatalogEditor.store.addComponent("footer-item", { x: 0, y: 0 }, { parentId: footerId, slotName: "items", props: { icon: "tag", title: "Oferta", subtitle: "Só hoje" } });
    return { previousCount, count: CatalogEditor.store.findComponent(footerId).component.children.length, itemId: item.id, width: item.frame.width, atomTypes: item.children.map(child => child.type) };
  }, ids.footerId);
  assert(footerState.count === footerState.previousCount + 1 && footerState.width > 0, "O rodapé não aceitou uma nova molécula editável.");
  assert(footerState.atomTypes.includes("icon") && footerState.atomTypes.filter(type => type === "text").length === 2, "A nova molécula do rodapé não foi atomizada.");

  await page.evaluate(cardId => {
    CatalogEditor.store.setEditingContext(null);
    CatalogEditor.store.setSelection(cardId);
  }, ids.cardId);
  assert(await page.locator('[data-inspector-tab="content"]').getAttribute("aria-selected") === "true", "Cards devem abrir em Conteúdo para revelar a apresentação.");
  const emphasis = await page.evaluate(cardId => ({
    canvasChildren: document.querySelectorAll(`[data-component-id="${cardId}"] > .component-children-layer > [data-within-selected-container="true"]`).length,
    layerChildren: document.querySelectorAll(`[data-layer-id][data-within-selection="true"]`).length
  }), ids.cardId);
  assert(emphasis.canvasChildren === 5 && emphasis.layerChildren >= 5, "Os átomos e moléculas do card não receberam ênfase contextual.");

  await page.locator('[data-inspector-tab="style"]').click();
  assert(await page.locator('[data-inspector-panel="style"]').isVisible(), "A aba Visual do inspetor não foi exibida.");
  assert(await page.locator('[data-inspector-panel="structure"]').isHidden(), "A aba Estrutura deveria estar oculta após trocar de categoria.");

  const beforeZoom = await page.evaluate(() => ({ effective: CatalogEditor.workspaceLayout.getScale(), browserScale: window.devicePixelRatio }));
  await page.dispatchEvent("#workspaceViewport", "wheel", { deltaY: -100, ctrlKey: true, bubbles: true, cancelable: true });
  const afterZoom = await page.evaluate(() => ({
    mode: CatalogEditor.store.getState().editor.zoomMode,
    zoom: CatalogEditor.store.getState().editor.zoom,
    effective: CatalogEditor.workspaceLayout.getScale(),
    selectValue: document.getElementById("zoomSelect").value,
    hasCustomOption: Boolean(document.querySelector("#zoomSelect option[data-custom-zoom]")),
    browserScale: window.devicePixelRatio
  }));
  assert(afterZoom.mode === "manual" && afterZoom.zoom > beforeZoom.effective && afterZoom.effective === afterZoom.zoom, "Ctrl+roda não alterou o zoom lógico da A4.");
  assert(afterZoom.selectValue === String(afterZoom.zoom) && afterZoom.hasCustomOption, "O seletor não refletiu o zoom intermediário.");
  assert(afterZoom.browserScale === beforeZoom.browserScale, "O zoom do navegador foi alterado.");

  const optionContrast = await page.evaluate(() => {
    const option = document.querySelector('#zoomSelect option[value="1"]');
    const style = getComputedStyle(option);
    return { color: style.color, background: style.backgroundColor };
  });
  assert(optionContrast.color !== optionContrast.background, "As opções do zoom continuam sem contraste.");
  assert(pageErrors.length === 0, `Erros no navegador: ${pageErrors.join(" | ")}`);
  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });

  console.log("✓ Estruturas compostas, abas, ênfase contextual e Ctrl+roda validados no navegador.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await browser?.close();
});
