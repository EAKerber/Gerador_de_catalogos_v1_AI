/* DB-05.20.1 — benchmark de generalização promocional construído pela interface. */
const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");

const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const outputDir = path.resolve(process.env.CATALOG_GENERALIZATION_OUTPUT_DIR || "/tmp/catalog-generalization-05.20");
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
fs.mkdirSync(outputDir, { recursive: true });

let browser;
let page;
const startedAt = Date.now();
const actions = [];
const findings = [];
const blockers = [];
const pageErrors = [];
const consoleErrors = [];
const responseErrors = [];
const insertionFallbacks = [];
let report = {
  suite: "Developer B 05.20 — promotional generalization benchmark",
  reference: "Promoção da semana — pé para móveis",
  constructionPolicy: "Criação e edição por controles da interface; store usada somente para leitura e métricas.",
  startedAt: new Date(startedAt).toISOString(),
  status: "running"
};

const wait = ms => page.waitForTimeout(ms);
const selectorForComponent = id => `[data-component-id="${id}"]`;

async function act(label, operation) {
  const before = Date.now();
  const result = await operation();
  actions.push({ index: actions.length + 1, label, durationMs: Date.now() - before });
  return result;
}

async function readEditorState() {
  return page.evaluate(() => ({
    contextId: CatalogEditor.store.getState().editor.editingContextId || null,
    selectedId: CatalogEditor.store.getSelected()?.id || null,
    pageChildren: CatalogEditor.store.getPage().children.map(component => ({ id: component.id, type: component.type, frame: { ...component.frame }, recipeRole: component.props?.recipeRole || null })),
    history: CatalogEditor.store.getHistoryState()
  }));
}

async function exitAllContexts() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const state = await readEditorState();
    if (!state.contextId) break;
    const button = page.locator('[data-exit-context]').first();
    if (await button.count() && await button.isVisible()) await act("Sair do contexto interno", () => button.click());
    else await act("Sair do contexto por Escape", () => page.keyboard.press("Escape"));
    await wait(25);
  }
  await act("Limpar seleção na página", () => page.locator("#pageCanvas").click({ position: { x: 3, y: 3 }, force: true }));
  await wait(20);
}

async function activateTab(tab) {
  const button = page.locator(`[data-inspector-tab="${tab}"]`).first();
  if (!await button.count()) return;
  if (await button.getAttribute("aria-selected") !== "true") {
    await act(`Abrir aba ${tab} do inspetor`, () => button.click());
    await wait(20);
  }
}

async function changeControl(selector, value, label) {
  const control = page.locator(selector).first();
  await control.waitFor({ state: "attached" });
  const kind = await control.evaluate(element => ({ tag: element.tagName, type: element.type || "" }));
  if (kind.tag === "SELECT") {
    await act(label, () => control.selectOption(String(value)));
  } else if (kind.type === "checkbox") {
    await act(label, () => value ? control.check() : control.uncheck());
  } else {
    await act(label, async () => {
      await control.fill(String(value));
      await control.evaluate(element => element.dispatchEvent(new Event("change", { bubbles: true })));
    });
  }
  await wait(35);
}

async function setProp(pathName, value) {
  await activateTab("content");
  await changeControl(`[data-prop-path="${pathName}"]`, value, `Editar propriedade ${pathName}`);
}

async function setStyle(pathName, value) {
  await activateTab("style");
  await changeControl(`[data-style-path="${pathName}"]`, value, `Editar token visual ${pathName}`);
}

async function showAdvancedGeometry() {
  if (await page.locator('[data-frame-path="x"]').count()) return;
  const toggle = page.locator('[data-toggle-all-properties]').first();
  await act("Mostrar geometria avançada", () => toggle.click());
  await page.locator('[data-frame-path="x"]').waitFor({ state: "attached" });
}

async function setFrame(frame) {
  await showAdvancedGeometry();
  for (const key of ["width", "height", "x", "y"]) {
    if (frame[key] == null) continue;
    await changeControl(`[data-frame-path="${key}"]`, frame[key], `Definir ${key} = ${frame[key]}`);
  }
}

async function setPresentation(presentation) {
  await activateTab("content");
  for (const key of ["mode", "density", "responsiveState"]) {
    if (presentation[key] == null) continue;
    await changeControl(`[data-presentation-path="${key}"]`, presentation[key], `Definir apresentação ${key}`);
  }
}

