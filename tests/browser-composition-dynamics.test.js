/* Fluxos reais de composição dinâmica, restauração estrutural e rodapé atomizado. */
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
    const header = CatalogEditor.store.addComponent("catalog-header", { x: 24, y: 24, width: 746, height: 140 });
    const logo = header.children.find(child => child.slot?.name === "logo");
    const title = header.children.find(child => child.slot?.name === "title");
    const titleWidth = title.frame.width;
    CatalogEditor.store.deleteComponent(logo.id);

    const area = CatalogEditor.store.addComponent("layout-container", { x: 24, y: 190, width: 746, height: 260 }, { layout: { mode: "row", gap: 7, responsive: { enabled: false } } });
    const first = CatalogEditor.store.addComponent("text", { x: 0, y: 0 }, { parentId: area.id, props: { content: "Primeiro" } });
    CatalogEditor.store.addComponent("text", { x: 0, y: 0 }, { parentId: area.id, props: { content: "Segundo" } });

    const footer = CatalogEditor.store.addComponent("catalog-footer", { x: 24, y: 999, width: 746, height: 100 });
    const item = footer.children[0];
    const icon = item.children.find(child => child.type === "icon");
    CatalogEditor.store.updateComponent(icon.id, { style: { vectorColor: "text.primary" } });
    CatalogEditor.store.setSelection(header.id);
    return { headerId: header.id, titleId: title.id, titleWidth, areaId: area.id, firstId: first.id, footerItemId: item.id, iconId: icon.id };
  });

  const collapsed = await page.evaluate(({ titleId, titleWidth }) => {
    const title = CatalogEditor.store.findComponent(titleId).component;
    return { x: title.frame.x, wider: title.frame.width > titleWidth };
  }, ids);
  assert(collapsed.x === 12 && collapsed.wider, "O cabeçalho não ocupou o espaço liberado pela logo.");
  assert(await page.locator('[data-restore-default-child][data-slot-name="logo"]').isVisible(), "A aba Estrutura não ofereceu restaurar a logo.");
  await page.locator('[data-restore-default-child][data-slot-name="logo"]').click();
  assert(await page.evaluate(headerId => CatalogEditor.store.findComponent(headerId).component.children.some(child => child.slot?.name === "logo"), ids.headerId), "A ação Adicionar Logo não restaurou a peça.");

  await page.evaluate(areaId => CatalogEditor.store.setSelection(areaId), ids.areaId);
  assert(await page.locator("[data-add-contextual-separator]").isVisible(), "A linha contextual não ficou disponível acima do limiar de espaçamento.");
  const widthBefore = await page.evaluate(firstId => CatalogEditor.store.findComponent(firstId).component.frame.width, ids.firstId);
  await page.locator("[data-add-contextual-separator]").click();
  const separator = await page.evaluate(({ areaId, firstId }) => {
    const area = CatalogEditor.store.findComponent(areaId).component;
    const line = area.children.find(child => child.props?.contextual === true);
    return { orientation: line?.props.orientation, overlay: line?.layoutItem.overlay, firstWidth: CatalogEditor.store.findComponent(firstId).component.frame.width };
  }, ids);
  assert(separator.orientation === "vertical" && separator.overlay === true && separator.firstWidth === widthBefore, "A linha contextual alterou o layout ou recebeu orientação incorreta.");

  const footerState = await page.evaluate(({ footerItemId, iconId }) => {
    const item = CatalogEditor.store.findComponent(footerItemId).component;
    const element = document.querySelector(`[data-component-id="${iconId}"] .component-icon`);
    return { children: item.children.map(child => child.type), color: getComputedStyle(element).color };
  }, ids);
  assert(footerState.children.filter(type => type === "text").length === 2 && footerState.children.includes("icon"), "O item de rodapé não possui os átomos esperados.");
  assert(footerState.color === "rgb(10, 9, 9)", "A troca do token vetorial não recoloriu o átomo de ícone do rodapé.");

  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });
  await browser.close();
  console.log("✓ Colapso, restauração, linha contextual e rodapé atomizado validados no navegador.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
