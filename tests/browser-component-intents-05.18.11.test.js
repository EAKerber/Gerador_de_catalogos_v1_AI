/* DB-05.18.11 — taxonomia consumível e acesso integral aos tipos. */
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
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogComponentIntents?.VERSION === "05.18.11");

  const state = await page.evaluate(() => {
    const validation = CatalogComponentIntents.validate(CATALOG_COMPONENT_REGISTRY);
    const groups = CatalogComponentIntents.grouped(CATALOG_COMPONENT_REGISTRY);
    const manifest = CatalogProjectManifests.buildCapabilitiesManifest();
    const paletteTypes = Array.from(document.querySelectorAll("[data-insert-component]")).map(button => button.dataset.insertComponent).sort();
    const buttons = Object.keys(CATALOG_COMPONENT_REGISTRY).sort().map(type => ({
      type,
      count: document.querySelectorAll(`[data-insert-component="${type}"]`).length,
      disabled: document.querySelector(`[data-insert-component="${type}"]`)?.disabled === true
    }));
    return {
      validation,
      groups,
      manifest,
      registryTypes: Object.keys(CATALOG_COMPONENT_REGISTRY).sort(),
      paletteTypes,
      buttons
    };
  });

  assert(state.validation.ok, `Taxonomia inválida no navegador: ${JSON.stringify(state.validation)}.`);
  assert(state.registryTypes.length === 16 && state.paletteTypes.length === 16, "A biblioteca não expõe exatamente os 16 tipos registrados.");
  assert(state.paletteTypes.join(",") === state.registryTypes.join(","), "Um tipo classificado ficou inacessível na biblioteca.");
  assert(state.buttons.every(item => item.count === 1 && !item.disabled), `Botão ausente ou desabilitado: ${JSON.stringify(state.buttons.filter(item => item.count !== 1 || item.disabled))}.`);
  assert(state.groups.length === 5 && state.groups.flatMap(group => group.componentTypes).length === 16, "A UI não consegue consumir os cinco grupos completos.");
  assert(state.manifest.componentIntents.groups.length === 5 && state.manifest.components.every(component => component.intent?.id), "O manifesto do navegador não contém a taxonomia completa.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.11 publica cinco intenções e mantém os 16 tipos acessíveis após mudanças de apresentação.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
