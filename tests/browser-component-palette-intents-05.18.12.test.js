/* DB-05.18.12 — biblioteca por intenção, busca, teclado e contexto. */
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sorted = values => values.slice().sort().join(",");
let browser;

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogComponentPaletteIntentContract?.VERSION === "05.18.12");

  const expectedPrimary = {
    page: ["catalog-footer", "catalog-header"],
    product: ["art", "art-gallery", "product-card"],
    data: ["legend-panel"],
    communication: ["icon", "separator", "text"]
  };
  const expectedAdvanced = ["data-table", "footer-item", "layout-container", "legend-group", "legend-item", "specification", "title-symbol"];

  const snapshot = await page.evaluate(() => {
    const group = id => Array.from(document.querySelectorAll(`[data-intent-group="${id}"] [data-insert-component]`)).map(button => button.dataset.insertComponent);
    const items = Array.from(document.querySelectorAll("#componentPalette .palette-item[data-component-type]")).filter(item => item.querySelector("[data-insert-component]"));
    return {
      headings: Array.from(document.querySelectorAll("[data-intent-tier='primary'] .palette-intent-heading h3")).map(element => element.textContent.trim()),
      groups: {
        page: group("page"),
        product: group("product"),
        data: group("data"),
        communication: group("communication"),
        advanced: group("advanced")
      },
      advancedOpen: document.querySelector('[data-intent-group="advanced"]')?.open,
      searchCount: document.querySelectorAll("[data-palette-intent-search]").length,
      stylesheet: document.querySelector('link[data-component-intent-styles="true"]')?.getAttribute("href") || null,
      items: items.map(item => ({
        type: item.dataset.componentType,
        draggable: item.getAttribute("draggable"),
        tabindex: item.getAttribute("tabindex"),
        insertCount: item.querySelectorAll("[data-insert-component]").length
      }))
    };
  });

  assert(snapshot.headings.join(",") === "Página,Produto,Dados,Comunicação", `Ordem visual inesperada: ${snapshot.headings.join(",")}.`);
  for (const [id, types] of Object.entries(expectedPrimary)) assert(sorted(snapshot.groups[id]) === sorted(types), `Grupo visual ${id} divergente: ${snapshot.groups[id].join(",")}.`);
  assert(sorted(snapshot.groups.advanced) === sorted(expectedAdvanced), `Estrutura avançada divergente: ${snapshot.groups.advanced.join(",")}.`);
  assert(snapshot.advancedOpen === false, "Estrutura avançada deveria iniciar recolhida na página.");
  assert(snapshot.searchCount === 1, "A biblioteca não possui um único campo de busca.");
  assert(snapshot.stylesheet?.includes("styles/component-intents.css"), "A folha de estilos da navegação por intenção não foi carregada.");
  assert(snapshot.items.length === 16, `A biblioteca deveria conter 16 itens regulares, mas contém ${snapshot.items.length}.`);
  assert(new Set(snapshot.items.map(item => item.type)).size === 16, "Um tipo aparece mais de uma vez na biblioteca.");
  assert(snapshot.items.every(item => item.draggable === "true" && item.tabindex === "0" && item.insertCount === 1), `Drag, teclado ou botão + foi perdido: ${JSON.stringify(snapshot.items.filter(item => item.draggable !== "true" || item.tabindex !== "0" || item.insertCount !== 1))}.`);

  const dragPayload = await page.evaluate(() => {
    const item = document.querySelector('.palette-item[data-component-type="art"]');
    const transfer = new DataTransfer();
    item.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: transfer }));
    item.dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer: transfer }));
    return {
      catalog: transfer.getData("application/x-catalog-component"),
      text: transfer.getData("text/plain")
    };
  });
  assert(dragPayload.catalog === "art" && dragPayload.text === "art", "Mover o item no DOM quebrou o payload de drag and drop.");

  const search = page.locator("[data-palette-intent-search]");
  await search.fill("tabela");
  await page.waitForTimeout(20);
  const searched = await page.evaluate(() => ({
    advancedOpen: document.querySelector('[data-intent-group="advanced"]')?.open,
    dataTableHidden: document.querySelector('.palette-item[data-component-type="data-table"]')?.hidden,
    productCardHidden: document.querySelector('.palette-item[data-component-type="product-card"]')?.hidden,
    status: document.querySelector("[data-palette-search-status]")?.textContent.trim(),
    visibleRegular: Array.from(document.querySelectorAll(".palette-item[data-component-type]")).filter(item => item.querySelector("[data-insert-component]") && !item.hidden).map(item => item.dataset.componentType)
  }));
  assert(searched.advancedOpen === true, "A busca não abriu automaticamente o caminho avançado.");
  assert(searched.dataTableHidden === false && searched.productCardHidden === true, "A busca não filtrou tabela e itens não relacionados.");
  assert(searched.visibleRegular.includes("data-table"), "Tabela de dados não ficou acessível pela busca.");
  assert(/resultado/.test(searched.status), "A busca não publicou contagem de resultados.");

  await search.press("Escape");
  const cleared = await page.evaluate(() => ({
    value: document.querySelector("[data-palette-intent-search]")?.value,
    visible: Array.from(document.querySelectorAll(".palette-item[data-component-type]")).filter(item => item.querySelector("[data-insert-component]") && !item.hidden).length
  }));
  assert(cleared.value === "" && cleared.visible === 16, "Escape não restaurou a biblioteca completa.");

  const beforePlus = await page.evaluate(() => CatalogEditor.store.getPage().children.length);
  await page.locator('[data-insert-component="product-card"]').click();
  await page.waitForFunction(count => CatalogEditor.store.getPage().children.length === count + 1, beforePlus);
  const cardId = await page.evaluate(() => CatalogEditor.store.getPage().children.find(component => component.type === "product-card")?.id || null);
  assert(cardId, "O botão + não inseriu o card de produto após a reorganização.");

  const currentFirstItem = page.locator("#componentPalette .palette-item[data-component-type]").first();
  await currentFirstItem.focus();
  await page.keyboard.press("/");
  assert(await page.evaluate(() => document.activeElement?.matches("[data-palette-intent-search]")), "O atalho / não focou a busca após rerender.");
  await page.locator("[data-palette-intent-search]").press("Escape");

  const beforeKeyboard = await page.evaluate(() => CatalogEditor.store.getPage().children.length);
  const iconItem = page.locator('.palette-item[data-component-type="icon"]');
  await iconItem.focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(count => CatalogEditor.store.getPage().children.length === count + 1, beforeKeyboard);
  assert(await page.evaluate(() => CatalogEditor.store.getPage().children.some(component => component.type === "icon")), "Enter não inseriu o componente após a reorganização.");

  await page.evaluate(id => CatalogEditor.store.setEditingContext(id), cardId);
  await page.waitForFunction(() => CatalogEditor.store.getEditingContext()?.type === "product-card");
  const contextual = await page.evaluate(() => {
    const types = Array.from(document.querySelectorAll("[data-insert-component]")).map(button => button.dataset.insertComponent);
    const advanced = document.querySelector('[data-intent-group="advanced"]');
    return {
      types,
      advancedOpen: advanced?.open,
      advancedTypes: advanced ? Array.from(advanced.querySelectorAll("[data-insert-component]")).map(button => button.dataset.insertComponent) : [],
      primaryGroups: Array.from(document.querySelectorAll("[data-intent-tier='primary']")).map(group => group.dataset.intentGroup),
      searchCount: document.querySelectorAll("[data-palette-intent-search]").length
    };
  });
  const cardAllowed = ["title-symbol", "art", "art-gallery", "specification", "data-table", "text", "icon"];
  assert(sorted(contextual.types) === sorted(cardAllowed), `O contexto do card perdeu tipos: ${contextual.types.join(",")}.`);
  assert(contextual.advancedOpen === true, "Estrutura avançada não abriu automaticamente no contexto interno.");
  assert(sorted(contextual.advancedTypes) === sorted(["data-table", "specification", "title-symbol"]), "O caminho avançado contextual está incorreto.");
  assert(sorted(contextual.primaryGroups) === sorted(["product", "communication"]), "Os grupos primários contextuais estão incorretos.");
  assert(contextual.searchCount === 1, "O rerender contextual duplicou o campo de busca.");

  const beforeContextPlus = await page.evaluate(id => CatalogEditor.store.findComponent(id).component.children.length, cardId);
  await page.locator('[data-insert-component="specification"]').click();
  await page.waitForFunction(({ id, count }) => CatalogEditor.store.findComponent(id).component.children.length === count + 1, { id: cardId, count: beforeContextPlus });
  assert(await page.evaluate(id => CatalogEditor.store.findComponent(id).component.children.filter(component => component.type === "specification").length >= 3, cardId), "O botão + contextual deixou de inserir peças internas.");

  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.12 reorganiza a biblioteca sem perder busca, teclado, drag, + ou acesso contextual.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
