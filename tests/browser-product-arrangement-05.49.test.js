/* Incremento 05.49 — apresentação encontrável no card e em suas peças internas. */
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const extraArgs = process.env.CATALOG_CHROMIUM_ARGS ? JSON.parse(process.env.CATALOG_CHROMIUM_ARGS) : [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

(async () => {
  browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [...extraArgs, "--no-sandbox", "--disable-dev-shm-usage"]
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(baseURL, { waitUntil: "networkidle" });
  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 24, width: 420, height: 320 });
    const specification = card.children.find(child => child.slot?.name === "specifications");
    CatalogEditor.store.setSelection(card.id);
    return { cardId: card.id, specificationId: specification.id, childIds: card.children.map(child => child.id) };
  });

  assert(await page.locator('[data-inspector-tab="content"]').getAttribute("aria-selected") === "true", "Card ainda abre em Layout em vez de Conteúdo.");
  const presentationSection = page.locator(".inspector-section--card-presentation");
  assert(await presentationSection.count() === 1, "Apresentação do card não aparece como seção própria.");
  const initialGeometry = await presentationSection.evaluate(section => {
    const panel = section.closest(".inspector-tab-panel");
    const sectionRect = section.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    return {
      visible: Boolean(section.offsetWidth && section.offsetHeight),
      first: section === panel.firstElementChild,
      startsVisible: sectionRect.top >= panelRect.top && sectionRect.top < panelRect.bottom
    };
  });
  assert(initialGeometry.visible && initialGeometry.first && initialGeometry.startsVisible, "Apresentação não é o primeiro controle visível de Conteúdo.");

  const arrangement = page.locator('[data-presentation-path="arrangement"]');
  const mode = page.locator('[data-presentation-path="mode"]');
  assert(await arrangement.isVisible() && await mode.isVisible(), "Modo ou arranjo continuam escondidos em controles secundários.");
  assert(await arrangement.inputValue() === "auto" && await mode.inputValue() === "standard", "Defaults de apresentação inesperados.");

  const secondary = page.locator(".card-presentation-secondary");
  await secondary.locator(":scope > summary").click();
  await page.locator('[data-presentation-path="density"]').selectOption("comfortable");
  assert(await secondary.evaluate(element => element.open), "A seção complementar fechou após editar um controle interno.");

  await arrangement.selectOption("stacked");
  await mode.selectOption("technical");
  const stackedState = await page.evaluate(cardId => {
    const card = CatalogEditor.store.findComponent(cardId).component;
    const art = CatalogComponentGeometry.slotFrame(card, "art");
    const specifications = CatalogComponentGeometry.slotFrame(card, "specifications");
    const element = document.querySelector(`[data-component-id="${cardId}"]`);
    return {
      mode: card.presentation.mode,
      arrangement: card.presentation.overrides.arrangement,
      effective: CatalogPresentations.effectiveArrangement(card),
      art,
      specifications,
      rendered: element?.dataset.presentationArrangement,
      childIds: card.children.map(child => child.id)
    };
  }, ids.cardId);
  assert(stackedState.mode === "technical" && stackedState.arrangement === "stacked" && stackedState.effective === "stacked", "Interface acoplou modo Técnico ao arranjo.");
  assert(stackedState.specifications.y > stackedState.art.y && stackedState.specifications.width === stackedState.art.width, "Empilhado não produziu arte acima e especificações abaixo.");
  assert(stackedState.rendered === "stacked", "Renderer não publicou o arranjo efetivo.");
  assert(stackedState.childIds.join(",") === ids.childIds.join(","), "A troca recriou peças internas.");

  await page.evaluate(specificationId => CatalogEditor.store.setSelection(specificationId), ids.specificationId);
  assert(await page.locator('[data-inspector-tab="content"]').getAttribute("aria-selected") === "true", "Peça interna não abriu na aba Conteúdo.");
  assert(await presentationSection.getAttribute("data-card-presentation-owner-id") === ids.cardId, "Peça interna não resolveu o card pai.");
  assert((await presentationSection.locator(".inspector-section__heading span").textContent()).includes("Card pai"), "A superfície não informa que controla o card pai.");
  await arrangement.selectOption("horizontal");

  const horizontalState = await page.evaluate(cardId => {
    const card = CatalogEditor.store.findComponent(cardId).component;
    const art = CatalogComponentGeometry.slotFrame(card, "art");
    const specifications = CatalogComponentGeometry.slotFrame(card, "specifications");
    return {
      selectedId: CatalogEditor.store.getSelected().id,
      mode: card.presentation.mode,
      arrangement: card.presentation.overrides.arrangement,
      effective: CatalogPresentations.effectiveArrangement(card),
      art,
      specifications,
      publication: CatalogEditor.store.getPublicationReport("draft").summary
    };
  }, ids.cardId);
  assert(horizontalState.selectedId === ids.specificationId, "Ajustar pelo filho perdeu a seleção de trabalho.");
  assert(horizontalState.mode === "technical" && horizontalState.arrangement === "horizontal" && horizontalState.effective === "horizontal", "A peça interna não atualizou somente o arranjo do card pai.");
  assert(horizontalState.specifications.x > horizontalState.art.x && horizontalState.specifications.y === horizontalState.art.y, "Lado a lado não produziu colunas horizontais.");
  assert(horizontalState.publication.collisions === 0 && horizontalState.publication.overflows === 0, "Mudança de arranjo gerou colisão ou overflow.");

  assert(pageErrors.length === 0, `Erros no navegador: ${pageErrors.join(" | ")}`);
  if (process.env.CATALOG_SCREENSHOT) await page.screenshot({ path: process.env.CATALOG_SCREENSHOT, fullPage: true });
  await browser.close();
  console.log("✓ Apresentação 05.49 é encontrável no card e em suas peças internas a 1366×768/100%.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
