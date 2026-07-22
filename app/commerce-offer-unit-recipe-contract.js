(function () {
  "use strict";

  const CONTRACT_VERSION = "05.20.13";
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

  function prefixIds(component, prefix) {
    const result = clone(component);
    const visit = item => {
      item.id = `${prefix}-${item.id}`;
      for (const child of item.children || []) visit(child);
    };
    visit(result);
    return result;
  }

  function buildRecipe(priceRecipe) {
    if (!priceRecipe?.component) throw new Error("A receita commerce-price-block deve estar instalada antes da unidade de oferta.");
    const priceBlock = prefixIds(priceRecipe.component, "recipe-commerce-offer");
    priceBlock.frame = { x: 0, y: 306, width: 180, height: 220 };
    priceBlock.layoutItem = { managed: true, grow: 0, span: 1 };

    return Object.freeze({
      id: "commerce-offer-unit",
      version: RECIPE_VERSION,
      label: "Unidade de oferta comercial",
      description: "Mídia, código, medida e bloco de preço em uma oferta independente, duplicável e reordenável.",
      icon: "payment",
      contexts: Object.freeze(["page", "layout-container"]),
      component: node("recipe-commerce-offer-root", "layout-container", { x: 0, y: 0, width: 180, height: 526 }, {
        name: "Unidade de oferta comercial",
        props: { label: "OFERTA COMERCIAL", recipeRole: "offer-unit" },
        style: { surface: "surface.paper", border: "border.strong", radius: "radius.small", accentColor: "promo.primary" },
        layout: { mode: "column", padding: 0, gap: 0, columns: 1, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 150, mode: "column" } },
        children: [
          node("recipe-commerce-offer-media", "art", { x: 0, y: 0, width: 180, height: 220 }, {
            name: "Produto ou variação",
            props: { assetId: null, alt: "Produto da oferta", fit: "contain", focusX: 50, focusY: 50, recipeRole: "media" },
            style: { surface: "surface.neutral", border: "border.none", radius: "radius.small", accentColor: "promo.primary" },
            layoutItem: { managed: true, grow: 1, span: 1 }
          }),
          node("recipe-commerce-offer-code", "text", { x: 0, y: 220, width: 180, height: 34 }, {
            name: "Código comercial",
            props: { content: "CÓD. 1123", align: "center", verticalAlign: "center", scale: 100, overflow: "ellipsis", recipeRole: "code" },
            style: { surface: "surface.promo-dark", border: "border.none", radius: "radius.none", textColor: "promo.on-dark", typography: "type.promo-meta" },
            layoutItem: { managed: true, grow: 0, span: 1 }
          }),
          node("recipe-commerce-offer-measure", "text", { x: 0, y: 254, width: 180, height: 52 }, {
            name: "Medida ou variação",
            props: { content: "100mm", align: "center", verticalAlign: "center", scale: 100, overflow: "ellipsis", recipeRole: "measure" },
            style: { surface: "surface.promo-secondary", border: "border.none", radius: "radius.none", textColor: "promo.on-secondary", typography: "type.promo-title" },
            layoutItem: { managed: true, grow: 0, span: 1 }
          }),
          priceBlock
        ]
      })
    });
  }

  function install() {
    const current = window.CatalogSectionRecipes;
    const currentRegistry = window.CATALOG_SECTION_RECIPES;
    if (!current?.list || !current?.get || !currentRegistry) return false;
    if (current.__commerceOfferUnitRecipeContractVersion === CONTRACT_VERSION) return true;
    const existing = current.get("commerce-offer-unit");
    if (existing && existing.version !== RECIPE_VERSION) throw new Error("A receita commerce-offer-unit já existe com contrato incompatível.");
    const offerRecipe = buildRecipe(current.get("commerce-price-block"));

    const merged = Object.freeze({ ...currentRegistry, "commerce-offer-unit": offerRecipe });
    const api = {
      VERSION: RECIPE_VERSION,
      list() { return Object.values(merged).map(clone); },
      get(recipeId) { return merged[recipeId] ? clone(merged[recipeId]) : null; }
    };
    Object.defineProperty(api, "__commerceOfferUnitRecipeContractVersion", { value: CONTRACT_VERSION });
    window.CATALOG_SECTION_RECIPES = merged;
    window.CatalogSectionRecipes = Object.freeze(api);
    return true;
  }

  window.CatalogCommerceOfferUnitRecipeContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    RECIPE_VERSION,
    buildRecipe,
    install
  });
})();