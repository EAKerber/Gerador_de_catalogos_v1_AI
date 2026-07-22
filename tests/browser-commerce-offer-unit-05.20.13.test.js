/* DB-05.20.13 — unidade de oferta no editor real. */
"use strict";

const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");

const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = process.env.CATALOG_OFFER_UNIT_OUTPUT_DIR || path.join("audit-output", "db-05.20.13", "offer-unit");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

fs.mkdirSync(outputDir, { recursive: true });

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor?.store && window.CatalogCommerceOfferUnitRecipeContract?.VERSION === "05.20.13");

  const fixture = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false, snapEnabled: false, smartSnapEnabled: false });
    const parent = store.addComponent("layout-container", { x: 24, y: 80, width: 746, height: 526 }, {
      props: { label: "OFERTAS INDEPENDENTES", recipeRole: "offer-strip" },
      style: { surface: "surface.paper", border: "border.none", radius: "radius.none" },
      layout: { mode: "row", padding: 0, gap: 8, columns: 4, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 500, mode: "row" } }
    });
    store.setEditingContext(parent.id);
    const baseline = store.getExportDocument();
    const historyBefore = store.getHistoryState();
    const ids = [];
    for (let index = 0; index < 4; index += 1) {
      store.setEditingContext(parent.id);
      const inserted = store.insertComponentFromTemplate("commerce-offer-unit", { parentId: parent.id });
      ids.push(inserted.id);
    }
    const completed = store.getExportDocument();
    const historyAfter = store.getHistoryState();
    return { parentId: parent.id, ids, baseline, completed, historyBefore, historyAfter };
  });

  assert(fixture.ids.length === 4, "Quatro ofertas não foram inseridas.");
  assert(fixture.historyAfter.undoCount === fixture.historyBefore.undoCount + 4, "As quatro inserções não criaram quatro transações.");
  await page.waitForFunction(ids => ids.every(id => document.querySelector(`[data-component-id="${id}"]`)), fixture.ids);

  const historyRoundTrip = await page.evaluate(count => {
    const store = CatalogEditor.store;
    for (let index = 0; index < count; index += 1) store.undo();
    const undone = store.getExportDocument();
    for (let index = 0; index < count; index += 1) store.redo();
    const redone = store.getExportDocument();
    return { undone, redone };
  }, 4);
  assert(JSON.stringify(canonical(historyRoundTrip.undone)) === JSON.stringify(canonical(fixture.baseline)), "Undo não restaurou o contêiner sem ofertas.");
  assert(JSON.stringify(canonical(historyRoundTrip.redone)) === JSON.stringify(canonical(fixture.completed)), "Redo não restaurou as quatro ofertas.");

  async function measure(media) {
    return page.evaluate(({ parentId, media }) => {
      const store = CatalogEditor.store;
      const parent = store.findComponent(parentId).component;
      const flatten = component => [component, ...(component.children || []).flatMap(flatten)];
      const rect = element => {
        const box = element?.getBoundingClientRect();
        return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height } : null;
      };
      const offers = parent.children.filter(component => component.props?.recipeRole === "offer-unit").map(root => {
        const all = flatten(root);
        const roles = Object.fromEntries(all.filter(item => item.props?.recipeRole).map(item => [item.props.recipeRole, item]));
        const textMetric = role => {
          const item = roles[role];
          const element = item ? document.querySelector(`[data-component-id="${item.id}"]`) : null;
          const text = element?.querySelector(".component-text p");
          return { id: item?.id || null, text: text?.textContent || "", fontSize: text ? Number.parseFloat(getComputedStyle(text).fontSize) : 0, rect: rect(element) };
        };
        return {
          id: root.id,
          root: rect(document.querySelector(`[data-component-id="${root.id}"]`)),
          descendantIds: all.map(item => item.id),
          types: [...new Set(all.map(item => item.type))],
          roles: Object.keys(roles),
          code: textMetric("code"),
          measure: textMetric("measure"),
          amount: textMetric("amount"),
          priceRoot: rect(roles["price-block"] ? document.querySelector(`[data-component-id="${roles["price-block"].id}"]`) : null),
          promoSurfaces: [...new Set(all.map(item => item.style?.surface).filter(value => String(value || "").startsWith("surface.promo-")))]
        };
      });
      return { media, offers, order: parent.children.map(component => component.id), publication: store.getPublicationReport("draft").summary };
    }, { parentId: fixture.parentId, media });
  }

  function validate(snapshot) {
    assert(snapshot.offers.length === 4, `Esperadas quatro ofertas, obtidas ${snapshot.offers.length}.`);
    const allIds = snapshot.offers.flatMap(offer => offer.descendantIds);
    assert(new Set(allIds).size === allIds.length, "Há IDs repetidos entre as ofertas.");
    snapshot.offers.forEach((offer, index) => {
      for (const role of ["offer-unit", "media", "code", "measure", "price-block", "currency", "amount"]) assert(offer.roles.includes(role), `Oferta ${index + 1} sem papel ${role}.`);
      assert(!offer.types.includes("data-table"), `Oferta ${index + 1} depende de tabela.`);
      assert(offer.priceRoot?.width > 0 && offer.priceRoot?.height > 0, `Oferta ${index + 1} sem contêiner visual de preço.`);
      assert(offer.amount.fontSize >= offer.code.fontSize * 2, `Oferta ${index + 1}: preço não domina o código.`);
      assert(offer.amount.fontSize >= offer.measure.fontSize * 1.5, `Oferta ${index + 1}: preço não domina a medida.`);
      assert(offer.promoSurfaces.length >= 3, `Oferta ${index + 1}: superfícies promocionais insuficientes.`);
    });
    assert(snapshot.publication.collisions === 0, `Ofertas introduziram colisões: ${JSON.stringify(snapshot.publication)}.`);
    assert(snapshot.publication.overflows === 0, `Ofertas introduziram overflow: ${JSON.stringify(snapshot.publication)}.`);
    assert(snapshot.publication.missingReferences === 0, "Ofertas introduziram referência obrigatória ausente.");
  }

  const screen = await measure("screen");
  validate(screen);
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await measure("print");
  validate(printed);
  printed.offers.forEach((offer, index) => {
    assert(Math.abs(offer.amount.fontSize - screen.offers[index].amount.fontSize) < 0.1, `Oferta ${index + 1}: preço divergiu na impressão.`);
  });
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });

  const independence = await page.evaluate(parentId => {
    const store = CatalogEditor.store;
    const parent = store.findComponent(parentId).component;
    const offers = () => parent.children.filter(component => component.props?.recipeRole === "offer-unit");
    const flatten = component => [component, ...(component.children || []).flatMap(flatten)];
    const roleId = (root, role) => flatten(root).find(item => item.props?.recipeRole === role)?.id;
    const initial = offers().map(item => item.id);

    const deletedId = initial[3];
    store.deleteComponent(deletedId);
    const duplicate = store.duplicateComponent(initial[0], { offsetX: 0, offsetY: 0 });
    const originalCodeId = roleId(store.findComponent(initial[0]).component, "code");
    const duplicateCodeId = roleId(duplicate, "code");
    store.updateComponent(duplicateCodeId, { props: { content: "CÓD. 9999" } });
    const originalCode = store.findComponent(originalCodeId).component.props.content;
    const duplicateCode = store.findComponent(duplicateCodeId).component.props.content;
    const beforeOrder = offers().map(item => item.id);
    const reordered = store.reorderComponent(duplicate.id, -1);
    const afterOrder = offers().map(item => item.id);
    const ids = offers().flatMap(flatten).map(item => item.id);
    return {
      deletedId,
      duplicateId: duplicate.id,
      originalCode,
      duplicateCode,
      beforeOrder,
      afterOrder,
      reordered,
      uniqueIds: new Set(ids).size === ids.length,
      offerCount: offers().length,
      publication: store.getPublicationReport("draft").summary,
      exported: store.getExportDocument()
    };
  }, fixture.parentId);

  assert(independence.offerCount === 4, "Excluir e duplicar não manteve quatro ofertas.");
  assert(independence.uniqueIds, "Duplicação gerou IDs repetidos.");
  assert(independence.originalCode === "CÓD. 1123", "Editar a cópia alterou a oferta original.");
  assert(independence.duplicateCode === "CÓD. 9999", "A oferta duplicada não preservou edição independente.");
  assert(independence.reordered && JSON.stringify(independence.beforeOrder) !== JSON.stringify(independence.afterOrder), "Reordenação não alterou a ordem das ofertas.");
  assert(independence.publication.collisions === 0 && independence.publication.overflows === 0 && independence.publication.missingReferences === 0, `Operações independentes quebraram a publicação: ${JSON.stringify(independence.publication)}.`);

  const roundTrip = await page.evaluate(exported => {
    const restored = new CatalogDocumentStore(exported);
    return restored.getExportDocument();
  }, independence.exported);
  assert(JSON.stringify(canonical(roundTrip)) === JSON.stringify(canonical(independence.exported)), "Exportação e reconstrução da store divergiram.");
  assert(independence.exported.schemaVersion === "1.16.0", "A unidade de oferta alterou o schema.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  const finalScreen = await measure("final-screen");
  validate(finalScreen);
  const report = { fixture, screen, printed, historyRoundTrip: { undoCount: 4, equivalent: true }, independence, finalScreen, pageErrors, consoleErrors };
  fs.writeFileSync(path.join(outputDir, "commerce-offer-unit-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await page.screenshot({ path: path.join(outputDir, "commerce-offer-unit.png"), fullPage: true });

  await browser.close();
  browser = null;
  console.log("✓ DB-05.20.13 validou quatro ofertas independentes, hierarquia, duplicação, exclusão, reordenação, round-trip e impressão.");
})().catch(async error => {
  fs.writeFileSync(path.join(outputDir, "commerce-offer-unit-error.json"), `${JSON.stringify({ message: error.message, stack: error.stack }, null, 2)}\n`);
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
