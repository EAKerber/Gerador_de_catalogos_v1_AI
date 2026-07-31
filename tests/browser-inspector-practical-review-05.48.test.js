/* Incremento 05.48 — revisão prática do inspetor em 1366×768 e zoom 100%. */
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"]
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => {
    const card = CatalogEditor.store.addComponent("product-card", {
      x: 24,
      y: 24,
      width: 350,
      height: 300
    });
    CatalogEditor.store.setSelection(card.id);
  });

  assert(
    await page.locator('[data-inspector-panel="structure"] > .inspector-section--frame-command').count() === 1,
    "Posição e tamanho não pertence exclusivamente à aba Layout."
  );
  assert(
    await page.locator("#inspectorRoot > .inspector-section--frame-command").count() === 0,
    "Posição e tamanho continua como irmão global das abas."
  );

  const expectedFirstControl = {
    content: ".product-binding-summary",
    structure: "[data-frame-draft-path=\"x\"]",
    style: "[data-style-path]"
  };

  for (const tab of ["content", "structure", "style"]) {
    await page.locator(`[data-inspector-tab="${tab}"]`).click();
    const geometry = await page.evaluate(({ tab, firstControl }) => {
      const root = document.getElementById("inspectorRoot");
      const tabs = document.querySelector(".inspector-tabs");
      const panel = document.querySelector(`[data-inspector-panel="${tab}"]`);
      const control = panel?.querySelector(firstControl);
      const rootRect = root?.getBoundingClientRect();
      const tabsRect = tabs?.getBoundingClientRect();
      const panelRect = panel?.getBoundingClientRect();
      const controlRect = control?.getBoundingClientRect();
      const buttons = [...root.querySelectorAll("button")]
        .filter(button => button.offsetWidth && button.offsetHeight)
        .map(button => {
          const style = getComputedStyle(button);
          return {
            label: button.textContent.trim() || button.getAttribute("aria-label"),
            radius: parseFloat(style.borderRadius),
            borderStyle: style.borderStyle
          };
        });
      return {
        browserZoom: window.devicePixelRatio,
        bodyOverflow: document.documentElement.scrollWidth > innerWidth,
        panelVisible: Boolean(panelRect?.width && panelRect?.height),
        panelStartsAfterTabs: Boolean(panelRect && tabsRect && panelRect.top >= tabsRect.bottom - 1),
        panelFitsRoot: Boolean(panelRect && rootRect && panelRect.bottom <= rootRect.bottom + 1),
        firstControlVisible: Boolean(
          controlRect
          && panelRect
          && controlRect.top >= panelRect.top
          && controlRect.top < panelRect.bottom
        ),
        buttons
      };
    }, { tab, firstControl: expectedFirstControl[tab] });
    assert(geometry.browserZoom === 1, `${tab}: o ensaio não permaneceu no zoom de navegador 100%.`);
    assert(!geometry.bodyOverflow, `${tab}: o documento criou rolagem horizontal global.`);
    assert(geometry.panelVisible, `${tab}: o painel da aba não está visível.`);
    assert(geometry.panelStartsAfterTabs, `${tab}: o corpo da aba foi deslocado por conteúdo global.`);
    assert(geometry.panelFitsRoot, `${tab}: o corpo da aba ultrapassou a altura útil do inspetor.`);
    assert(geometry.firstControlVisible, `${tab}: o primeiro controle específico exige rolagem ou zoom externo.`);
    assert(
      geometry.buttons.every(button => button.radius >= 4 && button.borderStyle !== "outset"),
      `${tab}: há botão visível com apresentação nativa acidental: ${JSON.stringify(geometry.buttons)}`
    );
  }

  await page.locator('[data-inspector-tab="structure"]').click();
  const buttonStyles = await page.locator("[data-frame-apply-all], [data-fit-content-height]").evaluateAll(buttons => (
    buttons.map(button => {
      const style = getComputedStyle(button);
      return {
        visible: Boolean(button.offsetWidth && button.offsetHeight),
        minHeight: parseFloat(style.minHeight),
        radius: parseFloat(style.borderRadius),
        weight: Number(style.fontWeight),
        borderStyle: style.borderStyle,
        background: style.backgroundColor
      };
    })
  ));
  assert(buttonStyles.length === 2 && buttonStyles.every(item => item.visible), "As ações de geometria não estão visíveis.");
  assert(
    buttonStyles.every(item => item.minHeight >= 32 && item.radius >= 4 && item.weight >= 700 && item.borderStyle !== "outset"),
    `Ações de geometria ainda usam apresentação nativa acidental: ${JSON.stringify(buttonStyles)}`
  );
  assert(
    buttonStyles.every(item => !["rgba(0, 0, 0, 0)", "buttonface"].includes(item.background.toLowerCase())),
    `Ações de geometria ficaram sem superfície definida: ${JSON.stringify(buttonStyles)}`
  );
  const primaryBeforeHover = await page.locator("[data-frame-apply-all]").evaluate(button => getComputedStyle(button).backgroundColor);
  await page.locator("[data-frame-apply-all]").hover();
  const primaryAfterHover = await page.locator("[data-frame-apply-all]").evaluate(button => getComputedStyle(button).backgroundColor);
  assert(primaryAfterHover !== primaryBeforeHover, "A ação primária não possui estado hover observável.");

  await page.evaluate(() => {
    const table = CatalogEditor.store.addComponent("data-table", { x: 420, y: 24, width: 300, height: 96 });
    CatalogEditor.store.setSelection(table.id);
  });
  await page.locator('[data-inspector-tab="content"]').click();
  const disabledStyles = await page.locator("#inspectorRoot button:disabled").evaluateAll(buttons => (
    buttons.map(button => {
      const style = getComputedStyle(button);
      return { opacity: Number(style.opacity), cursor: style.cursor };
    })
  ));
  assert(disabledStyles.length > 0, "O fixture não expôs controles desabilitados.");
  assert(
    disabledStyles.every(item => item.opacity <= .42 && item.cursor === "not-allowed"),
    `O estado disabled não está consolidado no inspetor: ${JSON.stringify(disabledStyles)}`
  );

  assert(pageErrors.length === 0, `Erros no navegador: ${pageErrors.join(" | ")}`);
  if (process.env.CATALOG_SCREENSHOT) {
    await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });
  }
  await browser.close();
  console.log("✓ Inspetor 05.48 preserva altura útil e controles estilizados em 1366×768/100%.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
