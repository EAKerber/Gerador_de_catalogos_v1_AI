(function () {
  "use strict";

  const CONTRACT_VERSION = "05.20.15";
  const RECIPE_VERSION = "1.5.0";
  const STYLE_ATTRIBUTE = "data-benefit-callout-legibility";
  const clone = value => JSON.parse(JSON.stringify(value));

  function patchRegistry() {
    const registry = window.CATALOG_COMPONENT_REGISTRY;
    if (!registry?.icon) return false;
    if (registry.icon.recommendedSize?.width === 96 && registry.icon.recommendedSize?.height === 72) return true;
    window.CATALOG_COMPONENT_REGISTRY = Object.freeze({
      ...registry,
      icon: Object.freeze({
        ...registry.icon,
        recommendedSize: Object.freeze({ width: 96, height: 72 })
      })
    });
    return true;
  }

  function improvedRecipe(current) {
    const recipe = clone(current);
    recipe.version = RECIPE_VERSION;
    recipe.description = "Ícone, título e texto com hierarquia responsiva ampla ou compacta.";
    const root = recipe.component;
    root.frame.height = 150;
    root.props = { ...(root.props || {}), recipeRole: "callout", contextual: true };
    root.style = { ...(root.style || {}), surface: "surface.paper", border: "border.none", radius: "radius.none", accentColor: "promo.primary" };
    root.layout = {
      ...(root.layout || {}),
      mode: "row",
      padding: 10,
      gap: 10,
      align: "stretch",
      distribution: "fill",
      responsive: { enabled: true, breakpoint: 260, mode: "column" }
    };
    const icon = (root.children || []).find(child => child.type === "icon");
    const content = (root.children || []).find(child => child.type === "layout-container");
    if (icon) {
      icon.frame.height = 130;
      icon.props = { ...(icon.props || {}), iconScale: 120, recipeRole: "icon" };
      icon.style = {
        ...(icon.style || {}),
        surface: "surface.promo-dark",
        border: "border.none",
        radius: "radius.small",
        vectorColor: "promo.secondary",
        textColor: "promo.on-dark",
        typography: "type.promo-meta"
      };
    }
    if (content) {
      content.frame.height = 130;
      content.props = { ...(content.props || {}), recipeRole: "content" };
      content.style = { ...(content.style || {}), surface: "surface.paper", border: "border.none", radius: "radius.none" };
      content.layout = {
        ...(content.layout || {}),
        mode: "column",
        padding: 0,
        gap: 4,
        align: "stretch",
        distribution: "fill",
        responsive: { enabled: false, breakpoint: 120, mode: "column" }
      };
      const texts = (content.children || []).filter(child => child.type === "text");
      if (texts[0]) {
        texts[0].props = { ...(texts[0].props || {}), align: "start", verticalAlign: "center", scale: 100, overflow: "wrap", recipeRole: "title" };
        texts[0].style = {
          ...(texts[0].style || {}),
          surface: "surface.promo-dark",
          border: "border.none",
          radius: "radius.small",
          textColor: "promo.on-dark",
          typography: "type.promo-title"
        };
        texts[0].layoutItem = { ...(texts[0].layoutItem || {}), managed: true, grow: 0, span: 1 };
      }
      if (texts[1]) {
        texts[1].props = { ...(texts[1].props || {}), align: "start", verticalAlign: "start", scale: 100, overflow: "wrap", recipeRole: "body" };
        texts[1].style = {
          ...(texts[1].style || {}),
          surface: "surface.paper",
          border: "border.none",
          radius: "radius.none",
          textColor: "text.primary",
          typography: "type.body"
        };
        texts[1].layoutItem = { ...(texts[1].layoutItem || {}), managed: true, grow: 1, span: 1 };
      }
    }
    return Object.freeze(recipe);
  }

  function installStyles() {
    if (typeof document === "undefined") return true;
    if (document.querySelector(`style[${STYLE_ATTRIBUTE}]`)) return true;
    const style = document.createElement("style");
    style.setAttribute(STYLE_ATTRIBUTE, CONTRACT_VERSION);
    style.textContent = `
      .component-icon {
        grid-template-rows: minmax(0, 1fr) auto;
        min-width: 0;
        min-height: 0;
        align-items: stretch;
        justify-items: center;
        align-content: normal;
      }
      .component-icon__svg { align-self: center; }
      .component-icon > span:last-child {
        display: block;
        max-width: 100%;
        max-height: 2.3em;
        overflow: hidden;
        font-size: min(var(--component-title-size, 10px), 8px);
        line-height: 1.15;
        overflow-wrap: anywhere;
        text-overflow: clip;
        white-space: normal;
      }
      .editor-component--footer-item > .component-children-layer > .editor-component--icon[data-slot-name="icon"] .component-icon {
        grid-template-rows: minmax(0, 1fr);
      }
      .editor-component--layout-container[data-contextual="true"][data-layout-mode="row"] > .component-children-layer > .editor-component--layout-container > .component-children-layer > .editor-component--text:first-child .component-text p {
        font-size: calc(var(--component-title-size, 30px) * .93);
        line-height: .94;
      }
      .editor-component--layout-container[data-contextual="true"][data-layout-mode="column"] > .component-children-layer > .editor-component--layout-container > .component-children-layer > .editor-component--text:first-child .component-text p {
        font-size: calc(var(--component-title-size, 30px) * .75);
        line-height: .98;
      }
      .editor-component--layout-container[data-contextual="true"] > .component-children-layer > .editor-component--layout-container > .component-children-layer > .editor-component--text .component-text {
        padding: 3px 5px;
      }
      .editor-component--layout-container[data-contextual="true"][data-layout-mode="row"] > .component-children-layer > .editor-component--icon .component-icon__svg {
        width: min(90%, 64px);
        height: min(90%, 64px);
      }
      .editor-component--layout-container[data-contextual="true"][data-layout-mode="column"] > .component-children-layer > .editor-component--icon .component-icon__svg {
        width: min(72%, 46px);
        height: min(72%, 46px);
      }
    `;
    document.head.appendChild(style);
    return true;
  }

  function install() {
    const current = window.CatalogSectionRecipes;
    const currentRegistry = window.CATALOG_SECTION_RECIPES;
    if (!current?.list || !current?.get || !currentRegistry) return false;
    if (current.__calloutRecipeContractVersion === CONTRACT_VERSION) return true;
    const source = current.get("section-tip-callout");
    if (!source) throw new Error("A receita section-tip-callout não está disponível para auditoria.");
    const callout = improvedRecipe(source);
    const merged = Object.freeze({ ...currentRegistry, "section-tip-callout": callout });
    const api = {
      VERSION: RECIPE_VERSION,
      list() { return Object.values(merged).map(clone); },
      get(recipeId) { return merged[recipeId] ? clone(merged[recipeId]) : null; }
    };
    Object.defineProperty(api, "__calloutRecipeContractVersion", { value: CONTRACT_VERSION });
    window.CATALOG_SECTION_RECIPES = merged;
    window.CatalogSectionRecipes = Object.freeze(api);
    return patchRegistry() && installStyles();
  }

  window.CatalogCalloutRecipeContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    RECIPE_VERSION,
    install,
    improvedRecipe,
    patchRegistry
  });
})();