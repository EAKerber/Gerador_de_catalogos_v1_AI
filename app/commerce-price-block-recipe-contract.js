(function () {
  "use strict";

  const CONTRACT_VERSION = "05.20.12";
  const RECIPE_VERSION = "1.0.0";
  const clone = value => JSON.parse(JSON.stringify(value));
  const node = (id, type, frame, options = {}) => ({
    id,
    type,
    name: options.name || id,
    frame: { ...frame },
    props: { ...(options.props || {}) },
    style: { ...(options.style || {}) },
    ...(options.layout ? { layout: clone(options.layout) } : {}),
    ...(options.layoutItem ? { layoutItem: clone(options.layoutItem) } : {}),
    structureInitialized: options.structureInitialized === true,
    children: clone(options.children || [])
  });

  const priceBlockRecipe = Object.freeze({
    id: "commerce-price-block",
    version: RECIPE_VERSION,
    label: "Bloco de preço promocional",
    description: "Preço antigo, qualificador, moeda, valor atual e unidade em uma composição comercial editável.",
    icon: "payment",
    contexts: Object.freeze(["page", "layout-container"]),
    component: node("recipe-commerce-price-root", "layout-container", { x: 0, y: 0, width: 180, height: 220 }, {
      name: "Bloco de preço promocional",
      props: { label: "PREÇO PROMOCIONAL", recipeRole: "price-block" },
      style: { surface: "surface.promo-primary", border: "border.none", radius: "radius.small", accentColor: "promo.primary" },
      layout: { mode: "column", padding: 8, gap: 4, columns: 1, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 150, mode: "column" } },
      children: [
        node("recipe-commerce-price-old", "text", { x: 8, y: 8, width: 164, height: 28 }, {
          name: "Preço anterior opcional",
          props: { content: "DE: R$ 6,50", align: "center", verticalAlign: "center", scale: 100, overflow: "ellipsis", recipeRole: "old-price" },
          style: { surface: "surface.promo-secondary", border: "border.none", radius: "radius.small", textColor: "promo.on-secondary", typography: "type.promo-meta" },
          layoutItem: { managed: true, grow: 0, span: 1 }
        }),
        node("recipe-commerce-price-qualifier", "text", { x: 8, y: 40, width: 164, height: 32 }, {
          name: "Qualificador opcional",
          props: { content: "POR APENAS", align: "center", verticalAlign: "center", scale: 100, overflow: "ellipsis", recipeRole: "qualifier" },
          style: { surface: "surface.promo-dark", border: "border.none", radius: "radius.small", textColor: "promo.on-dark", typography: "type.promo-qualifier" },
          layoutItem: { managed: true, grow: 0, span: 1 }
        }),
        node("recipe-commerce-price-current", "layout-container", { x: 8, y: 76, width: 164, height: 100 }, {
          name: "Valor atual",
          props: { label: "VALOR ATUAL", recipeRole: "current-price" },
          style: { surface: "surface.promo-primary", border: "border.none", radius: "radius.none" },
          layout: { mode: "free", padding: 4, gap: 2, columns: 2, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 120, mode: "free" } },
          layoutItem: { managed: true, grow: 1, span: 1 },
          children: [
            node("recipe-commerce-price-currency", "text", { x: 4, y: 4, width: 42, height: 92 }, {
              name: "Moeda",
              props: { content: "R$", align: "center", verticalAlign: "center", scale: 80, overflow: "ellipsis", recipeRole: "currency" },
              style: { surface: "surface.promo-primary", border: "border.none", radius: "radius.none", textColor: "promo.on-primary", typography: "type.promo-title" },
              layoutItem: { managed: false, grow: 0, span: 1 }
            }),
            node("recipe-commerce-price-amount", "text", { x: 48, y: 4, width: 112, height: 92 }, {
              name: "Valor",
              props: { content: "3,99", align: "center", verticalAlign: "center", scale: 100, overflow: "ellipsis", recipeRole: "amount" },
              style: { surface: "surface.promo-primary", border: "border.none", radius: "radius.none", textColor: "promo.on-primary", typography: "type.promo-price" },
              layoutItem: { managed: false, grow: 1, span: 1 }
            })
          ]
        }),
        node("recipe-commerce-price-unit", "text", { x: 8, y: 180, width: 164, height: 32 }, {
          name: "Unidade opcional",
          props: { content: "CADA", align: "center", verticalAlign: "center", scale: 100, overflow: "ellipsis", recipeRole: "unit" },
          style: { surface: "surface.promo-primary", border: "border.none", radius: "radius.none", textColor: "promo.on-primary", typography: "type.promo-meta" },
          layoutItem: { managed: true, grow: 0, span: 1 }
        })
      ]
    })
  });

  function install() {
    const current = window.CatalogSectionRecipes;
    const currentRegistry = window.CATALOG_SECTION_RECIPES;
    if (!current?.list || !current?.get || !currentRegistry) return false;
    if (current.__commercePriceBlockRecipeContractVersion === CONTRACT_VERSION) return true;
    const existing = current.get("commerce-price-block");
    if (existing && existing.version !== RECIPE_VERSION) throw new Error("A receita commerce-price-block já existe com contrato incompatível.");

    const merged = Object.freeze({ ...currentRegistry, "commerce-price-block": priceBlockRecipe });
    const api = {
      VERSION: RECIPE_VERSION,
      list() { return Object.values(merged).map(clone); },
      get(recipeId) { return merged[recipeId] ? clone(merged[recipeId]) : null; }
    };
    Object.defineProperty(api, "__commercePriceBlockRecipeContractVersion", { value: CONTRACT_VERSION });
    window.CATALOG_SECTION_RECIPES = merged;
    window.CatalogSectionRecipes = Object.freeze(api);
    return true;
  }

  window.CatalogCommercePriceBlockRecipeContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    RECIPE_VERSION,
    RECIPE: priceBlockRecipe,
    install
  });
})();
