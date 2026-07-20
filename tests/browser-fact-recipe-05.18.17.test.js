/* DB-05.18.17 — recipe fact pela biblioteca, em quatro classes de dado. */
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
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogFactRecipeContract?.VERSION === "05.18.17" && window.CatalogSectionRecipes?.get?.("fact"));

  await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
  });

  const recipeButton = page.locator('[data-insert-template="fact"]');
  assert(await recipeButton.count() === 1, "A receita Dado destacado não está acessível na biblioteca.");
  const recipeText = await recipeButton.locator("xpath=ancestor::article[1]").textContent();
  assert(recipeText.includes("Dado destacado") && recipeText.includes("Ícone opcional") && recipeText.includes("unidade"), `Descrição insuficiente da receita: ${recipeText}.`);

  const historyBefore = await page.evaluate(() => CatalogEditor.store.getHistoryState().undoCount);
  await recipeButton.click();
  await page.waitForFunction(() => CatalogEditor.store.getPage().children.filter(component => component.props?.recipeRole === "fact").length === 1);
  const historyAfter = await page.evaluate(() => CatalogEditor.store.getHistoryState());
  assert(historyAfter.undoCount === historyBefore + 1 && historyAfter.undoLabel === "Inserir estrutura pronta", "A inserção visual não foi uma transação única.");

  for (let count = 2; count <= 4; count += 1) {
    await recipeButton.click();
    await page.waitForFunction(expected => CatalogEditor.store.getPage().children.filter(component => component.props?.recipeRole === "fact").length === expected, count);
  }

  const fixture = await page.evaluate(() => {
    const store = CatalogEditor.store;
    const facts = store.getPage().children.filter(component => component.props?.recipeRole === "fact");
    const byRole = (component, role) => component.children.find(child => child.props?.recipeRole === role);
    const scenarios = [
      { kind: "dimension", icon: "diameter", label: "DIÂMETRO", value: "8", unit: "mm", frame: { x: 24, y: 24, width: 240, height: 180 } },
      { kind: "weight", icon: "load-capacity", label: "CAPACIDADE", value: "120", unit: "kg", frame: { x: 276, y: 24, width: 160, height: 180 } },
      { kind: "material", icon: "layers", label: "MATERIAL", value: "AÇO CARBONO", unit: "", frame: { x: 448, y: 24, width: 160, height: 180 }, removeIcon: true, removeUnit: true },
      { kind: "compatibility", icon: "target", label: "COMPATIBILIDADE", value: "MDF 15–25", unit: "mm", frame: { x: 24, y: 216, width: 180, height: 180 } }
    ];
    facts.forEach((fact, index) => {
      const scenario = scenarios[index];
      store.updateComponent(byRole(fact, "icon").id, { props: { icon: scenario.icon, iconScale: 120 } });
      store.updateComponent(byRole(fact, "label").id, { props: { content: scenario.label } });
      store.updateComponent(byRole(fact, "value").id, { props: { content: scenario.value } });
      store.updateComponent(byRole(fact, "unit").id, { props: { content: scenario.unit } });
      store.updateComponent(fact.id, { frame: scenario.frame });
      store.reflowComponentTree(fact.id);
    });
    const material = store.findComponent(facts[2].id).component;
    store.deleteComponent(byRole(material, "icon").id);
    store.deleteComponent(byRole(store.findComponent(material.id).component, "unit").id);
    store.reflowComponentTree(material.id);
    return {
      scenarios,
      facts: facts.map(fact => {
        const current = store.findComponent(fact.id).component;
        return {
          id: current.id,
          frame: { ...current.frame },
          children: current.children.map(child => ({ id: child.id, role: child.props?.recipeRole, type: child.type }))
        };
      })
    };
  });

  await page.waitForFunction(ids => ids.every(id => document.querySelector(`[data-component-id="${id}"]`)), fixture.facts.map(fact => fact.id));

  async function measure(media) {
    return page.evaluate(({ fixture, media }) => {
      return {
        media,
        facts: fixture.facts.map(fact => {
          const root = document.querySelector(`[data-component-id="${fact.id}"]`);
          const rootRect = root.getBoundingClientRect();
          const children = fact.children.map(childMeta => {
            const child = document.querySelector(`[data-component-id="${childMeta.id}"]`);
            if (!child) return null;
            const rect = child.getBoundingClientRect();
            const svg = child.querySelector("svg");
            return {
              ...childMeta,
              rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
              text: child.querySelector(".component-text p")?.textContent || "",
              svg: svg ? { viewBox: svg.getAttribute("viewBox"), stroke: svg.getAttribute("stroke") } : null
            };
          }).filter(Boolean);
          return {
            id: fact.id,
            frame: fact.frame,
            rect: { left: rootRect.left, top: rootRect.top, right: rootRect.right, bottom: rootRect.bottom },
            children
          };
        })
      };
    }, { fixture, media });
  }

  function validate(snapshot) {
    assert(snapshot.facts.length === 4, "O navegador não materializou os quatro fatos.");
    assert(snapshot.facts[0].frame.width === 240 && snapshot.facts[1].frame.width === 160, "As variações ampla e compacta foram perdidas.");
    snapshot.facts.forEach((fact, index) => {
      const scenario = fixture.scenarios[index];
      const roles = Object.fromEntries(fact.children.map(child => [child.role, child]));
      assert(roles.label?.text === scenario.label, `${scenario.kind}: rótulo incorreto em ${snapshot.media}.`);
      assert(roles.value?.text === scenario.value, `${scenario.kind}: valor incorreto em ${snapshot.media}.`);
      if (scenario.removeIcon) assert(!roles.icon, `${scenario.kind}: ícone removido reapareceu em ${snapshot.media}.`);
      else {
        assert(roles.icon?.svg?.viewBox === "0 0 24 24", `${scenario.kind}: viewBox ausente.`);
        assert(roles.icon?.svg?.stroke === "currentColor", `${scenario.kind}: recoloração por token ausente.`);
      }
      if (scenario.removeUnit) assert(!roles.unit, `${scenario.kind}: unidade removida reapareceu em ${snapshot.media}.`);
      else assert(roles.unit?.text === scenario.unit, `${scenario.kind}: unidade incorreta em ${snapshot.media}.`);

      fact.children.forEach(child => {
        assert(child.rect.left >= fact.rect.left - 1 && child.rect.right <= fact.rect.right + 1, `${scenario.kind}/${child.role}: vazamento horizontal em ${snapshot.media}.`);
        assert(child.rect.top >= fact.rect.top - 1 && child.rect.bottom <= fact.rect.bottom + 1, `${scenario.kind}/${child.role}: vazamento vertical em ${snapshot.media}.`);
      });
      for (let left = 0; left < fact.children.length; left += 1) {
        for (let right = left + 1; right < fact.children.length; right += 1) {
          const a = fact.children[left].rect;
          const b = fact.children[right].rect;
          const overlaps = !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
          assert(!overlaps, `${scenario.kind}: filhos sobrepostos em ${snapshot.media}.`);
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
  console.log("✓ DB-05.18.17 inseriu quatro fatos pela biblioteca e validou conteúdo parcial, escala, tela e impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
