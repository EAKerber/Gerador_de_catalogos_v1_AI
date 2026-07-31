/* DB-05.18.9 — variants validado no DOM, histórico e impressão. */
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
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogProductVariantsContract?.VERSION === "05.18.9");

  const ids = await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    const card = CatalogEditor.store.addComponent("product-card", { x: 24, y: 24, width: 420, height: 260 });
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
    const art = card.children.find(component => component.type === "art" && component.slot?.name === "art");
    const gallery = CatalogEditor.store.addArtVariation(art.id);
    CatalogEditor.store.applyGalleryItemsBulk(gallery.id, [{ caption: "Acabamento natural" }]);
    CatalogEditor.store.setSelection(card.id);
    return { cardId: card.id, galleryId: gallery.id };
  });

  await page.locator('[data-inspector-tab="content"]').click();
  await page.locator(".card-presentation-secondary > summary").click();

  const capture = async () => page.evaluate(cardId => {
    const card = CatalogEditor.store.findComponent(cardId)?.component;
    const cardElement = document.querySelector(`[data-component-id="${cardId}"]`);
    const cardRect = cardElement?.getBoundingClientRect();
    const gallery = card?.children?.find(component => component.type === "art-gallery" && component.slot?.name === "art") || null;
    const galleryElement = gallery ? document.querySelector(`[data-component-id="${gallery.id}"]`) : null;
    const galleryRect = galleryElement?.getBoundingClientRect() || null;
    const union = elements => {
      const rects = elements.map(element => element.getBoundingClientRect());
      if (!rects.length) return null;
      const left = Math.min(...rects.map(rect => rect.left));
      const top = Math.min(...rects.map(rect => rect.top));
      const right = Math.max(...rects.map(rect => rect.right));
      const bottom = Math.max(...rects.map(rect => rect.bottom));
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    };
    const relative = (rect, root) => rect && root ? {
      x: (rect.left - root.left) / root.width,
      y: (rect.top - root.top) / root.height,
      width: rect.width / root.width,
      height: rect.height / root.height
    } : null;
    const slots = {};
    for (const name of ["title", "art", "specifications", "table"]) {
      const elements = Array.from(document.querySelectorAll(`[data-parent-id="${cardId}"][data-slot-name="${name}"]`));
      slots[name] = {
        model: CatalogComponentGeometry.slotFrame(card, name),
        dom: relative(union(elements), cardRect),
        count: elements.length
      };
    }
    const captions = galleryElement ? Array.from(galleryElement.querySelectorAll(".component-art__caption")).map(element => {
      const rect = element.getBoundingClientRect();
      return { text: element.textContent.trim(), relative: relative(rect, galleryRect), bottom: rect.bottom, galleryBottom: galleryRect.bottom };
    }) : [];
    return {
      frame: { ...card.frame },
      presentation: JSON.parse(JSON.stringify(card.presentation)),
      inspection: CatalogProductVariantsContract.inspect(card),
      galleryId: gallery?.id || null,
      galleryItems: gallery?.children?.filter(component => component.type === "art").map(component => ({ id: component.id, caption: component.props?.caption || "" })) || [],
      captions,
      slots
    };
  }, ids.cardId);

  const setPreset = async presetId => {
    await page.locator('[data-presentation-path="presetId"]').selectOption(presetId);
    await page.waitForTimeout(40);
  };
  const setResponsive = async state => {
    await page.locator('[data-presentation-path="responsiveState"]').selectOption(state);
    await page.waitForTimeout(40);
  };

  await setResponsive("wide");
  await setPreset("product-variants");
  const oneWide = await capture();
  assert(oneWide.presentation.mode === "variants", "O preset não materializou variants.");
  assert(oneWide.galleryItems.length === 1 && oneWide.galleryItems[0].caption === "Acabamento natural", "A galeria inicial ou sua legenda foi alterada.");
  assert(oneWide.slots.art.model.y + oneWide.slots.art.model.height < oneWide.slots.specifications.model.y, "Variants amplo sobrepôs galeria e especificações.");
  assert(oneWide.slots.specifications.model.y + oneWide.slots.specifications.model.height <= oneWide.slots.table.model.y, "Variants amplo invadiu a tabela.");
  assert(oneWide.slots.art.model.height >= oneWide.inspection.artMinimum, "A galeria ampla ficou abaixo do mínimo com legenda.");
  assert(oneWide.slots.specifications.model.height >= oneWide.inspection.specificationsMinimum, "As especificações amplas ficaram abaixo do mínimo.");

  const mutation = await page.evaluate(galleryId => {
    const before = {
      height: CatalogEditor.store.variantsCardFor(galleryId).frame.height,
      history: CatalogEditor.store.getHistoryState().undoCount
    };
    CatalogEditor.store.applyGalleryItemsBulk(galleryId, [
      { caption: "Natural" },
      { caption: "Preto" },
      { caption: "Branco" },
      { caption: "Grafite" },
      { caption: "Dourado" }
    ]);
    const card = CatalogEditor.store.variantsCardFor(galleryId);
    return { before, after: { height: card.frame.height, history: CatalogEditor.store.getHistoryState().undoCount } };
  }, ids.galleryId);
  const fiveWide = await capture();
  assert(mutation.after.history === mutation.before.history + 1, "Editar a galeria gerou histórico fragmentado.");
  assert(mutation.after.height >= mutation.before.height, "O card não cresceu para a galeria ampliada.");
  assert(fiveWide.galleryItems.length === 5 && fiveWide.captions.length === 5, "Cinco imagens ou legendas não foram renderizadas.");
  assert(fiveWide.galleryItems.map(item => item.caption).join("|") === "Natural|Preto|Branco|Grafite|Dourado", "A ordem das legendas não foi preservada.");
  assert(fiveWide.captions.every(item => item.bottom <= item.galleryBottom + 0.5), "Uma legenda escapou da galeria.");
  assert(fiveWide.slots.art.model.height >= fiveWide.inspection.artMinimum, "A galeria de cinco itens ficou abaixo do mínimo.");
  assert(fiveWide.slots.specifications.model.height >= fiveWide.inspection.specificationsMinimum, "As quatro especificações ficaram abaixo do mínimo.");

  assert(await page.evaluate(() => CatalogEditor.store.undo()), "Não foi possível desfazer a galeria ampliada.");
  const undone = await capture();
  assert(undone.galleryItems.length === 1, "Desfazer não restaurou a galeria de uma imagem.");
  assert(await page.evaluate(() => CatalogEditor.store.redo()), "Não foi possível refazer a galeria ampliada.");
  const redone = await capture();
  assert(redone.galleryItems.length === 5, "Refazer não restaurou cinco imagens.");

  await page.evaluate(cardId => CatalogEditor.store.setSelection(cardId), ids.cardId);
  await page.locator('[data-inspector-tab="content"]').click();
  await page.evaluate(cardId => CatalogEditor.store.updateComponent(cardId, { frame: { width: 280, height: 260 } }), ids.cardId);
  await page.evaluate(cardId => CatalogEditor.store.setSelection(cardId), ids.cardId);
  await setResponsive("compact");
  const compact = await capture();
  assert(compact.presentation.responsiveState === "compact", "O estado compacto não foi persistido.");
  assert(compact.inspection.compact === true, "O contrato não reconheceu o estado compacto.");
  assert(compact.frame.width === 280, "Variants alterou a largura compacta solicitada.");
  assert(compact.slots.art.model.height >= compact.inspection.artMinimum, "Galeria compacta ficou abaixo do mínimo.");
  assert(compact.slots.specifications.model.height >= compact.inspection.specificationsMinimum, "Grade compacta de especificações ficou abaixo do mínimo.");
  assert(compact.slots.art.model.y + compact.slots.art.model.height < compact.slots.specifications.model.y, "Galeria compacta sobrepôs especificações.");
  assert(compact.slots.specifications.model.y + compact.slots.specifications.model.height <= compact.slots.table.model.y, "Especificações compactas invadiram a tabela.");

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await capture();
  for (const name of ["title", "art", "specifications", "table"]) {
    const screen = compact.slots[name].dom;
    const print = printed.slots[name].dom;
    for (const key of ["x", "y", "width", "height"]) {
      assert(Math.abs(screen[key] - print[key]) <= 0.015, `Tela e impressão divergiram em ${name}.${key}.`);
    }
  }
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });

  const publication = await page.evaluate(() => CatalogEditor.store.getPublicationReport("draft").summary);
  assert((publication.collisions || 0) === 0 && (publication.overflows || 0) === 0, "Variants produziu colisão ou overflow externo.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.9 validou variants amplo/compacto, cinco legendas, histórico, DOM e impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
