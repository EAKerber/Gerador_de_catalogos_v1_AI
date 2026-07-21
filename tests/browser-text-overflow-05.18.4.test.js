/* DB-05.18.4 — overflow × escala exercitado na interface real. */
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
  await page.waitForFunction(() => window.CatalogEditor
    && window.CatalogTextAlignmentContract?.VERSION === "05.18.2"
    && window.CatalogTextScaleContract?.VERSION === "05.18.3"
    && window.CatalogTextOverflowContract?.VERSION === "05.18.4.1");

  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    const text = CatalogEditor.store.addComponent("text", { x: 24, y: 24, width: 180, height: 58 });
    CatalogEditor.store.updateComponent(text.id, { props: { content: "PALAVRAEXTREMAMENTELONGASEMESPACOS PALAVRAEXTREMAMENTELONGASEMESPACOS" } });
    const footer = CatalogEditor.store.addComponent("footer-item", { x: 24, y: 130, width: 180, height: 96 });
    const title = footer.children.find(component => component.type === "text" && component.slot?.name === "title");
    CatalogEditor.store.updateComponent(title.id, { props: { content: "RODAPÉ COM CONTEÚDO LONGO PARA TESTE" } });
    CatalogEditor.store.selectComponentInContext(text.id);
    return { textId: text.id, titleId: title.id, textFrame: { ...text.frame }, titleFrame: { ...title.frame } };
  });

  const readText = async id => page.evaluate(componentId => {
    const component = CatalogEditor.store.findComponent(componentId)?.component;
    const shell = document.querySelector(`[data-component-id="${componentId}"] .component-text`);
    const copy = shell?.querySelector("p");
    const style = copy ? getComputedStyle(copy) : null;
    return {
      props: component ? JSON.parse(JSON.stringify(component.props)) : null,
      frame: component ? { ...component.frame } : null,
      whiteSpace: style?.whiteSpace || null,
      overflowWrap: style?.overflowWrap || null,
      textOverflow: style?.textOverflow || null,
      fontSize: style ? Number.parseFloat(style.fontSize) : 0,
      clientWidth: copy?.clientWidth || 0,
      scrollWidth: copy?.scrollWidth || 0,
      clientHeight: copy?.clientHeight || 0,
      scrollHeight: copy?.scrollHeight || 0
    };
  }, id);

  const expected = {
    wrap: { whiteSpace: "pre-wrap", overflowWrap: "anywhere", textOverflow: "clip" },
    ellipsis: { whiteSpace: "nowrap", overflowWrap: "normal", textOverflow: "ellipsis" },
    clip: { whiteSpace: "nowrap", overflowWrap: "normal", textOverflow: "clip" }
  };
  const matrix = [];
  for (const scale of [80, 100, 120]) {
    await page.locator('[data-prop-path="scale"]').selectOption(String(scale));
    for (const overflow of ["wrap", "ellipsis", "clip"]) {
      await page.locator('[data-prop-path="overflow"]').selectOption(overflow);
      const state = await readText(ids.textId);
      const contract = expected[overflow];
      assert(state.props.scale === scale && state.props.overflow === overflow, `A interface não persistiu ${scale}%/${overflow}.`);
      assert(state.whiteSpace === contract.whiteSpace, `${overflow} publicou white-space ${state.whiteSpace}.`);
      assert(state.overflowWrap === contract.overflowWrap, `${overflow} publicou overflow-wrap ${state.overflowWrap}.`);
      assert(state.textOverflow === contract.textOverflow, `${overflow} publicou text-overflow ${state.textOverflow}.`);
      assert(JSON.stringify(state.frame) === JSON.stringify(ids.textFrame), `${scale}%/${overflow} alterou o frame externo.`);
      matrix.push({ scale, overflow, state });
    }
  }

  for (const scale of [80, 100, 120]) {
    const wrap = matrix.find(item => item.scale === scale && item.overflow === "wrap").state;
    const ellipsis = matrix.find(item => item.scale === scale && item.overflow === "ellipsis").state;
    const clip = matrix.find(item => item.scale === scale && item.overflow === "clip").state;
    assert(wrap.scrollWidth <= wrap.clientWidth + 1, `wrap ${scale}% não quebrou a palavra dentro da caixa.`);
    assert(ellipsis.scrollWidth > ellipsis.clientWidth && clip.scrollWidth > clip.clientWidth, `ellipsis/clip ${scale}% não mantiveram a linha única para corte.`);
    assert(ellipsis.textOverflow !== clip.textOverflow, `ellipsis e clip ${scale}% não ficaram distinguíveis.`);
  }

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printState = await readText(ids.textId);
  const lastScreen = matrix[matrix.length - 1].state;
  assert(printState.whiteSpace === lastScreen.whiteSpace && printState.overflowWrap === lastScreen.overflowWrap && printState.textOverflow === lastScreen.textOverflow, "A impressão divergiu da política clip em tela.");
  assert(Math.abs(printState.fontSize - lastScreen.fontSize) < 0.01, "A impressão divergiu da escala combinada com overflow.");
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });

  await page.evaluate(titleId => CatalogEditor.store.selectComponentInContext(titleId), ids.titleId);
  const footerDefault = await readText(ids.titleId);
  assert(footerDefault.props.overflow === "ellipsis" && footerDefault.props.overflowExplicit === false, "O título do rodapé não preservou reticências como default estrutural.");
  assert(footerDefault.whiteSpace === "nowrap" && footerDefault.textOverflow === "ellipsis", "O default visual do título do rodapé deixou de usar reticências.");

  await page.locator('[data-prop-path="overflow"]').selectOption("wrap");
  const footerWrap = await readText(ids.titleId);
  assert(footerWrap.props.overflow === "wrap" && footerWrap.props.overflowExplicit === true, "Wrap explícito não foi persistido no rodapé.");
  assert(footerWrap.whiteSpace === "normal" && footerWrap.overflowWrap === "anywhere", "A regra estrutural do rodapé ainda mascarou wrap explícito.");
  assert(JSON.stringify(footerWrap.frame) === JSON.stringify(ids.titleFrame), "Wrap explícito alterou o frame do rodapé.");

  const publication = await page.evaluate(() => CatalogEditor.store.getPublicationReport("draft").summary);
  assert((publication.collisions || 0) === 0 && (publication.overflows || 0) === 0, "As políticas internas introduziram colisão ou overflow geométrico externo.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.4 validou nove combinações de escala/overflow e a política específica do rodapé.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
