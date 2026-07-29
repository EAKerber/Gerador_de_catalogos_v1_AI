(function () {
  "use strict";

  const CONTRACT_VERSION = "05.18.17";
  const RECIPE_VERSION = "1.4.0";
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

  const factRecipe = Object.freeze({
    id: "fact",
    version: RECIPE_VERSION,
    label: "Dado destacado",
    description: "Ícone opcional, rótulo, valor e unidade em um bloco vertical editável.",
    icon: "ruler",
    contexts: Object.freeze(["page", "layout-container"]),
    component: node("recipe-fact-root", "layout-container", { x: 0, y: 0, width: 180, height: 180 }, {
      name: "Dado destacado",
      props: { label: "DADO DESTACADO", recipeRole: "fact" },
      style: { surface: "surface.paper", border: "border.none", radius: "radius.none", accentColor: "brand.primary" },
      layout: { mode: "column", padding: 8, gap: 6, columns: 1, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 160, mode: "column" } },
      children: [
        node("recipe-fact-icon", "icon", { x: 8, y: 8, width: 164, height: 42 }, {
          name: "Ícone opcional",
          props: { icon: "load-capacity", label: "", iconScale: 100, recipeRole: "icon" },
          style: { surface: "surface.paper", border: "border.none", radius: "radius.none", accentColor: "brand.primary", vectorColor: "brand.primary", textColor: "text.primary", typography: "type.caption" },
          layoutItem: { managed: true, grow: 0, span: 1 }
        }),
        node("recipe-fact-label", "text", { x: 8, y: 56, width: 164, height: 34 }, {
          name: "Rótulo do dado",
          props: { content: "CAPACIDADE", align: "center", verticalAlign: "center", scale: 80, overflow: "ellipsis", recipeRole: "label" },
          style: { surface: "surface.paper", border: "border.none", radius: "radius.none", textColor: "brand.primary", typography: "type.label" },
          layoutItem: { managed: true, grow: 0, span: 1 }
        }),
        node("recipe-fact-value", "text", { x: 8, y: 96, width: 164, height: 44 }, {
          name: "Valor do dado",
          props: { content: "120", align: "center", verticalAlign: "center", scale: 120, overflow: "ellipsis", recipeRole: "value" },
          style: { surface: "surface.paper", border: "border.none", radius: "radius.none", textColor: "text.primary", typography: "type.card-title" },
          layoutItem: { managed: true, grow: 1, span: 1 }
        }),
        node("recipe-fact-unit", "text", { x: 8, y: 146, width: 164, height: 26 }, {
          name: "Unidade opcional",
          props: { content: "kg", align: "center", verticalAlign: "center", scale: 80, overflow: "ellipsis", recipeRole: "unit" },
          style: { surface: "surface.paper", border: "border.none", radius: "radius.none", textColor: "text.muted", typography: "type.label" },
          layoutItem: { managed: true, grow: 0, span: 1 }
        })
      ]
    })
  });

  function install() {
    const current = window.CatalogSectionRecipes;
    if (!current?.list || !current?.get || !current?.register) return false;
    const existing = current.get("fact");
    if (existing && existing.version !== RECIPE_VERSION) throw new Error("A receita fact já existe com contrato incompatível.");
    return current.register(factRecipe, { order: 600 });
  }

  window.CatalogFactRecipeContract = Object.freeze({
    VERSION: CONTRACT_VERSION,
    RECIPE_VERSION,
    RECIPE: factRecipe,
    install
  });
})();
