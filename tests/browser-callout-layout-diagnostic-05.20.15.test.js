/* DB-05.20.15 — diagnóstico não bloqueante da geometria interna do callout. */
"use strict";

const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");

const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = process.env.CATALOG_LEGIBILITY_OUTPUT_DIR || path.join("audit-output", "db-05.20.7", "legibility");
let browser;

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor?.store && window.CatalogCalloutRecipeContract?.VERSION === "05.20.15");

  const fixture = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false, snapEnabled: false, smartSnapEnabled: false });
    const callout = store.insertComponentFromTemplate("section-tip-callout");
    const flatten = component => [component, ...(component.children || []).flatMap(flatten)];
    const roles = Object.fromEntries(flatten(callout).filter(item => item.props?.recipeRole).map(item => [item.props.recipeRole, item.id]));
    store.updateComponent(callout.id, { frame: { x: 24, y: 24, width: 430, height: 150 } });
    store.updateComponent(roles.title, { props: { content: "OFERTA ESPECIAL POR TEMPO LIMITADO" } });
    store.updateComponent(roles.body, { props: { content: "Aproveite condições exclusivas para renovar seus projetos com segurança e praticidade." } });
    store.reflowComponentTree(callout.id);
    return { rootId: callout.id, roles };
  });

  await page.waitForSelector(`[data-component-id="${fixture.rootId}"]`);
  const report = await page.evaluate(fixture => {
    const store = CatalogEditor.store;
    const rect = element => {
      const box = element?.getBoundingClientRect();
      return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height } : null;
    };
    const readRole = role => {
      const id = fixture.roles[role];
      const component = id ? store.findComponent(id)?.component : null;
      const root = id ? document.querySelector(`[data-component-id="${id}"]`) : null;
      const p = root?.querySelector(".component-text p");
      const textRoot = root?.querySelector(".component-text");
      const style = p ? getComputedStyle(p) : null;
      const definition = component ? window.CATALOG_COMPONENT_REGISTRY[component.type] : null;
      return {
        id,
        modelFrame: component ? { ...component.frame } : null,
        domFrame: rect(root),
        textFrame: rect(textRoot),
        paragraphFrame: rect(p),
        clientHeight: p?.clientHeight || 0,
        scrollHeight: p?.scrollHeight || 0,
        clientWidth: p?.clientWidth || 0,
        scrollWidth: p?.scrollWidth || 0,
        fontSize: style ? Number.parseFloat(style.fontSize) : 0,
        lineHeight: style?.lineHeight || null,
        whiteSpace: style?.whiteSpace || null,
        content: p?.textContent || "",
        measuredMinimum: component && typeof definition?.measureMinimum === "function" ? definition.measureMinimum(component, component.frame) : null
      };
    };
    const root = store.findComponent(fixture.rootId).component;
    const content = store.findComponent(fixture.roles.content)?.component;
    const icon = store.findComponent(fixture.roles.icon)?.component;
    return {
      contractVersion: window.CatalogCalloutRecipeContract.VERSION,
      effectiveMode: window.CatalogLayoutEngine.effectiveMode(root),
      root: { modelFrame: { ...root.frame }, domFrame: rect(document.querySelector(`[data-component-id="${root.id}"]`)), layout: root.layout },
      icon: { modelFrame: icon ? { ...icon.frame } : null, domFrame: rect(document.querySelector(`[data-component-id="${fixture.roles.icon}"]`)) },
      content: { modelFrame: content ? { ...content.frame } : null, domFrame: rect(document.querySelector(`[data-component-id="${fixture.roles.content}"]`)), layout: content?.layout || null },
      title: readRole("title"),
      body: readRole("body"),
      pageErrors,
      consoleErrors
    };
  }, fixture);

  fs.writeFileSync(path.join(outputDir, "callout-layout-diagnostic.json"), `${JSON.stringify(report, null, 2)}\n`);
  await page.screenshot({ path: path.join(outputDir, "callout-layout-diagnostic.png"), fullPage: true });
  if (pageErrors.length || consoleErrors.length) throw new Error(`Erros durante diagnóstico: ${[...pageErrors, ...consoleErrors].join(" | ")}`);
  await browser.close();
  browser = null;
  console.log("✓ DB-05.20.15 registrou a geometria interna real do callout.");
})().catch(async error => {
  fs.writeFileSync(path.join(outputDir, "callout-layout-diagnostic-error.json"), `${JSON.stringify({ message: error.message, stack: error.stack }, null, 2)}\n`);
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
