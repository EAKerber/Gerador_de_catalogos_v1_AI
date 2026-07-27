/* Incremento 05.12 — reconstrução manual auditável da referência pela interface pública. */
const fs = require("fs");
const path = require("path");

const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = path.resolve(process.env.CATALOG_AUDIT_OUTPUT_DIR || "/tmp/catalog-audit-05.12");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;

const products = [
  "Título\tCódigo\tEmbalagem\tPreço\tEspecificação 1\tEspecificação 2\tAplicações",
  "PARAFUSO OVAL PHS\t1176\tCX 1000 UNID.\tR$ 35,90\tCABEÇA OVAL\tAÇO CROMADO\tMDF | MDP | MADEIRA MACIÇA",
  "PARAFUSO CHIPBOARD COLORIDO\t4016B\tPCT 100 UNID.\tR$ 12,90\tBITS PHILIPS\tDUAS CORES\tMDF",
  "PARAFUSO CHIPBOARD FLANGEADO\t1197\tCX 250 UNID.\tR$ 48,80\tCABEÇA FLANGEADA\tMADEIRA E MDF\tMDF",
  "CANTONEIRA ZAMAC 13×13 MACIÇA\t1037\tPCT 100 UNID.\tR$ 22,90\tALTA ÁREA DE APOIO\tTRÊS ACABAMENTOS\tMÓVEIS",
  "PINO DE PRATELEIRA METALIZADO\t1056\tPCT 100 UNID.\tR$ 19,90\tAÇO METALIZADO\tFÁCIL INSTALAÇÃO\tARMÁRIOS | CLOSETS | COZINHAS",
  "PINO INVISÍVEL DE FIXAÇÃO\t1369\tPCT 10 UNID.\tR$ 49,00\tFIXAÇÃO OCULTA\tDUAS MEDIDAS\tPRATELEIRAS SUSPENSAS | NICHOS | PAINÉIS",
  "L CAPA DE FIXAÇÃO\t1042\tPCT 100 UNID.\tR$ 1,69\tCINCO CORES\tACABAMENTO\tMÓVEIS"
].join("\n");

const tablePlans = [
  {
    middleLabel: "MEDIDA", middleRole: "measure", priceLabel: "VALOR À VISTA",
    rows: [["1176", "4,0×16", "CX 1000 UNID.", "R$ 35,90"]]
  },
  {
    middleLabel: "COR", middleRole: "value", priceLabel: "VALOR À VISTA",
    rows: [
      ["4016B", "Branco 4,0×16", "PCT 100 UNID.", "R$ 12,90"],
      ["4016P", "Preto 4,0×16", "PCT 100 UNID.", "R$ 12,90"]
    ]
  },
  {
    middleLabel: "MEDIDA", middleRole: "measure", priceLabel: "VALOR À VISTA",
    rows: [
      ["1197", "5,0×60", "CX 250 UNID.", "R$ 48,80"],
      ["1196", "6,0×60", "CX 150 UNID.", "R$ 43,87"]
    ]
  },
  {
    middleLabel: "COR", middleRole: "value", priceLabel: "VALOR À VISTA",
    rows: [
      ["1037", "Cromado", "PCT 100 UNID.", "R$ 22,90"],
      ["1039", "Preto", "PCT 100 UNID.", "R$ 22,90"],
      ["1038", "Branco", "PCT 100 UNID.", "R$ 22,90"]
    ]
  },
  {
    middleLabel: "MEDIDA", middleRole: "measure", priceLabel: "VALOR À VISTA",
    rows: [["1056", "5×16 Cromado", "PCT 100 UNID.", "R$ 19,90"]]
  },
  {
    middleLabel: "MODELO", middleRole: "value", priceLabel: "VALOR À VISTA",
    rows: [
      ["1369", "Pino 160 mm", "PCT 10 UNID.", "R$ 49,00"],
      ["1370", "Pino 210 mm", "PCT 7 UNID.", "R$ 40,60"]
    ]
  },
  {
    middleLabel: "COR", middleRole: "value", priceLabel: "VALOR UNITÁRIO", omitPackage: true,
    rows: [
      ["1042", "Branco", "R$ 1,69"],
      ["1145", "Cinza", "R$ 1,90"],
      ["1144", "Marrom", "R$ 1,90"],
      ["1111", "Preto", "R$ 1,90"],
      ["1371", "Bege", "R$ 1,90"]
    ]
  }
];