async function newPageChildIds() {
  return page.evaluate(() => CatalogEditor.store.getPage().children.map(component => component.id));
}

async function insertFromPalette(kind, id, desiredFrame) {
  await exitAllContexts();
  const before = await newPageChildIds();
  const selector = kind === "recipe" ? `[data-insert-template="${id}"]` : `[data-insert-component="${id}"]`;
  const button = page.locator(selector).first();
  await button.waitFor({ state: "visible" });
  await act(`Inserir ${kind} ${id} pelo botão +`, () => button.click());

  let inserted = false;
  try {
    await page.waitForFunction(previous => {
      const current = CatalogEditor.store.getPage().children.map(component => component.id);
      return current.some(item => !previous.includes(item));
    }, before, { timeout: 1300 });
    inserted = true;
  } catch {
    inserted = false;
  }

  if (!inserted) {
    const source = button.locator("xpath=ancestor::article[1]");
    const scale = await page.evaluate(() => window.CatalogWorkspace?.getScale?.() || CatalogEditor.store.getState().editor.zoom || 1);
    const targetPosition = {
      x: Math.max(8, (desiredFrame.x + desiredFrame.width / 2) * scale),
      y: Math.max(8, (desiredFrame.y + desiredFrame.height / 2) * scale)
    };
    await act(`Fallback de arraste para ${id}`, () => source.dragTo(page.locator("#pageCanvas"), { targetPosition }));
    insertionFallbacks.push({ kind, id, targetPosition });
    await page.waitForFunction(previous => {
      const current = CatalogEditor.store.getPage().children.map(component => component.id);
      return current.some(item => !previous.includes(item));
    }, before, { timeout: 2500 });
  }

  const insertedId = await page.evaluate(previous => {
    const current = CatalogEditor.store.getPage().children.map(component => component.id);
    return current.find(item => !previous.includes(item)) || CatalogEditor.store.getSelected()?.id || null;
  }, before);
  if (!insertedId) throw new Error(`A interface não materializou ${kind} ${id}.`);
  await page.waitForSelector(selectorForComponent(insertedId));
  await setFrame(desiredFrame);
  return insertedId;
}

async function selectComponent(id) {
  const content = page.locator(`${selectorForComponent(id)} > .editor-component__content`).first();
  const root = page.locator(selectorForComponent(id)).first();
  const target = await content.count() ? content : root;
  await act(`Selecionar componente ${id}`, () => target.click({ force: true }));
  try {
    await page.waitForFunction(componentId => CatalogEditor.store.getSelected()?.id === componentId, id, { timeout: 500 });
    return;
  } catch {}

  const assetDialog = page.locator("#assetLibraryDialog");
  if (await assetDialog.getAttribute("open") !== null) {
    findings.push({ code: "CANVAS_SELECTION_INTERCEPTED", componentId: id, message: "A tentativa de selecionar uma peça interna abriu a biblioteca de artes; a seleção continuou pela árvore de Camadas." });
    await act("Fechar biblioteca de artes aberta durante a seleção", () => assetDialog.locator("[data-close-asset-library]").first().click());
    await assetDialog.waitFor({ state: "hidden" });
  }

  const layersTab = page.locator('[data-left-panel-tab="layers"]');
  if (await layersTab.getAttribute("aria-selected") !== "true") await act("Abrir aba Camadas", () => layersTab.click());
  const layerItem = page.locator(`[data-layer-id="${id}"]`).first();
  await layerItem.waitFor({ state: "visible" });
  await act(`Selecionar ${id} pela árvore de camadas`, () => layerItem.click());
  await page.waitForFunction(componentId => CatalogEditor.store.getSelected()?.id === componentId, id, { timeout: 2000 });
  const componentsTab = page.locator('[data-left-panel-tab="components"]');
  if (await componentsTab.getAttribute("aria-selected") !== "true") await act("Voltar à aba Componentes", () => componentsTab.click());
}

async function enterContainer(id) {
  const current = await page.evaluate(() => CatalogEditor.store.getState().editor.editingContextId || null);
  if (current === id) return;
  const content = page.locator(`${selectorForComponent(id)} > .editor-component__content`).first();
  const root = page.locator(selectorForComponent(id)).first();
  const target = await content.count() ? content : root;
  await act(`Entrar no contêiner ${id}`, () => target.dblclick({ force: true }));
  await page.waitForFunction(componentId => CatalogEditor.store.getState().editor.editingContextId === componentId, id, { timeout: 2500 });
}

