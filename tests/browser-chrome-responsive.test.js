/* Incremento 05.11 — geometria real da toolbar e da biblioteca em três viewports. */
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function intersects(a, b) {
  return a.left < b.right - .5 && a.right > b.left + .5 && a.top < b.bottom - .5 && a.bottom > b.top + .5;
}

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"] });

  for (const width of [1280, 1366, 1800]) {
    const page = await browser.newPage({ viewport: { width, height: 768 } });
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });

    const toolbar = await page.evaluate(() => {
      const rect = element => {
        const value = element.getBoundingClientRect();
        return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height };
      };
      const documentGroup = document.querySelector('.app-toolbar__group[aria-label="Documento"]');
      return {
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        toolbar: rect(document.querySelector(".app-toolbar")),
        documentGroup: rect(documentGroup),
        documentItems: [...documentGroup.children].map(rect),
        visualizationSummaryDisplay: getComputedStyle(document.querySelector("#visualizationMenu > summary")).display,
        visualizationControlsDisplay: getComputedStyle(document.querySelector(".toolbar-visualization__controls")).display
      };
    });

    assert(toolbar.scrollWidth <= toolbar.viewportWidth, `A página criou scroll horizontal em ${width}px.`);
    assert(toolbar.toolbar.left >= 0 && toolbar.toolbar.right <= width + .5, `A toolbar saiu do viewport em ${width}px.`);
    assert(toolbar.documentGroup.left >= 0 && toolbar.documentGroup.right <= width + .5, `Documento foi cortado em ${width}px.`);
    for (let index = 0; index < toolbar.documentItems.length; index += 1) {
      const item = toolbar.documentItems[index];
      assert(item.left >= toolbar.documentGroup.left - .5 && item.right <= toolbar.documentGroup.right + .5, `Comando de documento ${index} foi cortado em ${width}px.`);
      for (let next = index + 1; next < toolbar.documentItems.length; next += 1) {
        assert(!intersects(item, toolbar.documentItems[next]), `Comandos de documento ${index}/${next} se sobrepõem em ${width}px.`);
      }
    }

    if (width < 1500) {
      assert(toolbar.visualizationSummaryDisplay !== "none", `O agrupamento Visualização não apareceu em ${width}px.`);
      assert(toolbar.visualizationControlsDisplay === "none", `Preferências abertas consumiram a toolbar em ${width}px.`);
      await page.locator("#visualizationMenu > summary").focus();
      await page.keyboard.press("Enter");
      assert(await page.locator("#visualizationMenu").evaluate(element => element.open), `Enter não abriu Visualização em ${width}px.`);
      const controlIds = await page.locator(".toolbar-visualization__controls input, .toolbar-visualization__controls select").evaluateAll(elements => elements.map(element => ({ id: element.id, visible: Boolean(element.offsetWidth || element.offsetHeight) })));
      assert(controlIds.length === 7 && controlIds.every(item => item.id && item.visible), `Controles de visualização não ficaram acessíveis em ${width}px.`);
      await page.keyboard.press("Escape");
      await page.locator("#visualizationMenu").evaluate(element => { element.open = false; });
    } else {
      assert(toolbar.visualizationSummaryDisplay === "none" && toolbar.visualizationControlsDisplay === "flex", "Visualização não voltou ao modo inline no viewport amplo.");
    }

    const cards = await page.locator("[data-official-recipes] .palette-item").evaluateAll(elements => elements.slice(0, 4).map(element => {
      const rect = node => {
        const value = node.getBoundingClientRect();
        return { left: value.left, top: value.top, right: value.right, bottom: value.bottom };
      };
      return {
        card: rect(element),
        meta: rect(element.querySelector(".palette-item__meta")),
        actions: rect(element.querySelector(".palette-item__actions")),
        insertLabel: element.querySelector(".palette-item__insert")?.getAttribute("aria-label") || ""
      };
    }));
    assert(cards.length > 0, "Receitas oficiais não foram renderizadas para testar a biblioteca.");
    cards.forEach((card, index) => {
      assert(card.meta.right <= card.actions.left + .5, `Texto e ações do card ${index} se sobrepõem em ${width}px.`);
      assert(card.actions.right <= card.card.right + .5, `Ações do card ${index} saíram da região em ${width}px.`);
      assert(card.insertLabel.startsWith("Inserir "), `Ação primária do card ${index} perdeu nome acessível.`);
    });

    assert(pageErrors.length === 0, `Erros no navegador em ${width}px: ${pageErrors.join(" | ")}`);
    if (process.env.CATALOG_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.CATALOG_SCREENSHOT_DIR, `chrome-${width}.png`), fullPage: true });
    await page.close();
  }

  await browser.close();
  console.log("✓ Toolbar, cards e teclado validados em 1280/1366/1800 px.");
})().catch(error => { console.error(error); process.exitCode = 1; });
