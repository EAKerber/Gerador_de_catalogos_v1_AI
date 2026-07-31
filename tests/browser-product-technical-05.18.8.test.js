/* DB-05.18.8 — modo technical validado pela interface real e impressão. */
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
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogProductTechnicalContract?.VERSION === "05.18.8");

  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 24, width: 420, height: 320 });
    CatalogEditor.store.setSelection(card.id);
    return {
      cardId: card.id,
      childIds: card.children.map(component => component.id),
      childSnapshot: card.children.map(component => ({ id: component.id, type: component.type, props: JSON.parse(JSON.stringify(component.props)) }))
    };
  });

  await page.locator('[data-inspector-tab="content"]').click();
  await page.locator(".card-presentation-secondary > summary").click();

  const capture = async () => page.evaluate(cardId => {
    const card = CatalogEditor.store.findComponent(cardId)?.component;
    const cardElement = document.querySelector(`[data-component-id="${cardId}"]`);
    const cardRect = cardElement?.getBoundingClientRect();
    const union = elements => {
      const rects = elements.map(element => element.getBoundingClientRect());
      if (!rects.length) return null;
      const left = Math.min(...rects.map(rect => rect.left));
      const top = Math.min(...rects.map(rect => rect.top));
      const right = Math.max(...rects.map(rect => rect.right));
      const bottom = Math.max(...rects.map(rect => rect.bottom));
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    };
    const relative = rect => rect && cardRect ? {
      x: (rect.left - cardRect.left) / cardRect.width,
      y: (rect.top - cardRect.top) / cardRect.height,
      width: rect.width / cardRect.width,
      height: rect.height / cardRect.height
    } : null;
    const slots = {};
    for (const name of ["title", "art", "specifications", "table"]) {
      const elements = Array.from(document.querySelectorAll(`[data-parent-id="${cardId}"][data-slot-name="${name}"]`));
      slots[name] = {
        model: CatalogComponentGeometry.slotFrame(card, name),
        dom: relative(union(elements)),
        count: elements.length
      };
    }
    return {
      frame: { ...card.frame },
      presentation: JSON.parse(JSON.stringify(card.presentation)),
      childIds: card.children.map(component => component.id),
      childSnapshot: card.children.map(component => ({ id: component.id, type: component.type, props: JSON.parse(JSON.stringify(component.props)) })),
      slots
    };
  }, ids.cardId);

  const setPreset = async presetId => {
    await page.locator('[data-presentation-path="presetId"]').selectOption(presetId);
    await page.waitForTimeout(30);
  };
  const setResponsive = async state => {
    await page.locator('[data-presentation-path="responsiveState"]').selectOption(state);
    await page.waitForTimeout(30);
  };

  await setResponsive("wide");
  await setPreset("product-standard");
  const standardWide = await capture();
  await setPreset("product-technical");
  const technicalWide = await capture();
  assert(technicalWide.presentation.mode === "technical", "O preset não materializou o modo técnico.");
  assert(technicalWide.slots.specifications.model.width > standardWide.slots.specifications.model.width, "Técnico amplo não ampliou as especificações.");
  assert(technicalWide.slots.art.model.width < standardWide.slots.art.model.width, "Técnico amplo não reduziu a arte.");
  assert(technicalWide.slots.specifications.dom.width > standardWide.slots.specifications.dom.width, "A prioridade ampla não apareceu no DOM.");

  await page.evaluate(cardId => CatalogEditor.store.updateComponent(cardId, { frame: { width: 280, height: 390 } }), ids.cardId);
  await page.evaluate(cardId => CatalogEditor.store.setSelection(cardId), ids.cardId);
  await setResponsive("compact");
  await setPreset("product-standard");
  const standardCompact = await capture();
  await setPreset("product-technical");
  const technicalCompact = await capture();
  assert(technicalCompact.presentation.mode === "technical" && technicalCompact.presentation.responsiveState === "compact", "Técnico compacto não foi persistido.");
  assert(technicalCompact.slots.art.model.height < standardCompact.slots.art.model.height, "Técnico compacto não reduziu verticalmente a arte.");
  assert(standardCompact.slots.art.model.height - technicalCompact.slots.art.model.height <= 24, "Técnico compacto excedeu a transferência máxima.");
  assert(technicalCompact.slots.specifications.model.height > standardCompact.slots.specifications.model.height, "Técnico compacto não ampliou verticalmente as especificações.");
  assert(technicalCompact.slots.specifications.dom.height > standardCompact.slots.specifications.dom.height, "A prioridade compacta não apareceu no DOM.");
  assert(technicalCompact.slots.art.model.height >= 60, "Técnico compacto reduziu arte simples abaixo do mínimo.");
  assert(technicalCompact.slots.art.model.y + technicalCompact.slots.art.model.height < technicalCompact.slots.specifications.model.y, "Arte e especificações se sobrepuseram.");
  assert(technicalCompact.slots.specifications.model.y + technicalCompact.slots.specifications.model.height <= technicalCompact.slots.table.model.y, "Especificações invadiram a tabela.");
  assert(technicalCompact.childIds.join(",") === ids.childIds.join(","), "Trocar para técnico recriou a subárvore.");
  assert(JSON.stringify(technicalCompact.childSnapshot) === JSON.stringify(ids.childSnapshot), "Trocar para técnico alterou conteúdo dos filhos.");

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printCompact = await capture();
  for (const name of ["title", "art", "specifications", "table"]) {
    const screen = technicalCompact.slots[name].dom;
    const printed = printCompact.slots[name].dom;
    for (const key of ["x", "y", "width", "height"]) {
      assert(Math.abs(screen[key] - printed[key]) <= 0.015, `Tela e impressão divergiram em ${name}.${key}.`);
    }
  }
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });

  assert(await page.evaluate(() => CatalogEditor.store.undo()), "Não foi possível desfazer técnico.");
  const undone = await capture();
  assert(undone.presentation.mode === "standard", "Desfazer não restaurou o modo padrão.");
  assert(Math.abs(undone.slots.specifications.model.height - standardCompact.slots.specifications.model.height) < 0.01, "Desfazer não restaurou as especificações padrão.");
  assert(await page.evaluate(() => CatalogEditor.store.redo()), "Não foi possível refazer técnico.");
  const redone = await capture();
  assert(redone.presentation.mode === "technical", "Refazer não restaurou técnico.");
  assert(Math.abs(redone.slots.specifications.model.height - technicalCompact.slots.specifications.model.height) < 0.01, "Refazer não restaurou a geometria técnica.");

  const publication = await page.evaluate(() => CatalogEditor.store.getPublicationReport("draft").summary);
  assert((publication.collisions || 0) === 0 && (publication.overflows || 0) === 0, "Técnico produziu colisão ou overflow externo.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.8 validou técnico amplo/compacto, DOM, reversibilidade e impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
