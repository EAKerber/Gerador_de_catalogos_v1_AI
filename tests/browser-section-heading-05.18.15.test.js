/* DB-05.18.15 — receita section-heading pela biblioteca, em tela e impressão. */
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
  await page.waitForFunction(() => window.CatalogEditor && window.CatalogSectionRecipes?.VERSION === "1.3.0");

  await page.evaluate(() => {
    CatalogEditor.store.reset();
    CatalogEditor.store.setEditorSettings({ zoom: 1, zoomMode: "manual", gridVisible: false });
  });

  const recipeButton = page.locator('[data-insert-template="section-heading"]');
  assert(await recipeButton.count() === 1, "A receita Título de seção não está acessível na biblioteca.");
  const recipeItemText = await recipeButton.locator("xpath=ancestor::article[1]").textContent();
  assert(recipeItemText.includes("Título de seção") && recipeItemText.includes("Sobretítulo opcional"), `Descrição editorial ausente: ${recipeItemText}.`);

  await recipeButton.click();
  await page.waitForFunction(() => CatalogEditor.store.getPage().children.filter(component => component.props?.recipeRole === "section-heading").length === 1);
  await recipeButton.click();
  await page.waitForFunction(() => CatalogEditor.store.getPage().children.filter(component => component.props?.recipeRole === "section-heading").length === 2);

  const fixture = await page.evaluate(() => {
    const store = CatalogEditor.store;
    const headings = store.getPage().children.filter(component => component.props?.recipeRole === "section-heading");
    const byRole = (component, role) => component.children.find(child => child.props?.recipeRole === role);
    const scenarios = [
      {
        kicker: "LINHA TÉCNICA",
        title: "FIXADORES PARA MADEIRA",
        support: "Parafusos, buchas e acessórios para montagem profissional."
      },
      {
        kicker: "COLEÇÃO 2026",
        title: "ILUMINAÇÃO LINEAR",
        support: "Perfis, difusores e acessórios para projetos arquitetônicos."
      }
    ];
    headings.forEach((heading, index) => {
      store.updateComponent(byRole(heading, "kicker").id, { props: { content: scenarios[index].kicker } });
      store.updateComponent(byRole(heading, "title").id, { props: { content: scenarios[index].title } });
      store.updateComponent(byRole(heading, "support").id, { props: { content: scenarios[index].support } });
      store.updateComponent(heading.id, { frame: { width: index === 0 ? 620 : 300, height: 124 } });
      store.reflowComponentTree(heading.id);
    });
    const compact = store.findComponent(headings[1].id).component;
    const compactKicker = byRole(compact, "kicker");
    store.deleteComponent(compactKicker.id);
    store.reflowComponentTree(compact.id);
    const current = headings.map(heading => store.findComponent(heading.id).component);
    return {
      roots: current.map(component => ({
        id: component.id,
        frame: { ...component.frame },
        childIds: component.children.map(child => child.id),
        roles: Object.fromEntries(component.children.map(child => [child.props?.recipeRole, child.id]))
      })),
      scenarios
    };
  });

  await page.waitForFunction(rootIds => rootIds.every(id => document.querySelector(`[data-component-id="${id}"]`)), fixture.roots.map(root => root.id));

  async function measure(media) {
    return page.evaluate(({ fixture, media }) => {
      const roots = fixture.roots.map(root => {
        const element = document.querySelector(`[data-component-id="${root.id}"]`);
        const rect = element.getBoundingClientRect();
        const children = root.childIds.map(id => {
          const child = document.querySelector(`[data-component-id="${id}"]`);
          if (!child) return null;
          const childRect = child.getBoundingClientRect();
          return {
            id,
            type: child.dataset.componentType,
            rect: { left: childRect.left, top: childRect.top, right: childRect.right, bottom: childRect.bottom },
            text: child.querySelector(".component-text p")?.textContent || ""
          };
        }).filter(Boolean);
        return {
          id: root.id,
          frame: root.frame,
          roles: root.roles,
          rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
          children
        };
      });
      return { media, roots };
    }, { fixture, media });
  }

  function validate(snapshot) {
    assert(snapshot.roots.length === 2, "O navegador não materializou as duas composições.");
    assert(snapshot.roots[0].frame.width === 620 && snapshot.roots[1].frame.width === 300, "As larguras ampla e compacta foram perdidas.");
    assert(snapshot.roots[0].children.length === 4, "A composição ampla perdeu uma peça.");
    assert(snapshot.roots[1].children.length === 3, "A composição compacta não refletiu a remoção do kicker.");
    assert(!snapshot.roots[1].children.some(child => child.id === snapshot.roots[1].roles.kicker), "O kicker removido reapareceu no DOM.");

    snapshot.roots.forEach(root => {
      root.children.forEach(child => {
        assert(child.rect.left >= root.rect.left - 1 && child.rect.right <= root.rect.right + 1, `${root.id}/${child.id}: vazamento horizontal em ${snapshot.media}.`);
        assert(child.rect.top >= root.rect.top - 1 && child.rect.bottom <= root.rect.bottom + 1, `${root.id}/${child.id}: vazamento vertical em ${snapshot.media}.`);
      });
      for (let left = 0; left < root.children.length; left += 1) {
        for (let right = left + 1; right < root.children.length; right += 1) {
          const a = root.children[left].rect;
          const b = root.children[right].rect;
          const overlaps = !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
          assert(!overlaps, `${root.id}: filhos sobrepostos em ${snapshot.media}.`);
        }
      }
    });

    const firstTexts = snapshot.roots[0].children.map(child => child.text);
    const secondTexts = snapshot.roots[1].children.map(child => child.text);
    assert(firstTexts.includes(fixture.scenarios[0].kicker) && firstTexts.includes(fixture.scenarios[0].title) && firstTexts.includes(fixture.scenarios[0].support), "O primeiro cenário não aparece integralmente.");
    assert(!secondTexts.includes(fixture.scenarios[1].kicker) && secondTexts.includes(fixture.scenarios[1].title) && secondTexts.includes(fixture.scenarios[1].support), "O segundo cenário não preservou a opcionalidade.");
  }

  const screen = await measure("screen");
  validate(screen);

  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => { document.documentElement.dataset.printing = "true"; });
  const printed = await measure("print");
  validate(printed);

  const publication = await page.evaluate(() => CatalogEditor.store.getPublicationReport("draft").summary);
  assert(publication.collisions === 0 && publication.overflows === 0, `Diagnóstico geométrico inválido: ${JSON.stringify(publication)}.`);
  assert(pageErrors.length === 0, `Erros de página: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console: ${consoleErrors.join(" | ")}`);

  await browser.close();
  console.log("✓ DB-05.18.15 inseriu a receita pela biblioteca e validou dois cenários, opcionalidade, tela e impressão.");
})().catch(async error => {
  console.error(error);
  if (browser) await browser.close();
  process.exitCode = 1;
});
