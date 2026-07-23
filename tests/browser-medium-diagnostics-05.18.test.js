/* Auditoria 05.18 — diagnóstico não bloqueante de receitas e contenção vetorial. */
const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");

const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = path.resolve(process.env.CATALOG_DIAGNOSTIC_OUTPUT_DIR || "/tmp/catalog-medium-diagnostic");
let browser;

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleMessages = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => consoleMessages.push({ type: message.type(), text: message.text() }));
  page.on("dialog", dialog => dialog.accept());

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogSectionRecipes && window.CatalogFactRecipeContract && window.CatalogCalloutRecipeContract);

  const recipeDiagnostics = [];
  for (const recipeId of ["section-heading", "fact", "section-tip-callout"]) {
    await page.evaluate(() => {
      CatalogEditor.store.reset();
      CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
    });
    const button = page.locator(`[data-insert-template="${recipeId}"]`);
    const buttonCount = await button.count();
    const before = await page.evaluate(id => ({
      recipe: CatalogSectionRecipes.get(id),
      children: CatalogEditor.store.getPage().children.map(component => ({ id: component.id, type: component.type, role: component.props?.recipeRole || null })),
      contextId: CatalogEditor.store.getState().editor.editingContextId,
      selectedIds: CatalogEditor.store.getSelectedIds(),
      history: CatalogEditor.store.getHistoryState()
    }), recipeId);
    let clickError = null;
    if (buttonCount) {
      try { await button.click(); } catch (error) { clickError = error.message; }
    }
    await page.waitForTimeout(250);
    const after = await page.evaluate(() => {
      const flatten = [];
      const visit = (children, parentId = null) => (children || []).forEach(component => {
        flatten.push({
          id: component.id,
          parentId,
          type: component.type,
          name: component.name,
          role: component.props?.recipeRole || null,
          label: component.props?.label || null,
          frame: { ...component.frame }
        });
        visit(component.children, component.id);
      });
      visit(CatalogEditor.store.getPage().children);
      return {
        children: CatalogEditor.store.getPage().children.map(component => ({ id: component.id, type: component.type, role: component.props?.recipeRole || null, name: component.name })),
        flatten,
        contextId: CatalogEditor.store.getState().editor.editingContextId,
        selectedIds: CatalogEditor.store.getSelectedIds(),
        history: CatalogEditor.store.getHistoryState(),
        toasts: Array.from(document.querySelectorAll(".toast")).map(node => node.textContent.trim()),
        visibleButtons: Array.from(document.querySelectorAll("[data-insert-template]")).filter(node => !node.closest("[hidden]")).map(node => node.dataset.insertTemplate)
      };
    });
    recipeDiagnostics.push({ recipeId, buttonCount, clickError, before, after });
  }

  await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });

    const icon = store.addComponent("icon", { x: 24, y: 24, width: 56, height: 56 }, {
      parentId: null,
      props: { icon: "load-capacity", iconScale: 100, label: "" }
    });

    const footerItem = store.addComponent("footer-item", { x: 100, y: 24, width: 112, height: 96 }, { parentId: null });
    const footerIcon = footerItem.children.find(component => component.slot?.name === "icon");
    store.updateComponent(footerIcon.id, { props: { icon: "phone", iconScale: 100, label: "" } });

    const card = store.addComponent("product-card", { x: 240, y: 24, width: 280, height: 390 }, { parentId: null });
    store.setComponentPresentation(card.id, { presetId: "product-variants", mode: "variants", density: "compact", responsiveState: "compact" });
    const specification = card.children.find(component => component.type === "specification");
    store.updateComponent(specification.id, { props: { icon: "diameter", iconScale: 80 } });

    window.__mediumDiagnosticIds = { iconId: icon.id, footerItemId: footerItem.id, footerIconId: footerIcon.id, cardId: card.id, specificationId: specification.id };
  });
  await page.waitForTimeout(100);

  const boxDiagnostics = await page.evaluate(() => {
    const ids = window.__mediumDiagnosticIds;
    const box = element => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
        boxSizing: style.boxSizing,
        width: style.width,
        height: style.height,
        padding: style.padding,
        border: style.border,
        overflow: style.overflow,
        transform: style.transform,
        transformOrigin: style.transformOrigin,
        display: style.display,
        position: style.position
      };
    };
    const deltas = (inner, outer) => inner && outer ? {
      left: outer.rect.left - inner.rect.left,
      top: outer.rect.top - inner.rect.top,
      right: inner.rect.right - outer.rect.right,
      bottom: inner.rect.bottom - outer.rect.bottom,
      maxOutside: Math.max(outer.rect.left - inner.rect.left, outer.rect.top - inner.rect.top, inner.rect.right - outer.rect.right, inner.rect.bottom - outer.rect.bottom)
    } : null;
    const inspectIcon = componentId => {
      const root = document.querySelector(`[data-component-id="${componentId}"]`);
      const shell = root?.querySelector(".component-icon, .component-specification__icon");
      const svg = shell?.querySelector("svg");
      const rootBox = box(root);
      const shellBox = box(shell);
      const svgBox = box(svg);
      return { componentId, root: rootBox, shell: shellBox, svg: svgBox, shellVsRoot: deltas(shellBox, rootBox), svgVsShell: deltas(svgBox, shellBox) };
    };
    const specificationRoot = document.querySelector(`[data-component-id="${ids.specificationId}"]`);
    const molecule = specificationRoot?.querySelector(".component-specification");
    const specificationShell = specificationRoot?.querySelector(".component-specification__icon");
    const specificationSvg = specificationShell?.querySelector("svg");
    const rootBox = box(specificationRoot);
    const moleculeBox = box(molecule);
    const shellBox = box(specificationShell);
    const svgBox = box(specificationSvg);
    return {
      ids,
      standalone: inspectIcon(ids.iconId),
      footer: inspectIcon(ids.footerIconId),
      specification: {
        componentId: ids.specificationId,
        root: rootBox,
        molecule: moleculeBox,
        shell: shellBox,
        svg: svgBox,
        moleculeVsRoot: deltas(moleculeBox, rootBox),
        shellVsMolecule: deltas(shellBox, moleculeBox),
        svgVsShell: deltas(svgBox, shellBox)
      }
    };
  });

  const report = { baseURL, recipeDiagnostics, boxDiagnostics, pageErrors, consoleMessages };
  fs.writeFileSync(path.join(outputDir, "browser-medium-diagnostic.json"), `${JSON.stringify(report, null, 2)}\n`);
  await page.screenshot({ path: path.join(outputDir, "browser-medium-diagnostic.png"), fullPage: true });
  await browser.close();
  console.log(`✓ Diagnóstico médio registrado em ${outputDir}.`);
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
