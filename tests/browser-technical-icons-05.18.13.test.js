/* DB-05.18.13 — iconografia técnica em specification, icon e impressão. */
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const ids = ["load-capacity", "corrosion-resistant", "torque", "diameter"];
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
    const card = store.addComponent("product-card", { x: 24, y: 24, width: 430, height: 300 }, {
      presentation: { mode: "technical", density: "standard", responsiveState: "wide" }
    });
    const specifications = card.children.filter(child => child.type === "specification");
    while (specifications.length < iconIds.length) {
      specifications.push(store.addComponent("specification", { x: 0, y: 0, width: 130, height: 38 }, {
        parentId: card.id,
        slotName: "specifications",
        props: { icon: "shield-star", label: "Especificação técnica", iconScale: 100 }
      }));
    }
    specifications.forEach((component, index) => store.updateComponent(component.id, {
      props: { icon: iconIds[index], label: window.CATALOG_ICON_LIBRARY[iconIds[index]].label, iconScale: 120 }
    }));
    const standalone = iconIds.map((iconId, index) => store.addComponent("icon", {
      x: 480 + (index % 2) * 104,
      y: 24 + Math.floor(index / 2) * 104,
      width: 88,
      height: 88
    }, { props: { icon: iconId, label: window.CATALOG_ICON_LIBRARY[iconId].label, iconScale: 120 } }));
    return { cardId: card.id, specificationIds: specifications.map(item => item.id), standaloneIds: standalone.map(item => item.id) };
  }, ids);

  await page.waitForFunction(({ specificationIds, standaloneIds }) => [...specificationIds, ...standaloneIds].every(id => document.querySelector(`[data-component-id="${id}"] svg`)), fixture);

  async function measure(mediaLabel) {
    return page.evaluate(({ specificationIds, standaloneIds, iconIds, mediaLabel }) => {
      const measurements = [];
      const collect = (componentId, context, iconId) => {
        const component = document.querySelector(`[data-component-id="${componentId}"]`);
        const wrapper = component.querySelector(context === "specification" ? ".component-specification__icon" : ".component-icon__svg");
        const svg = wrapper.querySelector("svg");
        const wrapperRect = wrapper.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        measurements.push({
          mediaLabel,
          componentId,
          context,
          iconId,
          wrapper: { left: wrapperRect.left, top: wrapperRect.top, right: wrapperRect.right, bottom: wrapperRect.bottom, width: wrapperRect.width, height: wrapperRect.height },
          svg: { left: svgRect.left, top: svgRect.top, right: svgRect.right, bottom: svgRect.bottom, width: svgRect.width, height: svgRect.height },
          viewBox: svg.getAttribute("viewBox"),
          stroke: svg.getAttribute("stroke"),
          body: svg.innerHTML
        });
      };
      specificationIds.forEach((id, index) => collect(id, "specification", iconIds[index]));
      standaloneIds.forEach((id, index) => collect(id, "icon", iconIds[index]));
      return measurements;
    }, { ...fixture, iconIds: ids, mediaLabel });
  }

  function assertContained(measurements) {
    for (const measurement of measurements) {
      assert(measurement.viewBox === "0 0 24 24", `${measurement.iconId}/${measurement.context}: viewBox inesperado.`);
      assert(measurement.stroke === "currentColor", `${measurement.iconId}/${measurement.context}: SVG não usa currentColor.`);
      assert(measurement.body.trim().length > 0, `${measurement.iconId}/${measurement.context}: corpo SVG ausente.`);
      assert(measurement.svg.left >= measurement.wrapper.left - 1 && measurement.svg.right <= measurement.wrapper.right + 1, `${measurement.iconId}/${measurement.context}: vazamento horizontal em ${measurement.mediaLabel}.`);
      assert(measurement.svg.top >= measurement.wrapper.top - 1 && measurement.svg.bottom <= measurement.wrapper.bottom + 1, `${measurement.iconId}/${measurement.context}: vazamento vertical em ${measurement.mediaLabel}.`);
    }
  }

  const screen = await measure("screen");
  assertContained(screen);
  assert(screen.filter(item => item.context === "specification").length === 4, "As quatro especificações técnicas não foram renderizadas.");
  assert(screen.filter(item => item.context === "icon").length === 4, "Os quatro átomos de ícone não foram renderizados.");

  const selector = await page.evaluate(iconIds => {
    const html = CatalogEditor.inspector.iconOptions(iconIds[0]);
    const select = document.createElement("select");
    select.innerHTML = html;
    return iconIds.map(id => ({
      id,
      text: Array.from(select.options).find(option => option.value === id)?.textContent || ""
    }));
  }, ids);
  for (const item of selector) {
    assert(item.text.includes(windowCategory(item.id)) || /Técnica|Desempenho/.test(item.text), `${item.id}: opção do inspetor sem categoria e rótulo: ${item.text}.`);
  }

  function windowCategory(id) {
    return id === "load-capacity" || id === "corrosion-resistant" ? "Desempenho" : "Técnica";
  }

  for (const scale of [80, 100, 120]) {
    await page.evaluate(({ componentId, scale }) => CatalogEditor.store.updateComponent(componentId, { props: { iconScale: scale } }), { componentId: fixture.standaloneIds[0], scale });
    await page.waitForTimeout(20);
    const measurement = (await measure(`scale-${scale}`)).find(item => item.componentId === fixture.standaloneIds[0]);
    assertContained([measurement]);
  }

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await measure("print");
  assertContained(printed);

  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);
  await browser.close();
  console.log("✓ DB-05.18.13 renderizou quatro ícones em dois contextos, três escalas e mídia de impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