async function directRoleMap(rootId) {
  return page.evaluate(componentId => {
    const root = CatalogEditor.store.findComponent(componentId)?.component;
    return Object.fromEntries((root?.children || []).filter(child => child.props?.recipeRole).map(child => [child.props.recipeRole, child.id]));
  }, rootId);
}

async function directChildrenByType(rootId, type) {
  return page.evaluate(({ rootId: componentId, type: expected }) => {
    const root = CatalogEditor.store.findComponent(componentId)?.component;
    return (root?.children || []).filter(child => child.type === expected).map(child => child.id);
  }, { rootId, type });
}

async function editSectionHeading(rootId) {
  await enterContainer(rootId);
  const roles = await directRoleMap(rootId);
  for (const [role, content] of Object.entries({
    kicker: "PROMOÇÃO",
    title: "DA SEMANA",
    support: "OFERTA VÁLIDA SOMENTE DE 20/05 A 25/05"
  })) {
    await selectComponent(roles[role]);
    await setProp("content", content);
    if (role === "title") await setProp("scale", 120);
  }
  await exitAllContexts();
}

async function editFact(rootId, values) {
  await enterContainer(rootId);
  const roles = await directRoleMap(rootId);
  await selectComponent(roles.icon);
  await setProp("icon", values.icon);
  await selectComponent(roles.label);
  await setProp("content", values.label);
  await selectComponent(roles.value);
  await setProp("content", values.value);
  await setProp("overflow", "wrap");
  await selectComponent(roles.unit);
  await setProp("content", values.unit);
  await setProp("overflow", "wrap");
  await exitAllContexts();
}

async function editProductCard(cardId) {
  await enterContainer(cardId);
  const titles = await directChildrenByType(cardId, "title-symbol");
  const arts = await directChildrenByType(cardId, "art");
  const specifications = await directChildrenByType(cardId, "specification");
  const tables = await directChildrenByType(cardId, "data-table");

  await selectComponent(titles[0]);
  await setProp("number", "01");
  await setProp("title", "PÉS PARA MÓVEIS");

  await selectComponent(arts[0]);
  await setProp("label", "LINHA DE PÉS");
  await setProp("hint", "100mm · 130mm · 150mm · 200mm");
  await setProp("role", "product");
  await setProp("caption", "Quatro alturas disponíveis");
  await setProp("captionPosition", "below");

  await selectComponent(specifications[0]);
  await setProp("icon", "layers");
  await setProp("label", "AÇO CARBONO");
  await selectComponent(specifications[1]);
  await setProp("icon", "load-capacity");
  await setProp("label", "ATÉ 40KG");

  await selectComponent(tables[0]);
  await activateTab("content");
  const bulk = page.locator("details.table-bulk-entry:not(.gallery-bulk-entry):not(.legend-bulk-entry)").first();
  if (!await bulk.getAttribute("open")) await act("Abrir colagem em lote da tabela", () => bulk.locator("summary").click());
  await act("Colar quatro ofertas comerciais", () => page.locator("[data-table-bulk-text]").fill([
    "1123\t100mm\tR$ 3,99",
    "1146\t130mm\tR$ 4,99",
    "1147\t150mm\tR$ 5,99",
    "1148\t200mm\tR$ 6,99"
  ].join("\n")));
  await changeControl("[data-table-bulk-mode]", "replace", "Escolher substituição da tabela");
  await act("Aplicar quatro ofertas", () => page.locator("[data-table-bulk-apply]").click());
  await page.waitForFunction(tableId => CatalogEditor.store.getTableRows(CatalogEditor.store.findComponent(tableId).component).length === 4, tables[0], { timeout: 3000 });
  await exitAllContexts();
  return { titleId: titles[0], artId: arts[0], specificationIds: specifications, tableId: tables[0] };
}

