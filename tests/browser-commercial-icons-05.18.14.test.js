/* DB-05.18.14 — contato, confiança e condições comerciais em contextos reais. */
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const ids = ["phone", "email", "warranty", "payment"];
let browser;

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(expected => expected.every(id => window.CATALOG_EDITOR_ICONS?.[id]), ids);

  const fixture = await page.evaluate(iconIds => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    const footer = store.insertComponent("catalog-footer");
    store.updateComponent(footer.id, { frame: { height: 80 } });
    const footerItems = footer.children.filter(child => child.type === "footer-item").slice(0, iconIds.length);
    const footerIconIds = [];
    footerItems.forEach((item, index) => {
      const icon = item.children.find(child => child.type === "icon");
      footerIconIds.push(icon.id);
      store.updateComponent(icon.id, { props: { icon: iconIds[index], iconScale: 120 } });
    });

    const standalone = iconIds.map((iconId, index) => store.addComponent("icon", {
      x: 24 + index * 92,
      y: 210,
      width: 76,
      height: 76
    }, { props: { icon: iconId, label: window.CATALOG_ICON_LIBRARY[iconId].label, iconScale: 120 } }));

    const card = store.addComponent("product-card", { x: 24, y: 330, width: 380, height: 270 }, {
      presentation: { mode: "technical", density: "standard", responsiveState: "wide" }
    });
    const warrantySpec = card.children.find(child => child.type === "specification");
    store.updateComponent(warrantySpec.id, { props: { icon: "warranty", label: "Garantia do produto", iconScale: 120 } });

    return {
      footerId: footer.id,
      footerItemIds: footerItems.map(item => item.id),
      footerIconIds,
      standaloneIds: standalone.map(item => item.id),
      warrantySpecId: warrantySpec.id
    };
  }, ids);

  await page.waitForFunction(({ footerIconIds, standaloneIds, warrantySpecId }) => [...footerIconIds, ...standaloneIds, warrantySpecId].every(id => document.querySelector(`[data-component-id="${id}"] svg`)), fixture);

  async function measure(media) {
    return page.evaluate(({ fixture, iconIds, media }) => {
      const entries = [];
      const collect = (componentId, iconId, context, wrapperSelector) => {
        const component = document.querySelector(`[data-component-id="${componentId}"]`);
        const wrapper = component.querySelector(wrapperSelector);
        const svg = wrapper.querySelector("svg");
        const wrapperRect = wrapper.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        entries.push({
          componentId,
          iconId,
          context,
          media,
          wrapper: { left: wrapperRect.left, top: wrapperRect.top, right: wrapperRect.right, bottom: wrapperRect.bottom },
          svg: { left: svgRect.left, top: svgRect.top, right: svgRect.right, bottom: svgRect.bottom },
          viewBox: svg.getAttribute("viewBox"),
          stroke: svg.getAttribute("stroke")
        });
      };
      fixture.footerIconIds.forEach((id, index) => collect(id, iconIds[index], "footer-item", ".component-icon__svg"));
      fixture.standaloneIds.forEach((id, index) => collect(id, iconIds[index], "icon", ".component-icon__svg"));
      collect(fixture.warrantySpecId, "warranty", "specification", ".component-specification__icon");
      const footer = document.querySelector(`[data-component-id="${fixture.footerId}"]`).getBoundingClientRect();
      const footerItems = fixture.footerItemIds.map(id => {
        const rect = document.querySelector(`[data-component-id="${id}"]`).getBoundingClientRect();
        return { id, top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
      });
      return { entries, footer: { top: footer.top, bottom: footer.bottom, left: footer.left, right: footer.right }, footerItems };
    }, { fixture, iconIds: ids, media });
  }

  function assertContained(snapshot) {
    for (const item of snapshot.entries) {
      assert(item.viewBox === "0 0 24 24", `${item.iconId}/${item.context}: viewBox inesperado.`);
      assert(item.stroke === "currentColor", `${item.iconId}/${item.context}: currentColor ausente.`);
      assert(item.svg.left >= item.wrapper.left - 1 && item.svg.right <= item.wrapper.right + 1, `${item.iconId}/${item.context}: vazamento horizontal em ${item.media}.`);
      assert(item.svg.top >= item.wrapper.top - 1 && item.svg.bottom <= item.wrapper.bottom + 1, `${item.iconId}/${item.context}: vazamento vertical em ${item.media}.`);
    }
    for (const item of snapshot.footerItems) {
      assert(item.top >= snapshot.footer.top - 1 && item.bottom <= snapshot.footer.bottom + 1, `Item comercial vazou do rodapé em ${snapshot.entries[0]?.media}: ${JSON.stringify(item)}.`);
      assert(item.left >= snapshot.footer.left - 1 && item.right <= snapshot.footer.right + 1, `Item comercial vazou lateralmente do rodapé: ${JSON.stringify(item)}.`);
    }
  }

  const screen = await measure("screen");
  assertContained(screen);

  const selector = await page.evaluate(iconIds => {
    const html = CatalogEditor.inspector.iconOptions(iconIds[0]);
    const select = document.createElement("select");
    select.innerHTML = html;
    return iconIds.map(id => ({ id, text: Array.from(select.options).find(option => option.value === id)?.textContent || "" }));
  }, ids);
  const categories = { phone: "Contato", email: "Contato", warranty: "Confiança", payment: "Comercial" };
  for (const option of selector) {
    assert(option.text.includes(categories[option.id]), `${option.id}: categoria ausente no seletor (${option.text}).`);
    assert(option.text.includes(windowLabel(option.id)), `${option.id}: rótulo ausente no seletor (${option.text}).`);
  }

  function windowLabel(id) {
    return { phone: "Telefone", email: "E-mail", warranty: "Garantia", payment: "Pagamento / condições" }[id];
  }

  for (const scale of [80, 100, 120]) {
    await page.evaluate(({ id, scale }) => CatalogEditor.store.updateComponent(id, { props: { iconScale: scale } }), { id: fixture.standaloneIds[0], scale });
    await page.waitForTimeout(20);
    const scaled = await measure(`scale-${scale}`);
    assertContained({ ...scaled, entries: scaled.entries.filter(item => item.componentId === fixture.standaloneIds[0]) });
  }

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await measure("print");
  assertContained(printed);

  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);
  await browser.close();
  console.log("✓ DB-05.18.14 renderizou contato, confiança e pagamento no rodapé, em ícones autônomos, especificação e impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
