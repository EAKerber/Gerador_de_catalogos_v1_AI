(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.19";
  const RECIPE_VERSION = "1.4.1";
  const clone = value => JSON.parse(JSON.stringify(value));

  function improvedRecipe(current) {
    const recipe = clone(current);
    recipe.version = RECIPE_VERSION;
    recipe.description = "Ícone, título e texto em uma composição responsiva e editável.";
    const root = recipe.component;
    root.frame.height = 140;
    root.props = { ...(root.props || {}), recipeRole: "callout" };
    root.layout = {
      ...(root.layout || {}),
      mode: "row",
      padding: 10,
      gap: 8,
      align: "stretch",
      distribution: "fill",
      responsive: { enabled: true, breakpoint: 240, mode: "column" }
    };
    const icon = (root.children || []).find(child => child.type === "icon");
    const content = (root.children || []).find(child => child.type === "layout-container");
    if (icon) {
      icon.frame.height = 120;
      icon.props = { ...(icon.props || {}), recipeRole: "icon" };
    }
    if (content) {
      content.frame.height = 120;
      content.props = { ...(content.props || {}), recipeRole: "content" };
      const texts = (content.children || []).filter(child => child.type === "text");
      if (texts[0]) texts[0].props = { ...(texts[0].props || {}), recipeRole: "title" };
      if (texts[1]) texts[1].props = { ...(texts[1].props || {}), recipeRole: "body" };
    }
    return Object.freeze(recipe);
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
    return true;
  }

  window.CatalogCalloutRecipeContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    RECIPE_VERSION,
    install,
    improvedRecipe
  });
})();
