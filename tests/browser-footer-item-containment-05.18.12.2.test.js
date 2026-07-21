/* DB-05.18.12.2 — rodapé reduzido ao mínimo sem vazamento dos subtítulos. */
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogFooterItemContainmentContract?.VERSION === "05.19.3");

  const footerId = await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: true });
    const footer = CatalogEditor.store.insertComponent("catalog-footer");
    CatalogEditor.store.updateComponent(footer.id, { frame: { height: 80 } });
    return footer.id;
  });
  await page.waitForFunction(id => document.querySelector(`[data-component-id="${id}"]`), footerId);

  async function measure() {
    return page.evaluate(id => {
      const footer = CatalogEditor.store.findComponent(id).component;
      const footerElement = document.querySelector(`[data-component-id="${id}"]`);
      const itemModels = footer.children.filter(child => child.type === "footer-item");
      const itemMeasurements = itemModels.map(item => {
        const itemElement = footerElement.querySelector(`[data-component-id="${item.id}"]`);
        const itemRect = itemElement.getBoundingClientRect();
        const layer = itemElement.querySelector(":scope > .component-children-layer");
        const textChildren = item.children.filter(child => child.type === "text").map(child => {
          const element = itemElement.querySelector(`[data-component-id="${child.id}"]`);
          const rect = element.getBoundingClientRect();
          const paragraph = element.querySelector(".component-text p");
          const style = getComputedStyle(paragraph);
          return {
            id: child.id,
            slot: child.slot?.name,
            frame: { ...child.frame },
            dom: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
            text: paragraph.textContent,
            whiteSpace: style.whiteSpace,
            overflow: style.overflow
          };
        });
        return {
          id: item.id,
          frame: { ...item.frame },
          dom: { left: itemRect.left, top: itemRect.top, right: itemRect.right, bottom: itemRect.bottom },
          layerOverflow: getComputedStyle(layer).overflow,
          textChildren
        };
      });
      return { footer: { ...footer.frame }, items: itemMeasurements };
    }, footerId);
  }

  const screen = await measure();
  assert(screen.footer.height === 80, `O rodapé não permaneceu no mínimo de 80 px: ${JSON.stringify(screen.footer)}.`);
  assert(screen.items.length === 6, `Quantidade inesperada de itens do rodapé: ${screen.items.length}.`);

  for (const item of screen.items) {
    assert(item.frame.height <= 77, `O item não foi contido no slot mínimo do rodapé: ${JSON.stringify(item.frame)}.`);
    assert(item.layerOverflow === "hidden", `A camada interna não possui recorte defensivo: ${item.layerOverflow}.`);
    for (const child of item.textChildren) {
      assert(child.frame.x >= 0 && child.frame.y >= 0, `Frame interno negativo: ${JSON.stringify(child)}.`);
      assert(child.frame.x + child.frame.width <= item.frame.width, `Texto vazou horizontalmente no modelo: ${JSON.stringify(child)} em ${JSON.stringify(item.frame)}.`);
      assert(child.frame.y + child.frame.height <= item.frame.height, `Texto vazou verticalmente no modelo: ${JSON.stringify(child)} em ${JSON.stringify(item.frame)}.`);
      assert(child.dom.left >= item.dom.left - 1 && child.dom.right <= item.dom.right + 1, `Texto vazou horizontalmente no DOM: ${JSON.stringify(child.dom)} em ${JSON.stringify(item.dom)}.`);
      assert(child.dom.top >= item.dom.top - 1 && child.dom.bottom <= item.dom.bottom + 1, `Texto vazou verticalmente no DOM: ${JSON.stringify(child.dom)} em ${JSON.stringify(item.dom)}.`);
    }
  }

  const whatsapp = screen.items.flatMap(item => item.textChildren).find(child => child.text === "Atendimento via WhatsApp");
  assert(whatsapp, "O subtítulo de WhatsApp não foi encontrado.");
  assert(whatsapp.whiteSpace === "normal", `O subtítulo voltou a usar nowrap: ${JSON.stringify(whatsapp)}.`);

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await measure();
  for (const item of printed.items) {
    assert(item.layerOverflow === "hidden", "O recorte defensivo não foi preservado na impressão.");
    for (const child of item.textChildren) {
      assert(child.dom.bottom <= item.dom.bottom + 1, `A impressão deixou um subtítulo abaixo do item: ${JSON.stringify(child.dom)} em ${JSON.stringify(item.dom)}.`);
      assert(child.dom.right <= item.dom.right + 1, `A impressão deixou texto além da lateral do item: ${JSON.stringify(child.dom)} em ${JSON.stringify(item.dom)}.`);
    }
  }

  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.12.2 mantém títulos e subtítulos dentro do rodapé mínimo em tela e impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