const legendPlans = [
  ["CX 1000", "pack.1000"], ["CX 500", "pack.500"], ["CX 300", "pack.300"],
  ["CX 250", "pack.250"], ["CX 200", "pack.200"], ["CX 150", "pack.150"],
  ["CX 100", "pack.100"], ["PCT", "pack.pct"]
];

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  const actions = [];
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("dialog", dialog => dialog.accept());

  const record = (kind, label, meta = {}) => actions.push({
    index: actions.length + 1,
    kind,
    label,
    surface: meta.surface || "editor",
    contextSwitch: meta.contextSwitch === true,
    focusChange: meta.focusChange === true,
    correction: meta.correction === true,
    noEffect: meta.noEffect === true
  });
  const click = async (locator, label, meta = {}) => {
    await locator.click();
    record("click", label, meta);
  };
  const clickContext = async (contextId, label) => {
    const breadcrumb = page.locator("#contextBreadcrumb");
    const menuTarget = breadcrumb.locator(`.context-breadcrumb__menu [data-context-id="${contextId}"]`);
    if (await menuTarget.count()) {
      await breadcrumb.locator(".context-breadcrumb__overflow").evaluate(element => { element.open = true; });
      record("click", "Abrir ancestrais condensados", { surface: "breadcrumb", contextSwitch: true });
      await click(menuTarget, label, { surface: "breadcrumb", contextSwitch: true });
      return;
    }
    await click(
      breadcrumb.locator(`:scope > [data-context-id="${contextId}"]`),
      label,
      { surface: "breadcrumb", contextSwitch: true }
    );
  };
  const fill = async (locator, value, label, meta = {}) => {
    await locator.fill(String(value));
    record("fill", label, meta);
  };
  const select = async (locator, value, label, meta = {}) => {
    await locator.selectOption(String(value));
    record("selection", label, meta);
  };
  const leftTab = async tab => {
    const locator = page.locator(`[data-left-panel-tab="${tab}"]`);
    if (await locator.getAttribute("aria-selected") !== "true") await click(locator, `Abrir painel ${tab}`, { surface: "left-panel", contextSwitch: true });
  };
  const inspectorTab = async tab => {
    const locator = page.locator(`[data-inspector-tab="${tab}"]`).first();
    const panel = page.locator(`[data-inspector-panel="${tab}"]`).first();
    if (await locator.count() && (await locator.getAttribute("aria-selected") !== "true" || !await panel.isVisible())) {
      await click(locator, `Abrir inspetor ${tab}`, { surface: "inspector", contextSwitch: true });
    }
    if (await locator.count() && !await panel.isVisible()) {
      await click(locator, `Repetir abertura do inspetor ${tab}`, { surface: "inspector", contextSwitch: true, correction: true, noEffect: true });
    }
    if (await panel.count()) await panel.waitFor({ state: "visible" });
  };
  const ensureDetails = async (selector, label, meta = {}) => {
    const details = page.locator(selector);
    if (!await details.evaluate(element => element.open)) await click(details.locator(":scope > summary"), label, { surface: "inspector", ...meta });
  };
  const ensureDetailsContent = async (selector, contentSelector, label) => {
    const details = page.locator(selector);
    const content = details.locator(contentSelector);
    await ensureDetails(selector, label);
    if (!await content.isVisible()) {
      if (await details.evaluate(element => element.open)) {
        await click(details.locator(":scope > summary"), `${label}: recolher estado inconsistente`, { surface: "inspector", correction: true, noEffect: true });
      }
      await click(details.locator(":scope > summary"), `${label}: reabrir conteúdo`, { surface: "inspector", correction: true });
    }
    assert(await content.isVisible(), `${label} permaneceu oculto depois da reabertura.`);
  };
  const selectLayer = async (componentId, label) => {
    await leftTab("layers");
    await click(page.locator(`[data-layer-id="${componentId}"]`), label, { surface: "layers", focusChange: true });
    let selectedId = await page.evaluate(() => CatalogEditor.store.getSelected()?.id || null);
    if (selectedId !== componentId) {
      actions[actions.length - 1].noEffect = true;
      actions[actions.length - 1].correction = true;
      const parentId = await page.evaluate(id => CatalogEditor.store.getParentId(id), componentId);
      const enterParent = parentId ? page.locator(`#layerList [data-enter-container="${parentId}"]`) : null;
      if (enterParent && await enterParent.count()) {
        await click(enterParent, `Entrar no contêiner pai para ${label}`, { surface: "layers", contextSwitch: true, correction: true });
      }
      await click(page.locator(`[data-layer-id="${componentId}"]`), `Repetir: ${label}`, { surface: "layers", focusChange: true, correction: true });
      selectedId = await page.evaluate(() => CatalogEditor.store.getSelected()?.id || null);
    }
    assert(selectedId === componentId, `A camada ${componentId} não pôde ser selecionada pela interface.`);
  };
  const setFrame = async (componentId, frame, label) => {
    await selectLayer(componentId, `Selecionar ${label}`);
    const current = await page.evaluate(id => ({ ...CatalogEditor.store.findComponent(id).component.frame }), componentId);
    const requested = { ...current, ...frame };
    for (const [key, value] of Object.entries(requested)) {
      await fill(page.locator(`[data-frame-draft-path="${key}"]`), value, `${label}: ${key} = ${value}`, { surface: "inspector" });
    }
    await click(page.locator("[data-frame-apply-all]"), `Aplicar geometria completa de ${label}`, { surface: "inspector" });
    const applied = await page.evaluate(({ id, requestedFrame }) => ({
      frame: { ...CatalogEditor.store.findComponent(id).component.frame },
      transaction: CatalogEditor.store.getLastGeometryTransaction(),
      status: document.getElementById("documentStatus")?.textContent || ""
    }), { id: componentId, requestedFrame: requested });
    assert(
      ["x", "y", "width", "height"].every(key => applied.frame[key] === requested[key]),
      `A geometria completa de ${label} não foi aplicada: ${JSON.stringify({ requested, applied })}.`
    );
  };

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  await click(page.locator('[data-insert-template="page-catalog-base"]'), "Inserir Página de catálogo", { surface: "components" });
  await leftTab("products");
  await click(page.locator(".product-bulk-entry > summary"), "Abrir Entrada rápida", { surface: "products" });
  await fill(page.locator("[data-products-bulk-text]"), products, "Colar sete produtos", { surface: "products" });
  await click(page.locator("[data-products-bulk-add]"), "Adicionar produtos da tabela", { surface: "products" });
  await click(page.locator("[data-products-create-cards]"), "Criar cards da seleção", { surface: "products" });
  await page.waitForFunction(() => CatalogEditor.store.getProducts().length === 7);

  let ids = await page.evaluate(() => {
    const root = CatalogEditor.store.getPage().children.find(component => component.name === "Página de catálogo");
    const content = root?.children.find(component => component.props?.recipeRole === "primary-content");
    const cards = content?.children.filter(component => component.type === "product-card") || [];
    return {
      rootId: root?.id,
      contentId: content?.id,
      headerId: root?.children.find(component => component.type === "catalog-header")?.id,
      footerId: root?.children.find(component => component.type === "catalog-footer")?.id,
      cardIds: cards.map(component => component.id),
      tableIds: cards.map(card => card.children.find(component => component.type === "data-table")?.id),
      artIds: cards.map(card => card.children.find(component => component.type === "art")?.id)
    };
  });
  assert(ids.rootId && ids.contentId && ids.cardIds.length === 7, "A fundação manual não criou a página e os sete cards.");

  await leftTab("components");
  await click(page.locator('[data-insert-component="legend-panel"]'), "Adicionar painel de legenda", { surface: "components" });
  await click(page.locator('[data-insert-template="section-tip-callout"]'), "Adicionar chamada de dica", { surface: "components" });
  Object.assign(ids, await page.evaluate(contentId => {
    const content = CatalogEditor.store.findComponent(contentId)?.component;
    return {
      legendPanelId: content?.children.find(component => component.type === "legend-panel")?.id,
      tipId: content?.children.find(component => component.name === "Chamada de dica")?.id
    };
  }, ids.contentId));
  assert(ids.legendPanelId && ids.tipId, "Legenda ou chamada de dica não foi inserida pela biblioteca.");
  await selectLayer(ids.legendPanelId, "Selecionar painel de legenda recém-criado");
  await inspectorTab("content");
  await fill(page.locator('[data-prop-path="label"]'), "LEGENDA DE EMBALAGENS", "Editar título da legenda", { surface: "inspector" });

  async function configureTable(tableId, plan, index) {
    await selectLayer(tableId, `Selecionar tabela ${index + 1}`);
    await inspectorTab("content");
    await ensureDetails(".table-column-editor", "Abrir configuração de colunas");
    let columns = await page.evaluate(id => CatalogEditor.store.getTableColumns(id), tableId);
    if (!plan.omitPackage) {
      await click(page.locator("[data-table-column-add]"), `Tabela ${index + 1}: adicionar quarta coluna`, { surface: "inspector" });
      columns = await page.evaluate(id => CatalogEditor.store.getTableColumns(id), tableId);
      const [code, middle, packageColumn, price] = columns;
      await fill(page.locator(`[data-table-column-key="${middle.key}"][data-table-column-path="label"]`), plan.middleLabel, `Tabela ${index + 1}: rótulo ${plan.middleLabel}`, { surface: "inspector" });
      await select(page.locator(`[data-table-column-key="${middle.key}"][data-table-column-path="role"]`), plan.middleRole, `Tabela ${index + 1}: função ${plan.middleRole}`, { surface: "inspector" });
      await fill(page.locator(`[data-table-column-key="${packageColumn.key}"][data-table-column-path="label"]`), "EMBALAGEM", `Tabela ${index + 1}: rótulo EMBALAGEM`, { surface: "inspector" });
      await select(page.locator(`[data-table-column-key="${packageColumn.key}"][data-table-column-path="role"]`), "package", `Tabela ${index + 1}: função embalagem`, { surface: "inspector" });
      await fill(page.locator(`[data-table-column-key="${price.key}"][data-table-column-path="label"]`), plan.priceLabel, `Tabela ${index + 1}: rótulo ${plan.priceLabel}`, { surface: "inspector" });
      await select(page.locator(`[data-table-column-key="${price.key}"][data-table-column-path="role"]`), "price", `Tabela ${index + 1}: função preço`, { surface: "inspector" });
      assert(code.role === "identifier", `Tabela ${index + 1} perdeu a coluna identificadora.`);
    } else {
      const [, middle, price] = columns;
      await fill(page.locator(`[data-table-column-key="${middle.key}"][data-table-column-path="label"]`), plan.middleLabel, `Tabela ${index + 1}: rótulo ${plan.middleLabel}`, { surface: "inspector" });
      await select(page.locator(`[data-table-column-key="${middle.key}"][data-table-column-path="role"]`), plan.middleRole, `Tabela ${index + 1}: função ${plan.middleRole}`, { surface: "inspector" });
      await ensureDetails(".table-column-editor", "Reabrir configuração de colunas após alterar função");
      await fill(page.locator(`[data-table-column-key="${price.key}"][data-table-column-path="label"]`), plan.priceLabel, `Tabela ${index + 1}: rótulo ${plan.priceLabel}`, { surface: "inspector" });
    }
    const bulkEntry = page.locator('details.table-bulk-entry:has([data-table-bulk-text])');
    await ensureDetailsContent('details.table-bulk-entry:has([data-table-bulk-text])', "[data-table-bulk-text]", "Abrir colagem de linhas");
    const headers = plan.omitPackage ? ["CÓDIGO", plan.middleLabel, plan.priceLabel] : ["CÓDIGO", plan.middleLabel, "EMBALAGEM", plan.priceLabel];
    const text = [headers, ...plan.rows].map(row => row.join("\t")).join("\n");
    await fill(bulkEntry.locator("[data-table-bulk-text]"), text, `Tabela ${index + 1}: colar ${plan.rows.length} linha(s)`, { surface: "inspector" });
    await click(bulkEntry.locator("[data-table-bulk-apply]"), `Tabela ${index + 1}: aplicar linhas`, { surface: "inspector" });
    const applied = await page.evaluate(({ id, expected }) => ({
      count: CatalogEditor.store.getTableRows(id).length,
      expected,
      feedback: document.querySelector('details.table-bulk-entry:has([data-table-bulk-text]) [role="status"]')?.textContent || ""
    }), { id: tableId, expected: plan.rows.length });
    assert(applied.count === applied.expected, `Tabela ${index + 1} não aplicou a colagem: ${JSON.stringify(applied)}.`);
  }

  for (let index = 0; index < ids.tableIds.length; index += 1) await configureTable(ids.tableIds[index], tablePlans[index], index);

  await ensureDetails(".semantic-legend-editor", "Abrir editor de legenda cromática");
  for (const [label, token] of legendPlans) {
    await ensureDetails(".semantic-legend-editor", "Recuperar editor de legenda cromática", { correction: true });
    await ensureDetailsContent(".semantic-legend-editor", "[data-new-legend-label]", "Recuperar editor de legenda cromática");
    await fill(page.locator("[data-new-legend-label]"), label, `Legenda: ${label}`, { surface: "inspector" });
    await select(page.locator("[data-new-legend-token]"), token, `Legenda: token ${token}`, { surface: "inspector" });
    await click(page.locator("[data-color-legend-add]"), `Materializar legenda ${label}`, { surface: "inspector" });
  }

  const legendState = await page.evaluate(() => ({
    definitions: CatalogEditor.store.getColorLegends().map(item => ({ key: item.metadata.key, token: item.metadata.token })),
    panel: CatalogEditor.store.getLegendPanels()[0]
  }));
  assert(legendState.definitions.length === 8 && legendState.panel, "As oito legendas não foram materializadas.");
  ids.legendGroupId = legendState.panel.children.find(component => component.type === "legend-group")?.id;
  await selectLayer(ids.legendGroupId, "Selecionar grupo de embalagens");
  await inspectorTab("structure");
  await select(page.locator('[data-layout-path="mode"]'), "grid", "Legenda: organizar em grade", { surface: "inspector" });
  await fill(page.locator('[data-layout-path="columns"]'), "4", "Legenda: quatro colunas", { surface: "inspector" });

  await selectLayer(ids.tableIds[2], "Selecionar tabela 03 para vínculos cromáticos");
  await inspectorTab("content");
  const coloredCells = await page.evaluate(tableId => {
    const table = CatalogEditor.store.findComponent(tableId)?.component;
    const packageKey = CatalogEditor.store.getTableColumns(table).find(column => column.role === "package")?.key;
    const rows = CatalogEditor.store.getTableRows(table);
    const legends = CatalogEditor.store.getColorLegends();
    return rows.map(row => {
      const value = row.metadata?.values?.[packageKey] || "";
      const token = value.includes("250") ? "pack.250" : "pack.150";
      return { rowId: row.id, columnKey: packageKey, legendKey: legends.find(item => item.metadata.token === token)?.metadata.key };
    });
  }, ids.tableIds[2]);
  for (const cell of coloredCells) await select(page.locator(`[data-table-cell-legend][data-table-row-id="${cell.rowId}"][data-table-column-key="${cell.columnKey}"]`), cell.legendKey, `Vincular cor à célula ${cell.rowId}`, { surface: "inspector" });

  async function configureGallery(cardIndex, captions) {
    const artId = await page.evaluate(cardId => CatalogEditor.store.findComponent(cardId)?.component?.children.find(component => component.type === "art")?.id || null, ids.cardIds[cardIndex]);
    assert(artId, `Card ${cardIndex + 1} não possui arte simples para converter.`);
    await selectLayer(artId, `Selecionar arte do card ${cardIndex + 1}`);
    await inspectorTab("content");
    await leftTab("components");
    const contextual = await page.evaluate(id => ({
      selectedId: CatalogEditor.store.getSelected()?.id,
      selectedType: CatalogEditor.store.getSelected()?.type,
      canConvert: CatalogEditor.store.canConvertArtToGallery(id),
      actions: CatalogEditor.store.getContextualActions()
    }), artId);
    assert(contextual.selectedId === artId && contextual.actions.some(action => action.id === "convert-art-gallery"), `A conversão contextual não apareceu para ${artId}: ${JSON.stringify(contextual)}`);
    await click(page.locator('[data-context-action="convert-art-gallery"]'), `Card ${cardIndex + 1}: converter arte em galeria`, { surface: "components", contextSwitch: true });
    for (let index = 2; index < captions.length; index += 1) {
      await click(page.locator('[data-context-action="add-gallery-art"]'), `Card ${cardIndex + 1}: adicionar imagem ${index + 1}`, { surface: "components" });
    }
    let gallery = await page.evaluate(cardId => CatalogEditor.store.findComponent(cardId)?.component?.children.find(component => component.type === "art-gallery"), ids.cardIds[cardIndex]);
    assert(gallery?.children.length === captions.length, `Card ${cardIndex + 1} não recebeu ${captions.length} imagens.`);
    await selectLayer(gallery.id, `Selecionar galeria do card ${cardIndex + 1}`);
    await inspectorTab("structure");
    await fill(page.locator('[data-layout-path="columns"]'), String(captions.length), `Card ${cardIndex + 1}: ${captions.length} imagens por linha`, { surface: "inspector" });
    if (captions.length >= 5) {
      await fill(page.locator('[data-layout-path="padding"]'), "0", `Card ${cardIndex + 1}: remover padding da galeria compacta`, { surface: "inspector" });
      await fill(page.locator('[data-layout-path="gap"]'), "1", `Card ${cardIndex + 1}: reduzir espaço entre variações`, { surface: "inspector" });
    }
    gallery = await page.evaluate(id => CatalogEditor.store.findComponent(id)?.component, gallery.id);
    const last = gallery.children[gallery.children.length - 1];
    await selectLayer(last.id, `Selecionar última imagem do card ${cardIndex + 1}`);
    await inspectorTab("content");
    await fill(page.locator('[data-prop-path="caption"]'), captions[captions.length - 1], `Card ${cardIndex + 1}: legenda ${captions[captions.length - 1]}`, { surface: "inspector" });
    for (let index = 0; index < gallery.children.length - 1; index += 1) {
      await selectLayer(gallery.children[index].id, `Selecionar imagem ${index + 1} do card ${cardIndex + 1}`);
      await inspectorTab("content");
      await fill(page.locator('[data-prop-path="caption"]'), captions[index], `Card ${cardIndex + 1}: legenda ${captions[index]}`, { surface: "inspector" });
    }
  }

  await configureGallery(3, ["Cromado", "Preto", "Branco"]);
  await clickContext(ids.contentId, "Voltar da galeria 04 ao conteúdo principal");
  await configureGallery(6, ["Branco", "Cinza", "Marrom", "Preto", "Bege"]);
  await clickContext(ids.contentId, "Voltar da galeria 07 ao conteúdo principal");

  await selectLayer(ids.cardIds[0], "Selecionar card 01");
  await inspectorTab("content");
  await select(page.locator('[data-presentation-path="presetId"]'), "product-hero", "Card 01: preset de destaque", { surface: "inspector" });
  await select(page.locator('[data-presentation-path="responsiveState"]'), "wide", "Card 01: forçar layout amplo", { surface: "inspector" });
  for (const index of [3, 6]) {
    await selectLayer(ids.cardIds[index], `Selecionar card ${index + 1}`);
    await inspectorTab("content");
    await select(page.locator('[data-presentation-path="presetId"]'), "product-variants", `Card ${index + 1}: preset de variações`, { surface: "inspector" });
  }
  for (const index of [1, 2, 3, 4, 5, 6]) {
    await selectLayer(ids.cardIds[index], `Selecionar card ${index + 1} para compactação`);
    await inspectorTab("content");
    await select(page.locator('[data-presentation-path="density"]'), "compact", `Card ${index + 1}: densidade compacta`, { surface: "inspector" });
    await select(page.locator('[data-presentation-path="responsiveState"]'), "compact", `Card ${index + 1}: layout compacto`, { surface: "inspector" });
  }

  await selectLayer(ids.contentId, "Selecionar conteúdo principal");
  await inspectorTab("structure");
  await select(page.locator('[data-layout-path="mode"]'), "free", "Conteúdo principal: layout livre", { surface: "inspector" });
  await fill(page.locator('[data-layout-path="padding"]'), "0", "Conteúdo principal: remover padding interno", { surface: "inspector" });

  await clickContext(ids.rootId, "Voltar ao contêiner da página");
  const cardFrames = [
    { x: 0, y: 0, width: 746, height: 222 },
    { x: 0, y: 222, width: 240, height: 262 },
    { x: 252, y: 222, width: 240, height: 262 },
    { x: 504, y: 222, width: 242, height: 262 },
    { x: 0, y: 484, width: 240, height: 320 },
    { x: 252, y: 484, width: 240, height: 320 },
    { x: 504, y: 484, width: 242, height: 320 }
  ];
  for (let index = 0; index < ids.cardIds.length; index += 1) await setFrame(ids.cardIds[index], cardFrames[index], `card ${index + 1}`);
  await setFrame(ids.legendPanelId, { x: 0 }, "painel de legenda alinhado");
  await setFrame(ids.tipId, { x: 485 }, "chamada de dica alinhada");
  await setFrame(ids.contentId, { x: 0, y: 110, width: 746, height: 933 }, "conteúdo principal final");
  await setFrame(ids.legendPanelId, { x: 0, y: 804, width: 475, height: 129 }, "painel de legenda");
  await setFrame(ids.tipId, { x: 485, y: 804, width: 261, height: 129 }, "chamada de dica");
  await setFrame(ids.rootId, { x: 0, y: 0, width: 794, height: 1123 }, "estrutura da página");
  await setFrame(ids.headerId, { x: 24, y: 0, width: 746, height: 110 }, "cabeçalho");
  await setFrame(ids.footerId, { x: 24, y: 1043, width: 746, height: 80 }, "rodapé");

  const semanticTextIds = await page.evaluate(({ tipId, legendPanelId }) => {
    const tip = CatalogEditor.store.findComponent(tipId)?.component;
    const panel = CatalogEditor.store.findComponent(legendPanelId)?.component;
    const descendants = component => component ? [component, ...(component.children || []).flatMap(descendants)] : [];
    const tipParts = descendants(tip);
    return {
      tipTitleId: tipParts.find(component => component.type === "text" && component.props?.recipeRole === "title")?.id,
      tipBodyId: tipParts.find(component => component.type === "text" && component.props?.recipeRole === "body")?.id,
      panelId: panel?.id
    };
  }, ids);
  assert(semanticTextIds.tipTitleId && semanticTextIds.tipBodyId, "A receita de callout não expôs textos semânticos de título e corpo.");
  await selectLayer(semanticTextIds.tipTitleId, "Selecionar título da dica");
  await inspectorTab("content");
  await fill(page.locator('[data-prop-path="content"]'), "DICA TOP MOBILI", "Editar título da dica", { surface: "inspector" });
  await inspectorTab("style");
  await select(page.locator('[data-inspector-panel="style"]:not([hidden]) [data-style-path="typography"]'), "type.card-title", "Usar título compacto na dica", { surface: "inspector" });
  await selectLayer(semanticTextIds.tipBodyId, "Selecionar corpo da dica");
  await inspectorTab("content");
  await fill(page.locator('[data-prop-path="content"]'), "Utilize a bit Philips correta para maior durabilidade do parafuso e melhor performance na fixação.", "Editar corpo da dica", { surface: "inspector" });
  await inspectorTab("style");
  await select(page.locator('[data-inspector-panel="style"]:not([hidden]) [data-style-path="typography"]'), "type.caption", "Usar corpo compacto na dica", { surface: "inspector" });
  await setFrame(ids.tipId, { x: 485, y: 804, width: 261, height: 129 }, "chamada de dica compactada");
  await setFrame(ids.contentId, { x: 0, y: 110, width: 746, height: 933 }, "conteúdo principal após compactação");
  const documentPath = path.join(outputDir, "reference-manual.document.json");
  await click(page.locator("#exportMenu > summary"), "Abrir menu Exportar", { surface: "toolbar", contextSwitch: true });
  const downloadPromise = page.waitForEvent("download");
  await click(page.locator("#exportButton"), "Exportar Documento JSON", { surface: "toolbar" });
  const download = await downloadPromise;
  await download.saveAs(documentPath);
  record("download", "Salvar Documento JSON", { surface: "browser" });

  const editorScreenshot = path.join(outputDir, "reference-manual.editor.png");
  await page.screenshot({ path: editorScreenshot, fullPage: true });
  await click(page.locator('[data-toggle-panel="left"]'), "Recolher painel esquerdo", { surface: "chrome", contextSwitch: true });
  await click(page.locator('[data-toggle-panel="right"]'), "Recolher painel direito", { surface: "chrome", contextSwitch: true });
  const canvasScreenshot = path.join(outputDir, "reference-manual.canvas.png");
  await page.locator("#pageCanvas").screenshot({ path: canvasScreenshot });

  await click(page.locator("#printButton"), "Abrir Imprimir / PDF", { surface: "toolbar" });
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const pdfPath = path.join(outputDir, "reference-manual.pdf");
  await page.pdf({ path: pdfPath, width: "210mm", height: "297mm", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });

  const result = await page.evaluate(() => {
    const pageState = CatalogEditor.store.getPage();
    const walk = (children, output = []) => {
      (children || []).forEach(component => { output.push(component); walk(component.children, output); });
      return output;
    };
    const components = walk(pageState.children);
    const cards = components.filter(component => component.type === "product-card");
    const tables = components.filter(component => component.type === "data-table");
    const galleries = components.filter(component => component.type === "art-gallery");
    const tableRows = CatalogEditor.store.getCollection("tableRows")?.items || [];
    const report = CatalogEditor.store.getPublicationReport("draft");
    const clippedText = Array.from(document.querySelectorAll([
      ".component-card__title h3",
      ".component-title-symbol h3",
      ".component-card__spec span",
      ".component-specification > span:last-child",
      ".component-data-table__header span",
      ".component-data-table__row strong"
    ].join(",")))
      .filter(element => element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)
      .map(element => ({
        componentId: element.closest("[data-component-id]")?.dataset.componentId || null,
        text: element.textContent.trim(),
        horizontalOverflow: Math.max(0, element.scrollWidth - element.clientWidth),
        verticalOverflow: Math.max(0, element.scrollHeight - element.clientHeight)
      }));
    return {
      schemaVersion: CatalogEditor.store.getState().schemaVersion,
      products: CatalogEditor.store.getProducts().length,
      components: components.length,
      cards: cards.length,
      tableRows: tableRows.length,
      tableRowCounts: tables.map(table => ({ id: table.id, name: table.name, count: CatalogEditor.store.getTableRows(table).length })),
      galleries: galleries.map(gallery => gallery.children.filter(component => component.type === "art").length),
      legends: CatalogEditor.store.getColorLegends().length,
      report,
      clippedText,
      viewport: { width: innerWidth, height: innerHeight },
      zoom: CatalogEditor.store.getState().editor.zoom,
      frames: cards.map(card => ({ id: card.id, frame: card.frame })),
      finalSections: {
        legend: components.find(component => component.type === "legend-panel")?.frame || null,
        tip: components.find(component => component.name === "Chamada de dica")?.frame || null
      }
    };
  });

  const counts = actions.reduce((summary, action) => {
    summary[action.kind] = (summary[action.kind] || 0) + 1;
    if (action.contextSwitch) summary.contextSwitches += 1;
    if (action.focusChange) summary.focusChanges += 1;
    if (action.correction) summary.corrections += 1;
    if (action.noEffect) summary.noEffectAttempts += 1;
    return summary;
  }, { click: 0, fill: 0, selection: 0, drag: 0, keypress: 0, download: 0, contextSwitches: 0, focusChanges: 0, corrections: 0, noEffectAttempts: 0 });
  counts.total = actions.length;
  const metrics = {
    audit: "Incremento 05.12 — reconstrução manual da referência",
    date: new Date().toISOString(),
    baselineActions: 319,
    actions: counts,
    reduction: {
      absolute: 319 - counts.total,
      percentage: Number((((319 - counts.total) / 319) * 100).toFixed(1))
    },
    result,
    pageErrors,
    consoleErrors,
    actionLog: actions
  };
  fs.writeFileSync(path.join(outputDir, "reference-manual.metrics.json"), `${JSON.stringify(metrics, null, 2)}\n`);

  assert(result.viewport.width === 1366 && result.viewport.height === 768, "O ensaio não ocorreu em 1366×768.");
  assert(
    result.products === 7 && result.cards === 7 && result.tableRows === 16,
    `Produtos, cards ou linhas divergiram da referência: ${JSON.stringify({ products: result.products, cards: result.cards, tableRows: result.tableRows, tableRowCounts: result.tableRowCounts })}.`
  );
  assert(result.galleries.join(",") === "3,5", `Galerias divergiram: ${result.galleries.join(",")}.`);
  assert(result.legends === 8, "A legenda global não preservou oito definições.");
  assert(
    result.finalSections.legend?.y === 804
      && result.finalSections.tip?.x === 485
      && result.finalSections.tip?.y === 804,
    `Legenda ou dica não preservou a geometria aplicada: ${JSON.stringify(result.finalSections)}.`
  );
  assert(
    result.report.summary.collisions === 0 && result.report.summary.overflows === 0,
    `A reconstrução técnica não está geometricamente íntegra: ${JSON.stringify(result.report.summary)}.`
  );
  assert(result.clippedText.length === 0, `A reconstrução técnica contém texto truncado: ${JSON.stringify(result.clippedText)}.`);
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log(`✓ Auditoria manual concluída: ${counts.total} ações (${counts.click} cliques, ${counts.fill} preenchimentos, ${counts.selection} seleções), ${result.report.summary.collisions} colisão(ões), ${result.report.summary.overflows} overflow(s).`);
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close().catch(() => {});
  process.exitCode = 1;
});
