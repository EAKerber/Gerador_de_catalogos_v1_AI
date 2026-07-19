(function () {
  "use strict";

  const VERSION = "1.0.0";
  const FIXED_TIMESTAMP = "2000-01-01T00:00:00.000Z";
  const clone = value => JSON.parse(JSON.stringify(value));

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (!value || typeof value !== "object") return value;
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableValue(value[key]);
      return result;
    }, {});
  }

  function stableJSON(value) {
    return JSON.stringify(stableValue(value));
  }

  function digest(value) {
    const input = stableJSON(value);
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function key(value, fallback = "item") {
    return window.CatalogSource?.key?.(value, fallback) || String(value || fallback).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function issue(severity, code, message, details = {}) {
    return { severity, code, message, scope: "compiler", ...details };
  }

  function validateSource(source) {
    const issues = [];
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      issues.push(issue("error", "SOURCE_TYPE", "O CatalogSource precisa ser um objeto JSON."));
      return { ok: false, issues };
    }
    if (source.sourceFormat !== "CatalogSource") issues.push(issue("error", "SOURCE_FORMAT", "O arquivo não usa sourceFormat CatalogSource."));
    if (!["1.0.0", window.CatalogSource?.VERSION].includes(source.sourceVersion)) issues.push(issue("error", "SOURCE_VERSION", `A versão ${source.sourceVersion || "não informada"} não é suportada; esperado 1.0.0 ou ${window.CatalogSource?.VERSION || "1.1.0"}.`));
    if (!source.catalog || typeof source.catalog !== "object") issues.push(issue("error", "SOURCE_CATALOG", "O CatalogSource precisa informar catalog."));
    if (!Array.isArray(source.products) || !source.products.length) issues.push(issue("error", "SOURCE_PRODUCTS", "O CatalogSource precisa conter ao menos um produto."));
    const ids = new Set();
    (source.products || []).forEach((product, index) => {
      const path = `products[${index}]`;
      if (!product || typeof product !== "object") {
        issues.push(issue("error", "SOURCE_PRODUCT_TYPE", `${path} não é um produto válido.`));
        return;
      }
      const id = String(product.id || "");
      if (!id) issues.push(issue("error", "SOURCE_PRODUCT_ID", `${path} não possui ID.`));
      else if (ids.has(id)) issues.push(issue("error", "SOURCE_PRODUCT_ID_DUPLICATE", `O produto “${id}” está duplicado.`));
      else ids.add(id);
      if (!product.values || typeof product.values !== "object") issues.push(issue("error", "SOURCE_PRODUCT_VALUES", `O produto “${id || index + 1}” não possui values.`));
      if (!String(product.values?.title || product.label || "").trim()) issues.push(issue("error", "SOURCE_PRODUCT_TITLE", `O produto “${id || index + 1}” não possui título.`));
    });
    return { ok: !issues.some(item => item.severity === "error"), issues };
  }

  function productItem(product) {
    const values = {
      title: String(product.values?.title || product.label || "Produto"),
      specOne: String(product.values?.specOne || product.highlights?.[0]?.label || product.attributes?.[0]?.label || ""),
      specTwo: String(product.values?.specTwo || product.highlights?.[1]?.label || product.attributes?.[1]?.label || ""),
      code: String(product.values?.code || ""),
      package: String(product.values?.package || ""),
      price: String(product.values?.price || ""),
      assetId: product.values?.assetId || product.assetRoles?.main || null
    };
    const metadata = window.CatalogSource.normalizeProductMetadata(product, values);
    metadata.values = values;
    metadata.commercialRows = commercialRows(product);
    metadata.tableColumns = window.CatalogSource.normalizeColumns(product.tableColumns || product.commercialColumns);
    return { id: String(product.id), label: String(product.label || values.title), metadata, reference: null };
  }

  function commercialRows(product) {
    const source = Array.isArray(product.commercialRows) && product.commercialRows.length
      ? product.commercialRows
      : [product.values || {}];
    return source.slice(0, 12).map((row, index) => ({
      id: String(row?.id || `commercial-row-${index + 1}`),
      variantId: row?.variantId ? String(row.variantId) : null,
      values: { ...(row?.values || row || {}) },
      legendKeys: { ...(row?.legendKeys || {}) }
    }));
  }

  function findChild(component, type, slot = null) {
    return (component?.children || []).find(child => child.type === type && (!slot || child.slot?.name === slot)) || null;
  }

  function applySemanticSpecifications(store, card, product, limit) {
    const candidates = [...(product.highlights || []), ...(product.attributes || []), ...(product.applications || [])]
      .map(entry => ({ label: String(entry.label || entry.value || "").trim(), icon: entry.icon || "shield-star" }))
      .filter(entry => entry.label)
      .filter((entry, index, list) => list.findIndex(item => item.label.toLowerCase() === entry.label.toLowerCase()) === index)
      .slice(0, limit);
    if (!candidates.length) return;
    const existing = (card.children || []).filter(child => child.type === "specification" && child.slot?.name === "specifications");
    candidates.forEach((entry, index) => {
      if (existing[index]) store.updateComponent(existing[index].id, { props: { label: entry.label, icon: entry.icon } });
      else store.addComponent("specification", { x: 0, y: 0, width: 100, height: 28 }, {
        parentId: card.id,
        slotName: "specifications",
        props: { label: entry.label, icon: entry.icon }
      });
    });
  }

  function applyTable(store, card, product, density) {
    const table = findChild(card, "data-table", "table");
    if (!table) return;
    const columns = window.CatalogSource.normalizeColumns(product.tableColumns || product.commercialColumns);
    store.updateTableColumns(table.id, columns);
    store.updateComponent(table.id, { props: { density } });
    const rows = commercialRows(product);
    const first = store.getTableRows(table)[0];
    if (first) {
      store.updateTableRow(table.id, first.id, rows[0].values);
      first.metadata.legendKeys = { ...rows[0].legendKeys };
      first.metadata.sourceRowId = rows[0].id;
      first.metadata.variantId = rows[0].variantId;
    }
    rows.slice(1).forEach(row => {
      const created = store.addTableRow(table.id, row.values);
      created.metadata.legendKeys = { ...row.legendKeys };
      created.metadata.sourceRowId = row.id;
      created.metadata.variantId = row.variantId;
    });
  }

  function applyGallery(store, card, product) {
    const entries = [];
    (product.variants || []).forEach(variant => entries.push({ label: variant.label, assetId: variant.assetIds?.[0] || null, variantId: variant.id }));
    (product.assetRoles?.gallery || []).forEach((assetId, index) => {
      if (!entries.some(entry => entry.assetId === assetId)) entries.push({ label: `Variação ${index + 1}`, assetId });
    });
    if (entries.length < 2) return false;
    const art = (card.children || []).find(child => child.slot?.name === "art");
    if (art) store.deleteComponent(art.id);
    const gallery = store.addComponent("art-gallery", { x: 0, y: 0, width: card.frame.width - 24, height: 90 }, {
      parentId: card.id,
      slotName: "art",
      constraints: { minWidth: 120, minHeight: 60 },
      props: { label: "VARIAÇÕES" }
    });
    store.updateComponent(gallery.id, { layout: { columns: Math.min(5, entries.length), gap: 4, padding: 2 } });
    const items = (gallery.children || []).filter(child => child.type === "art");
    entries.slice(0, 5).forEach((entry, index) => {
      let item = items[index];
      if (!item) item = store.addComponent("art", { x: 0, y: 0, width: 40, height: 60 }, { parentId: gallery.id, constraints: { minWidth: 40, minHeight: 40 } });
      store.updateComponent(item.id, { constraints: { minWidth: 40, minHeight: 40 }, props: {
        label: String(entry.label || `Variação ${index + 1}`).toUpperCase(),
        caption: String(entry.label || `Variação ${index + 1}`),
        role: "product",
        assetId: entry.assetId || null,
        variantId: entry.variantId || null,
        semanticBinding: entry.variantId ? "variant" : null
      } });
    });
    items.slice(entries.length).forEach(item => store.deleteComponent(item.id));
    return true;
  }

  function updateHeader(store, header, plan) {
    const kicker = (header.children || []).find(child => child.type === "text" && child.slot?.name === "kicker");
    const title = (header.children || []).find(child => child.type === "text" && child.slot?.name === "title");
    const logo = (header.children || []).find(child => child.slot?.name === "logo");
    if (kicker) store.updateComponent(kicker.id, { props: { content: plan.header.kicker } });
    if (title) store.updateComponent(title.id, { props: { content: plan.header.title } });
    if (logo && plan.header.logoAssetId) store.updateComponent(logo.id, { props: { assetId: plan.header.logoAssetId } });
  }

  function canonicalize(document, source, plan, decisions, repairs) {
    const signature = digest({ source, plan });
    const idMap = new Map();
    const used = new Set();
    const unique = base => {
      let candidate = key(base, "component");
      let suffix = 2;
      while (used.has(candidate)) candidate = `${key(base, "component")}-${suffix++}`;
      used.add(candidate);
      return candidate;
    };
    document.id = String(source.catalog?.id || `catalog-${signature}`);
    document.title = String(source.catalog?.title || "Catálogo");
    document.createdAt = source.catalog?.createdAt || FIXED_TIMESTAMP;
    document.updatedAt = document.createdAt;
    document.activePageId = "page-1";
    document.pages.forEach((page, pageIndex) => {
      page.id = `page-${pageIndex + 1}`;
      page.name = `Página ${String(pageIndex + 1).padStart(2, "0")}`;
      const visit = (children, parentId) => (children || []).forEach((component, index) => {
        const oldId = component.id;
        const semantic = component.type === "product-card" && component.binding?.productId
          ? `card-${String(index + 1).padStart(2, "0")}-${component.binding.productId}`
          : `${parentId}-${component.type}-${String(index + 1).padStart(2, "0")}`;
        component.id = unique(semantic);
        idMap.set(oldId, component.id);
        visit(component.children, component.id);
      });
      visit(page.children, page.id);
    });
    const remapRefs = children => (children || []).forEach(component => {
      for (const ref of ["beforeId", "afterId"]) if (component.props?.[ref] && idMap.has(component.props[ref])) component.props[ref] = idMap.get(component.props[ref]);
      remapRefs(component.children);
    });
    document.pages.forEach(page => remapRefs(page.children));

    const rowCollection = (document.collections || []).find(item => item.id === "tableRows");
    const oldRows = new Map((rowCollection?.items || []).map(item => [item.id, item]));
    const nextRows = [];
    const usedRows = new Set();
    document.pages.forEach(page => {
      const visit = children => (children || []).forEach(component => {
        if (component.type === "data-table") {
          const card = component.binding?.productId || component.id.split("-data-table-")[0];
          component.props.rowIds = (component.props.rowIds || []).map((oldId, index) => {
            const nextId = unique(`row-${card}-${index + 1}`);
            const row = oldRows.get(oldId);
            if (row && !usedRows.has(oldId)) nextRows.push({ ...row, id: nextId, label: `${component.name || "Tabela"} · linha ${index + 1}` });
            usedRows.add(oldId);
            return nextId;
          });
        }
        visit(component.children);
      });
      visit(page.children);
    });
    if (rowCollection) rowCollection.items = nextRows;
    document.numbering.cardNext = (source.products?.length || 0) + 1;
    if (document.editor) {
      document.editor.selectedComponentId = null;
      document.editor.selectedComponentIds = [];
      document.editor.editingContextId = null;
    }
    document.generation = {
      compilerVersion: VERSION,
      sourceVersion: source.sourceVersion,
      planVersion: plan.planVersion,
      sourceDigest: digest(source),
      planDigest: digest(plan),
      strategy: plan.strategy,
      plan: clone(plan),
      decisions: clone(decisions),
      repairs: clone(repairs)
    };
    return document;
  }

  function compile(source, inputPlan = null, options = {}) {
    const sourceValidation = validateSource(source);
    const planValidation = window.CatalogGenerationPlan.validate(source, inputPlan || {});
    const preliminaryIssues = [...sourceValidation.issues, ...planValidation.issues];
    if (preliminaryIssues.some(item => item.severity === "error")) {
      return {
        ok: false,
        kind: "source",
        sourceVersion: source?.sourceVersion || "não informada",
        targetVersion: window.CATALOG_SCHEMA_VERSION,
        document: null,
        plan: null,
        summary: { pages: 0, components: 0, products: source?.products?.length || 0, templates: 0, assets: 0, tableRows: 0 },
        issues: preliminaryIssues
      };
    }

    const plan = window.CatalogGenerationPlan.normalize(source, inputPlan || {});
    const gridProducts = plan.products.filter(item => item.role === "grid");
    const rows = Math.ceil(gridProducts.length / plan.layout.columns);
    if (rows > plan.layout.maxGridRows) {
      preliminaryIssues.push(issue(plan.policies.overflow === "warn" ? "warning" : "error", "GRID_CAPACITY_EXCEEDED", `O plano exige ${rows} linhas de cards, acima do limite ${plan.layout.maxGridRows} desta página.`, { rows, maxRows: plan.layout.maxGridRows }));
    }
    if (preliminaryIssues.some(item => item.severity === "error")) {
      return {
        ok: false,
        kind: "source",
        sourceVersion: source.sourceVersion,
        targetVersion: window.CATALOG_SCHEMA_VERSION,
        document: null,
        plan,
        summary: { pages: 0, components: 0, products: source.products.length, templates: 0, assets: 0, tableRows: 0 },
        issues: preliminaryIssues
      };
    }

    const decisions = [];
    if (!inputPlan) decisions.push({ code: "DEFAULT_PLAN", message: "Plano hero-grid padrão escolhido porque nenhum plano editorial foi fornecido." });
    const blank = window.createBlankCatalogDocument();
    blank.schemaVersion = window.CATALOG_SCHEMA_VERSION;
    blank.title = String(source.catalog?.title || "Catálogo");
    blank.pages[0].children = [];
    const products = blank.collections.find(item => item.id === "products");
    products.items = source.products.map(productItem);
    const legends = blank.collections.find(item => item.id === "colorLegends");
    legends.items = window.CatalogSource.normalizeLegendDefinitions(source.legends || []).map((legend, index) => window.CatalogCollections.normalizeItem(legends, {
      id: `color-legend-${legend.key}`,
      label: legend.label,
      metadata: { key: legend.key, token: legend.token, textLabel: legend.label, fallback: legend.fallback, groupId: legend.groupId, groupLabel: legend.groupLabel, groupOrder: legend.groupOrder, order: legend.order, emphasized: legend.emphasized },
      reference: null
    }, index));
    const store = new window.CatalogDocumentStore(blank);
    const page = store.getPage();
    const margin = plan.page.safeMargin;
    const gap = plan.layout.gap;
    const innerWidth = page.size.width - margin * 2;
    const hasVisualLegends = (source.legends || []).length > 0;
    const compiledHeaderHeight = plan.layout.headerHeight;
    const compiledFooterHeight = plan.layout.footerHeight;
    let cursorY = margin;

    if (plan.header.enabled) {
      const header = store.addComponent("catalog-header", { x: margin, y: cursorY, width: innerWidth, height: compiledHeaderHeight }, {
        props: { kicker: plan.header.kicker, title: plan.header.title }
      });
      updateHeader(store, header, plan);
      cursorY += header.frame.height + gap;
    }

    const productById = new Map(source.products.map(product => [String(product.id), product]));
    const directiveById = new Map(plan.products.map(item => [item.productId, item]));
    const createCard = (productId, frame, role) => {
      const product = productById.get(productId);
      const directive = directiveById.get(productId);
      const hasMainAsset = Boolean(product.assetRoles?.main || product.values?.assetId);
      let presetId = directive.presetId;
      if (role === "hero" && presetId === "product-standard" && hasMainAsset) presetId = "product-hero";
      if (role === "hero" && presetId === "product-hero" && !hasMainAsset) {
        presetId = "product-standard";
        decisions.push({ code: "HERO_ASSET_FALLBACK", productId, message: "Destaque preservado com placeholder porque não há asset principal." });
      }
      const card = store.addComponent("product-card", frame, {
        props: { number: String(plan.productOrder.indexOf(productId) + 1).padStart(2, "0") },
        presentation: { presetId, mode: role === "hero" ? "hero" : directive.mode, density: directive.density, responsiveState: "auto" }
      });
      store.bindProduct(card.id, productId);
      store.setComponentPresentation(card.id, { presetId, mode: role === "hero" ? "hero" : directive.mode, density: directive.density, responsiveState: "auto" });
      applySemanticSpecifications(store, card, product, role === "hero" ? 4 : 2);
      if (directive.mode === "variants" || presetId === "product-variants") applyGallery(store, card, product);
      applyTable(store, card, product, directive.density);
      store.updateComponent(card.id, { frame });
      return card;
    };

    if (plan.heroProductId) {
      const hero = createCard(plan.heroProductId, { x: margin, y: cursorY, width: innerWidth, height: plan.layout.heroHeight }, "hero");
      cursorY += hero.frame.height + gap;
    }

    const footerY = plan.footer.enabled ? page.size.height - margin - compiledFooterHeight : page.size.height - margin;
    const materializeVisualLegends = hasVisualLegends && !(plan.strategy === "grid-only" && rows >= 3);
    if (hasVisualLegends && !materializeVisualLegends) decisions.push({ code: "LEGEND_DEFERRED_CAPACITY", message: "As definições semânticas foram preservadas, mas o painel visual foi adiado para respeitar os mínimos técnicos desta página." });
    const legendGroups = new Set((source.legends || []).map(item => item.groupId || item.groupLabel || "geral")).size;
    const legendHeight = materializeVisualLegends ? Math.min(150, 12 + Math.max(1, legendGroups) * 42) : 0;
    const gridBottom = footerY - (plan.footer.enabled ? gap : 0) - (legendHeight ? legendHeight + gap : 0);
    const gridHeight = Math.max(0, gridBottom - cursorY);
    const gridRows = Math.max(1, rows);
    const verticalGridGap = legendHeight ? Math.max(0, gap - 12) : gap;
    const rowHeight = Math.floor((gridHeight - verticalGridGap * Math.max(0, gridRows - 1)) / gridRows);
    const columnWidth = Math.floor((innerWidth - gap * Math.max(0, plan.layout.columns - 1)) / plan.layout.columns);
    gridProducts.forEach((directive, index) => {
      const column = index % plan.layout.columns;
      const row = Math.floor(index / plan.layout.columns);
      const x = margin + column * (columnWidth + gap);
      const y = cursorY + row * (rowHeight + verticalGridGap);
      const width = column === plan.layout.columns - 1 ? page.size.width - margin - x : columnWidth;
      createCard(directive.productId, { x, y, width, height: rowHeight }, "grid");
    });

    if (legendHeight) {
      const legendPanel = store.addComponent("legend-panel", { x: margin, y: gridBottom + gap + 2, width: innerWidth, height: legendHeight }, { props: { label: "LEGENDA" } });
      (source.legends || []).slice().sort((left, right) => (left.groupOrder || 0) - (right.groupOrder || 0) || (left.order || 0) - (right.order || 0)).forEach(legend => {
        store.materializeLegendDefinition(legend.key, { panelId: legendPanel.id, groupId: legend.groupId, groupLabel: legend.groupLabel });
      });
    }

    if (plan.footer.enabled) {
      store.addComponent("catalog-footer", { x: margin, y: footerY, width: innerWidth, height: compiledFooterHeight }, {
        props: {
          store: plan.footer.store,
          city: plan.footer.city,
          phone: plan.footer.phone,
          pageLabel: "Página 01",
          updatedAt: plan.footer.updatedAt
        }
      });
    }

    let document = store.getExportDocument();
    let repairs = [];
    if (plan.policies.safeRepair) {
      const repaired = window.CatalogDocumentValidator.repair(document);
      document = repaired.document;
      repairs = repaired.repairs;
    }
    canonicalize(document, source, plan, decisions, repairs);
    const validation = window.CatalogDocumentValidator.validate(document, { target: options.target || "draft" });
    const issues = [...preliminaryIssues, ...validation.issues];
    const summary = {
      pages: document.pages.length,
      components: validation.summary.components,
      products: source.products.length,
      templates: 0,
      assets: document.collections.find(item => item.id === "assets")?.items.length || 0,
      tableRows: document.collections.find(item => item.id === "tableRows")?.items.length || 0,
      collisions: validation.summary.collisions,
      overflows: validation.summary.overflows,
      actionsRequired: 3
    };
    return {
      ok: !issues.some(item => item.severity === "error"),
      kind: "source",
      compilerVersion: VERSION,
      sourceVersion: source.sourceVersion,
      targetVersion: window.CATALOG_SCHEMA_VERSION,
      document,
      plan,
      report: validation,
      decisions,
      repairs,
      summary,
      issues
    };
  }

  window.CatalogCompiler = Object.freeze({ VERSION, compile, validateSource, stableJSON, digest });
})();
