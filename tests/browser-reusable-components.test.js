/* Interface real de Meus componentes, galeria multiarte e numeração assistida. */
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

  const ids = await page.evaluate(() => {
    const first = CatalogEditor.store.addComponent("product-card", { x: 24, y: 120, width: 350, height: 300 });
    const second = CatalogEditor.store.addComponent("product-card", { x: 400, y: 120, width: 350, height: 300 });
    CatalogEditor.store.setSelection(first.id);
    return { firstId: first.id, secondId: second.id };
  });

  page.once("dialog", dialog => dialog.accept("Card reutilizável"));
  await page.locator('[data-inspector-tab="structure"]').click();
  await page.locator("[data-save-component-template]").click();
  const template = page.locator('[data-saved-components] [data-template-id]');
  assert(await template.isVisible(), "O componente salvo não apareceu em Meus componentes.");
  assert((await template.textContent()).includes("Card reutilizável"), "O nome do componente salvo não foi preservado.");

  const templateId = await template.getAttribute("data-template-id");
  const instanceId = await page.evaluate(templateId => CatalogEditor.store.addComponentFromTemplate(templateId, { x: 24, y: 470, width: 350, height: 300 }).id, templateId);
  const instanceState = await page.evaluate(instanceId => {
    const card = CatalogEditor.store.findComponent(instanceId).component;
    return { number: card.children.find(child => child.type === "title-symbol").props.number, rendered: Boolean(document.querySelector(`[data-component-id="${instanceId}"]`)) };
  }, instanceId);
  assert(instanceState.number === "03" && instanceState.rendered, "A instância reutilizada não foi renderizada ou numerada.");

  const galleryState = await page.evaluate(firstId => {
    const card = CatalogEditor.store.findComponent(firstId).component;
    const currentArt = card.children.find(child => child.slot?.name === "art");
    CatalogEditor.store.deleteComponent(currentArt.id);
    const gallery = CatalogEditor.store.addComponent("art-gallery", { x: 0, y: 0 }, { parentId: card.id, slotName: "art" });
    return { id: gallery.id, captions: gallery.children.map(child => child.props.caption) };
  }, ids.firstId);
  assert(galleryState.captions.join(",") === "Variação 1,Variação 2,Variação 3", "A galeria não expôs legendas independentes.");
  assert(await page.locator(`[data-component-id="${galleryState.id}"] .component-art-gallery-shell`).isVisible(), "A galeria não foi projetada no canvas.");

  const numberState = await page.evaluate(({ firstId, secondId }) => {
    const first = CatalogEditor.store.findComponent(firstId).component;
    const second = CatalogEditor.store.findComponent(secondId).component;
    const secondTitle = second.children.find(child => child.type === "title-symbol");
    CatalogEditor.store.updateCardNumber(secondTitle.id, "1", { compact: false });
    return {
      first: first.children.find(child => child.type === "title-symbol").props.number,
      second: secondTitle.props.number,
      plan: CatalogEditor.store.getCardNumberChangePlan(secondTitle.id, "20").kind
    };
  }, ids);
  assert(numberState.first === "01" && numberState.second === "01" && numberState.plan === "above", "A numeração assistida não preservou a escolha manual ou o plano de salto.");

  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });
  await browser.close();
  console.log("✓ Meus componentes, galeria multiarte e numeração validados no navegador.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
