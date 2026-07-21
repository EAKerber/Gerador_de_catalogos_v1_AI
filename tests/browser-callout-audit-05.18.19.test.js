/* DB-05.18.19 — callout auditado pela biblioteca, em tela e impressão. */
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
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogCalloutRecipeContract?.VERSION === "05.18.19" && window.CatalogSectionRecipes?.VERSION === "1.4.1");

  await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
  });

  const recipeButton = page.locator('[data-insert-template="section-tip-callout"]');
  assert(await recipeButton.count() === 1, "A receita Chamada de dica não está acessível na biblioteca.");
  const recipeText = await recipeButton.locator("xpath=ancestor::article[1]").textContent();
  assert(recipeText.includes("Chamada de dica") && recipeText.includes("responsiva") && recipeText.includes("editável"), `Descrição auditada ausente: ${recipeText}.`);

  const before = await page.evaluate(() => CatalogEditor.store.getHistoryState().undoCount);
  await recipeButton.click();
  await page.waitForFunction(() => CatalogEditor.store.getPage().children.filter(component => component.props?.recipeRole === "callout").length === 1);
  const after = await page.evaluate(() => CatalogEditor.store.getHistoryState());
  assert(after.undoCount === before + 1 && after.undoLabel === "Inserir estrutura pronta", "A inserção do callout não foi uma ação única.");
  await page.evaluate(() => CatalogEditor.store.setEditingContext(null));
  await recipeButton.click();
  await page.waitForFunction(() => CatalogEditor.store.getPage().children.filter(component => component.props?.recipeRole === "callout").length === 2);

  const fixture = await page.evaluate(() => {
    const store = CatalogEditor.store;
    const callouts = store.getPage().children.filter(component => component.props?.recipeRole === "callout");
    const role = (component, roleName) => {
      if (component.props?.recipeRole === roleName) return component;
      for (const child of component.children || []) {
        const found = role(child, roleName);
        if (found) return found;
      }
      return null;
    };
    const scenarios = [
      {
        kind: "technical",
        icon: "torque",
        title: "DICA DE INSTALAÇÃO",
        body: "Aplique o torque recomendado para evitar deformação da ferragem.",
        frame: { x: 24, y: 24, width: 330, height: 140 },
        expectedMode: "row"
      },
      {
        kind: "commercial",
        icon: "payment",
        title: "CONDIÇÃO COMERCIAL",
        body: "Consulte disponibilidade, prazo e condições de pagamento para o seu pedido.",
        frame: { x: 366, y: 24, width: 180, height: 190 },
        expectedMode: "column"
      }
    ];
    callouts.forEach((callout, index) => {
      const scenario = scenarios[index];
      store.updateComponent(role(callout, "icon").id, { props: { icon: scenario.icon, iconScale: 120 } });
      store.updateComponent(role(callout, "title").id, { props: { content: scenario.title } });
      store.updateComponent(role(callout, "body").id, { props: { content: scenario.body } });
      store.updateComponent(callout.id, { frame: scenario.frame });
      store.reflowComponentTree(callout.id);
    });
    const serialize = component => ({
      id: component.id,
      type: component.type,
      role: component.props?.recipeRole || null,
      parentId: null,
      children: (component.children || []).map(serialize)
    });
    return {
      scenarios,
      callouts: callouts.map(callout => {
        const current = store.findComponent(callout.id).component;
        return {
          id: current.id,
          frame: { ...current.frame },
          mode: CatalogLayoutEngine.effectiveMode(current),
          style: { ...current.style },
          tree: serialize(current)
        };
      })
    };
  });

  await page.waitForFunction(ids => ids.every(id => document.querySelector(`[data-component-id="${id}"]`)), fixture.callouts.map(callout => callout.id));

  async function measure(media) {
    return page.evaluate(({ fixture, media }) => {
      const flatten = (node, parentId = null, result = []) => {
        result.push({ ...node, parentId });
        node.children.forEach(child => flatten(child, node.id, result));
        return result;
      };
      return {
        media,
        callouts: fixture.callouts.map(callout => {
          const entries = flatten(callout.tree).map(entry => {
            const element = document.querySelector(`[data-component-id="${entry.id}"]`);
            const rect = element.getBoundingClientRect();
            const svg = element.querySelector(":scope > .editor-component__content svg") || (entry.role === "icon" ? element.querySelector("svg") : null);
            return {
              ...entry,
              rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
              text: element.querySelector(":scope > .editor-component__content .component-text p")?.textContent || "",
              svg: svg ? { viewBox: svg.getAttribute("viewBox"), stroke: svg.getAttribute("stroke") } : null
            };
          });
          return { ...callout, entries };
        })
      };
    }, { fixture, media });
  }

  function validate(snapshot) {
    assert(snapshot.callouts.length === 2, "O navegador não materializou os dois callouts.");
    snapshot.callouts.forEach((callout, index) => {
      const scenario = fixture.scenarios[index];
      assert(callout.mode === scenario.expectedMode, `${scenario.kind}: modo inesperado (${callout.mode}).`);
      assert(callout.style.border === "border.none" && callout.style.radius === "radius.none", `${scenario.kind}: raiz ainda depende de moldura não publicável.`);
      const byId = new Map(callout.entries.map(entry => [entry.id, entry]));
      const byRole = Object.fromEntries(callout.entries.filter(entry => entry.role).map(entry => [entry.role, entry]));
      assert(byRole.icon?.svg?.viewBox === "0 0 24 24" && byRole.icon?.svg?.stroke === "currentColor", `${scenario.kind}: ícone inválido em ${snapshot.media}.`);
      assert(byRole.title?.text === scenario.title, `${scenario.kind}: título incorreto em ${snapshot.media}.`);
      assert(byRole.body?.text === scenario.body, `${scenario.kind}: corpo incorreto em ${snapshot.media}.`);

      for (const entry of callout.entries) {
        if (!entry.parentId) continue;
        const parent = byId.get(entry.parentId);
        assert(entry.rect.left >= parent.rect.left - 1 && entry.rect.right <= parent.rect.right + 1, `${scenario.kind}/${entry.role || entry.type}: vazamento horizontal em ${snapshot.media}.`);
        assert(entry.rect.top >= parent.rect.top - 1 && entry.rect.bottom <= parent.rect.bottom + 1, `${scenario.kind}/${entry.role || entry.type}: vazamento vertical em ${snapshot.media}.`);
      }

      const siblingGroups = new Map();
      callout.entries.filter(entry => entry.parentId).forEach(entry => {
        const group = siblingGroups.get(entry.parentId) || [];
        group.push(entry);
        siblingGroups.set(entry.parentId, group);
      });
      for (const siblings of siblingGroups.values()) {
        for (let left = 0; left < siblings.length; left += 1) {
          for (let right = left + 1; right < siblings.length; right += 1) {
            const a = siblings[left].rect;
            const b = siblings[right].rect;
            const overlaps = !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
            assert(!overlaps, `${scenario.kind}: irmãos sobrepostos em ${snapshot.media}.`);
          }
        }
      }
    });
  }

  const screen = await measure("screen");
  validate(screen);

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await measure("print");
  validate(printed);

  const report = await page.evaluate(() => CatalogEditor.store.getPublicationReport("draft").summary);
  assert(report.collisions === 0 && report.overflows === 0, `Diagnóstico geométrico inválido: ${JSON.stringify(report)}.`);
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.19 validou callout amplo e compacto pela biblioteca, com hierarquia preservada na impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