async function editCallout(rootId) {
  await enterContainer(rootId);
  const rootRoles = await directRoleMap(rootId);
  await selectComponent(rootRoles.icon);
  await setProp("icon", "payment");
  const contentId = rootRoles.content;
  await enterContainer(contentId);
  const contentRoles = await directRoleMap(contentId);
  await selectComponent(contentRoles.title);
  await setProp("content", "VALORES IMPERDÍVEIS");
  await selectComponent(contentRoles.body);
  await setProp("content", "QUE NÃO VÃO VOLTAR MAIS!");
  await setProp("overflow", "wrap");
  await exitAllContexts();
  return { contentId, titleId: contentRoles.title, bodyId: contentRoles.body };
}

async function duplicateFeatureIcons(firstId) {
  await selectComponent(firstId);
  await activateTab("structure");
  await changeControl("[data-duplicate-direction]", "right", "Duplicar benefícios para a direita");
  await changeControl("[data-duplicate-mode]", "gap", "Usar espaçamento entre duplicatas");
  await changeControl("[data-duplicate-distance]", 24, "Definir gap de 24px");
  await changeControl("[data-duplicate-count]", 3, "Criar três cópias");
  const before = await page.evaluate(() => CatalogEditor.store.getPage().children.filter(component => component.type === "icon").length);
  await act("Duplicar e distribuir benefícios", () => page.locator("[data-duplicate-series]").click());
  await page.waitForFunction(count => CatalogEditor.store.getPage().children.filter(component => component.type === "icon").length === count + 3, before, { timeout: 3000 });
  return page.evaluate(() => CatalogEditor.store.getPage().children.filter(component => component.type === "icon").sort((a, b) => a.frame.x - b.frame.x).map(component => component.id));
}

function cleanSnapshot(value, key = "") {
  if (Array.isArray(value)) return value.map(item => cleanSnapshot(item));
  if (!value || typeof value !== "object") return value;
  const ignored = new Set(["updatedAt", "lastSavedAt", "generatedAt", "editor", "session"]);
  return Object.fromEntries(Object.keys(value).filter(item => !ignored.has(item)).sort().map(item => [item, cleanSnapshot(value[item], item)]));
}

function signature(value) {
  return JSON.stringify(cleanSnapshot(value));
}

async function exportDocumentSnapshot() {
  return page.evaluate(() => CatalogEditor.store.getExportDocument());
}

async function captureEvidence(label) {
  await page.screenshot({ path: path.join(outputDir, `${label}-full.png`), fullPage: true });
  await page.locator("#pageCanvas").screenshot({ path: path.join(outputDir, `${label}-canvas.png`) });
}

