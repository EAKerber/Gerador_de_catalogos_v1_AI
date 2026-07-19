(function () {
  "use strict";

  const VERSION = "1.2.0";
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
    ...(options.slot ? { slot: clone(options.slot) } : {}),
    structureInitialized: options.structureInitialized === true,
    children: clone(options.children || [])
  });

  const pageScaffold = node("recipe-page-root", "layout-container", { x: 0, y: 0, width: 746, height: 1075 }, {
    name: "Página de catálogo",
    props: { label: "ESTRUTURA DA PÁGINA" },
    style: { surface: "surface.paper", border: "border.none", radius: "radius.none" },
    layout: { mode: "free", padding: 0, gap: 12, columns: 1, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 300, mode: "column" } },
    children: [
      node("recipe-page-header", "catalog-header", { x: 0, y: 0, width: 746, height: 150 }, {
        name: "Cabeçalho do catálogo",
        props: { kicker: "CATÁLOGO", title: "FIXAÇÃO E ACESSÓRIOS", recipeRole: "header" }
      }),
      node("recipe-page-content", "layout-container", { x: 0, y: 162, width: 746, height: 801 }, {
        name: "Conteúdo principal",
        props: { label: "CONTEÚDO PRINCIPAL", recipeRole: "primary-content" },
        style: { surface: "surface.paper", border: "border.none", radius: "radius.none" },
        layout: { mode: "grid", padding: 8, gap: 12, columns: 3, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 300, mode: "grid" } }
      }),
      node("recipe-page-footer", "catalog-footer", { x: 0, y: 975, width: 746, height: 100 }, {
        name: "Rodapé do catálogo",
        props: { recipeRole: "footer" }
      })
    ]
  });

  const applicationStrip = node("recipe-applications-root", "layout-container", { x: 0, y: 0, width: 500, height: 88 }, {
    name: "Faixa de aplicações",
    props: { label: "APLICAÇÕES" },
    layout: { mode: "row", padding: 8, gap: 8, columns: 3, align: "stretch", distribution: "fill", responsive: { enabled: true, breakpoint: 360, mode: "column" } },
    children: [
      node("recipe-application-1", "specification", { x: 8, y: 8, width: 156, height: 72 }, { props: { icon: "cabinet", label: "ARMÁRIOS" } }),
      node("recipe-application-2", "specification", { x: 172, y: 8, width: 156, height: 72 }, { props: { icon: "hanger", label: "CLOSETS" } }),
      node("recipe-application-3", "specification", { x: 336, y: 8, width: 156, height: 72 }, { props: { icon: "kitchen", label: "COZINHAS" } })
    ]
  });

  const packagingLegend = node("recipe-legend-root", "layout-container", { x: 0, y: 0, width: 620, height: 72 }, {
    name: "Legenda de embalagens",
    props: { label: "LEGENDA DE EMBALAGENS" },
    layout: { mode: "row", padding: 8, gap: 6, columns: 5, align: "stretch", distribution: "fill", responsive: { enabled: true, breakpoint: 420, mode: "column" } },
    children: [
      node("recipe-legend-title", "text", { x: 8, y: 8, width: 116, height: 56 }, { props: { content: "LEGENDA DE EMBALAGENS" }, style: { surface: "surface.paper", border: "border.none", radius: "radius.none", textColor: "text.primary", typography: "type.label" } }),
      node("recipe-legend-1000", "text", { x: 130, y: 8, width: 116, height: 56 }, { props: { content: "CX 1000" }, style: { surface: "surface.pack-1000", border: "border.none", radius: "radius.small", textColor: "text.primary", typography: "type.label" } }),
      node("recipe-legend-300", "text", { x: 252, y: 8, width: 116, height: 56 }, { props: { content: "CX 300" }, style: { surface: "surface.pack-300", border: "border.none", radius: "radius.small", textColor: "text.primary", typography: "type.label" } }),
      node("recipe-legend-100", "text", { x: 374, y: 8, width: 116, height: 56 }, { props: { content: "CX 100" }, style: { surface: "surface.pack-100", border: "border.none", radius: "radius.small", textColor: "text.primary", typography: "type.label" } }),
      node("recipe-legend-pct", "text", { x: 496, y: 8, width: 116, height: 56 }, { props: { content: "PCT" }, style: { surface: "surface.pack-pct", border: "border.none", radius: "radius.small", textColor: "text.primary", typography: "type.label" } })
    ]
  });

  const tipCallout = node("recipe-tip-root", "layout-container", { x: 0, y: 0, width: 330, height: 120 }, {
    name: "Chamada de dica",
    props: { label: "DICA" },
    style: { surface: "surface.paper", border: "border.default", radius: "radius.medium", accentColor: "brand.primary" },
    layout: { mode: "row", padding: 10, gap: 8, columns: 2, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 180, mode: "column" } },
    children: [
      node("recipe-tip-icon", "icon", { x: 10, y: 10, width: 54, height: 100 }, { props: { icon: "bulb", label: "" }, style: { surface: "surface.paper", border: "border.none", radius: "radius.none", accentColor: "brand.primary", vectorColor: "brand.primary", textColor: "text.primary", typography: "type.caption" }, layoutItem: { managed: true, grow: 0, span: 1 } }),
      node("recipe-tip-copy", "layout-container", { x: 72, y: 10, width: 248, height: 100 }, {
        name: "Textos da dica",
        props: { label: "CONTEÚDO DA DICA" },
        style: { surface: "surface.paper", border: "border.none", radius: "radius.none" },
        layout: { mode: "column", padding: 0, gap: 4, columns: 1, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 120, mode: "column" } },
        layoutItem: { managed: true, grow: 1, span: 1 },
        children: [
          node("recipe-tip-title", "text", { x: 0, y: 0, width: 248, height: 36 }, { props: { content: "DICA DO CATÁLOGO" }, style: { surface: "surface.paper", border: "border.none", radius: "radius.none", textColor: "text.primary", typography: "type.card-title" }, layoutItem: { managed: true, grow: 0, span: 1 } }),
          node("recipe-tip-body", "text", { x: 0, y: 40, width: 248, height: 60 }, { props: { content: "Edite esta chamada com uma orientação útil para o cliente." }, style: { surface: "surface.paper", border: "border.none", radius: "radius.none", textColor: "text.primary", typography: "type.body" }, layoutItem: { managed: true, grow: 1, span: 1 } })
        ]
      })
    ]
  });

  const heroGridStrip = node("recipe-hero-grid-strip-root", "layout-container", { x: 0, y: 0, width: 746, height: 800 }, {
    name: "Hero, grade e faixa",
    props: { label: "HERO + GRADE + FAIXA", recipeRole: "product-composition" },
    style: { surface: "surface.paper", border: "border.none", radius: "radius.none" },
    layout: { mode: "free", padding: 0, gap: 12, columns: 1, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 300, mode: "column" } },
    children: [
      node("recipe-hero-region", "layout-container", { x: 0, y: 0, width: 746, height: 280 }, {
        name: "Produto em destaque",
        props: { label: "PRODUTO EM DESTAQUE", recipeRole: "hero" },
        style: { surface: "surface.paper", border: "border.none", radius: "radius.none" },
        layout: { mode: "grid", padding: 0, gap: 0, columns: 1, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 300, mode: "grid" } }
      }),
      node("recipe-grid-region", "layout-container", { x: 0, y: 292, width: 746, height: 400 }, {
        name: "Grade de produtos",
        props: { label: "GRADE DE PRODUTOS", recipeRole: "grid" },
        style: { surface: "surface.paper", border: "border.none", radius: "radius.none" },
        layout: { mode: "grid", padding: 0, gap: 12, columns: 3, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 300, mode: "grid" } }
      }),
      node("recipe-strip-region", "layout-container", { x: 0, y: 704, width: 746, height: 88 }, {
        name: "Faixa complementar",
        props: { label: "FAIXA COMPLEMENTAR", recipeRole: "strip" },
        style: { surface: "surface.paper", border: "border.none", radius: "radius.none" },
        layout: { mode: "row", padding: 0, gap: 8, columns: 3, align: "stretch", distribution: "fill", responsive: { enabled: true, breakpoint: 360, mode: "column" } },
        children: clone(applicationStrip.children)
      })
    ]
  });

  const recipes = Object.freeze({
    "page-catalog-base": Object.freeze({
      id: "page-catalog-base",
      version: VERSION,
      label: "Página de catálogo",
      description: "Cabeçalho, conteúdo principal e rodapé prontos para preencher.",
      icon: "page",
      contexts: ["page"],
      focusRole: "primary-content",
      component: pageScaffold
    }),
    "section-applications": Object.freeze({
      id: "section-applications",
      version: VERSION,
      label: "Faixa de aplicações",
      description: "Três aplicações com ícones e textos editáveis.",
      icon: "application",
      contexts: ["page", "layout-container"],
      component: applicationStrip
    }),
    "section-packaging-legend": Object.freeze({
      id: "section-packaging-legend",
      version: VERSION,
      label: "Legenda de embalagens",
      description: "Faixa cromática pronta para adaptar às embalagens do projeto.",
      icon: "palette",
      contexts: ["page", "layout-container"],
      component: packagingLegend
    }),
    "section-tip-callout": Object.freeze({
      id: "section-tip-callout",
      version: VERSION,
      label: "Chamada de dica",
      description: "Ícone, título e texto em uma composição editável.",
      icon: "bulb",
      contexts: ["page", "layout-container"],
      component: tipCallout
    }),
    "section-hero-grid-strip": Object.freeze({
      id: "section-hero-grid-strip",
      version: VERSION,
      label: "Hero + grade + faixa",
      description: "Um destaque, uma grade de produtos e uma faixa complementar editável.",
      icon: "page",
      contexts: ["page", "layout-container"],
      focusRole: "grid",
      component: heroGridStrip
    })
  });

  function list() {
    return Object.values(recipes).map(clone);
  }

  function get(recipeId) {
    return recipes[recipeId] ? clone(recipes[recipeId]) : null;
  }

  window.CATALOG_SECTION_RECIPES = recipes;
  window.CatalogSectionRecipes = { VERSION, list, get };
})();
