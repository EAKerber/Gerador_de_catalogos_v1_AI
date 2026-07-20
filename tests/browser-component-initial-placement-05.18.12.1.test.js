/* DB-05.18.12.1 — inserção real, liberdade posterior e texto de rodapé. */
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
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogComponentInitialPlacementContract?.VERSION === "05.18.12.1");

  await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: true });
  });

  await page.locator('[data-insert-component="catalog-footer"]').click();
  await page.waitForFunction(() => CatalogEditor.store.getPage().children.some(component => component.type === "catalog-footer"));
  await page.locator('[data-insert-component="catalog-header"]').click();
  await page.waitForFunction(() => CatalogEditor.store.getPage().children.some(component => component.type === "catalog-header"));

  const snapshot = await page.evaluate(() => {
    const pageModel = CatalogEditor.store.getPage();
    const footer = pageModel.children.find(component => component.type === "catalog-footer");
    const header = pageModel.children.find(component => component.type === "catalog-header");
    const pageElement = document.getElementById("pageCanvas");
    const footerElement = document.querySelector(`[data-component-id="${footer.id}"]`);
    const pageRect = pageElement.getBoundingClientRect();
    const footerRect = footerElement.getBoundingClientRect();
    const subtitle = Array.from(footerElement.querySelectorAll('.editor-component--text[data-slot-name="subtitle"] .component-text p'))
      .find(element => element.textContent.includes("Atendimento via WhatsApp"));
    const style = subtitle ? getComputedStyle(subtitle) : null;
    return {
      header: { ...header.frame },
      footer: { ...footer.frame },
      footerId: footer.id,
      footerDom: {
        x: footerRect.left - pageRect.left,
        y: footerRect.top - pageRect.top,
        width: footerRect.width,
        height: footerRect.height
      },
      subtitle: subtitle ? {
        text: subtitle.textContent,
        whiteSpace: style.whiteSpace,
        lineClamp: style.webkitLineClamp,
        scrollHeight: subtitle.scrollHeight,
        clientHeight: subtitle.clientHeight
      } : null
    };
  });

  assert(snapshot.header.x === 24 && snapshot.header.y === 24 && snapshot.header.width === 746, `Cabeçalho visual fora do topo seguro: ${JSON.stringify(snapshot.header)}.`);
  assert(snapshot.footer.x === 24 && snapshot.footer.y === 999 && snapshot.footer.width === 746, `Rodapé visual fora da base segura: ${JSON.stringify(snapshot.footer)}.`);
  assert(Math.abs(snapshot.footerDom.x - 24) <= 2 && Math.abs(snapshot.footerDom.y - 999) <= 2, `DOM do rodapé divergiu do modelo: ${JSON.stringify(snapshot.footerDom)}.`);
  assert(snapshot.subtitle, "O complemento de atendimento não foi renderizado.");
  assert(snapshot.subtitle.text === "Atendimento via WhatsApp", "O texto integral do complemento não foi preservado.");
  assert(snapshot.subtitle.whiteSpace === "normal" && snapshot.subtitle.lineClamp === "2", `O wrap de duas linhas não foi aplicado: ${JSON.stringify(snapshot.subtitle)}.`);
  assert(snapshot.subtitle.scrollHeight <= snapshot.subtitle.clientHeight + 1, "O complemento continua excedendo verticalmente a caixa.");

  await page.evaluate(id => CatalogEditor.store.updateComponent(id, { frame: { y: 500 } }), snapshot.footerId);
  const movedY = await page.evaluate(id => CatalogEditor.store.findComponent(id).component.frame.y, snapshot.footerId);
  assert(movedY === 500, "A posição provável impediu movimentação manual posterior.");
  assert(await page.evaluate(() => CatalogEditor.store.undo()), "Não foi possível desfazer a movimentação do rodapé.");
  assert(await page.evaluate(id => CatalogEditor.store.findComponent(id).component.frame.y, snapshot.footerId) === 999, "Desfazer não restaurou a base provável.");

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await page.evaluate(id => {
    const footer = document.querySelector(`[data-component-id="${id}"]`);
    const subtitle = Array.from(footer.querySelectorAll('.editor-component--text[data-slot-name="subtitle"] .component-text p')).find(element => element.textContent.includes("Atendimento via WhatsApp"));
    return { y: CatalogEditor.store.findComponent(id).component.frame.y, whiteSpace: getComputedStyle(subtitle).whiteSpace };
  }, snapshot.footerId);
  assert(printed.y === 999 && printed.whiteSpace === "normal", "Impressão perdeu posição ou wrap do rodapé.");

  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.12.1 validou topo/base prováveis, liberdade manual e rodapé legível em tela e impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