async function collectMetrics() {
  return page.evaluate(() => {
    const flatten = components => components.flatMap(component => [component, ...flatten(component.children || [])]);
    const components = flatten(CatalogEditor.store.getPage().children);
    const ids = components.map(component => component.id);
    const domIds = Array.from(document.querySelectorAll("#componentLayer .editor-component[data-component-id]")).map(element => element.dataset.componentId);
    const nonFiniteFrames = components.filter(component => ["x", "y", "width", "height"].some(key => !Number.isFinite(Number(component.frame?.[key])))).map(component => component.id);
    const table = components.find(component => component.type === "data-table");
    const footer = components.find(component => component.type === "catalog-footer");
    const pageLevel = CatalogEditor.store.getPage().children;
    return {
      schemaVersion: CatalogEditor.store.getState().schemaVersion,
      modelCount: components.length,
      uniqueModelIds: new Set(ids).size,
      domCount: domIds.length,
      uniqueDOMIds: new Set(domIds).size,
      missingDOM: ids.filter(id => !domIds.includes(id)),
      nonFiniteFrames,
      pageLevelTypes: pageLevel.map(component => component.type),
      recipeRoles: pageLevel.map(component => component.props?.recipeRole).filter(Boolean),
      placeholderArts: components.filter(component => component.type === "art" && !component.props?.assetId).length,
      tableRows: table ? CatalogEditor.store.getTableRows(table).length : 0,
      footerFrame: footer ? { ...footer.frame } : null,
      history: CatalogEditor.store.getHistoryState(),
      publication: CatalogEditor.store.getPublicationReport("draft").summary
    };
  });
}

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  page = await browser.newPage({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  page.on("dialog", dialog => dialog.accept());
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) responseErrors.push({ status: response.status(), url: response.url() }); });

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogSectionRecipes?.get?.("fact") && window.CatalogSectionRecipes?.get?.("section-tip-callout"));
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogSectionRecipes?.get?.("fact"));

  await act("Criar documento vazio", () => page.locator("#newDocumentButton").click());
  await page.waitForFunction(() => CatalogEditor.store.getPage().children.length === 0);
  if (await page.locator("#gridToggle").isChecked()) {
  await act("Abrir preferências de visualização", () => page.locator("#visualizationMenu > summary").click());
  await act("Ocultar grade", () => page.locator("#gridToggle").uncheck());
  await act("Fechar preferências de visualização", () => page.locator("#visualizationMenu > summary").click());
}

  const logoId = await insertFromPalette("component", "art", { x: 24, y: 24, width: 200, height: 150 });
  await setProp("label", "MOBILI OP");
  await setProp("hint", "TUDO PARA SUA MARCENARIA");
  await setProp("role", "logo");

  const headingId = await insertFromPalette("recipe", "section-heading", { x: 250, y: 24, width: 500, height: 170 });
  await editSectionHeading(headingId);

  const heroTitleId = await insertFromPalette("component", "text", { x: 24, y: 200, width: 210, height: 105 });
  await setProp("content", "PÉ PARA MÓVEIS");
  await setProp("scale", 120);
  await setProp("overflow", "wrap");
  await setStyle("textColor", "text.strong");

  const heroSupportId = await insertFromPalette("component", "text", { x: 24, y: 315, width: 210, height: 90 });
  await setProp("content", "Mais resistência, mais estabilidade e mais qualidade para seus móveis.");
  await setProp("overflow", "wrap");

  const materialFactId = await insertFromPalette("recipe", "fact", { x: 24, y: 420, width: 210, height: 170 });
  await editFact(materialFactId, { icon: "layers", label: "MATERIAL", value: "AÇO CARBONO", unit: "RESISTENTE E DURÁVEL" });

  const capacityFactId = await insertFromPalette("recipe", "fact", { x: 24, y: 595, width: 210, height: 170 });
  await editFact(capacityFactId, { icon: "load-capacity", label: "CAPACIDADE DE CARGA", value: "40", unit: "KG POR UNIDADE" });

  const productCardId = await insertFromPalette("component", "product-card", { x: 250, y: 205, width: 370, height: 500 });
  await setPresentation({ mode: "variants", density: "compact", responsiveState: "wide" });
  const productParts = await editProductCard(productCardId);

  const technicalArtId = await insertFromPalette("component", "art", { x: 630, y: 205, width: 140, height: 500 });
  await setProp("label", "DESENHO TÉCNICO");
  await setProp("hint", "70×70 mm · Ø30 · Ø4,5");
  await setProp("role", "technical");
  await setProp("caption", "Medidas em milímetros");
  await setProp("captionPosition", "below");

  const calloutId = await insertFromPalette("recipe", "section-tip-callout", { x: 590, y: 720, width: 180, height: 160 });
  const calloutParts = await editCallout(calloutId);

  const firstFeatureId = await insertFromPalette("component", "icon", { x: 24, y: 890, width: 160, height: 80 });
  const featureIds = await duplicateFeatureIcons(firstFeatureId);
  const featureValues = [
    { icon: "warranty", label: "ACABAMENTO PREMIUM" },
    { icon: "corrosion-resistant", label: "ALTA DURABILIDADE" },
    { icon: "torque", label: "FÁCIL INSTALAÇÃO" },
    { icon: "layers", label: "DIVERSOS AMBIENTES" }
  ];
  for (let index = 0; index < featureIds.length; index += 1) {
    await selectComponent(featureIds[index]);
    await setProp("icon", featureValues[index].icon);
    await setProp("label", featureValues[index].label);
  }
  await exitAllContexts();

  const footerId = await insertFromPalette("component", "catalog-footer", { x: 24, y: 1019, width: 746, height: 80 });
  const footerPlacement = await page.evaluate(id => ({ ...CatalogEditor.store.findComponent(id).component.frame }), footerId);

  const beforeRoundTrip = await exportDocumentSnapshot();

  await selectComponent(heroSupportId);
  await setProp("content", "Mais resistência, estabilidade e qualidade para todos os seus móveis.");
  await exitAllContexts();
  await selectComponent(technicalArtId);
  await setProp("caption", "Medidas técnicas em milímetros");
  await exitAllContexts();
  await selectComponent(featureIds[0]);
  await setProp("label", "ACABAMENTO PREMIUM E MODERNO");

  const terminalRoundTrip = await exportDocumentSnapshot();
  let roundTripOperations = 0;
  let undoEquivalent = false;
  for (let index = 0; index < 8; index += 1) {
    if (await page.locator("#undoButton").isDisabled()) break;
    await act("Desfazer edição final", () => page.locator("#undoButton").click());
    roundTripOperations += 1;
    const candidate = await exportDocumentSnapshot();
    if (signature(candidate) === signature(beforeRoundTrip)) {
      undoEquivalent = true;
      break;
    }
  }
  if (!undoEquivalent) blockers.push({ code: "UNDO_DIVERGENCE", message: "Undo não reencontrou o snapshot anterior dentro de oito passos." });
  else if (roundTripOperations !== 3) findings.push({ code: "HISTORY_FRAGMENTATION", expected: 3, observed: roundTripOperations, message: "As três edições exigiram quantidade diferente de passos no histórico." });

  for (let index = 0; index < roundTripOperations; index += 1) {
    if (await page.locator("#redoButton").isDisabled()) break;
    await act("Refazer edição final", () => page.locator("#redoButton").click());
  }
  const redoneRoundTrip = await exportDocumentSnapshot();
  const redoEquivalent = signature(redoneRoundTrip) === signature(terminalRoundTrip);
  if (!redoEquivalent) blockers.push({ code: "REDO_DIVERGENCE", message: "Redo não restaurou o estado terminal." });

  await captureEvidence("constructed");

  await act("Abrir menu de exportação", () => page.locator("#exportMenu > summary").click());
  const downloadPromise = page.waitForEvent("download");
  await act("Exportar documento JSON", () => page.locator("#exportButton").click());
  const download = await downloadPromise;
  const exportPath = path.join(outputDir, "promotional-generalization-document.json");
  await download.saveAs(exportPath);
  const exportedSnapshot = await exportDocumentSnapshot();

  await act("Criar documento vazio para reimportação", () => page.locator("#newDocumentButton").click());
  await page.waitForFunction(() => CatalogEditor.store.getPage().children.length === 0);
  await act("Abrir importação", () => page.locator("#importButton").click());
  await act("Selecionar JSON exportado", () => page.locator("#documentImportFileInput").setInputFiles(exportPath));
  await page.locator("[data-document-import-analysis]").waitFor({ state: "visible" });
  await page.locator("[data-confirm-document-import]").waitFor({ state: "visible" });
  await act("Confirmar reimportação", () => page.locator("[data-confirm-document-import]").click());
  await page.waitForFunction(expected => CatalogEditor.store.getPage().children.length === expected, exportedSnapshot.pages[0].children.length, { timeout: 5000 });
  const reimportedSnapshot = await exportDocumentSnapshot();
  const importEquivalent = signature(reimportedSnapshot) === signature(exportedSnapshot);
  if (!importEquivalent) blockers.push({ code: "IMPORT_DIVERGENCE", message: "Exportação e reimportação não preservaram o documento." });

  await captureEvidence("reimported");

  await page.evaluate(() => {
    window.__catalogBenchmarkPrintCalls = 0;
    window.print = () => { window.__catalogBenchmarkPrintCalls += 1; };
  });
  await act("Acionar Imprimir / PDF", () => page.locator("#printButton").click());
  await page.waitForFunction(() => window.__catalogBenchmarkPrintCalls === 1);
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  await page.screenshot({ path: path.join(outputDir, "print-preview.png"), fullPage: true });
  await page.pdf({ path: path.join(outputDir, "promotional-generalization.pdf"), printBackground: true, preferCSSPageSize: true, format: "A4" });
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });

  const metrics = await collectMetrics();
  if (metrics.schemaVersion !== "1.16.0") blockers.push({ code: "SCHEMA_CHANGE", message: `Schema inesperado: ${metrics.schemaVersion}.` });
  if (metrics.modelCount !== metrics.domCount || metrics.uniqueModelIds !== metrics.modelCount || metrics.uniqueDOMIds !== metrics.domCount || metrics.missingDOM.length) blockers.push({ code: "MODEL_DOM_DIVERGENCE", message: "Modelo e DOM divergiram após a reimportação.", details: metrics });
  if (metrics.nonFiniteFrames.length) blockers.push({ code: "NON_FINITE_GEOMETRY", message: "Frames não finitos encontrados.", ids: metrics.nonFiniteFrames });
  if (metrics.tableRows !== 4) blockers.push({ code: "OFFER_ROWS", message: `A tabela promocional terminou com ${metrics.tableRows} linhas.` });
  if (!metrics.footerFrame || metrics.footerFrame.y < 990) findings.push({ code: "FOOTER_POSITION", message: `Rodapé terminou fora da faixa inferior esperada: ${JSON.stringify(metrics.footerFrame)}.` });
  if (metrics.publication.collisions > 0) findings.push({ code: "PUBLICATION_COLLISIONS", count: metrics.publication.collisions });
  if (metrics.publication.overflows > 0) findings.push({ code: "PUBLICATION_OVERFLOWS", count: metrics.publication.overflows });
  if (metrics.placeholderArts > 0) findings.push({ code: "PLACEHOLDER_ASSETS", count: metrics.placeholderArts, message: "Assets comerciais não estavam disponíveis no runner; arte foi avaliada estruturalmente." });
  if (insertionFallbacks.length) findings.push({ code: "AUTOMATIC_PLACEMENT_FALLBACK", count: insertionFallbacks.length, items: insertionFallbacks });
  if (responseErrors.length) findings.push({ code: "HTTP_ERRORS", items: responseErrors });
  if (pageErrors.length) blockers.push({ code: "PAGE_ERRORS", items: pageErrors });
  if (consoleErrors.length) blockers.push({ code: "CONSOLE_ERRORS", items: consoleErrors });

  const coverage = [
    { target: "Identidade / logo", representation: "art role=logo", status: "represented-with-placeholder", componentId: logoId },
    { target: "Hierarquia Promoção da Semana", representation: "section-heading", status: "represented", componentId: headingId },
    { target: "Nome e argumento do produto", representation: "text + text", status: "represented", componentIds: [heroTitleId, heroSupportId] },
    { target: "Material e capacidade", representation: "duas receitas fact", status: "represented", componentIds: [materialFactId, capacityFactId] },
    { target: "Variações e quatro preços", representation: "product-card variants + data-table", status: "represented", componentId: productCardId, tableId: productParts.tableId },
    { target: "Imagem principal do produto", representation: "art interna", status: "represented-with-placeholder", componentId: productParts.artId },
    { target: "Desenho técnico", representation: "art role=technical", status: "represented-with-placeholder", componentId: technicalArtId },
    { target: "Chamada de urgência", representation: "section-tip-callout", status: "represented", componentId: calloutId },
    { target: "Quatro benefícios", representation: "icon duplicado e editado", status: "represented", componentIds: featureIds },
    { target: "Contato e confiança", representation: "catalog-footer", status: "represented", componentId: footerId },
    { target: "Faixas inclinadas, personagem e megafone", representation: "dependem de asset composto", status: "not-recreated-with-native-components" }
  ];

  report = {
    ...report,
    status: blockers.length ? "fail" : findings.length ? "pass-with-findings" : "pass",
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    actionCount: actions.length,
    actions,
    insertionFallbacks,
    historyRoundTrip: { operationsExpected: 3, operationsObserved: roundTripOperations, undoEquivalent, redoEquivalent },
    exportImport: { equivalent: importEquivalent, exportFile: path.basename(exportPath) },
    print: { invokedThroughToolbar: true, pdf: "promotional-generalization.pdf" },
    coverage,
    metrics,
    footerPlacement,
    findings,
    blockers,
    pageErrors,
    consoleErrors,
    responseErrors
  };

  fs.writeFileSync(path.join(outputDir, "promotional-generalization-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
  browser = null;
  if (blockers.length) throw new Error(`Benchmark bloqueado: ${blockers.map(item => item.code).join(", ")}`);
  console.log(`✓ Benchmark promocional concluído como ${report.status}; ${actions.length} ações em ${report.durationMs} ms.`);
})().catch(async error => {
  report = {
    ...report,
    status: "error",
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    actionCount: actions.length,
    actions,
    findings,
    blockers,
    pageErrors,
    consoleErrors,
    responseErrors,
    fatalError: { message: error.message, stack: error.stack }
  };
  try {
    if (page) await page.screenshot({ path: path.join(outputDir, "fatal-error.png"), fullPage: true });
  } catch {}
  fs.writeFileSync(path.join(outputDir, "promotional-generalization-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
