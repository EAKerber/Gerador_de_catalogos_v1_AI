/* DB-05.18.10 — data-only validado pelo inspetor, DOM e impressão. */
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
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogProductDataOnlyContract?.VERSION === "05.18.10");

  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 24, width: 420, height: 280 });
    CatalogEditor.store.addComponent("specification", { x: 0, y: 0, width: 130, height: 38 }, {
      parentId: card.id,
      slotName: "specifications",
      props: { icon: "truck", label: "Entrega rápida" }
    });
    CatalogEditor.store.addComponent("specification", { x: 0, y: 0, width: 130, height: 38 }, {
      parentId: card.id,
      slotName: "specifications",
      props: { icon: "layers", label: "Quatro opções" }
    });
    CatalogEditor.store.setSelection(card.id);
    return {
      cardId: card.id,
      artId: card.children.find(component => component.slot?.name === "art").id,
      childIds: card.children.map(component => component.id)
    };
  });

  await page.locator('[data-inspector-tab="content"]').click();
  await page.locator(".card-presentation-secondary > summary").click();
  const modeSelect = page.locator('[data-presentation-path="mode"]');
  assert(await modeSelect.locator('option[value="data-only"]').count() === 1, "O inspetor não oferece o modo Dados.");
  assert(await page.locator('[data-presentation-path="presetId"] option[value="product-data-only"]').count() === 0, "Foi criado um preset redundante para data-only.");

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
    const table = card.children.find(component => component.type === "data-table" && component.slot?.name === "table");
    return {
      frame: { ...card.frame },
      presentation: JSON.parse(JSON.stringify(card.presentation)),
      inspection: CatalogProductDataOnlyContract.inspect(card),
      childIds: card.children.map(component => component.id),
      artId: card.children.find(component => component.slot?.name === "art")?.id || null,
      rows: table ? CatalogEditor.store.getTableRows(table).length : 0,
      slots
    };
  }, ids.cardId);

  const setMode = async mode => {
    await modeSelect.selectOption(mode);
    await page.waitForTimeout(40);
  };
  const setResponsive = async state => {
    await page.locator('[data-presentation-path="responsiveState"]').selectOption(state);
    await page.waitForTimeout(40);
  };

  await setResponsive("wide");
  await setMode("standard");
  const standardWide = await capture();
  await setMode("data-only");
  const dataWide = await capture();
  assert(dataWide.presentation.mode === "data-only", "O modo data-only não foi persistido.");
  assert(dataWide.slots.art.model.width < standardWide.slots.art.model.width, "A prioridade ampla não reduziu a arte.");
  assert(dataWide.slots.specifications.model.width > standardWide.slots.specifications.model.width, "A prioridade ampla não ampliou as informações.");
  assert(dataWide.slots.specifications.dom.width > standardWide.slots.specifications.dom.width, "A prioridade ampla não apareceu no DOM.");
  assert(dataWide.artId === ids.artId && dataWide.childIds.join(",") === ids.childIds.join(","), "Data-only recriou ou removeu filhos no modo amplo.");

  await page.evaluate(cardId => CatalogEditor.store.updateComponent(cardId, { frame: { width: 280, height: 280 } }), ids.cardId);
  await page.evaluate(cardId => CatalogEditor.store.setSelection(cardId), ids.cardId);
  await page.locator('[data-inspector-tab="content"]').click();
  await setResponsive("compact");
  await setMode("standard");
  const standardCompact = await capture();
  await setMode("data-only");
  const dataCompact = await capture();
  assert(dataCompact.inspection.compact === true, "O contrato não reconheceu data-only compacto.");
  assert(dataCompact.slots.art.model.height < standardCompact.slots.art.model.height, "Data-only compacto não reduziu a arte.");
  assert(dataCompact.slots.art.model.height >= dataCompact.inspection.artMinimum, "Data-only compacto reduziu a arte abaixo do mínimo.");
  assert(dataCompact.slots.specifications.model.height > standardCompact.slots.specifications.model.height, "Data-only compacto não ampliou a região informativa.");
  assert(dataCompact.slots.specifications.model.height >= dataCompact.inspection.specificationsMinimum, "A grade compacta ficou abaixo do mínimo.");
  assert(dataCompact.slots.art.model.y + dataCompact.slots.art.model.height < dataCompact.slots.specifications.model.y, "Arte e informações se sobrepuseram no compacto.");
  assert(dataCompact.slots.specifications.model.y + dataCompact.slots.specifications.model.height <= dataCompact.slots.table.model.y, "Informações invadiram a tabela.");
  assert(dataCompact.slots.specifications.dom.height > standardCompact.slots.specifications.dom.height, "A prioridade compacta não apareceu no DOM.");

  const mutation = await page.evaluate(cardId => {
    const card = CatalogEditor.store.findComponent(cardId).component;
    const table = card.children.find(component => component.type === "data-table" && component.slot?.name === "table");
    const before = { height: card.frame.height, history: CatalogEditor.store.getHistoryState().undoCount };
    CatalogEditor.store.replaceTableRowsBulk(table.id, Array.from({ length: 8 }, (_, index) => ({
      code: String(1000 + index),
      package: `CX ${index + 1}`,
      price: `R$ ${index + 1},00`
    })), { mode: "replace" });
    const current = CatalogEditor.store.findComponent(cardId).component;
    return { before, after: { height: current.frame.height, history: CatalogEditor.store.getHistoryState().undoCount } };
  }, ids.cardId);
  const longTable = await capture();
  assert(mutation.after.history === mutation.before.history + 1, "A tabela longa fragmentou o histórico.");
  assert(mutation.after.height > mutation.before.height, "O card não cresceu para a tabela longa.");
  assert(longTable.rows === 8, "A tabela longa não renderizou oito linhas.");
  assert(longTable.slots.table.model.height >= 20 + 8 * 28, "A tabela longa ficou abaixo do conteúdo semântico.");
  assert(longTable.slots.table.model.y + longTable.slots.table.model.height <= longTable.frame.height, "A tabela longa escapou do card.");

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await capture();
  for (const name of ["title", "art", "specifications", "table"]) {
    const screen = longTable.slots[name].dom;
    const print = printed.slots[name].dom;
    for (const key of ["x", "y", "width", "height"]) {
      assert(Math.abs(screen[key] - print[key]) <= 0.015, `Tela e impressão divergiram em ${name}.${key}.`);
    }
  }
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });

  assert(await page.evaluate(() => CatalogEditor.store.undo()), "Não foi possível desfazer a tabela longa.");
  const undone = await capture();
  assert(undone.rows === 1, "Desfazer não restaurou a tabela curta.");
  assert(await page.evaluate(() => CatalogEditor.store.redo()), "Não foi possível refazer a tabela longa.");
  const redone = await capture();
  assert(redone.rows === 8 && redone.presentation.mode === "data-only", "Refazer não restaurou a tabela longa em data-only.");

  const publication = await page.evaluate(() => CatalogEditor.store.getPublicationReport("draft").summary);
  assert((publication.collisions || 0) === 0 && (publication.overflows || 0) === 0, "Data-only produziu colisão ou overflow externo.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.10 validou data-only amplo/compacto, tabela longa, inspetor, DOM e impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
