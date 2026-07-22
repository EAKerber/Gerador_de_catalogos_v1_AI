/* DB-05.20.7 — benefícios estreitos e callout responsivo. */
"use strict";

const fs = require("fs");
const path = require("path");
const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || chromium.executablePath();
const outputDir = process.env.CATALOG_LEGIBILITY_OUTPUT_DIR || path.join("audit-output", "db-05.20.7", "legibility");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser;
let page;

fs.mkdirSync(outputDir, { recursive: true });

function inside(inner, outer, tolerance = 1) {
  return inner && outer
    && inner.left >= outer.left - tolerance
    && inner.top >= outer.top - tolerance
    && inner.right <= outer.right + tolerance
    && inner.bottom <= outer.bottom + tolerance;
}

(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogSectionRecipes?.get?.("section-tip-callout"));

  const fixture = await page.evaluate(() => {
    const store = CatalogEditor.store;
    store.reset();
    store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false, snapEnabled: false, smartSnapEnabled: false });
    const labels = [
      "ACABAMENTO PREMIUM E MODERNO",
      "ALTA DURABILIDADE CONTRA CORROSÃO",
      "INSTALAÇÃO RÁPIDA E SIMPLIFICADA",
      "APLICAÇÃO EM DIVERSOS AMBIENTES"
    ];
    const scales = [80, 100, 120, 100];
    const icons = labels.map((label, index) => store.addComponent("icon", {
      x: 24 + index * 132,
      y: 24,
      width: 120,
      height: 84
    }, {
      props: { icon: ["warranty", "corrosion-resistant", "torque", "layers"][index], label, iconScale: scales[index] },
      style: { typography: "type.label" }
    }));

    const wide = store.insertComponentFromTemplate("section-tip-callout");
    store.setEditingContext(null);
    const compact = store.insertComponentFromTemplate("section-tip-callout");
    const roles = root => {
      const all = [];
      const visit = component => {
        all.push(component);
        (component.children || []).forEach(visit);
      };
      visit(root);
      return Object.fromEntries(all.filter(component => component.props?.recipeRole).map(component => [component.props.recipeRole, component]));
    };
    const wideRoot = store.findComponent(wide.id).component;
    const compactRoot = store.findComponent(compact.id).component;
    const wideRoles = roles(wideRoot);
    const compactRoles = roles(compactRoot);
    store.updateComponent(wideRoot.id, { frame: { x: 24, y: 150, width: 430, height: 150 } });
    store.updateComponent(compactRoot.id, { frame: { x: 500, y: 150, width: 220, height: 210 } });
    store.updateComponent(wideRoles.title.id, { props: { content: "OFERTA ESPECIAL POR TEMPO LIMITADO" } });
    store.updateComponent(wideRoles.body.id, { props: { content: "Aproveite condições exclusivas para renovar seus projetos com segurança e praticidade." } });
    store.updateComponent(compactRoles.title.id, { props: { content: "OFERTA ESPECIAL POR TEMPO LIMITADO" } });
    store.updateComponent(compactRoles.body.id, { props: { content: "Aproveite condições exclusivas para renovar seus projetos com segurança e praticidade." } });
    store.reflowComponentTree(wideRoot.id);
    store.reflowComponentTree(compactRoot.id);
    return {
      icons: icons.map(icon => ({ id: icon.id, label: icon.props.label, scale: icon.props.iconScale })),
      wide: { rootId: wideRoot.id, titleId: wideRoles.title.id, bodyId: wideRoles.body.id, iconId: wideRoles.icon.id },
      compact: { rootId: compactRoot.id, titleId: compactRoles.title.id, bodyId: compactRoles.body.id, iconId: compactRoles.icon.id }
    };
  });

  await page.waitForFunction(ids => ids.every(id => document.querySelector(`[data-component-id="${id}"]`)), [
    ...fixture.icons.map(item => item.id),
    fixture.wide.rootId,
    fixture.compact.rootId
  ]);

  async function measure(media) {
    return page.evaluate(({ fixture, media }) => {
      const rect = element => {
        const box = element?.getBoundingClientRect();
        return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height } : null;
      };
      const icons = fixture.icons.map(item => {
        const root = document.querySelector(`[data-component-id="${item.id}"]`);
        const label = root?.querySelector(".component-icon > span:last-child");
        const svg = root?.querySelector(".component-icon__svg svg");
        const style = label ? getComputedStyle(label) : null;
        const lineHeight = style ? Number.parseFloat(style.lineHeight) : 0;
        return {
          ...item,
          root: rect(root),
          label: rect(label),
          svg: rect(svg),
          whiteSpace: style?.whiteSpace || null,
          overflowWrap: style?.overflowWrap || null,
          clientWidth: label?.clientWidth || 0,
          scrollWidth: label?.scrollWidth || 0,
          clientHeight: label?.clientHeight || 0,
          scrollHeight: label?.scrollHeight || 0,
          lineHeight,
          estimatedLines: lineHeight ? Math.round((label?.getBoundingClientRect().height || 0) / lineHeight) : 0
        };
      });
      const callout = source => {
        const root = document.querySelector(`[data-component-id="${source.rootId}"]`);
        const titleRoot = document.querySelector(`[data-component-id="${source.titleId}"]`);
        const bodyRoot = document.querySelector(`[data-component-id="${source.bodyId}"]`);
        const iconRoot = document.querySelector(`[data-component-id="${source.iconId}"]`);
        const title = titleRoot?.querySelector(".component-text p");
        const body = bodyRoot?.querySelector(".component-text p");
        const iconSvg = iconRoot?.querySelector(".component-icon__svg svg");
        return {
          root: rect(root),
          titleRoot: rect(titleRoot),
          bodyRoot: rect(bodyRoot),
          iconRoot: rect(iconRoot),
          title: rect(title),
          body: rect(body),
          iconSvg: rect(iconSvg),
          mode: root?.dataset.layoutMode || null,
          titleFontSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
          titleScrollHeight: title?.scrollHeight || 0,
          titleClientHeight: title?.clientHeight || 0,
          bodyScrollHeight: body?.scrollHeight || 0,
          bodyClientHeight: body?.clientHeight || 0,
          titleText: title?.textContent || "",
          bodyText: body?.textContent || ""
        };
      };
      return { media, icons, wide: callout(fixture.wide), compact: callout(fixture.compact) };
    }, { fixture, media });
  }

  function validate(snapshot) {
    assert(snapshot.icons.length === 4, "Os quatro benefícios não foram renderizados.");
    snapshot.icons.forEach(item => {
      assert(item.whiteSpace !== "nowrap", `${item.label}: o rótulo continua preso a uma linha.`);
      assert(item.estimatedLines >= 1 && item.estimatedLines <= 2, `${item.label}: quantidade de linhas inválida (${item.estimatedLines}).`);
      assert(item.scrollWidth <= item.clientWidth + 1, `${item.label}: overflow horizontal no rótulo.`);
      assert(item.scrollHeight <= item.clientHeight + 1, `${item.label}: truncamento vertical no rótulo.`);
      assert(inside(item.label, item.root), `${item.label}: rótulo escapou do componente.`);
      assert(inside(item.svg, item.root), `${item.label}: SVG escapou do componente.`);
    });
    const byScale = Object.fromEntries(snapshot.icons.map(item => [item.scale, item.svg.width]));
    assert(byScale[80] < byScale[100] && byScale[100] < byScale[120], "A legibilidade alterou a distinção 80/100/120 do vetor.");

    assert(snapshot.wide.mode === "row", `Callout amplo deveria usar linha, mas usa ${snapshot.wide.mode}.`);
    assert(snapshot.compact.mode === "column", `Callout compacto deveria usar coluna, mas usa ${snapshot.compact.mode}.`);
    assert(snapshot.wide.titleFontSize >= snapshot.compact.titleFontSize * 1.1, `Hierarquia ampla/compacta insuficiente: ${snapshot.wide.titleFontSize}/${snapshot.compact.titleFontSize}.`);
    for (const [label, callout] of [["amplo", snapshot.wide], ["compacto", snapshot.compact]]) {
      assert(callout.titleText.includes("OFERTA ESPECIAL"), `Título ${label} não foi preservado.`);
      assert(callout.bodyText.includes("condições exclusivas"), `Corpo ${label} não foi preservado.`);
      assert(callout.titleScrollHeight <= callout.titleClientHeight + 1, `Título ${label} foi truncado verticalmente.`);
      assert(callout.bodyScrollHeight <= callout.bodyClientHeight + 1, `Corpo ${label} foi truncado verticalmente.`);
      assert(inside(callout.titleRoot, callout.root), `Título ${label} escapou do callout.`);
      assert(inside(callout.bodyRoot, callout.root), `Corpo ${label} escapou do callout.`);
      assert(inside(callout.iconRoot, callout.root), `Ícone ${label} escapou do callout.`);
      assert(inside(callout.iconSvg, callout.iconRoot), `SVG ${label} escapou do ícone.`);
    }
  }

  const screen = await measure("screen");
  validate(screen);

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await measure("print");
  validate(printed);
  assert(Math.abs(printed.wide.titleFontSize - screen.wide.titleFontSize) < .1, "O título amplo divergiu na impressão.");
  assert(Math.abs(printed.compact.titleFontSize - screen.compact.titleFontSize) < .1, "O título compacto divergiu na impressão.");

  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => { delete document.documentElement.dataset.printing; });
  await page.evaluate(bodyId => {
    const store = CatalogEditor.store;
    store.deleteComponent(bodyId);
    const parentId = store.getParentId(bodyId);
    if (parentId) store.reflowComponentTree(parentId);
  }, fixture.compact.bodyId);
  await page.waitForFunction(id => !CatalogEditor.store.findComponent(id), fixture.compact.bodyId);
  const optional = await page.evaluate(source => {
    const root = document.querySelector(`[data-component-id="${source.rootId}"]`);
    const title = document.querySelector(`[data-component-id="${source.titleId}"]`);
    const icon = document.querySelector(`[data-component-id="${source.iconId}"]`);
    const box = element => {
      const rect = element?.getBoundingClientRect();
      return rect ? { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom } : null;
    };
    return { root: box(root), title: box(title), icon: box(icon) };
  }, fixture.compact);
  assert(inside(optional.title, optional.root) && inside(optional.icon, optional.root), "Remover o corpo opcional quebrou o callout compacto.");

  const publication = await page.evaluate(() => CatalogEditor.store.getPublicationReport("draft").summary);
  assert(publication.collisions === 0 && publication.overflows === 0, `Legibilidade introduziu problemas geométricos: ${JSON.stringify(publication)}.`);
  assert(publication.missingReferences === 0, "Legibilidade introduziu referência obrigatória ausente.");
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  const report = { fixture, screen, printed, optional, publication, pageErrors, consoleErrors };
  fs.writeFileSync(path.join(outputDir, "benefit-callout-legibility-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await page.screenshot({ path: path.join(outputDir, "benefit-callout-legibility.png"), fullPage: true });
  await page.pdf({ path: path.join(outputDir, "benefit-callout-legibility.pdf"), printBackground: true, preferCSSPageSize: true, format: "A4" });

  await browser.close();
  browser = null;
  console.log("✓ DB-05.20.7 validou benefícios em duas linhas e callout amplo/compacto em tela e impressão.");
})().catch(async error => {
  fs.writeFileSync(path.join(outputDir, "benefit-callout-legibility-error.json"), `${JSON.stringify({ message: error.message, stack: error.stack }, null, 2)}\n`);
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
