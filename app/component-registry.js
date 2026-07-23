(function () {
  "use strict";

  const icon = (name, className) => window.CatalogEditorIcon(name, className);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const discreteScale = value => [80, 100, 120].includes(Number(value)) ? Number(value) : 100;

  const slotChildren = (component, slotName) => (component.children || []).filter(child => child.slot?.name === slotName);
  const hasSlot = (component, slotName, type = null) => slotChildren(component, slotName).some(child => !type || child.type === type);

  function headerRender(component) {
    return `
      <div class="component-header-shell" aria-label="Cabeçalho composto"></div>`;
  }

  function separatorRender(component) {
    const props = component.props || {};
    const thickness = Math.max(2, Math.min(8, Number(props.thickness) || 2));
    return `<div class="component-separator" data-orientation="${escapeHtml(props.orientation || "horizontal")}" data-cap="${escapeHtml(props.cap || "round")}" data-marker="${escapeHtml(props.marker || "none")}" data-preset="${escapeHtml(props.presetId || "subtle")}" style="--separator-thickness:${thickness}px;--separator-print-thickness:${thickness * .3}mm"><span></span></div>`;
  }

  const separatorPresets = Object.freeze({
    subtle: { id: "subtle", label: "Discreta", thickness: 2, cap: "round", marker: "none" },
    standard: { id: "standard", label: "Padrão", thickness: 2, cap: "square", marker: "none" },
    emphasis: { id: "emphasis", label: "Destaque", thickness: 4, cap: "round", marker: "none" },
    "solid-dot": { id: "solid-dot", label: "Bolinha sólida", thickness: 2, cap: "round", marker: "solid" },
    "outline-dot": { id: "outline-dot", label: "Bolinha contorno", thickness: 2, cap: "round", marker: "outline" }
  });

  function cardIsCompact(component) {
    const state = component.presentation?.responsiveState;
    if (state === "compact") return true;
    if (state === "wide") return false;
    return component.frame.width < 320;
  }

  function productCardRender(component) {
    const compact = cardIsCompact(component);
    const presentation = window.CatalogPresentations?.normalizePresentation?.(component.presentation, component.type) || { mode: "standard", density: "standard" };
    return `
      <div class="component-card-shell" data-responsive-state="${compact ? "compact" : "wide"}" data-presentation-mode="${escapeHtml(presentation.mode)}" data-presentation-density="${escapeHtml(presentation.density)}" aria-label="Contêiner de card de produto">
        <span class="component-card-shell__accent" aria-hidden="true"></span>
        <span class="component-card-shell__state">${compact ? "layout compacto" : "layout amplo"}</span>
      </div>`;
  }

  function layoutContainerRender(component) {
    const mode = window.CatalogLayoutEngine?.effectiveMode(component) || component.layout?.mode || "free";
    return `
      <div class="component-layout-shell" data-layout-mode="${escapeHtml(mode)}">
        <span class="component-layout-shell__mode">${escapeHtml(mode === "free" ? "livre" : mode === "row" ? "linha" : mode === "column" ? "coluna" : "grade")}</span>
        <span class="component-layout-shell__hint">Canvas interno para combinar componentes</span>
      </div>`;
  }

  function artGalleryRender(component) {
    const count = (component.children || []).filter(child => child.type === "art").length;
    return `<div class="component-art-gallery-shell" aria-label="Galeria de imagens com legendas individuais"><span>${escapeHtml(component.props.label || "GALERIA DE VARIAÇÕES")}</span><small>${count} imagem(ns)</small></div>`;
  }

  function footerRender(component) {
    return `<div class="component-footer-shell" aria-label="Rodapé composto"></div>`;
  }

  function footerItemRender(component) {
    return `<div class="component-footer-item" aria-label="Item de rodapé composto"></div>`;
  }

  function artRender(component) {
    const props = component.props || {};
    const linkedAssetId = props.assetId || "";
    const hasAsset = Boolean(linkedAssetId);
    const focalX = Math.max(0, Math.min(100, Number(props.focalX ?? 50)));
    const focalY = Math.max(0, Math.min(100, Number(props.focalY ?? 50)));
    const caption = String(props.caption || "").trim();
    const captionPosition = props.captionPosition === "overlay" ? "overlay" : "below";
    return `
      <figure class="component-art" data-art-role="${escapeHtml(props.role || "generic")}" data-has-asset="${String(hasAsset)}" data-has-caption="${String(Boolean(caption))}" data-caption-position="${captionPosition}">
        <div class="component-art__preview" data-asset-preview data-asset-id="${escapeHtml(linkedAssetId)}" data-asset-alt="${escapeHtml(props.alt || "")}" data-fit="${escapeHtml(props.fit || "contain")}" data-focal-x="${focalX}" data-focal-y="${focalY}" data-vector-mode="${escapeHtml(props.vectorMode || "original")}" style="--asset-focal-x:${focalX}%;--asset-focal-y:${focalY}%">
          <img data-asset-image alt="${escapeHtml(props.alt || "")}" />
          <span data-asset-vector aria-hidden="true"></span>
          <span class="component-art__missing">Arquivo não encontrado neste navegador</span>
        </div>
        <div class="component-art__meta">
          <strong>${escapeHtml(props.label)}</strong>
          <span>${escapeHtml(props.hint)}</span>
        </div>
        ${caption ? `<figcaption class="component-art__caption">${escapeHtml(caption)}</figcaption>` : ""}
        <button type="button" class="component-art__trigger" data-open-asset-library data-component-id="${escapeHtml(component.id)}" aria-label="${hasAsset ? "Substituir" : "Escolher"} arte"><span>${hasAsset ? "Substituir arte" : "Escolher arte"}</span></button>
      </figure>`;
  }

  function textRender(component) {
    const props = component.props || {};
    const align = ["start", "center", "end"].includes(props.align) ? props.align : "start";
    const verticalAlign = ["start", "center", "end"].includes(props.verticalAlign) ? props.verticalAlign : "center";
    const overflow = ["wrap", "ellipsis", "clip"].includes(props.overflow) ? props.overflow : "wrap";
    return `<div class="component-text" data-text-align="${align}" data-text-vertical="${verticalAlign}" data-text-overflow="${overflow}" style="--text-content-scale:${discreteScale(props.scale) / 100}"><p>${escapeHtml(props.content)}</p></div>`;
  }

  function iconRender(component) {
    return `<div class="component-icon" style="--icon-content-scale:${discreteScale(component.props?.iconScale) / 100}">${icon(component.props.icon || "shield-star", "component-icon__svg")}<span>${escapeHtml(component.props.label || "")}</span></div>`;
  }

  function titleSymbolRender(component) {
    return `
      <div class="component-title-symbol">
        <span class="component-title-symbol__number">${escapeHtml(component.props.number)}</span>
        <h3>${escapeHtml(component.props.title)}</h3>
      </div>`;
  }

  function specificationRender(component) {
    return `
      <div class="component-specification" style="--icon-content-scale:${discreteScale(component.props?.iconScale) / 100}">
        ${icon(component.props.icon || "shield-star", "component-specification__icon")}
        <span>${escapeHtml(component.props.label)}</span>
      </div>`;
  }

  function tableColumns(component) {
    return window.CatalogSource?.normalizeColumns?.(component.props?.columns) || [
      { key: "code", label: "Código", role: "identifier", align: "center", width: 1 },
      { key: "package", label: "Embalagem", role: "package", align: "center", width: 1.25 },
      { key: "price", label: "Preço", role: "price", align: "center", width: 1.15 }
    ];
  }

  function tableValues(row, fallback = {}, columns = []) {
    return window.CatalogSource?.normalizeRowValues?.(row?.metadata?.values || fallback, columns) || { ...(row?.metadata?.values || fallback) };
  }

  function legendFor(context, legendKey) {
    if (!legendKey) return null;
    const item = context.store?.getColorLegendByKey?.(legendKey)
      || (context.state?.collections || []).find(collection => collection.id === "colorLegends")?.items?.find(entry => entry.metadata?.key === legendKey);
    if (!item) return null;
    const token = item.metadata?.token || "surface.neutral";
    const color = window.CATALOG_EDITOR_TOKENS?.colors?.[token]?.value || "#f5f6f7";
    return { key: item.metadata?.key || legendKey, label: item.metadata?.textLabel || item.label || legendKey, color };
  }

  function legendPanelRender(component) {
    return `<section class="component-legend-panel"><header>${escapeHtml(component.props?.label || "LEGENDA")}</header></section>`;
  }

  function legendGroupRender(component) {
    return `<section class="component-legend-group" data-emphasized="${String(component.props?.emphasized === true)}"><header>${escapeHtml(component.props?.label || "Grupo")}</header></section>`;
  }

  function legendItemRender(component, context = {}) {
    const legend = legendFor(context, component.props?.legendKey);
    const label = component.props?.labelOverride || legend?.label || component.props?.legendKey || "Legenda sem vínculo";
    return `<div class="component-legend-item" data-legend-key="${escapeHtml(legend?.key || component.props?.legendKey || "")}" data-legend-state="${legend ? "linked" : "missing"}" style="--legend-item-color:${escapeHtml(legend?.color || "#f5f6f7")}"><span aria-hidden="true"></span><strong>${escapeHtml(label)}</strong></div>`;
  }

  function dataTableRender(component, context = {}) {
    const linkedRows = context.store?.getTableRows?.(component) || [];
    const rows = linkedRows.length ? linkedRows : [{ metadata: { values: component.props || {} } }];
    const columns = tableColumns(component);
    const grid = columns.map(column => `${column.width || 1}fr`).join(" ");
    return `
      <div class="component-data-table" style="--table-columns:${escapeHtml(grid)}">
        <div class="component-data-table__header">${columns.map(column => `<span data-column-role="${escapeHtml(column.role)}" data-cell-align="${escapeHtml(column.align)}">${escapeHtml(column.label)}</span>`).join("")}</div>
        <div class="component-data-table__body">
          ${rows.map(row => {
            const values = tableValues(row, component.props, columns);
            return `<div class="component-data-table__row" data-table-row-id="${escapeHtml(row.id || "legacy")}">
              ${columns.map(column => {
                const legend = legendFor(context, row.metadata?.legendKeys?.[column.key]);
                return `<strong data-column-role="${escapeHtml(column.role)}" data-cell-align="${escapeHtml(column.align)}" data-legend-key="${escapeHtml(legend?.key || "")}" ${legend ? `style="--cell-legend-color:${escapeHtml(legend.color)}" title="${escapeHtml(`Legenda: ${legend.label}`)}" aria-label="${escapeHtml(`${values[column.key] || "Sem valor"}; legenda ${legend.label}`)}"` : ""}><span>${escapeHtml(values[column.key])}</span>${legend ? `<small>${escapeHtml(legend.label)}</small>` : ""}</strong>`;
              }).join("")}
            </div>`;
          }).join("")}
        </div>
      </div>`;
  }

  function dataTableRowCount(component) {
    return Math.max(1, Array.isArray(component?.props?.rowIds) ? component.props.rowIds.length : 1);
  }

  function tableMetrics(component, density = component?.props?.density) {
    const compact = density === "compact";
    return { header: compact ? 16 : 20, row: compact ? 20 : 28 };
  }

  function tableSlotHeight(component) {
    const table = (component.children || []).find(child => child.slot?.name === "table" && child.type === "data-table");
    if (!table) return 0;
    const metrics = tableMetrics(table, component.presentation?.density || table.props?.density);
    const intrinsic = tableMetrics(table);
    const rows = dataTableRowCount(table);
    return Math.max(Number(table.constraints?.minHeight) || 0, metrics.header + rows * metrics.row, intrinsic.header + rows * intrinsic.row);
  }

  function artSlotMinimumHeight(component) {
    const gallery = (component.children || []).find(child => child.slot?.name === "art" && child.type === "art-gallery");
    if (!gallery) return 0;
    const count = Math.max(1, (gallery.children || []).filter(child => child.type === "art").length);
    const columns = Math.max(1, Math.min(Number(gallery.layout?.columns) || 3, count));
    const rows = Math.ceil(count / columns);
    const padding = Math.max(0, Number(gallery.layout?.padding) || 4);
    const gap = Math.max(0, Number(gallery.layout?.gap) || 6);
    const childMinimum = Math.max(44, ...(gallery.children || []).filter(child => child.type === "art").map(child => Number(child.constraints?.minHeight) || 44));
    return padding * 2 + rows * childMinimum + Math.max(0, rows - 1) * gap;
  }

  function headerContentLeft(component) {
    return hasSlot(component, "logo") ? 160 : 12;
  }

  function cardGeometry(component) {
    const compact = cardIsCompact(component);
    const dense = component.presentation?.density === "compact";
    const mode = ["hero", "technical", "variants", "data-only"].includes(component.presentation?.mode) ? component.presentation.mode : "standard";
    const titlePresent = hasSlot(component, "title");
    const artPresent = hasSlot(component, "art");
    const specificationsPresent = hasSlot(component, "specifications");
    const tableHeight = tableSlotHeight(component);
    const artMinimumHeight = artSlotMinimumHeight(component);
    const tablePresent = tableHeight > 0;
    const edge = dense ? 8 : 12;
    const titleHeight = titlePresent ? (mode === "hero" ? (dense ? 38 : 44) : mode === "technical" ? (dense ? 30 : 34) : (dense ? 32 : 38)) : 0;
    const titleGap = dense ? 8 : 10;
    const contentTop = titlePresent ? edge + titleHeight + titleGap : edge;
    const contentBottom = tablePresent ? component.frame.height - tableHeight - edge : component.frame.height - edge;
    const contentHeight = Math.max(60, contentBottom - contentTop);
    const fullWidth = Math.max(100, component.frame.width - edge * 2);
    let art = { x: edge, y: contentTop, width: fullWidth, height: contentHeight };
    let specifications = { x: edge, y: contentTop, width: fullWidth, height: contentHeight };

    if ((compact || mode === "variants") && artPresent && specificationsPresent) {
      const specsHeight = dense ? 42 : 60;
      const between = dense ? 6 : 14;
      const artHeight = Math.max(dense ? 60 : 72, artMinimumHeight, Math.min(dense ? 92 : 84, contentHeight - specsHeight - between));
      art = { x: edge, y: contentTop, width: fullWidth, height: artHeight };
      specifications = { x: edge, y: contentTop + artHeight + between, width: fullWidth, height: Math.max(specsHeight, contentBottom - contentTop - artHeight - between) };
    } else if (!compact && artPresent && specificationsPresent) {
      const availableWidth = Math.max(192, fullWidth - 10);
      const ratio = mode === "hero" ? .68 : mode === "technical" ? .42 : mode === "data-only" ? .34 : .6;
      const artWidth = Math.max(100, Math.min(availableWidth - 82, Math.round(availableWidth * ratio)));
      art = { x: edge, y: contentTop, width: artWidth, height: contentHeight };
      const specificationsX = art.x + art.width + 10;
      specifications = { x: specificationsX, y: contentTop, width: Math.max(82, component.frame.width - specificationsX - edge), height: contentHeight };
    }

    return {
      title: { x: edge, y: edge, width: Math.max(120, component.frame.width - edge * 2), height: titleHeight || (dense ? 32 : 38) },
      art,
      specifications,
      table: { x: edge, y: Math.max(contentTop, component.frame.height - tableHeight - edge), width: Math.max(120, component.frame.width - edge * 2), height: Math.max(32, tableHeight) }
    };
  }

  const headerSlots = [
    {
      name: "rule",
      label: "Linha editorial",
      capacity: 1,
      accepts: ["separator"],
      getFrame(component) {
        const x = headerContentLeft(component);
        return { x, y: Math.max(84, component.frame.height - 16), width: Math.max(230, component.frame.width - x - 12), height: 8 };
      }
    }, {
      name: "divider",
      label: "Divisor vertical",
      capacity: 1,
      accepts: ["separator"],
      getFrame(component) {
        const x = hasSlot(component, "logo") ? 148 : 0;
        return { x, y: 18, width: 8, height: Math.max(72, component.frame.height - 36) };
      }
    }, {
      name: "logo",
      label: "Logo",
      capacity: 1,
      accepts: ["art", "icon"],
      getFrame(component) {
        return { x: 12, y: 12, width: 132, height: Math.max(86, component.frame.height - 24) };
      }
    },
    {
      name: "kicker",
      label: "Sobretítulo",
      capacity: 1,
      accepts: ["text"],
      getFrame(component) {
        const x = headerContentLeft(component);
        const titlePresent = hasSlot(component, "title");
        const rulePresent = hasSlot(component, "rule");
        const bottom = rulePresent ? component.frame.height - 20 : component.frame.height - 12;
        return { x, y: 18, width: Math.max(230, component.frame.width - x - 12), height: titlePresent ? 34 : Math.max(34, bottom - 18) };
      }
    },
    {
      name: "title",
      label: "Título principal",
      capacity: 1,
      accepts: ["text", "title-symbol"],
      getFrame(component) {
        const x = headerContentLeft(component);
        const y = hasSlot(component, "kicker") ? 52 : 18;
        const bottom = hasSlot(component, "rule") ? component.frame.height - 20 : component.frame.height - 12;
        return { x, y, width: Math.max(230, component.frame.width - x - 12), height: Math.max(42, bottom - y) };
      }
    }
  ];

  const footerSlots = [{
    name: "items",
    label: "Itens do rodapé",
    capacity: 8,
    layout: "row",
    gap: 0,
    accepts: ["footer-item", "text", "icon"],
    getFrame(component) {
      return { x: 0, y: 3, width: component.frame.width, height: Math.max(60, component.frame.height - 3) };
    }
  }];

  function footerItemTextFrame(component, slotName) {
    const width = Math.max(1, Number(component?.frame?.width) || 80);
    const height = Math.max(1, Number(component?.frame?.height) || 64);
    const iconPresent = hasSlot(component, "icon");
    const titlePresent = hasSlot(component, "title");
    const subtitlePresent = hasSlot(component, "subtitle");
    const insetX = Math.min(4, Math.floor(width / 2));
    const top = Math.min(iconPresent ? 31 : 3, height);
    const bottomInset = Math.min(3, Math.max(0, height - top));
    const available = Math.max(0, height - top - bottomInset);
    const innerWidth = Math.max(1, width - insetX * 2);

    if (titlePresent && subtitlePresent) {
      const gap = available >= 30 ? 2 : available >= 12 ? 1 : 0;
      const usable = Math.max(0, available - gap);
      const titleHeight = usable >= 28
        ? Math.max(14, Math.min(usable - 14, Math.round(usable * .52)))
        : Math.ceil(usable / 2);
      const subtitleHeight = Math.max(0, usable - titleHeight);
      return slotName === "title"
        ? { x: insetX, y: top, width: innerWidth, height: titleHeight }
        : { x: insetX, y: top + titleHeight + gap, width: innerWidth, height: subtitleHeight };
    }

    const present = slotName === "title" ? titlePresent : subtitlePresent;
    return present
      ? { x: insetX, y: top, width: innerWidth, height: available }
      : { x: insetX, y: top, width: innerWidth, height: 0 };
  }

  const footerItemSlots = [{
    name: "icon",
    label: "Ícone",
    capacity: 1,
    accepts: ["icon"],
    getFrame(component) {
      const hasText = hasSlot(component, "title") || hasSlot(component, "subtitle");
      const size = 26;
      return { x: Math.max(0, Math.round((component.frame.width - size) / 2)), y: hasText ? 4 : Math.max(4, Math.round((component.frame.height - size) / 2)), width: size, height: size };
    }
  }, {
    name: "title",
    label: "Título",
    capacity: 1,
    accepts: ["text"],
    getFrame(component) { return footerItemTextFrame(component, "title"); }
  }, {
    name: "subtitle",
    label: "Complemento",
    capacity: 1,
    accepts: ["text"],
    getFrame(component) { return footerItemTextFrame(component, "subtitle"); }
  }];

  const cardSlots = [
    {
      name: "title",
      label: "Título",
      capacity: 1,
      accepts: ["title-symbol", "text"],
      getFrame(component) { return cardGeometry(component).title; }
    },
    {
      name: "art",
      label: "Arte",
      capacity: 1,
      accepts: ["art", "art-gallery"],
      getFrame(component) { return cardGeometry(component).art; }
    },
    {
      name: "specifications",
      label: "Especificações",
      capacity: 4,
      layout(component) {
        const count = slotChildren(component, "specifications").length;
        return cardIsCompact(component) || (component.presentation?.mode === "hero" && count > 2) ? "grid" : "column";
      },
      columns: 2,
      gap: 7,
      accepts: ["specification", "text", "icon"],
      getFrame(component) { return cardGeometry(component).specifications; }
    },
    {
      name: "table",
      label: "Tabela",
      capacity: 1,
      accepts: ["data-table", "text"],
      getFrame(component) { return cardGeometry(component).table; }
    }
  ];

  window.CATALOG_COMPONENT_REGISTRY = {
    "catalog-header": {
      label: "Cabeçalho",
      description: "Logo, sobretítulo, título e linha editorial.",
      icon: "header",
      category: "Estruturas",
      gridUnit: 4,
      minSize: { width: 420, height: 110 },
      defaultFrame: { width: 730, height: 150 },
      defaultProps: { kicker: "CATÁLOGO", title: "FIXAÇÃO E ACESSÓRIOS" },
      defaultStyle: { surface: "surface.paper", border: "border.none", radius: "radius.none", accentColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.display" },
      contentFields: [],
      styleFields: ["surface", "border", "radius", "accentColor", "textColor", "typography"],
      container: {
        label: "Conteúdo do cabeçalho",
        accepts: ["art", "icon", "text", "title-symbol", "separator"],
        slots: headerSlots
      },
      defaultChildren(component) {
        return [
          { type: "art", slot: "logo", props: { label: "LOGO", hint: "Escolha uma arte da biblioteca", role: "logo", fit: "contain", assetId: null, alt: "Logo do catálogo", focalX: 50, focalY: 50, vectorMode: "original", caption: "", captionPosition: "below" }, style: { surface: "surface.paper", border: "border.none", radius: "radius.none" } },
          { type: "text", slot: "kicker", props: { content: component.props.kicker || "CATÁLOGO" }, style: { surface: "surface.paper", border: "border.none", radius: "radius.none", textColor: "brand.primary", typography: "type.label" } },
          { type: "text", slot: "title", props: { content: component.props.title || "FIXAÇÃO E ACESSÓRIOS" }, style: { surface: "surface.paper", border: "border.none", radius: "radius.none", textColor: "text.primary", typography: "type.display" } },
          { type: "separator", slot: "rule", props: { orientation: "horizontal", cap: "round", marker: "outline" }, style: { accentColor: "brand.primary" } },
          { type: "separator", slot: "divider", props: { orientation: "vertical", cap: "square", marker: "none" }, style: { accentColor: "brand.primary" } }
        ];
      },
      render: headerRender
    },
    "layout-container": {
      label: "Área de composição",
      description: "Canvas interno com layout livre, linha, coluna ou grade.",
      icon: "page",
      category: "Estruturas",
      gridUnit: 4,
      minSize: { width: 160, height: 120 },
      defaultFrame: { width: 360, height: 300 },
      defaultProps: { label: "ÁREA DE COMPOSIÇÃO" },
      defaultStyle: { surface: "surface.paper", border: "border.default", radius: "radius.medium", accentColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.label" },
      defaultLayout: { mode: "row", padding: 12, gap: 12, columns: 2, align: "stretch", distribution: "fill", responsive: { enabled: true, breakpoint: 300, mode: "column" } },
      contentFields: [{ path: "label", label: "Identificação", type: "text", full: true }],
      styleFields: ["surface", "border", "radius", "accentColor", "textColor"],
      container: {
        label: "Área de composição",
        autoLayout: true,
        accepts: ["layout-container", "art-gallery", "legend-panel", "catalog-header", "product-card", "catalog-footer", "art", "icon", "text", "title-symbol", "specification", "data-table", "separator"],
        slots: []
      },
      render: layoutContainerRender
    },
    "art-gallery": {
      label: "Galeria de imagens",
      description: "Composição ordenável com uma legenda vinculada a cada imagem.",
      icon: "art",
      category: "Estruturas",
      gridUnit: 2,
      minSize: { width: 150, height: 96 },
      defaultFrame: { width: 260, height: 150 },
      defaultProps: { label: "GALERIA DE VARIAÇÕES" },
      defaultStyle: { surface: "surface.paper", border: "border.default", radius: "radius.medium", accentColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.label" },
      defaultLayout: { mode: "grid", padding: 4, gap: 6, columns: 3, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 150, mode: "grid" } },
      contentFields: [{ path: "label", label: "Identificação", type: "text", full: true }],
      styleFields: ["surface", "border", "radius", "accentColor", "textColor"],
      container: {
        label: "Imagens da galeria",
        autoLayout: true,
        accepts: ["art"],
        slots: []
      },
      defaultChildren: [
        { type: "art", constraints: { minWidth: 44, minHeight: 44 }, props: { label: "VARIAÇÃO 1", hint: "Escolha a primeira imagem", role: "product", fit: "contain", assetId: null, alt: "", focalX: 50, focalY: 50, vectorMode: "original", caption: "Variação 1", captionPosition: "below", galleryItem: true }, layoutItem: { managed: true, grow: 1, span: 1 } },
        { type: "art", constraints: { minWidth: 44, minHeight: 44 }, props: { label: "VARIAÇÃO 2", hint: "Escolha a segunda imagem", role: "product", fit: "contain", assetId: null, alt: "", focalX: 50, focalY: 50, vectorMode: "original", caption: "Variação 2", captionPosition: "below", galleryItem: true }, layoutItem: { managed: true, grow: 1, span: 1 } },
        { type: "art", constraints: { minWidth: 44, minHeight: 44 }, props: { label: "VARIAÇÃO 3", hint: "Escolha a terceira imagem", role: "product", fit: "contain", assetId: null, alt: "", focalX: 50, focalY: 50, vectorMode: "original", caption: "Variação 3", captionPosition: "below", galleryItem: true }, layoutItem: { managed: true, grow: 1, span: 1 } }
      ],
      render: artGalleryRender
    },
    "legend-panel": {
      label: "Painel de legenda",
      description: "Contêiner visual de grupos e itens vinculados a definições semânticas.",
      icon: "layers",
      category: "Estruturas",
      gridUnit: 2,
      minSize: { width: 180, height: 54 },
      defaultFrame: { width: 360, height: 92 },
      defaultProps: { label: "LEGENDA" },
      defaultStyle: { surface: "surface.paper", border: "border.default", radius: "radius.small", accentColor: "brand.primary", textColor: "text.primary", typography: "type.label" },
      defaultLayout: { mode: "column", padding: 8, gap: 6, columns: 1, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 180, mode: "column" } },
      contentFields: [{ path: "label", label: "Título", type: "text", full: true }],
      styleFields: ["surface", "border", "radius", "accentColor", "textColor", "typography"],
      container: { label: "Grupos da legenda", autoLayout: true, accepts: ["legend-group", "legend-item"], slots: [] },
      defaultChildren: [{ type: "legend-group", props: { groupId: "geral", label: "Geral", emphasized: false }, layoutItem: { managed: true, grow: 1, span: 1 } }],
      render: legendPanelRender
    },
    "legend-group": {
      label: "Grupo de legenda",
      description: "Subgrupo ordenável e destacável de itens de legenda.",
      icon: "layers",
      category: "Peças internas",
      gridUnit: 2,
      minSize: { width: 140, height: 38 },
      defaultFrame: { width: 320, height: 54 },
      defaultProps: { groupId: "geral", label: "Geral", emphasized: false },
      defaultStyle: { surface: "surface.paper", border: "border.none", radius: "radius.small", accentColor: "brand.primary", textColor: "text.primary", typography: "type.caption" },
      defaultLayout: { mode: "row", padding: 4, gap: 6, columns: 4, align: "stretch", distribution: "fill", responsive: { enabled: true, breakpoint: 190, mode: "column" } },
      contentFields: [
        { path: "label", label: "Nome do grupo", type: "text", full: true },
        { path: "groupId", label: "Chave do grupo", type: "text", full: true },
        { path: "emphasized", label: "Destacar grupo", type: "checkbox", full: true }
      ],
      styleFields: ["surface", "border", "radius", "accentColor", "textColor", "typography"],
      container: { label: "Itens da legenda", autoLayout: true, accepts: ["legend-item"], slots: [] },
      render: legendGroupRender
    },
    "legend-item": {
      label: "Item de legenda",
      description: "Representação visual vinculada a uma definição por legendKey.",
      icon: "layers",
      category: "Peças internas",
      gridUnit: 2,
      minSize: { width: 72, height: 24 },
      defaultFrame: { width: 96, height: 30 },
      defaultProps: { legendKey: "", labelOverride: "" },
      defaultStyle: { surface: "surface.paper", border: "border.default", radius: "radius.small", textColor: "text.primary", typography: "type.caption" },
      contentFields: [
        { path: "legendKey", label: "Chave vinculada", type: "text", full: true },
        { path: "labelOverride", label: "Rótulo local opcional", type: "text", full: true }
      ],
      styleFields: ["surface", "border", "radius", "textColor", "typography"],
      render: legendItemRender
    },
    "product-card": {
      label: "Card de produto",
      description: "Contêiner com slots internos editáveis.",
      icon: "card",
      category: "Estruturas",
      gridUnit: 4,
      minSize: { width: 220, height: 190 },
      recommendedSize: { width: 270, height: 220 },
      defaultFrame: { width: 350, height: 260 },
      defaultProps: { number: "01", title: "NOVO PRODUTO", specOne: "Alta resistência", specTwo: "Material", code: "0000", package: "PCT 100 UNID.", price: "R$ 0,00" },
      defaultStyle: { surface: "surface.paper", border: "border.default", radius: "radius.medium", accentColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.card-title" },
      measureMinimum(component, proposedFrame) {
        const compact = component.presentation?.responsiveState === "compact" || (component.presentation?.responsiveState !== "wide" && Number(proposedFrame?.width || component.frame.width) < 320);
        const tableHeight = tableSlotHeight(component);
        const dense = component.presentation?.density === "compact";
        const galleryHeight = artSlotMinimumHeight(component);
        const specificationsPresent = hasSlot(component, "specifications");
        if (compact && dense && galleryHeight > 0 && !specificationsPresent) return { width: 220, height: 48 + galleryHeight + 6 + tableHeight + 8 };
        const galleryExtra = Math.max(0, galleryHeight - (dense ? 92 : 84));
        if (compact && dense) return { width: 220, height: 170 + tableHeight + galleryExtra };
        return { width: 220, height: compact ? 210 + tableHeight + galleryExtra : Math.max(220, 174 + tableHeight) };
      },
      responsiveRules: [
        { label: "Compacto", maxWidth: 319, description: "Arte em largura total e especificações em grade de duas colunas." },
        { label: "Amplo", minWidth: 320, description: "Arte à esquerda e especificações em coluna." }
      ],
      contentFields: [],
      styleFields: ["surface", "border", "radius", "accentColor", "textColor"],
      container: {
        label: "Conteúdo do card",
        accepts: ["title-symbol", "art", "art-gallery", "specification", "data-table", "text", "icon"],
        slots: cardSlots
      },
      defaultChildren(component) {
        return [
          { type: "title-symbol", slot: "title", props: { number: component.props.number || "01", title: component.props.title || "NOVO PRODUTO" } },
          { type: "art", slot: "art", props: { label: "ARTE DO PRODUTO", hint: "Foto, render, SVG ou desenho técnico", role: "product", fit: "contain", assetId: null, alt: "", focalX: 50, focalY: 50, vectorMode: "original", caption: "", captionPosition: "below" } },
          { type: "specification", slot: "specifications", props: { icon: "shield-star", label: component.props.specOne || "Alta resistência" } },
          { type: "specification", slot: "specifications", props: { icon: "layers", label: component.props.specTwo || "Material" } },
          { type: "data-table", slot: "table", props: { collectionId: "tableRows", rowIds: [], columns: window.CatalogSource?.DEFAULT_TABLE_COLUMNS || [], code: component.props.code || "0000", package: component.props.package || "PCT 100 UNID.", price: component.props.price || "R$ 0,00" } }
        ];
      },
      render: productCardRender
    },
    "catalog-footer": {
      label: "Rodapé",
      description: "Contatos, benefícios e identificação da página.",
      icon: "footer",
      category: "Estruturas",
      gridUnit: 4,
      minSize: { width: 500, height: 80 },
      defaultFrame: { width: 746, height: 100 },
      defaultProps: { store: "Top Mobili Ferragens", city: "Canoas · RS", phone: "51 98977-6262", pageLabel: "Página 01", updatedAt: "Atualizado em 2026" },
      defaultStyle: { surface: "surface.paper", border: "border.default", radius: "radius.none", accentColor: "brand.primary", vectorColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.label" },
      contentFields: [],
      styleFields: ["surface", "border", "radius", "accentColor", "vectorColor", "textColor"],
      container: {
        label: "Itens do rodapé",
        accepts: ["footer-item", "text", "icon"],
        slots: footerSlots
      },
      defaultChildren(component) {
        return [
          { type: "footer-item", slot: "items", props: { icon: "location", title: component.props.store || "Top Mobili Ferragens", subtitle: component.props.city || "Canoas · RS" } },
          { type: "footer-item", slot: "items", props: { icon: "whatsapp", title: component.props.phone || "51 98977-6262", subtitle: "Atendimento via WhatsApp" } },
          { type: "footer-item", slot: "items", props: { icon: "shield-star", title: "Qualidade", subtitle: "" } },
          { type: "footer-item", slot: "items", props: { icon: "truck", title: "Entrega", subtitle: "" } },
          { type: "footer-item", slot: "items", props: { icon: "headset", title: "Atendimento", subtitle: "" } },
          { type: "footer-item", slot: "items", props: { icon: "calendar", title: component.props.pageLabel || "Página 01", subtitle: component.props.updatedAt || "Atualizado em 2026" } }
        ];
      },
      render: footerRender
    },
    art: {
      label: "Arte / logo",
      description: "Imagem, SVG, render ou logotipo reutilizável da biblioteca.",
      icon: "art",
      category: "Elementos",
      gridUnit: 2,
      minSize: { width: 80, height: 60 },
      defaultFrame: { width: 210, height: 160 },
      defaultProps: { label: "ÁREA DE ARTE", hint: "Logo, foto, render, SVG ou desenho técnico", role: "generic", fit: "contain", assetId: null, alt: "", focalX: 50, focalY: 50, vectorMode: "original", caption: "", captionPosition: "below" },
      defaultStyle: { surface: "surface.neutral", border: "border.default", radius: "radius.medium", accentColor: "brand.primary", vectorColor: "brand.primary", textColor: "text.strong", mutedColor: "text.muted", typography: "type.card-title" },
      contentFields: [
        { path: "label", label: "Identificação", type: "text", full: true },
        { path: "hint", label: "Descrição", type: "textarea", full: true },
        { path: "role", label: "Função", type: "select", options: [{ value: "generic", label: "Arte genérica" }, { value: "logo", label: "Logo" }, { value: "product", label: "Produto" }, { value: "technical", label: "Desenho técnico" }] },
        { path: "fit", label: "Ajuste", type: "token-select", tokenGroup: "artFits" },
        { path: "focalX", label: "Foco horizontal (%)", type: "number", min: 0, max: 100, step: 1 },
        { path: "focalY", label: "Foco vertical (%)", type: "number", min: 0, max: 100, step: 1 },
        { path: "vectorMode", label: "Cor de SVG", type: "select", options: [{ value: "original", label: "Cores originais" }, { value: "token", label: "Token do componente" }] },
        { path: "alt", label: "Texto alternativo", type: "text", full: true },
        { path: "caption", label: "Legenda vinculada", type: "textarea", full: true },
        { path: "captionPosition", label: "Posição da legenda", type: "select", options: [{ value: "below", label: "Faixa inferior" }, { value: "overlay", label: "Sobre a arte" }] }
      ],
      styleFields: ["surface", "border", "radius", "accentColor", "vectorColor", "textColor"],
      render: artRender
    },
    separator: {
      label: "Linha separadora",
      description: "Átomo de linha horizontal ou vertical com terminação editorial.",
      icon: "minus",
      category: "Elementos",
      gridUnit: 4,
      minThickness: 2,
      minSize: { width: 8, height: 8 },
      defaultFrame: { width: 220, height: 8 },
      defaultProps: { orientation: "horizontal", cap: "round", marker: "none", thickness: 2, presetId: "subtle" },
      defaultStyle: { accentColor: "brand.primary" },
      contentFields: [
        { path: "presetId", label: "Preset", type: "select", options: Object.values(separatorPresets).map(item => ({ value: item.id, label: item.label })) },
        { path: "orientation", label: "Orientação", type: "select", options: [{ value: "horizontal", label: "Horizontal" }, { value: "vertical", label: "Vertical" }] },
        { path: "cap", label: "Ponta", type: "select", options: [{ value: "square", label: "Reta" }, { value: "round", label: "Arredondada" }] },
        { path: "marker", label: "Marcador", type: "select", options: [{ value: "none", label: "Nenhum" }, { value: "solid", label: "Bolinha sólida" }, { value: "outline", label: "Bolinha contorno" }] },
        { path: "thickness", label: "Espessura", type: "number", min: 2, max: 8, step: 1 }
      ],
      styleFields: ["accentColor"],
      render: separatorRender
    },
    icon: {
      label: "Ícone",
      description: "Átomo SVG com grid mínimo de 1 px.",
      icon: "shield-star",
      category: "Elementos",
      gridUnit: 1,
      minSize: { width: 24, height: 24 },
      defaultFrame: { width: 56, height: 56 },
      defaultProps: { icon: "shield-star", label: "", iconScale: 100 },
      defaultStyle: { surface: "surface.paper", border: "border.none", radius: "radius.none", accentColor: "brand.primary", vectorColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.caption" },
      contentFields: [
        { path: "icon", label: "Ícone", type: "icon-select", full: true },
        { path: "label", label: "Legenda", type: "text", full: true },
        { path: "iconScale", label: "Escala do ícone", type: "select", options: [{ value: 100, label: "100% · padrão" }, { value: 80, label: "80% · discreto" }, { value: 120, label: "120% · destaque" }] }
      ],
      styleFields: ["surface", "border", "radius", "accentColor", "vectorColor", "textColor", "typography"],
      render: iconRender
    },
    text: {
      label: "Texto",
      description: "Bloco de texto com estilo tipográfico da biblioteca.",
      icon: "text",
      category: "Elementos",
      gridUnit: 2,
      minSize: { width: 80, height: 34 },
      defaultFrame: { width: 260, height: 80 },
      defaultProps: { content: "Digite o conteúdo do texto no painel lateral.", align: "start", verticalAlign: "center", scale: 100, overflow: "wrap" },
      defaultStyle: { surface: "surface.paper", border: "border.none", radius: "radius.none", accentColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.body" },
      contentFields: [
        { path: "content", label: "Conteúdo", type: "textarea", full: true },
        { path: "align", label: "Alinhamento", type: "select", options: [{ value: "start", label: "Início" }, { value: "center", label: "Centro" }, { value: "end", label: "Fim" }] },
        { path: "verticalAlign", label: "Alinhamento vertical", type: "select", options: [{ value: "center", label: "Meio" }, { value: "start", label: "Topo" }, { value: "end", label: "Base" }] },
        { path: "scale", label: "Escala tipográfica", type: "select", options: [{ value: 100, label: "100% · padrão" }, { value: 80, label: "80% · discreta" }, { value: 120, label: "120% · destaque" }] },
        { path: "overflow", label: "Excedente", type: "select", options: [{ value: "wrap", label: "Quebrar linhas" }, { value: "ellipsis", label: "Uma linha com reticências" }, { value: "clip", label: "Cortar na caixa" }] }
      ],
      styleFields: ["surface", "border", "radius", "textColor", "typography"],
      render: textRender
    },
    "title-symbol": {
      label: "Título com símbolo",
      description: "Número ou símbolo seguido de título editorial.",
      icon: "text",
      category: "Peças internas",
      gridUnit: 2,
      minSize: { width: 140, height: 32 },
      defaultFrame: { width: 260, height: 38 },
      defaultProps: { number: "01", title: "NOVO PRODUTO" },
      defaultStyle: { surface: "surface.paper", border: "border.none", radius: "radius.none", accentColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.card-title" },
      contentFields: [
        { path: "number", label: "Número", type: "text" },
        { path: "title", label: "Título", type: "text", full: true }
      ],
      styleFields: ["surface", "border", "radius", "accentColor", "textColor", "typography"],
      render: titleSymbolRender
    },
    specification: {
      label: "Especificação",
      description: "Ícone e informação técnica curta.",
      icon: "shield-star",
      category: "Peças internas",
      gridUnit: 1,
      minSize: { width: 82, height: 28 },
      defaultFrame: { width: 130, height: 38 },
      defaultProps: { icon: "shield-star", label: "Alta resistência", iconScale: 100 },
      defaultStyle: { surface: "surface.paper", border: "border.none", radius: "radius.none", accentColor: "brand.primary", vectorColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.label" },
      contentFields: [
        { path: "icon", label: "Ícone", type: "icon-select", full: true },
        { path: "label", label: "Especificação", type: "text", full: true },
        { path: "iconScale", label: "Escala do ícone", type: "select", options: [{ value: 100, label: "100% · padrão" }, { value: 80, label: "80% · discreto" }, { value: 120, label: "120% · destaque" }] }
      ],
      styleFields: ["surface", "border", "radius", "accentColor", "vectorColor", "textColor", "typography"],
      render: specificationRender
    },
    "footer-item": {
      label: "Item do rodapé",
      description: "Molécula composta por átomos editáveis de ícone e texto.",
      icon: "footer",
      category: "Peças internas",
      gridUnit: 1,
      minSize: { width: 80, height: 64 },
      recommendedSize: { width: 112, height: 96 },
      defaultFrame: { width: 112, height: 96 },
      defaultProps: { icon: "shield-star", title: "Novo item", subtitle: "" },
      defaultStyle: { surface: "surface.paper", border: "border.none", radius: "radius.none", accentColor: "brand.primary", vectorColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.label" },
      contentFields: [],
      styleFields: ["surface", "border", "radius"],
      container: {
        label: "Conteúdo do item de rodapé",
        accepts: ["icon", "text"],
        slots: footerItemSlots
      },
      defaultChildren(component) {
        return [
          { type: "icon", slot: "icon", props: { icon: component.props.icon || "shield-star", label: "" }, style: { surface: "surface.paper", border: "border.none", radius: "radius.none", accentColor: component.style.accentColor || "brand.primary", vectorColor: component.style.vectorColor || component.style.accentColor || "brand.primary", textColor: component.style.textColor || "text.primary", typography: "type.caption" } },
          { type: "text", slot: "title", constraints: { minWidth: 40, minHeight: 14 }, props: { content: component.props.title || "Novo item" }, style: { surface: "surface.paper", border: "border.none", radius: "radius.none", textColor: component.style.textColor || "text.primary", typography: component.style.typography || "type.label" } },
          { type: "text", slot: "subtitle", constraints: { minWidth: 40, minHeight: 14 }, props: { content: component.props.subtitle || "" }, style: { surface: "surface.paper", border: "border.none", radius: "radius.none", textColor: component.style.mutedColor || "text.muted", typography: "type.caption" } }
        ];
      },
      render: footerItemRender
    },
    "data-table": {
      label: "Tabela de dados",
      description: "Colunas semânticas, valores e legendas por célula.",
      icon: "card",
      category: "Peças internas",
      gridUnit: 2,
      minSize: { width: 180, height: 32 },
      defaultFrame: { width: 300, height: 48 },
      defaultProps: { collectionId: "tableRows", rowIds: [], columns: window.CatalogSource?.DEFAULT_TABLE_COLUMNS || [], code: "0000", package: "PCT 100 UNID.", price: "R$ 0,00" },
      measureMinimum(component) {
        const metrics = tableMetrics(component);
        return { width: component.props?.density === "compact" ? 180 : 180, height: metrics.header + dataTableRowCount(component) * metrics.row };
      },
      defaultStyle: { surface: "surface.paper", border: "border.default", radius: "radius.small", accentColor: "brand.primary", textColor: "text.primary", mutedColor: "text.muted", typography: "type.table-value" },
      contentFields: [],
      styleFields: ["surface", "border", "radius", "accentColor", "textColor", "typography"],
      render: dataTableRender
    }
  };
  window.CATALOG_SEPARATOR_PRESETS = separatorPresets;
})();
