/* Auditoria 05.19 — diagnóstico não bloqueante de recursos e cascata do rodapé sem shim. */
const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");

const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const outputDir = path.resolve(process.env.CATALOG_DIAGNOSTIC_OUTPUT_DIR || "/tmp/catalog-browser-diagnostic");
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
let browser;

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const consoleMessages = [];
  const responses = [];
  const requestFailures = [];
  const pageErrors = [];
  page.on("console", message => consoleMessages.push({ type: message.type(), text: message.text() }));
  page.on("response", response => {
    if (response.status() >= 400) responses.push({ status: response.status(), url: response.url(), resourceType: response.request().resourceType() });
  });
  page.on("requestfailed", request => requestFailures.push({ url: request.url(), resourceType: request.resourceType(), error: request.failure()?.errorText || null }));
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogComponentInitialPlacementContract && window.CATALOG_COMPONENT_REGISTRY?.["footer-item"]);

  const fixture = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    const footer = store.addComponent("catalog-footer", { x: 24, y: 900, width: 746, height: 80 }, { parentId: null });
    const item = footer.children.find(component => component.type === "footer-item");
    const subtitle = item.children.find(component => component.slot?.name === "subtitle");
    store.updateComponent(subtitle.id, { props: { content: "Atendimento via WhatsApp", overflow: "wrap" } });
    store.updateComponent(footer.id, { frame: { height: 80 } });
    store.reflowComponentTree(footer.id);
    return { footerId: footer.id, itemId: item.id, subtitleId: subtitle.id };
  });
  await page.waitForTimeout(100);

  const cascade = await page.evaluate(({ subtitleId }) => {
    const root = document.querySelector(`[data-component-id="${subtitleId}"]`);
    const text = root?.querySelector(".component-text");
    const paragraph = text?.querySelector("p");
    const rules = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let cssRules;
      try { cssRules = sheet.cssRules; } catch { continue; }
      for (const rule of Array.from(cssRules || [])) {
        if (!rule.selectorText || !paragraph?.matches(rule.selectorText)) continue;
        const declaration = rule.style;
        const relevant = ["white-space", "overflow", "text-overflow", "display", "-webkit-line-clamp", "overflow-wrap"]
          .filter(property => declaration.getPropertyValue(property))
          .map(property => ({ property, value: declaration.getPropertyValue(property), priority: declaration.getPropertyPriority(property) }));
        if (relevant.length) rules.push({ href: sheet.href || "inline", selector: rule.selectorText, relevant });
      }
    }
    const computed = paragraph ? getComputedStyle(paragraph) : null;
    return {
      rootClass: root?.className || null,
      overflowAttribute: text?.dataset.textOverflow || null,
      paragraphText: paragraph?.textContent || null,
      computed: computed ? {
        whiteSpace: computed.whiteSpace,
        overflow: computed.overflow,
        textOverflow: computed.textOverflow,
        display: computed.display,
        lineClamp: computed.webkitLineClamp,
        overflowWrap: computed.overflowWrap,
        height: paragraph.getBoundingClientRect().height,
        scrollHeight: paragraph.scrollHeight,
        clientHeight: paragraph.clientHeight
      } : null,
      rules
    };
  }, fixture);

  const scripts = await page.evaluate(() => Array.from(document.scripts).map(script => ({ src: script.src, runtimeContract: script.dataset.runtimeContract || null })));
  const styles = await page.evaluate(() => Array.from(document.querySelectorAll("link[rel=stylesheet], style")).map(node => ({ tag: node.tagName, href: node.href || null, dataset: { ...node.dataset } })));
  const report = { baseURL, fixture, responses, requestFailures, consoleMessages, pageErrors, cascade, scripts, styles };
  fs.writeFileSync(path.join(outputDir, "browser-smoke-diagnostic.json"), `${JSON.stringify(report, null, 2)}\n`);
  await page.screenshot({ path: path.join(outputDir, "browser-smoke-diagnostic.png"), fullPage: true });
  await browser.close();
  console.log(`✓ Diagnóstico visual registrado em ${outputDir}.`);
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
