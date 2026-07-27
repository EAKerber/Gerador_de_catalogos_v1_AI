(function () {
  "use strict";

  const STORAGE_KEY = "catalogo-v1-editor-document";
  const SCHEMA_VERSION = "1.16.0";
  const HISTORY_LIMIT = 100;
  const HISTORY_COALESCE_MS = 700;
  const PRODUCT_FIELDS = ["title", "specOne", "specTwo", "code", "package", "price", "assetId"];
  const TABLE_BINDING_FIELDS = Object.freeze(["code", "package", "price"]);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const EPHEMERAL_CHANGE_TYPES = new Set(["init", "selection", "editing-context", "editor-setting", "document-saved", "history-undo", "history-redo"]);
  const GEOMETRY_PLAN_DRAFT = Symbol("geometry-plan-draft");
  const SPACING_PLAN_DRAFT = Symbol("spacing-plan-draft");
  const GEOMETRY_EPSILON = 1;
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

  function normalizeLegacyFooterAlignment(source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) return source;
    const next = clone(source);
    const visit = (component, parent = null) => {
      if (!component || typeof component !== "object") return;
      if (component.type === "text" && parent?.type === "footer-item") {
        component.props ||= {};
        const explicit = component.props.alignExplicit === true;
        if (!explicit && (!hasOwn(component.props, "align") || component.props.align === "start")) {
          component.props.align = "center";
        }
        if (!hasOwn(component.props, "alignExplicit")) component.props.alignExplicit = false;
      }
      (component.children || []).forEach(child => visit(child, component));
    };
    (next.pages || []).forEach(page => (page.children || []).forEach(component => visit(component)));
    return next;
  }

  const footerDefaultOverflow = component => component?.slot?.name === "subtitle" ? "wrap" : "ellipsis";

  function normalizeLegacyFooterOverflow(source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) return source;
    const next = clone(source);
    const visit = (component, parent = null) => {
      if (!component || typeof component !== "object") return;
      if (component.type === "text" && parent?.type === "footer-item") {
        component.props ||= {};
        const explicit = component.props.overflowExplicit === true;
        if (!explicit) component.props.overflow = footerDefaultOverflow(component);
        if (!hasOwn(component.props, "overflowExplicit")) component.props.overflowExplicit = false;
      }
      (component.children || []).forEach(child => visit(child, component));
    };
    (next.pages || []).forEach(page => (page.children || []).forEach(component => visit(component)));
    return next;
  }

  function normalizeLegacyTextPresentation(source) {
    return normalizeLegacyFooterOverflow(normalizeLegacyFooterAlignment(source));
  }

  function documentSnapshot(state) {
    const snapshot = clone(state);
    delete snapshot.editor;
    delete snapshot.updatedAt;
    return snapshot;
  }

  function snapshotSignature(snapshot) {
    return JSON.stringify(snapshot);
  }

  function historyCoalesceKey(change) {
    if (change?.type === "table-row-updated") {
      return `table:${change.componentId}:${change.rowId}:${Object.keys(change.patch || {}).sort().join(",")}`;
    }
    if (change?.type !== "component-updated") return null;
    const patch = change.patch || {};
    if (patch.name !== undefined) return `component:${change.componentId}:name`;
    if (patch.props) return `component:${change.componentId}:props:${Object.keys(patch.props).sort().join(",")}`;
    return null;
  }

  function historyLabel(change) {
    const labels = {
      "component-added": "Adicionar componente",
      "component-updated": "Editar componente",
      "component-deleted": "Excluir componente",
      "component-duplicated": "Duplicar componente",
      "component-duplicated-series": "Distribuir cópias",
      "component-template-saved": "Salvar componente",
      "component-template-inserted": "Inserir componente salvo",
      "section-recipe-inserted": "Inserir estrutura pronta",
      "art-converted-to-gallery": "Criar galeria da arte",
      "gallery-items-bulk-applied": "Editar galeria em lote",
      "component-template-removed": "Excluir componente salvo",
      "product-created": "Adicionar produto",
      "product-bulk-created": "Adicionar produtos em lote",
      "product-updated": "Editar produto",
      "product-variant-added": "Adicionar variação",
      "product-variant-updated": "Editar variação",
      "product-variant-removed": "Excluir variação",
      "product-removed": "Excluir produto",
      "product-bound": "Vincular produto",
      "product-unbound": "Desvincular produto",
      "product-template-applied": "Aplicar apresentação",
      "product-cards-created": "Criar cards da seleção",
      "hero-grid-strip-created": "Criar hero, grade e faixa",
      "table-row-added": "Adicionar linha",
      "table-rows-replaced": "Colar linhas da tabela",
      "table-schema-applied": "Aplicar esquema da tabela",
      "table-schema-batch-applied": "Aplicar esquema às tabelas",
      "table-row-updated": "Editar linha",
      "table-row-removed": "Excluir linha",
      "table-columns-updated": "Editar colunas da tabela",
      "color-legend-upserted": "Editar legenda semântica",
      "legend-materialized": "Materializar legenda",
      "color-legends-bulk-applied": "Criar legendas em lote",
      "color-legend-removed": "Excluir legenda semântica",
      "component-presentation-updated": "Editar apresentação",
      "components-aligned": "Alinhar seleção",
      "components-distributed": "Distribuir seleção",
      "components-transformed": "Transformar seleção",
      "component-frames-bulk-applied": "Aplicar geometria da seleção",
      "components-spaced": "Ajustar espaçamento",
      "components-presentation-updated": "Editar apresentação da seleção",
      "components-style-updated": "Editar estilo da seleção",
      "components-duplicated": "Duplicar seleção",
      "components-deleted": "Excluir seleção",
      "component-minimum-updated": "Editar tamanho recomendado",
      "document-replaced": "Importar documento",
      "document-imported": "Importar documento",
      "document-compiled": "Gerar catálogo por dados",
      "package-imported": "Importar pacote portátil",
      "document-reset": "Novo documento"
    };
    return labels[change?.type] || "Editar documento";
  }

  function compareVersions(left, right) {
    const parse = value => String(value || "0.0.0").split(".").map(part => Number(part) || 0).slice(0, 3);
    const a = parse(left);
    const b = parse(right);
    for (let index = 0; index < 3; index += 1) {
      if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) - (b[index] || 0);
    }
    return 0;
  }

  function id(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function registry() {
    return window.CATALOG_COMPONENT_REGISTRY || {};
  }

  function defaultCollections() {
    return window.CatalogCollections?.createDefaults?.() || [];
  }

  function createBlankDocument() {
    return {
      schemaVersion: SCHEMA_VERSION,
      id: id("document"),
      title: "Catálogo sem título",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activePageId: "page-1",
      collections: defaultCollections(),
      numbering: { cardNext: 1 },
      editor: {
        zoom: 0.7,
        zoomMode: "fit",
        leftPanelCollapsed: false,
        rightPanelCollapsed: false,
        gridVisible: true,
        snapEnabled: true,
        smartSnapEnabled: true,
        equalSpacingEnabled: true,
        showGuides: true,
        snapTolerance: 6,
        selectedComponentId: null,
        selectedComponentIds: [],
        editingContextId: null
      },
      pages: [{
        id: "page-1",
        type: "page",
        name: "Página 01",
        size: { preset: "A4", orientation: "portrait", width: 794, height: 1123, unit: "px", printWidth: "210mm", printHeight: "297mm" },
        grid: { unit: 4, majorEvery: 4, safeMargin: 24 },
        children: []
      }]
    };
  }

  function definitionFor(type) {
    return registry()[type] || null;
  }

  function slotDefinition(parent, slotName) {
    const definition = definitionFor(parent?.type);
    return definition?.container?.slots?.find(slot => slot.name === slotName) || null;
  }

  function slotFrame(parent, slotName) {
    const slot = slotDefinition(parent, slotName);
    if (!slot) return null;
    const frame = typeof slot.getFrame === "function" ? slot.getFrame(parent) : slot.frame;
    return frame ? { ...frame } : null;
  }

  function normalizedSlotSpan(value, capacity = 1) {
    return Math.max(1, Math.min(Math.max(1, Number(capacity) || 1), Math.round(Number(value) || 1)));
  }

  function slotSpan(component, slot) {
    return normalizedSlotSpan(component?.slot?.span, slot?.capacity || 1);
  }

  function slotUsage(children, slotName, slot, excludingId = null) {
    return (children || [])
      .filter(child => child.id !== excludingId && child.slot?.name === slotName)
      .reduce((total, child) => total + slotSpan(child, slot), 0);
  }

  function normalizedReflow(definition, source) {
    if (!definition?.container) return null;
    let mode = "auto";
    if (source?.mode === "manual") mode = "manual";
    return { mode };
  }

  function usesAutoReflow(component) {
    const definition = definitionFor(component?.type);
    return Boolean(definition?.container && component?.reflow?.mode !== "manual");
  }

  function defaultChildDescriptors(parent) {
    const definition = definitionFor(parent?.type);
    if (!definition?.defaultChildren) return [];
    return typeof definition.defaultChildren === "function" ? definition.defaultChildren(parent) : definition.defaultChildren;
  }

  function missingDefaultChildren(parent) {
    const descriptors = defaultChildDescriptors(parent);
    const seen = new Set();
    return descriptors.filter(descriptor => {
      const slot = slotDefinition(parent, descriptor.slot);
      if (!slot || slotUsage(parent.children, descriptor.slot, slot) >= slot.capacity) return false;
      const key = `${descriptor.slot}:${descriptor.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return !(parent.children || []).some(child => child.slot?.name === descriptor.slot && child.type === descriptor.type);
    });
  }

  function contextualSeparatorState(parent) {
    const definition = definitionFor(parent?.type);
    const separatorDefinition = definitionFor("separator");
    const mode = window.CatalogLayoutEngine?.effectiveMode(parent) || parent?.layout?.mode;
    const minimumThickness = Math.max(1, Number(separatorDefinition?.minThickness) || 2);
    const threshold = minimumThickness * 3;
    const gap = Math.max(0, Number(parent?.layout?.gap) || 0);
    const items = (parent?.children || []).filter(child => !child.slot?.name && child.layoutItem?.managed !== false && child.layoutItem?.overlay !== true);
    const separators = (parent?.children || []).filter(child => child.type === "separator" && child.props?.contextual === true);
    const pairs = [];
    for (let index = 0; index < items.length - 1; index += 1) {
      const before = items[index];
      const after = items[index + 1];
      const occupied = separators.some(separator => separator.props?.beforeId === before.id && separator.props?.afterId === after.id);
      if (!occupied) pairs.push({ before, after });
    }
    return {
      eligible: Boolean(definition?.container?.autoLayout && (mode === "row" || mode === "column") && gap > threshold && pairs.length),
      gap,
      threshold,
      mode,
      pairs
    };
  }

  function createNode(type, frame, options = {}) {
    const definition = definitionFor(type);
    if (!definition) throw new Error(`Tipo de componente desconhecido: ${type}`);
    const node = {
      id: id(type),
      type,
      name: options.name || definition.label,
      frame: {
        x: Math.round(frame?.x ?? 24),
        y: Math.round(frame?.y ?? 24),
        width: Math.round(frame?.width ?? definition.defaultFrame.width),
        height: Math.round(frame?.height ?? definition.defaultFrame.height)
      },
      constraints: {
        minWidth: definition.minSize.width,
        minHeight: definition.minSize.height,
        minimums: {
          technical: { width: definition.minSize.width, height: definition.minSize.height },
          recommended: { width: definition.recommendedSize?.width || definition.defaultFrame.width, height: definition.recommendedSize?.height || definition.defaultFrame.height },
          custom: null
        },
        gridUnit: definition.gridUnit,
        snapX: true,
        snapY: true,
        freeX: false,
        freeY: false,
        ...clone(options.constraints || {})
      },
      props: { ...clone(definition.defaultProps), ...clone(options.props || {}) },
      style: { ...clone(definition.defaultStyle), ...clone(options.style || {}) },
      layout: definition.container?.autoLayout ? { ...clone(definition.defaultLayout || {}), ...clone(options.layout || {}) } : null,
      layoutItem: options.layoutItem ? { managed: true, grow: 1, span: 1, ...clone(options.layoutItem) } : null,
      reflow: normalizedReflow(definition, options.reflow),
      slot: options.slot ? { name: options.slot, order: options.order ?? 0, managed: options.managed !== false, span: normalizedSlotSpan(options.slotSpan, options.slotCapacity) } : null,
      structureInitialized: false,
      children: []
    };
    if (type === "product-card") {
      node.binding = normalizeProductBinding(options.binding);
      node.presentation = window.CatalogPresentations?.normalizePresentation?.(options.presentation, type) || null;
    }
    return node;
  }

  function normalizeProductBinding(source = {}) {
    const overrides = {};
    PRODUCT_FIELDS.forEach(field => { overrides[field] = source?.overrides?.[field] === true; });
    return {
      productId: source?.productId ? String(source.productId) : null,
      templateId: source?.templateId ? String(source.templateId) : null,
      overrides
    };
  }

  function normalizeNode(node) {
    const definition = definitionFor(node.type);
    if (!definition) return node;
    node.id ||= id(node.type);
    node.name ||= definition.label;
    node.frame = { ...definition.defaultFrame, x: 24, y: 24, ...(node.frame || {}) };
    const sourceConstraints = node.constraints || {};
    const sourceMinimums = sourceConstraints.minimums || {};
    node.constraints = {
      minWidth: definition.minSize.width,
      minHeight: definition.minSize.height,
      gridUnit: definition.gridUnit,
      snapX: true,
      snapY: true,
      freeX: false,
      freeY: false,
      ...sourceConstraints,
      minimums: {
        technical: { width: definition.minSize.width, height: definition.minSize.height, ...(sourceMinimums.technical || {}) },
        recommended: { width: definition.recommendedSize?.width || definition.defaultFrame.width, height: definition.recommendedSize?.height || definition.defaultFrame.height, ...(sourceMinimums.recommended || {}) },
        custom: sourceMinimums.custom && typeof sourceMinimums.custom === "object" ? {
          width: Math.max(1, Number(sourceMinimums.custom.width) || definition.defaultFrame.width),
          height: Math.max(1, Number(sourceMinimums.custom.height) || definition.defaultFrame.height)
        } : null
      }
    };
    node.props = { ...clone(definition.defaultProps), ...(node.props || {}) };
    node.style = { ...clone(definition.defaultStyle), ...(node.style || {}) };
    node.layout = definition.container?.autoLayout ? { ...clone(definition.defaultLayout || {}), ...(node.layout || {}) } : null;
    node.layoutItem = node.layoutItem ? { managed: true, grow: 1, span: 1, ...node.layoutItem } : null;
    node.reflow = normalizedReflow(definition, node.reflow);
    node.slot = node.slot ? { ...node.slot, span: normalizedSlotSpan(node.slot.span, 24) } : null;
    node.structureInitialized = node.structureInitialized === true;
    node.children = Array.isArray(node.children) ? node.children.map(normalizeNode) : [];
    if (node.type === "product-card") {
      node.binding = normalizeProductBinding(node.binding);
      node.presentation = window.CatalogPresentations?.normalizePresentation?.(node.presentation, node.type) || null;
    }
    return node;
  }

  function findRecordIn(children, componentId, parent = null, path = []) {
    for (let index = 0; index < children.length; index += 1) {
      const component = children[index];
      const nextPath = [...path, component];
      if (component.id === componentId) {
        return { component, parent, parentChildren: children, index, path: nextPath };
      }
      const nested = findRecordIn(component.children || [], componentId, component, nextPath);
      if (nested) return nested;
    }
    return null;
  }

  function cloneNodeWithNewIds(component) {
    const next = clone(component);
    const idMap = new Map();
    const visit = node => {
      const previousId = node.id;
      node.id = id(node.type || "component");
      if (previousId) idMap.set(previousId, node.id);
      node.children = Array.isArray(node.children) ? node.children : [];
      node.children.forEach(visit);
    };
    visit(next);
    visitSubtree(next, node => {
      if (node.props?.beforeId && idMap.has(node.props.beforeId)) node.props.beforeId = idMap.get(node.props.beforeId);
      if (node.props?.afterId && idMap.has(node.props.afterId)) node.props.afterId = idMap.get(node.props.afterId);
    });
    return next;
  }

  function collectionFor(document, collectionId) {
    return (document.collections || []).find(collection => collection.id === collectionId) || null;
  }

  function tableColumns(source) {
    return window.CatalogSource?.normalizeColumns?.(source) || [
      { key: "code", label: "Código", role: "identifier", align: "center", width: 1 },
      { key: "package", label: "Embalagem", role: "package", align: "center", width: 1.25 },
      { key: "price", label: "Preço", role: "price", align: "center", width: 1.15 }
    ];
  }

  function tableRowValues(source = {}, columns = null) {
    return window.CatalogSource?.normalizeRowValues?.(source, columns || window.CatalogSource.DEFAULT_TABLE_COLUMNS) || {
      code: String(source.code ?? ""),
      package: String(source.package ?? ""),
      price: String(source.price ?? "")
    };
  }

  function productValues(source = {}) {
    return {
      title: String(source.title ?? "NOVO PRODUTO"),
      specOne: String(source.specOne ?? "Alta resistência"),
      specTwo: String(source.specTwo ?? "Material"),
      code: String(source.code ?? "0000"),
      package: String(source.package ?? "PCT 100 UNID."),
      price: String(source.price ?? "R$ 0,00"),
      assetId: source.assetId ? String(source.assetId) : null
    };
  }

  function productItemValues(item) {
    return productValues(item?.metadata?.values || {});
  }

  function productMetadata(source = {}, values = {}) {
    const next = window.CatalogSource?.normalizeProductMetadata?.(source, values) || { ...source };
    next.values = productValues(values);
    if (source.attributesText !== undefined) next.attributes = window.CatalogSource?.normalizeSemanticList?.(window.CatalogSource.parseLines(source.attributesText, "attribute"), "attribute") || [];
    if (source.highlightsText !== undefined) next.highlights = window.CatalogSource?.normalizeSemanticList?.(window.CatalogSource.parseLines(source.highlightsText, "highlight"), "highlight") || [];
    if (source.applicationsText !== undefined) next.applications = window.CatalogSource?.normalizeSemanticList?.(window.CatalogSource.parseLines(source.applicationsText, "application"), "application") || [];
    next.assetRoles = window.CatalogSource?.normalizeAssetRoles?.(next.assetRoles, next.values.assetId) || { main: next.values.assetId, gallery: [], technical: [], application: [] };
    next.assetRoles.main = next.values.assetId;
    delete next.attributesText;
    delete next.highlightsText;
    delete next.applicationsText;
    PRODUCT_FIELDS.forEach(field => { delete next[field]; });
    return next;
  }

  function createTableRow(document, values = {}, label = "Linha de tabela", options = {}) {
    const collection = collectionFor(document, "tableRows");
    if (!collection) throw new Error("A coleção tableRows não está disponível.");
    const item = window.CatalogCollections?.normalizeItem?.(collection, {
      id: id("table-row"),
      label,
      metadata: { values: tableRowValues(values, options.columns), legendKeys: { ...(options.legendKeys || {}) }, sourceRowId: options.sourceRowId || null, variantId: options.variantId || null },
      reference: null
    }, collection.items.length) || {
      id: id("table-row"),
      label,
      metadata: { values: tableRowValues(values, options.columns), legendKeys: { ...(options.legendKeys || {}) }, sourceRowId: options.sourceRowId || null, variantId: options.variantId || null },
      reference: null
    };
    collection.items.push(item);
    return item;
  }

  function ensureTableRows(document, component) {
    if (component?.type !== "data-table") return [];
    component.props ||= {};
    component.props.collectionId = component.props.collectionId || "tableRows";
    component.props.columns = tableColumns(component.props.columns);
    let collection = collectionFor(document, component.props.collectionId);
    if (!collection) {
      component.props.collectionId = "tableRows";
      collection = collectionFor(document, "tableRows");
    }
    const ids = Array.isArray(component.props.rowIds) ? component.props.rowIds.map(String) : [];
    component.props.rowIds = ids.filter(rowId => collection?.items.some(item => item.id === rowId));
    component.props.rowIds.forEach(rowId => {
      const row = collection?.items.find(item => item.id === rowId);
      if (!row) return;
      row.metadata = {
        ...(row.metadata || {}),
        values: tableRowValues(row.metadata?.values, component.props.columns),
        legendKeys: row.metadata?.legendKeys && typeof row.metadata.legendKeys === "object" ? { ...row.metadata.legendKeys } : {},
        sourceRowId: row.metadata?.sourceRowId ? String(row.metadata.sourceRowId) : null,
        variantId: row.metadata?.variantId ? String(row.metadata.variantId) : null
      };
    });
    if (!component.props.rowIds.length) {
      const row = createTableRow(document, component.props, `${component.name || "Tabela"} · linha 1`, { columns: component.props.columns });
      component.props.rowIds = [row.id];
    }
    return component.props.rowIds;
  }

  function visitSubtree(component, callback) {
    callback(component);
    (component.children || []).forEach(child => visitSubtree(child, callback));
  }

  function productCards(document) {
    const cards = [];
    (document.pages || []).forEach(page => (page.children || []).forEach(component => visitSubtree(component, node => {
      if (node.type === "product-card") cards.push(node);
    })));
    return cards;
  }

  function productCardForRecord(record) {
    return record?.path?.slice().reverse().find(node => node.type === "product-card") || null;
  }

  function orderedCardSpecifications(card) {
    return (card?.children || [])
      .filter(child => child.type === "specification" && child.slot?.name === "specifications")
      .sort((a, b) => (a.slot?.order ?? 0) - (b.slot?.order ?? 0));
  }

  function cardDataTable(card) {
    return (card?.children || []).find(child => child.type === "data-table" && child.slot?.name === "table") || null;
  }

  function cardArt(card) {
    const artSlot = (card?.children || []).find(child => child.slot?.name === "art") || null;
    if (artSlot?.type === "art") return artSlot;
    if (artSlot?.type === "art-gallery") return (artSlot.children || []).find(child => child.type === "art") || null;
    return null;
  }

  function extractCardContent(document, card) {
    const title = cardNumberNode(card);
    const specifications = orderedCardSpecifications(card);
    const table = cardDataTable(card);
    const row = table ? (collectionFor(document, table.props?.collectionId || "tableRows")?.items || []).find(item => item.id === table.props?.rowIds?.[0]) : null;
    return productValues({
      title: title?.props?.title ?? card?.props?.title,
      specOne: specifications[0]?.props?.label ?? card?.props?.specOne,
      specTwo: specifications[1]?.props?.label ?? card?.props?.specTwo,
      ...(row?.metadata?.values || card?.props || {}),
      assetId: cardArt(card)?.props?.assetId ?? card?.props?.assetId
    });
  }

  function applyCardContent(document, card, values, fields = PRODUCT_FIELDS) {
    const next = productValues(values);
    const enabled = new Set(fields);
    card.props ||= {};
    const title = cardNumberNode(card);
    const specifications = orderedCardSpecifications(card);
    const table = cardDataTable(card);
    const art = cardArt(card);

    if (enabled.has("title")) {
      card.props.title = next.title;
      if (title) title.props.title = next.title;
    }
    ["specOne", "specTwo"].forEach((field, index) => {
      if (!enabled.has(field)) return;
      card.props[field] = next[field];
      if (specifications[index]) specifications[index].props.label = next[field];
    });
    if (table) {
      ensureTableRows(document, table);
      const row = collectionFor(document, table.props.collectionId || "tableRows")?.items.find(item => item.id === table.props.rowIds[0]);
      if (row) {
        const rowValues = tableRowValues(row.metadata?.values, table.props?.columns);
        for (const field of ["code", "package", "price"]) {
          if (!enabled.has(field)) continue;
          rowValues[field] = next[field];
          card.props[field] = next[field];
        }
        row.metadata = { ...(row.metadata || {}), values: rowValues };
      }
    }
    if (enabled.has("assetId")) {
      card.props.assetId = next.assetId;
      if (art) art.props.assetId = next.assetId;
    }
    return card;
  }

  function productOverrideFieldsForPatch(record, patch) {
    const card = productCardForRecord(record);
    if (!card?.binding?.productId) return [];
    const component = record.component;
    if (component.type === "product-card") return PRODUCT_FIELDS.filter(field => patch.props && Object.hasOwn(patch.props, field));
    if (component.type === "title-symbol" && patch.props && Object.hasOwn(patch.props, "title")) return ["title"];
    if (component.type === "specification" && patch.props && Object.hasOwn(patch.props, "label")) {
      const index = orderedCardSpecifications(card).findIndex(item => item.id === component.id);
      return index === 0 ? ["specOne"] : index === 1 ? ["specTwo"] : [];
    }
    return [];
  }

  function cardNumberNode(card) {
    return (card?.children || []).find(child => child.type === "title-symbol" && child.slot?.name === "title") || null;
  }

  function numericCardNumber(card) {
    const raw = String(cardNumberNode(card)?.props?.number ?? card?.props?.number ?? "").trim();
    return /^\d+$/.test(raw) ? Number(raw) : null;
  }

  function formatCardNumber(value) {
    return String(Math.max(0, Math.round(Number(value) || 0))).padStart(2, "0");
  }

  function setCardNumberValue(card, value) {
    const formatted = /^\d+$/.test(String(value).trim()) ? formatCardNumber(value) : String(value ?? "");
    card.props ||= {};
    card.props.number = formatted;
    const title = cardNumberNode(card);
    if (title) title.props.number = formatted;
    return formatted;
  }

  function inferredNextCardNumber(document) {
    return Math.max(0, ...productCards(document).map(numericCardNumber).filter(Number.isFinite)) + 1;
  }

  function collectTemplateTableRows(document, component) {
    const collection = collectionFor(document, "tableRows");
    const snapshots = [];
    const seen = new Set();
    visitSubtree(component, node => {
      if (node.type !== "data-table") return;
      (node.props?.rowIds || []).forEach(rowId => {
        if (seen.has(rowId)) return;
        const row = collection?.items.find(item => item.id === rowId);
        if (!row) return;
        seen.add(rowId);
        snapshots.push({
          sourceId: rowId,
          label: row.label,
          values: tableRowValues(row.metadata?.values, node.props?.columns),
          legendKeys: { ...(row.metadata?.legendKeys || {}) },
          sourceRowId: row.metadata?.sourceRowId || null,
          variantId: row.metadata?.variantId || null
        });
      });
    });
    return snapshots;
  }

  function materializeTemplateTableRows(document, component, snapshots = []) {
    const bySourceId = new Map((snapshots || []).map(item => [item.sourceId, item]));
    visitSubtree(component, node => {
      if (node.type !== "data-table") return;
      const sourceIds = Array.isArray(node.props?.rowIds) ? node.props.rowIds.slice() : [];
      node.props.collectionId = "tableRows";
      node.props.rowIds = sourceIds.map((rowId, index) => {
        const snapshot = bySourceId.get(rowId);
        if (!snapshot) return null;
        return createTableRow(document, snapshot.values, `${snapshot.label || `Linha ${index + 1}`} · componente salvo`, {
          columns: node.props?.columns,
          legendKeys: snapshot.legendKeys,
          sourceRowId: snapshot.sourceRowId,
          variantId: snapshot.variantId
        }).id;
      }).filter(Boolean);
      ensureTableRows(document, node);
    });
  }

  function ensureTableRowsForSubtree(document, component) {
    visitSubtree(component, node => ensureTableRows(document, node));
  }

  function cloneTableRowsForSubtree(document, component) {
    visitSubtree(component, node => {
      if (node.type !== "data-table") return;
      const collection = collectionFor(document, node.props?.collectionId || "tableRows") || collectionFor(document, "tableRows");
      const sourceRows = (node.props?.rowIds || []).map(rowId => collection?.items.find(item => item.id === rowId)).filter(Boolean);
      node.props.collectionId = "tableRows";
      node.props.rowIds = sourceRows.map((source, index) => createTableRow(
        document,
        source.metadata?.values || {},
        `${source.label || `Linha ${index + 1}`} · cópia`,
        {
          columns: node.props?.columns,
          legendKeys: source.metadata?.legendKeys,
          sourceRowId: source.metadata?.sourceRowId,
          variantId: source.metadata?.variantId
        }
      ).id);
      ensureTableRows(document, node);
    });
  }

  function layoutSlot(parent, slotName) {
    const slot = slotDefinition(parent, slotName);
    const frame = slotFrame(parent, slotName);
    if (!slot || !frame) return;
    const occupants = (parent.children || [])
      .filter(child => child.slot?.name === slotName)
      .sort((a, b) => (a.slot?.order ?? 0) - (b.slot?.order ?? 0));

    occupants.forEach((child, index) => {
      child.slot.order = index;
    });

    const managed = occupants.filter(child => child.slot?.managed !== false);
    if (!managed.length) return;
    const minimumFor = child => window.CatalogLayoutEngine?.itemMinimum?.(child, child.frame) || { width: child.constraints?.minWidth || 1, height: child.constraints?.minHeight || 1 };
    const refreshNestedSlots = () => {
      managed.forEach(child => {
        const childDefinition = definitionFor(child.type);
        if (!childDefinition?.container) return;
        layoutAllSlots(child);
        if (childDefinition.container.autoLayout) window.CatalogLayoutEngine?.applyAutoLayout(child);
      });
    };

    const slotLayout = typeof slot.layout === "function" ? slot.layout(parent) : slot.layout;
    if (slotLayout === "column") {
      const gap = slot.gap ?? 6;
      const available = frame.height - gap * Math.max(0, managed.length - 1);
      const totalSpan = managed.reduce((total, child) => total + slotSpan(child, slot), 0);
      const unitHeight = Math.max(1, available / totalSpan);
      let y = frame.y;
      managed.forEach(child => {
        const minimum = minimumFor(child).height;
        const height = Math.max(minimum, unitHeight * slotSpan(child, slot));
        child.frame = {
          x: Math.round(frame.x),
          y: Math.round(y),
          width: Math.max(minimumFor(child).width, Math.round(frame.width)),
          height: Math.round(height)
        };
        y += height + gap;
      });
      refreshNestedSlots();
      return;
    }

    if (slotLayout === "row") {
      const gap = slot.gap ?? 6;
      const available = frame.width - gap * Math.max(0, managed.length - 1);
      const totalSpan = managed.reduce((total, child) => total + slotSpan(child, slot), 0);
      const unitWidth = Math.max(1, available / totalSpan);
      let x = frame.x;
      managed.forEach(child => {
        const minimum = minimumFor(child).width;
        const width = Math.max(minimum, unitWidth * slotSpan(child, slot));
        child.frame = {
          x: Math.round(x),
          y: Math.round(frame.y),
          width: Math.round(width),
          height: Math.max(minimumFor(child).height, Math.round(frame.height))
        };
        x += width + gap;
      });
      refreshNestedSlots();
      return;
    }

    if (slotLayout === "grid") {
      const gap = slot.gap ?? 6;
      const columns = Math.max(1, Math.min(slot.columns || 2, slot.capacity || 24));
      const placements = [];
      let row = 0;
      let column = 0;
      managed.forEach(child => {
        const span = Math.min(columns, slotSpan(child, slot));
        if (column + span > columns) { row += 1; column = 0; }
        placements.push({ child, row, column, span });
        column += span;
        if (column >= columns) { row += 1; column = 0; }
      });
      const rows = Math.max(1, placements.reduce((maximum, item) => Math.max(maximum, item.row + 1), 1));
      const sharedWidth = Math.max(1, (frame.width - gap * Math.max(0, columns - 1)) / columns);
      const sharedHeight = Math.max(1, (frame.height - gap * Math.max(0, rows - 1)) / rows);
      placements.forEach(({ child, row: itemRow, column: itemColumn, span }) => {
        child.frame = {
          x: Math.round(frame.x + itemColumn * (sharedWidth + gap)),
          y: Math.round(frame.y + itemRow * (sharedHeight + gap)),
          width: Math.max(minimumFor(child).width, Math.round(sharedWidth * span + gap * Math.max(0, span - 1))),
          height: Math.max(minimumFor(child).height, Math.round(sharedHeight))
        };
      });
      refreshNestedSlots();
      return;
    }

    managed.forEach(child => {
      child.frame = {
        x: Math.round(frame.x),
        y: Math.round(frame.y),
        width: Math.max(minimumFor(child).width, Math.round(frame.width)),
        height: Math.max(minimumFor(child).height, Math.round(frame.height))
      };
    });
    refreshNestedSlots();
  }

  function layoutAllSlots(parent) {
    const definition = definitionFor(parent.type);
    (definition?.container?.slots || []).forEach(slot => layoutSlot(parent, slot.name));
  }

  function reflowPass(component, forceRoot = false, visited = new Set()) {
    if (!component || visited.has(component)) return;
    const definition = definitionFor(component.type);
    if (!definition?.container) return;
    if (!forceRoot && !usesAutoReflow(component)) return;
    visited.add(component);

    component.children.forEach(child => {
      if (child.slot?.name && child.slot.managed === undefined) child.slot.managed = true;
      if (definition.container.autoLayout && !child.slot?.name && child.layoutItem?.overlay !== true) {
        child.layoutItem ||= { managed: true, grow: 1, span: 1 };
      }
    });

    layoutAllSlots(component);
    if (definition.container.autoLayout) window.CatalogLayoutEngine?.applyAutoLayout(component);

    component.children.forEach(child => {
      if (!definitionFor(child.type)?.container) return;
      reflowPass(child, false, visited);
      if (!usesAutoReflow(child)) return;
      const minimum = window.CatalogLayoutEngine?.contentMinimum(child, child.frame);
      if (!minimum) return;
      child.frame.width = Math.max(child.frame.width, minimum.width);
      child.frame.height = Math.max(child.frame.height, minimum.height);
      layoutAllSlots(child);
      if (definitionFor(child.type)?.container?.autoLayout) window.CatalogLayoutEngine?.applyAutoLayout(child);
    });
  }

  function reflowTree(component) {
    if (!usesAutoReflow(component)) return false;
    for (let pass = 0; pass < 4; pass += 1) reflowPass(component, true, new Set());
    return true;
  }

  function reflowMinimum(component, proposedFrame) {
    if (!usesAutoReflow(component)) {
      return window.CatalogLayoutEngine?.contentMinimum(component, proposedFrame || component.frame);
    }
    const preview = clone(component);
    preview.frame = { ...preview.frame, ...(proposedFrame || {}) };
    for (let pass = 0; pass < 4; pass += 1) reflowPass(preview, true, new Set());
    return window.CatalogLayoutEngine?.contentMinimum(preview, preview.frame);
  }

  function frameEquals(left, right) {
    return ["x", "y", "width", "height"].every(key => Number(left?.[key]) === Number(right?.[key]));
  }

  function publicGeometryPlan(plan) {
    return {
      status: plan.status,
      requested: clone(plan.requested),
      resolved: clone(plan.resolved),
      changes: clone(plan.changes),
      authorityChanges: clone(plan.authorityChanges),
      reasons: clone(plan.reasons),
      conflicts: clone(plan.conflicts)
    };
  }

  function publicSpacingPlan(plan) {
    return {
      status: plan.status,
      requested: clone(plan.requested),
      resolved: clone(plan.resolved),
      changes: clone(plan.changes),
      structuralChanges: clone(plan.structuralChanges),
      authorityChanges: clone(plan.authorityChanges),
      reasons: clone(plan.reasons),
      conflicts: clone(plan.conflicts)
    };
  }

  function geometrySnapshot(store) {
    const entries = new Map();
    const visit = (children, parentId = null, ancestors = []) => (children || []).forEach(component => {
      const path = [...ancestors, component.id];
      entries.set(component.id, {
        component,
        parentId,
        path,
        frame: { ...component.frame },
        slotManaged: component.slot?.name ? component.slot.managed !== false : null,
        layoutManaged: component.layoutItem ? component.layoutItem.managed !== false : null
      });
      visit(component.children, component.id, path);
    });
    visit(store.getPage()?.children || []);
    return entries;
  }

  function geometryAffectedIds(before, after, requestedIds) {
    const affected = new Set(requestedIds);
    const addPath = entry => (entry?.path || []).forEach(componentId => affected.add(componentId));
    const addDescendants = (entries, rootId) => entries.forEach(entry => {
      if (entry.path.includes(rootId)) affected.add(entry.component.id);
    });

    new Set([...before.keys(), ...after.keys()]).forEach(componentId => {
      const previous = before.get(componentId);
      const next = after.get(componentId);
      if (!previous || !next
        || !frameEquals(previous.frame, next.frame)
        || previous.slotManaged !== next.slotManaged
        || previous.layoutManaged !== next.layoutManaged) {
        affected.add(componentId);
        addPath(previous);
        addPath(next);
      }
    });
    requestedIds.forEach(componentId => {
      addPath(before.get(componentId));
      addPath(after.get(componentId));
      addDescendants(before, componentId);
      addDescendants(after, componentId);
    });
    return affected;
  }

  function geometryConflicts(store, componentIds) {
    const entries = geometrySnapshot(store);
    const conflicts = new Map();
    const add = (componentId, code, magnitude, details = {}) => {
      const normalizedMagnitude = Number.isFinite(Number(magnitude)) ? Math.max(0, Number(magnitude)) : Number.MAX_SAFE_INTEGER;
      conflicts.set(`${componentId}:${code}`, { componentId, code, magnitude: normalizedMagnitude, ...details });
    };

    componentIds.forEach(componentId => {
      const entry = entries.get(componentId);
      if (!entry) {
        add(componentId, "component-missing", Number.MAX_SAFE_INTEGER);
        return;
      }
      const frame = entry.frame;
      if (!["x", "y", "width", "height"].every(key => Number.isFinite(Number(frame[key])))
        || Number(frame.width) <= 0
        || Number(frame.height) <= 0) {
        add(componentId, "invalid-frame", Number.MAX_SAFE_INTEGER, { frame: { ...frame } });
        return;
      }

      const size = entry.parentId
        ? { width: entries.get(entry.parentId)?.frame.width || 0, height: entries.get(entry.parentId)?.frame.height || 0 }
        : store.getPage().size;
      const overflow = {
        left: Math.max(0, -Number(frame.x)),
        top: Math.max(0, -Number(frame.y)),
        right: Math.max(0, Number(frame.x) + Number(frame.width) - Number(size.width)),
        bottom: Math.max(0, Number(frame.y) + Number(frame.height) - Number(size.height))
      };
      const overflowMagnitude = Math.max(...Object.values(overflow));
      if (overflowMagnitude > GEOMETRY_EPSILON) add(componentId, "bounds", overflowMagnitude, { overflow });

      const minimum = store.getReflowMinimum(entry.component, frame);
      const shortage = {
        width: Math.max(0, Number(minimum?.width) - Number(frame.width)),
        height: Math.max(0, Number(minimum?.height) - Number(frame.height))
      };
      const minimumMagnitude = Math.max(shortage.width, shortage.height);
      if (minimumMagnitude > GEOMETRY_EPSILON) add(componentId, "minimum-or-content", minimumMagnitude, { minimum: { ...minimum }, shortage });
    });
    return conflicts;
  }

  function worsenedGeometryConflicts(before, after) {
    return [...after.entries()]
      .filter(([key, conflict]) => conflict.magnitude > (before.get(key)?.magnitude || 0) + GEOMETRY_EPSILON)
      .map(([, conflict]) => conflict);
  }

  function synchronizeGeometryState(targetStore, draftStore) {
    const target = geometrySnapshot(targetStore);
    const draft = geometrySnapshot(draftStore);
    draft.forEach((entry, componentId) => {
      const current = target.get(componentId)?.component;
      if (!current) return;
      if (!frameEquals(current.frame, entry.component.frame)) Object.assign(current.frame, clone(entry.component.frame));
      if (JSON.stringify(current.slot) !== JSON.stringify(entry.component.slot)) current.slot = entry.component.slot ? clone(entry.component.slot) : null;
      if (JSON.stringify(current.layoutItem) !== JSON.stringify(entry.component.layoutItem)) current.layoutItem = entry.component.layoutItem ? clone(entry.component.layoutItem) : null;
      if (JSON.stringify(current.props) !== JSON.stringify(entry.component.props)) current.props = clone(entry.component.props);
    });
  }

  function synchronizeComponentChildren(targetChildren, draftChildren) {
    const currentById = new Map((targetChildren || []).map(component => [component.id, component]));
    const synchronized = (draftChildren || []).map(draftComponent => {
      const current = currentById.get(draftComponent.id);
      if (!current) return clone(draftComponent);
      Object.keys(current).forEach(key => {
        if (key !== "children" && !Object.hasOwn(draftComponent, key)) delete current[key];
      });
      Object.entries(draftComponent).forEach(([key, value]) => {
        if (key !== "children") current[key] = clone(value);
      });
      current.children = synchronizeComponentChildren(current.children || [], draftComponent.children || []);
      return current;
    });
    targetChildren.splice(0, targetChildren.length, ...synchronized);
    return targetChildren;
  }

  function synchronizeStructuralState(targetStore, draftStore) {
    const targetPage = targetStore.getPage();
    const draftPage = draftStore.getPage();
    synchronizeComponentChildren(targetPage.children, draftPage.children);
    targetStore.state.editor.selectedComponentIds = draftStore.state.editor.selectedComponentIds.slice();
    targetStore.state.editor.selectedComponentId = draftStore.state.editor.selectedComponentId;
  }

  function hydrateDefaultChildren(parent) {
    const definition = definitionFor(parent.type);
    if (!definition?.container) return;
    if ((parent.children || []).length) {
      parent.structureInitialized = true;
      return;
    }
    if (parent.structureInitialized === true) return;
    if (!definition.defaultChildren) {
      parent.structureInitialized = true;
      return;
    }
    const descriptors = defaultChildDescriptors(parent);
    parent.children = descriptors.map((descriptor, index) => createNode(
      descriptor.type,
      descriptor.frame,
      {
        name: descriptor.name,
        props: descriptor.props,
        style: descriptor.style,
        constraints: descriptor.constraints,
        slot: descriptor.slot,
        slotSpan: descriptor.slotSpan,
        slotCapacity: slotDefinition(parent, descriptor.slot)?.capacity,
        order: descriptor.order ?? index,
        managed: descriptor.managed,
        layout: descriptor.layout,
        layoutItem: descriptor.layoutItem
      }
    ));
    parent.children.forEach(hydrateDefaultChildren);
    layoutAllSlots(parent);
    parent.structureInitialized = true;
  }

  function hydrateHeaderSeparators(parent) {
    if (parent.type !== "catalog-header") return;
    const definition = definitionFor(parent.type);
    const descriptors = definition.defaultChildren(parent).filter(descriptor => descriptor.type === "separator");
    descriptors.forEach(descriptor => {
      if (parent.children.some(child => child.slot?.name === descriptor.slot)) return;
      const slot = slotDefinition(parent, descriptor.slot);
      parent.children.push(createNode(descriptor.type, descriptor.frame, {
        props: descriptor.props,
        style: descriptor.style,
        slot: descriptor.slot,
        slotSpan: 1,
        slotCapacity: slot?.capacity,
        order: parent.children.length,
        managed: true
      }));
    });
  }

  function migrateDocument(document) {
    const next = document && Array.isArray(document.pages) && document.pages.length ? clone(document) : createBlankDocument();
    const upgradingStructureSchema = next.schemaVersion !== SCHEMA_VERSION;
    next.schemaVersion = SCHEMA_VERSION;
    next.id = String(next.id || id("document"));
    next.title = String(next.title || "Catálogo sem título");
    next.createdAt ||= new Date().toISOString();
    next.updatedAt ||= next.createdAt;
    next.pages = next.pages.map((page, index) => ({
      id: String(page?.id || `page-${index + 1}`),
      type: "page",
      name: String(page?.name || `Página ${String(index + 1).padStart(2, "0")}`),
      size: {
        preset: "A4",
        orientation: "portrait",
        width: 794,
        height: 1123,
        unit: "px",
        printWidth: "210mm",
        printHeight: "297mm",
        ...(page?.size || {})
      },
      grid: { unit: 4, majorEvery: 4, safeMargin: 24, ...(page?.grid || {}) },
      children: Array.isArray(page?.children) ? page.children : []
    }));
    if (!next.pages.some(page => page.id === next.activePageId)) next.activePageId = next.pages[0].id;
    next.collections = window.CatalogCollections?.normalizeCollections?.(next.collections) || (Array.isArray(next.collections) ? next.collections : defaultCollections());
    const templates = collectionFor(next, "templates");
    if (templates && (!templates.label || templates.label === "Templates")) templates.label = "Meus componentes";
    (templates?.items || []).forEach(template => {
      template.metadata ||= {};
      template.metadata.kind ||= template.metadata.rootType === "product-card" ? "product-presentation" : "snapshot";
      if (template.metadata.component?.type && definitionFor(template.metadata.component.type)) {
        template.metadata.component = normalizeNode(template.metadata.component);
        if (template.metadata.component.type === "product-card") template.metadata.component.binding = normalizeProductBinding();
      }
      template.metadata = window.CatalogPresentations?.normalizeTemplateMetadata?.(template.metadata, template.metadata.component) || template.metadata;
    });
    const products = collectionFor(next, "products");
    (products?.items || []).forEach(product => {
      product.metadata = productMetadata(product.metadata || {}, productItemValues(product));
      product.label = product.metadata.values.title || product.label || product.id;
    });
    const subcatalogs = collectionFor(next, "subcatalogs");
    (subcatalogs?.items || []).forEach(subcatalog => {
      subcatalog.metadata = {
        ...(subcatalog.metadata || {}),
        productIds: Array.from(new Set((subcatalog.metadata?.productIds || []).map(String))).filter(productId => products?.items.some(product => product.id === productId))
      };
    });
    next.numbering = {
      cardNext: Math.max(1, Math.round(Number(next.numbering?.cardNext) || inferredNextCardNumber(next)))
    };
    next.editor = {
      zoom: 0.7,
      zoomMode: "fit",
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      gridVisible: true,
      snapEnabled: true,
      smartSnapEnabled: true,
      equalSpacingEnabled: true,
      showGuides: true,
      snapTolerance: 6,
      selectedComponentId: null,
      selectedComponentIds: [],
      editingContextId: null,
      ...(next.editor || {})
    };
    if (!["fit", "manual"].includes(next.editor.zoomMode)) next.editor.zoomMode = "fit";
    next.editor.selectedComponentId = null;
    next.editor.selectedComponentIds = [];
    next.editor.editingContextId = null;
    next.pages.forEach(page => {
      page.children = Array.isArray(page.children) ? page.children.map(normalizeNode) : [];
      const visit = children => children.forEach(component => {
        hydrateDefaultChildren(component);
        if (upgradingStructureSchema) {
          hydrateHeaderSeparators(component);
        }
        if (definitionFor(component.type)?.container?.autoLayout) {
          component.children.forEach(child => { child.layoutItem ||= { managed: true, grow: 1, span: 1 }; });
          window.CatalogLayoutEngine?.applyAutoLayout(component);
        }
        visit(component.children || []);
      });
      visit(page.children);
      page.children.forEach(component => ensureTableRowsForSubtree(next, component));
      (page.children || []).forEach(component => visitSubtree(component, node => {
        if (node.type !== "product-card") return;
        node.binding = normalizeProductBinding(node.binding);
        const product = products?.items.find(item => item.id === node.binding.productId);
        if (!product) node.binding.productId = null;
        if (node.binding.templateId && !templates?.items.some(item => item.id === node.binding.templateId && item.metadata?.rootType === "product-card")) node.binding.templateId = null;
        if (product) {
          const syncedFields = PRODUCT_FIELDS.filter(field => node.binding.overrides[field] !== true);
          applyCardContent(next, node, productItemValues(product), syncedFields);
        }
      }));
      const refreshSlots = children => children.forEach(component => {
        if (definitionFor(component.type)?.container) {
          component.children.forEach(child => {
            if (!child.slot?.name) return;
            const slot = slotDefinition(component, child.slot.name);
            child.slot.span = normalizedSlotSpan(child.slot.span, slot?.capacity || 1);
          });
          layoutAllSlots(component);
        }
        refreshSlots(component.children || []);
      });
      refreshSlots(page.children);
    });
    return next;
  }

  function analyzeDocumentInput(source) {
    const issues = [];
    const addIssue = (severity, code, message) => issues.push({ severity, code, message });
    const sourceVersion = String(source?.schemaVersion || "não informada");
    const emptySummary = { pages: 0, components: 0, products: 0, templates: 0, assets: 0, tableRows: 0 };

    if (!source || typeof source !== "object" || Array.isArray(source)) {
      addIssue("error", "DOCUMENT_TYPE", "A raiz do arquivo precisa ser um objeto JSON.");
      return { ok: false, sourceVersion, targetVersion: SCHEMA_VERSION, document: null, summary: emptySummary, issues };
    }
    const sourcePages = Array.isArray(source.pages) ? source.pages : [];
    if (!sourcePages.length) {
      addIssue("error", "PAGES_REQUIRED", "O documento precisa conter ao menos uma página.");
    }
    if (source.schemaVersion && compareVersions(source.schemaVersion, SCHEMA_VERSION) > 0) {
      addIssue("error", "FUTURE_SCHEMA", `O schema ${source.schemaVersion} é mais recente que o suportado (${SCHEMA_VERSION}).`);
    } else if (!source.schemaVersion) {
      addIssue("warning", "SCHEMA_MISSING", "A versão do schema não foi informada e será inferida durante a migração.");
    } else if (source.schemaVersion !== SCHEMA_VERSION) {
      addIssue("info", "SCHEMA_MIGRATION", `O documento será migrado de ${source.schemaVersion} para ${SCHEMA_VERSION}.`);
    }
    if (!source.editor) addIssue("info", "EDITOR_SESSION_DEFAULTED", "Preferências de interface ausentes serão preenchidas localmente.");
    if (Array.isArray(source.pages) && source.pages.length && !source.pages.some(page => page?.id === source.activePageId)) {
      addIssue("warning", "ACTIVE_PAGE_FALLBACK", "A página ativa não existe; a primeira página será usada.");
    }

    const componentIds = new Set();
    let sourceComponentCount = 0;
    const visitSource = (children, pageLabel) => {
      if (!Array.isArray(children)) {
        addIssue("warning", "CHILDREN_DEFAULTED", `${pageLabel} possui uma lista de componentes inválida e será normalizada.`);
        return;
      }
      children.forEach((component, index) => {
        const path = `${pageLabel} · componente ${index + 1}`;
        if (!component || typeof component !== "object") {
          addIssue("error", "COMPONENT_TYPE", `${path} não é um objeto válido.`);
          return;
        }
        sourceComponentCount += 1;
        if (!component.type || !definitionFor(component.type)) addIssue("error", "UNKNOWN_COMPONENT", `${path} usa o tipo desconhecido “${component.type || "sem tipo"}”.`);
        if (!component.id) addIssue("warning", "COMPONENT_ID_MISSING", `${path} não possui ID estável.`);
        else if (componentIds.has(component.id)) addIssue("error", "DUPLICATE_COMPONENT_ID", `O ID de componente “${component.id}” está duplicado.`);
        else componentIds.add(component.id);
        if (component.frame && (!(Number(component.frame.width) > 0) || !(Number(component.frame.height) > 0))) {
          addIssue("error", "INVALID_FRAME", `${path} possui largura ou altura inválida.`);
        }
        visitSource(component.children || [], component.name || component.id || path);
      });
    };
    sourcePages.forEach((page, index) => {
      if (!page || typeof page !== "object") addIssue("error", "PAGE_TYPE", `A página ${index + 1} não é um objeto válido.`);
      else visitSource(page.children || [], page.name || page.id || `Página ${index + 1}`);
    });

    if (issues.some(issue => issue.severity === "error")) {
      return {
        ok: false,
        sourceVersion,
        targetVersion: SCHEMA_VERSION,
        document: null,
        summary: { ...emptySummary, pages: sourcePages.length, components: sourceComponentCount },
        issues
      };
    }

    let migrated;
    try {
      migrated = migrateDocument(source);
    } catch (error) {
      addIssue("error", "MIGRATION_FAILED", `A migração falhou: ${error.message}`);
      return { ok: false, sourceVersion, targetVersion: SCHEMA_VERSION, document: null, summary: emptySummary, issues };
    }

    const summary = {
      pages: migrated.pages.length,
      components: 0,
      products: collectionFor(migrated, "products")?.items.length || 0,
      templates: collectionFor(migrated, "templates")?.items.length || 0,
      assets: collectionFor(migrated, "assets")?.items.length || 0,
      tableRows: collectionFor(migrated, "tableRows")?.items.length || 0
    };
    const assetIds = new Set((collectionFor(migrated, "assets")?.items || []).map(asset => asset.id));
    const missingAssetIds = new Set();
    const missingRowIds = new Set();
    const tableRowIds = new Set((collectionFor(migrated, "tableRows")?.items || []).map(row => row.id));
    migrated.pages.forEach(page => (page.children || []).forEach(component => visitSubtree(component, node => {
      summary.components += 1;
      if (node.type === "art" && node.props?.assetId && !assetIds.has(node.props.assetId)) missingAssetIds.add(node.props.assetId);
      if (node.type === "data-table") (node.props?.rowIds || []).forEach(rowId => { if (!tableRowIds.has(rowId)) missingRowIds.add(rowId); });
    })));
    if (missingAssetIds.size) addIssue("warning", "MISSING_ASSET_REFERENCES", `${missingAssetIds.size} referência(s) de asset não existem na coleção e usarão placeholder.`);
    if (missingRowIds.size) addIssue("warning", "MISSING_TABLE_ROWS", `${missingRowIds.size} linha(s) de tabela referenciada(s) não foram encontradas.`);
    const localAssetCount = (collectionFor(migrated, "assets")?.items || []).filter(asset => asset.reference?.provider === "indexeddb").length;
    if (localAssetCount) addIssue("warning", "LOCAL_ASSET_REFERENCES", `${localAssetCount} asset(s) dependem do armazenamento do navegador de origem e podem aparecer como ausentes.`);
    const packageAssetCount = (collectionFor(migrated, "assets")?.items || []).filter(asset => asset.reference?.provider === "package").length;
    if (packageAssetCount) addIssue("warning", "PACKAGE_ASSET_REFERENCES", `${packageAssetCount} asset(s) exigem o pacote ZIP correspondente; JSON isolado não transporta esses arquivos.`);
    if (!issues.length) addIssue("info", "READY", "Documento pronto para importação.");

    return { ok: true, sourceVersion, targetVersion: SCHEMA_VERSION, document: migrated, summary, issues };
  }

  class DocumentStore {
    constructor(initialState) {
      this.state = migrateDocument(normalizeLegacyTextPresentation(initialState || createBlankDocument()));
      this.listeners = new Set();
      this.bindingSyncDepth = 0;
      this.geometryResolutions = new Map();
      this.lastGeometryTransaction = null;
      this.historyUndo = [];
      this.historyRedo = [];
      this.historySuspended = false;
      this.lastHistorySnapshot = documentSnapshot(this.state);
      this.lastHistorySignature = snapshotSignature(this.lastHistorySnapshot);
      this.savedSignature = this.lastHistorySignature;
      this.dirty = false;
    }

    subscribe(listener) {
      this.listeners.add(listener);
      listener(this.getState(), { type: "init" });
      return () => this.listeners.delete(listener);
    }

    emit(change, options = {}) {
      const selectedIds = Array.isArray(this.state.editor.selectedComponentIds)
        ? this.state.editor.selectedComponentIds.filter(componentId => this.findComponent(componentId))
        : [];
      const primaryId = this.state.editor.selectedComponentId;
      this.state.editor.selectedComponentIds = primaryId
        ? (selectedIds.includes(primaryId) ? selectedIds : [primaryId])
        : [];
      const ephemeral = options.ephemeral === true || EPHEMERAL_CHANGE_TYPES.has(change?.type);
      if (!ephemeral) this.state.updatedAt = new Date().toISOString();
      if (!ephemeral && !this.historySuspended) this.captureHistory(change);
      this.listeners.forEach(listener => listener(this.getState(), change));
    }

    captureHistory(change) {
      const nextSnapshot = documentSnapshot(this.state);
      const nextSignature = snapshotSignature(nextSnapshot);
      if (nextSignature === this.lastHistorySignature) {
        this.dirty = nextSignature !== this.savedSignature;
        return false;
      }
      const now = Date.now();
      const coalesceKey = historyCoalesceKey(change);
      const previousEntry = this.historyUndo[this.historyUndo.length - 1];
      if (coalesceKey && previousEntry?.coalesceKey === coalesceKey && now - previousEntry.timestamp <= HISTORY_COALESCE_MS) {
        previousEntry.after = nextSnapshot;
        previousEntry.timestamp = now;
        previousEntry.changeType = change?.type || previousEntry.changeType;
      } else {
        this.historyUndo.push({
          before: this.lastHistorySnapshot,
          after: nextSnapshot,
          label: historyLabel(change),
          changeType: change?.type || "document-change",
          coalesceKey,
          timestamp: now
        });
        if (this.historyUndo.length > HISTORY_LIMIT) this.historyUndo.splice(0, this.historyUndo.length - HISTORY_LIMIT);
      }
      this.historyRedo = [];
      this.lastHistorySnapshot = nextSnapshot;
      this.lastHistorySignature = nextSignature;
      this.dirty = nextSignature !== this.savedSignature;
      return true;
    }

    restoreHistorySnapshot(snapshot) {
      const editor = clone(this.state.editor || {});
      const selectedComponentId = editor.selectedComponentId;
      const selectedComponentIds = Array.isArray(editor.selectedComponentIds) ? editor.selectedComponentIds : [];
      const editingContextId = editor.editingContextId;
      this.state = migrateDocument({ ...clone(snapshot), editor });
      const survivingSelection = selectedComponentIds.filter(componentId => this.findComponent(componentId));
      if (selectedComponentId && this.findComponent(selectedComponentId)) {
        this.state.editor.selectedComponentId = selectedComponentId;
        this.state.editor.selectedComponentIds = survivingSelection.includes(selectedComponentId) ? survivingSelection : [selectedComponentId];
      }
      if (editingContextId && this.isContainer(editingContextId)) this.state.editor.editingContextId = editingContextId;
      this.state.updatedAt = new Date().toISOString();
    }

    undo() {
      const entry = this.historyUndo.pop();
      if (!entry) return false;
      this.historySuspended = true;
      try {
        this.restoreHistorySnapshot(entry.before);
      } finally {
        this.historySuspended = false;
      }
      this.historyRedo.push(entry);
      this.lastHistorySnapshot = documentSnapshot(this.state);
      this.lastHistorySignature = snapshotSignature(this.lastHistorySnapshot);
      this.dirty = this.lastHistorySignature !== this.savedSignature;
      this.emit({ type: "history-undo", label: entry.label, changeType: entry.changeType }, { ephemeral: true });
      return true;
    }

    redo() {
      const entry = this.historyRedo.pop();
      if (!entry) return false;
      this.historySuspended = true;
      try {
        this.restoreHistorySnapshot(entry.after);
      } finally {
        this.historySuspended = false;
      }
      this.historyUndo.push(entry);
      this.lastHistorySnapshot = documentSnapshot(this.state);
      this.lastHistorySignature = snapshotSignature(this.lastHistorySnapshot);
      this.dirty = this.lastHistorySignature !== this.savedSignature;
      this.emit({ type: "history-redo", label: entry.label, changeType: entry.changeType }, { ephemeral: true });
      return true;
    }

    getHistoryState() {
      const undo = this.historyUndo[this.historyUndo.length - 1] || null;
      const redo = this.historyRedo[this.historyRedo.length - 1] || null;
      return {
        canUndo: Boolean(undo),
        canRedo: Boolean(redo),
        undoLabel: undo?.label || null,
        redoLabel: redo?.label || null,
        undoCount: this.historyUndo.length,
        redoCount: this.historyRedo.length,
        dirty: this.dirty
      };
    }

    isDirty() { return this.dirty; }

    markSaved() {
      this.savedSignature = snapshotSignature(documentSnapshot(this.state));
      this.dirty = false;
    }

    runCompoundChange(change, callback) {
      if (this.historySuspended) return callback();
      const previousState = clone(this.state);
      this.historySuspended = true;
      let result;
      try {
        result = callback();
      } catch (error) {
        this.state = previousState;
        this.historySuspended = false;
        this.emit({ type: "compound-change-rolled-back", failedType: change?.type || null }, { ephemeral: true });
        throw error;
      }
      this.historySuspended = false;
      this.emit(change || { type: "compound-change" });
      return result;
    }

    analyzeDocument(document) {
      const source = document === undefined ? document : normalizeLegacyTextPresentation(document);
      const analysis = analyzeDocumentInput(source);
      if (analysis?.document) analysis.document = normalizeLegacyTextPresentation(analysis.document);
      return analysis;
    }

    getState() { return this.state; }
    getPage() { return this.state.pages.find(page => page.id === this.state.activePageId) || this.state.pages[0]; }

    findComponent(componentId) {
      if (!componentId) return null;
      return findRecordIn(this.getPage().children, componentId);
    }

    getSelected() {
      return this.findComponent(this.state.editor.selectedComponentId)?.component || null;
    }

    getSelectedRecord() {
      return this.findComponent(this.state.editor.selectedComponentId);
    }

    getSelectedIds() {
      const selectedIds = Array.isArray(this.state.editor.selectedComponentIds) ? this.state.editor.selectedComponentIds : [];
      const surviving = selectedIds.filter(componentId => this.findComponent(componentId));
      const primaryId = this.state.editor.selectedComponentId;
      if (primaryId && this.findComponent(primaryId) && !surviving.includes(primaryId)) surviving.push(primaryId);
      return surviving;
    }

    getSelectedComponents() {
      return this.getSelectedIds().map(componentId => this.findComponent(componentId)?.component).filter(Boolean);
    }

    getLastGeometryResolution(componentId) {
      return this.geometryResolutions.get(componentId) || null;
    }

    getLastGeometryTransaction() {
      return this.lastGeometryTransaction ? clone(this.lastGeometryTransaction) : null;
    }

    getEditingContext() {
      return this.findComponent(this.state.editor.editingContextId)?.component || null;
    }

    getContextChildren(contextId = this.state.editor.editingContextId) {
      if (!contextId) return this.getPage().children;
      return this.findComponent(contextId)?.component.children || [];
    }

    getContextSiblings(contextId = this.state.editor.editingContextId, excludingId = null) {
      return this.getContextChildren(contextId).filter(component => component.id !== excludingId);
    }

    getAbsoluteOffset(contextId) {
      if (!contextId) return { x: 0, y: 0 };
      const path = this.findComponent(contextId)?.path || [];
      return path.reduce((offset, component) => ({ x: offset.x + component.frame.x, y: offset.y + component.frame.y }), { x: 0, y: 0 });
    }

    getContentMinimum(componentOrId, proposedFrame = null) {
      const component = typeof componentOrId === "string" ? this.findComponent(componentOrId)?.component : componentOrId;
      if (!component) return { width: 1, height: 1 };
      return window.CatalogLayoutEngine?.contentMinimum(component, proposedFrame || component.frame) || {
        width: component.constraints.minWidth,
        height: component.constraints.minHeight
      };
    }

    getReflowMinimum(componentOrId, proposedFrame = null) {
      const component = typeof componentOrId === "string" ? this.findComponent(componentOrId)?.component : componentOrId;
      if (!component) return { width: 1, height: 1 };
      return reflowMinimum(component, proposedFrame || component.frame) || this.getContentMinimum(component, proposedFrame);
    }

    reflowComponentTree(componentOrId) {
      const component = typeof componentOrId === "string" ? this.findComponent(componentOrId)?.component : componentOrId;
      if (!component) return false;
      return reflowTree(component);
    }

    getContextPath(contextId = this.state.editor.editingContextId) {
      if (!contextId) return [];
      return this.findComponent(contextId)?.path || [];
    }

    getParentId(componentId) {
      return this.findComponent(componentId)?.parent?.id || null;
    }

    getContainerSize(contextId) {
      if (!contextId) return { width: this.getPage().size.width, height: this.getPage().size.height };
      const component = this.findComponent(contextId)?.component;
      return component ? { width: component.frame.width, height: component.frame.height } : { width: 0, height: 0 };
    }

    getProbablePlacementFrame(type, sourceFrame, parentId = this.state.editor.editingContextId) {
      return window.CatalogComponentPlacements?.probableFrame?.(this, type, sourceFrame, parentId) || null;
    }

    getSuggestedFrame(sourceFrame, parentId = this.state.editor.editingContextId, type = null) {
      const preferred = type ? this.getProbablePlacementFrame(type, sourceFrame, parentId) : null;
      if (preferred) return preferred;
      const parent = parentId ? this.findComponent(parentId)?.component : null;
      const size = this.getContainerSize(parentId);
      const page = this.getPage();
      const padding = parent ? Math.max(0, Number(parent.layout?.padding) || 8) : Math.max(0, Number(page.grid?.safeMargin) || 24);
      const gap = parent ? Math.max(4, Number(parent.layout?.gap) || 8) : 12;
      const frame = {
        x: padding,
        y: padding,
        width: Math.min(Number(sourceFrame?.width) || 100, Math.max(1, size.width - padding * 2)),
        height: Math.min(Number(sourceFrame?.height) || 100, Math.max(1, size.height - padding * 2))
      };
      const autoManaged = Boolean(parent && definitionFor(parent.type)?.container?.autoLayout && (window.CatalogLayoutEngine?.effectiveMode(parent) || parent.layout?.mode) !== "free");
      if (autoManaged) return frame;

      const siblings = this.getContextChildren(parentId).filter(component => component.layoutItem?.overlay !== true);
      const step = Math.max(4, Number(page.grid?.unit) || 4) * 2;
      const collides = candidate => siblings.some(component => !(
        candidate.x + candidate.width + gap <= component.frame.x
        || component.frame.x + component.frame.width + gap <= candidate.x
        || candidate.y + candidate.height + gap <= component.frame.y
        || component.frame.y + component.frame.height + gap <= candidate.y
      ));
      const maxX = size.width - padding - frame.width;
      const maxY = size.height - padding - frame.height;
      for (let y = padding; y <= maxY; y += step) {
        for (let x = padding; x <= maxX; x += step) {
          const candidate = { ...frame, x, y };
          if (!collides(candidate)) return candidate;
        }
      }
      const error = new Error("Não há espaço livre suficiente no contexto atual para inserir este item automaticamente. Arraste para uma posição específica ou aumente o contêiner.");
      error.code = "NO_AUTOMATIC_PLACEMENT";
      throw error;
    }

    getPreferredSlot(parentId, type) {
      if (!parentId) return null;
      const parent = this.findComponent(parentId)?.component;
      const slots = this.getSlotDefinitions(parentId).filter(slot => slot.accepts.includes(type));
      return slots.find(slot => this.getSlotUsage(parentId, slot.name) < slot.capacity) || null;
    }

    getContextualInsertionTarget(type, options = {}) {
      if (options.parentId !== undefined) return options.parentId;
      const currentContextId = this.state.editor.editingContextId;
      if (options.preferCurrentContext === true) return currentContextId;
      const selected = this.getSelected();
      if (selected && this.isContainer(selected.id) && this.isTypeAllowed(type, selected.id)) return selected.id;
      return currentContextId;
    }

    insertComponent(type, options = {}) {
      const definition = definitionFor(type);
      const previousContextId = this.state.editor.editingContextId;
      const parentId = this.getContextualInsertionTarget(type, options);
      if (!definition || !this.isTypeAllowed(type, parentId)) return null;
      const compatibleSlots = parentId ? this.getSlotDefinitions(parentId).filter(item => item.accepts.includes(type)) : [];
      const slot = options.slotName ? this.getSlotDefinitions(parentId).find(item => item.name === options.slotName) : this.getPreferredSlot(parentId, type);
      if (compatibleSlots.length && !slot) throw new Error("Todos os slots compatíveis estão ocupados. Remova uma peça, aumente a capacidade ou arraste para criar um override livre.");
      const frame = slot ? { ...definition.defaultFrame, x: 0, y: 0 } : this.getSuggestedFrame(definition.defaultFrame, parentId, type);
      if (parentId !== previousContextId && parentId) this.state.editor.editingContextId = parentId;
      return this.addComponent(type, frame, { ...options, parentId, slotName: slot?.name || null });
    }

    canConvertArtToGallery(componentId) {
      const record = this.findComponent(componentId);
      if (!record || record.component.type !== "art" || record.parent?.type === "art-gallery") return false;
      const parentId = record.parent?.id || null;
      if (!this.isTypeAllowed("art-gallery", parentId)) return false;
      if (!record.component.slot?.name || !record.parent) return true;
      return Boolean(slotDefinition(record.parent, record.component.slot.name)?.accepts.includes("art-gallery"));
    }

    getContextualActions() {
      const selected = this.getSelectedComponents();
      if (selected.length !== 1) return [];
      const component = selected[0];
      const record = this.findComponent(component.id);
      if (component.type === "data-table") {
        const card = this.getProductCard(component.id);
        const actions = [{
          id: "add-table-row",
          componentId: component.id,
          label: "Linha da tabela",
          description: "Acrescenta uma linha visual com as colunas atuais.",
          icon: "card"
        }];
        if (card?.binding?.productId) actions.push({
          id: "add-table-variant",
          componentId: component.id,
          label: "Variação do produto",
          description: "Cria a entidade de variação, sua linha vinculada e uma imagem legendada.",
          icon: "layers"
        });
        return actions;
      }
      if (component.type === "legend-panel") return [{
        id: "add-legend-group",
        componentId: component.id,
        label: "Grupo de legenda",
        description: "Acrescenta um subgrupo destacável ao painel.",
        icon: "layers"
      }];
      if (component.type === "legend-group") return [{
        id: "add-legend-item",
        componentId: component.id,
        label: "Item de legenda",
        description: "Vincula ao grupo a próxima definição sem representação.",
        icon: "layers"
      }];
      if (component.type === "art" && record?.parent?.type === "art-gallery") return [{
        id: "add-gallery-art",
        componentId: component.id,
        label: "Imagem na galeria",
        description: "Acrescenta outra imagem com legenda individual.",
        icon: "art"
      }];
      if (component.type === "art" && this.canConvertArtToGallery(component.id)) return [{
        id: "convert-art-gallery",
        componentId: component.id,
        label: "Variação de imagem",
        description: "Preserva esta arte e cria uma galeria com uma segunda imagem.",
        icon: "art"
      }];
      return [];
    }

    performContextualAction(actionId, componentId = this.state.editor.selectedComponentId) {
      if (actionId === "add-table-row") {
        const component = this.findComponent(componentId)?.component;
        if (component?.type !== "data-table") return null;
        const values = Object.fromEntries(this.getTableColumns(component).map(column => [
          column.key,
          column.role === "price" ? "R$ 0,00" : column.role === "identifier" ? "0000" : ""
        ]));
        return this.addTableRow(component.id, values);
      }
      if (actionId === "add-table-variant") {
        const table = this.findComponent(componentId)?.component;
        const card = table?.type === "data-table" ? this.getProductCard(table.id) : null;
        const productId = card?.binding?.productId;
        if (!productId) return null;
        const product = this.getProduct(productId);
        const index = (product.metadata?.variants || []).length + 1;
        const rows = this.getTableRows(table);
        const sourceValues = rows[rows.length - 1]?.metadata?.values || product.metadata?.values || {};
        return this.addProductVariant(productId, {
          label: `Variação ${index}`,
          commercialValues: { ...sourceValues, code: "0000", price: "R$ 0,00" }
        }, { materializeVisual: true, materializeRow: true });
      }
      if (actionId === "add-gallery-art" || actionId === "convert-art-gallery") return this.addArtVariation(componentId);
      if (actionId === "add-legend-group") return this.createLegendGroup(componentId);
      if (actionId === "add-legend-item") {
        const group = this.findComponent(componentId)?.component;
        if (group?.type !== "legend-group") return null;
        const represented = new Set((group.children || []).filter(child => child.type === "legend-item").map(child => child.props?.legendKey));
        const definition = (this.getCollection("colorLegends")?.items || []).find(item => !represented.has(item.metadata?.key));
        if (!definition) return null;
        return this.addComponent("legend-item", { x: 0, y: 0, width: 92, height: 30 }, {
          parentId: group.id,
          props: { legendKey: definition.metadata.key, labelOverride: "" },
          layoutItem: { managed: true, grow: 0, span: 1 }
        });
      }
      return null;
    }

    addArtVariation(componentId) {
      const initial = this.findComponent(componentId);
      if (!initial || initial.component.type !== "art") throw new Error("Selecione uma arte para criar uma variação.");
      if (initial.parent?.type === "art-gallery") {
        const count = initial.parent.children.filter(child => child.type === "art").length + 1;
        return this.addComponent("art", { x: 0, y: 0, width: 120, height: 100 }, {
          parentId: initial.parent.id,
          constraints: { minWidth: 44, minHeight: 44 },
          props: { label: `VARIAÇÃO ${count}`, hint: "Escolha a nova imagem", role: "product", caption: `Variação ${count}`, captionPosition: "below", galleryItem: true },
          layoutItem: { managed: true, grow: 1, span: 1 }
        });
      }
      if (!this.canConvertArtToGallery(componentId)) throw new Error("Esta arte ocupa um contexto que não aceita galerias.");
      return this.runCompoundChange({ type: "art-converted-to-gallery", componentId }, () => {
        const record = this.findComponent(componentId);
        const source = record.component;
        const parent = record.parent;
        const sourceSlot = source.slot ? clone(source.slot) : null;
        const sourceLayoutItem = source.layoutItem ? clone(source.layoutItem) : null;
        const gallery = createNode("art-gallery", source.frame, {
          name: "Galeria de variações",
          props: { label: "GALERIA DE VARIAÇÕES" },
          slot: sourceSlot?.name,
          slotSpan: sourceSlot?.span,
          slotCapacity: sourceSlot?.name ? slotDefinition(parent, sourceSlot.name)?.capacity : undefined,
          order: sourceSlot?.order,
          managed: sourceSlot?.managed,
          layoutItem: sourceLayoutItem
        });
        source.slot = null;
        source.layoutItem = { managed: true, grow: 1, span: 1 };
        source.constraints.minWidth = 44;
        source.constraints.minHeight = 44;
        source.props.galleryItem = true;
        source.props.caption ||= "Principal";
        source.props.captionPosition ||= "below";
        const variation = createNode("art", { x: 0, y: 0, width: 120, height: 100 }, {
          constraints: { minWidth: 44, minHeight: 44 },
          props: { label: "VARIAÇÃO 2", hint: "Escolha a segunda imagem", role: "product", caption: "Variação 2", captionPosition: "below", galleryItem: true },
          layoutItem: { managed: true, grow: 1, span: 1 }
        });
        gallery.children = [source, variation];
        gallery.structureInitialized = true;
        record.parentChildren.splice(record.index, 1, gallery);
        this.ensureContainerMinimum(gallery, parent?.id || null);
        reflowTree(gallery);
        if (parent && sourceSlot?.name) layoutSlot(parent, sourceSlot.name);
        if (parent && usesAutoReflow(parent)) reflowTree(parent);
        this.state.editor.editingContextId = gallery.id;
        this.state.editor.selectedComponentId = variation.id;
        this.state.editor.selectedComponentIds = [variation.id];
        return gallery;
      });
    }

    applyGalleryItemsBulk(galleryId, entries = [], options = {}) {
      const gallery = this.findComponent(galleryId)?.component;
      if (gallery?.type !== "art-gallery") throw new Error("Selecione uma galeria para editar suas variações.");
      const mode = options.mode === "append" ? "append" : "replace";
      const valid = entries.slice(0, 24).map((entry, index) => ({
        caption: String(entry?.caption || `Variação ${index + 1}`).trim(),
        assetId: entry?.assetId && this.getAsset(entry.assetId) ? entry.assetId : null
      })).filter(entry => entry.caption || entry.assetId);
      if (!valid.length) throw new Error("Informe ao menos uma legenda de imagem.");
      return this.runCompoundChange({ type: "gallery-items-bulk-applied", componentId: galleryId, mode, count: valid.length }, () => {
        const existing = (gallery.children || []).filter(child => child.type === "art");
        const target = mode === "append" ? existing.length + valid.length : valid.length;
        while (existing.length < target) {
          const index = existing.length;
          const item = createNode("art", { x: 0, y: 0, width: 120, height: 100 }, {
            constraints: { minWidth: 44, minHeight: 44 },
            props: { label: `VARIAÇÃO ${index + 1}`, hint: "Escolha a imagem", role: "product", caption: `Variação ${index + 1}`, captionPosition: "below", galleryItem: true },
            layoutItem: { managed: true, grow: 1, span: 1 }
          });
          gallery.children.push(item);
          existing.push(item);
        }
        if (mode === "replace" && existing.length > target) {
          const removed = new Set(existing.slice(target).map(item => item.id));
          gallery.children = gallery.children.filter(child => !removed.has(child.id));
          existing.splice(target);
        }
        const offset = mode === "append" ? existing.length - valid.length : 0;
        valid.forEach((entry, index) => {
          const item = existing[offset + index];
          item.props = { ...(item.props || {}), label: entry.caption.toUpperCase(), caption: entry.caption, captionPosition: "below", galleryItem: true };
          if (entry.assetId) item.props.assetId = entry.assetId;
        });
        gallery.structureInitialized = true;
        this.ensureContainerMinimum(gallery, this.getParentId(gallery.id));
        reflowTree(gallery);
        const record = this.findComponent(gallery.id);
        if (record?.parent && usesAutoReflow(record.parent)) reflowTree(record.parent);
        this.state.editor.selectedComponentId = gallery.id;
        this.state.editor.selectedComponentIds = [gallery.id];
        return existing;
      });
    }

    isContainer(componentId) {
      const component = this.findComponent(componentId)?.component;
      return Boolean(component && definitionFor(component.type)?.container);
    }

    isTypeAllowed(type, parentId = this.state.editor.editingContextId) {
      if (!definitionFor(type)) return false;
      if (!parentId) return true;
      const parent = this.findComponent(parentId)?.component;
      const accepts = definitionFor(parent?.type)?.container?.accepts || [];
      return accepts.includes(type);
    }

    getSlotDefinitions(parentId) {
      const parent = this.findComponent(parentId)?.component;
      return definitionFor(parent?.type)?.container?.slots || [];
    }

    getSlotOccupants(parentId, slotName, excludingId = null) {
      const parent = this.findComponent(parentId)?.component;
      return (parent?.children || []).filter(child => child.id !== excludingId && child.slot?.name === slotName);
    }

    getSlotUsage(parentId, slotName, excludingId = null) {
      const parent = this.findComponent(parentId)?.component;
      const slot = slotDefinition(parent, slotName);
      return slot ? slotUsage(parent.children, slotName, slot, excludingId) : 0;
    }

    getMissingDefaultChildren(parentId) {
      const parent = this.findComponent(parentId)?.component;
      if (!parent) return [];
      return missingDefaultChildren(parent).map(descriptor => {
        const slot = slotDefinition(parent, descriptor.slot);
        const childDefinition = definitionFor(descriptor.type);
        return {
          type: descriptor.type,
          label: slot?.label || childDefinition?.label || descriptor.type,
          slotName: descriptor.slot
        };
      });
    }

    restoreDefaultChild(parentId, slotName, type) {
      const parent = this.findComponent(parentId)?.component;
      if (!parent) return null;
      const descriptor = missingDefaultChildren(parent).find(item => item.slot === slotName && item.type === type);
      if (!descriptor) return null;
      return this.addComponent(descriptor.type, descriptor.frame, {
        parentId,
        slotName: descriptor.slot,
        slotSpan: descriptor.slotSpan,
        props: descriptor.props,
        style: descriptor.style,
        layout: descriptor.layout,
        layoutItem: descriptor.layoutItem
      });
    }

    getContextualSeparatorState(parentId) {
      const parent = this.findComponent(parentId)?.component;
      if (!parent) return { eligible: false, gap: 0, threshold: 6, mode: "free", pairs: [] };
      const state = contextualSeparatorState(parent);
      return { ...state, pairs: state.pairs.map(pair => ({ beforeId: pair.before.id, afterId: pair.after.id })) };
    }

    addContextualSeparator(parentId) {
      const parent = this.findComponent(parentId)?.component;
      if (!parent) return null;
      const state = contextualSeparatorState(parent);
      const pair = state.pairs[0];
      if (!state.eligible || !pair) return null;
      const vertical = state.mode === "row";
      const separator = this.addComponent("separator", { x: 0, y: 0, width: vertical ? state.gap : 100, height: vertical ? 100 : state.gap }, {
        parentId,
        props: {
          orientation: vertical ? "vertical" : "horizontal",
          cap: "round",
          marker: "none",
          contextual: true,
          beforeId: pair.before.id,
          afterId: pair.after.id
        },
        style: { accentColor: parent.style?.accentColor || "brand.primary" },
        layoutItem: { managed: false, grow: 0, span: 1, overlay: true }
      });
      this.emit({ type: "contextual-separator-added", componentId: separator.id, parentId });
      return separator;
    }

    allocateCardNumber() {
      this.state.numbering ||= { cardNext: inferredNextCardNumber(this.state) };
      const next = Math.max(1, Math.round(Number(this.state.numbering.cardNext) || inferredNextCardNumber(this.state)));
      this.state.numbering.cardNext = next + 1;
      return formatCardNumber(next);
    }

    assignFreshCardNumbers(component) {
      visitSubtree(component, node => {
        if (node.type === "product-card") setCardNumberValue(node, this.allocateCardNumber());
      });
      return component;
    }

    getCardNumberChangePlan(componentId, requestedValue) {
      const record = this.findComponent(componentId);
      const card = record?.path.slice().reverse().find(node => node.type === "product-card") || null;
      const raw = String(requestedValue ?? "").trim();
      if (!card || !/^\d+$/.test(raw)) return { kind: "plain", cardId: card?.id || null, requestedValue: raw };
      const requested = Number(raw);
      const current = numericCardNumber(card);
      const cards = productCards(this.state);
      const otherNumbers = cards.filter(item => item.id !== card.id).map(numericCardNumber).filter(Number.isFinite);
      if (otherNumbers.includes(requested)) return { kind: "duplicate", cardId: card.id, current, requested };
      const maximum = Math.max(0, ...otherNumbers);
      if (requested > maximum) return { kind: "above", cardId: card.id, current, requested, maximum };
      return { kind: "plain", cardId: card.id, current, requested };
    }

    updateCardNumber(componentId, requestedValue, options = {}) {
      const plan = this.getCardNumberChangePlan(componentId, requestedValue);
      const card = plan.cardId ? this.findComponent(plan.cardId)?.component : null;
      if (!card) return null;
      const formatted = setCardNumberValue(card, requestedValue);
      if (plan.kind === "duplicate" && options.compact === true && Number.isFinite(plan.current)) {
        let afterSource = false;
        productCards(this.state).forEach(item => {
          if (item.id === card.id) {
            afterSource = true;
            return;
          }
          const value = numericCardNumber(item);
          if (afterSource && Number.isFinite(value) && value > plan.current) setCardNumberValue(item, value - 1);
        });
        if (this.state.numbering.cardNext > plan.current) this.state.numbering.cardNext = Math.max(1, this.state.numbering.cardNext - 1);
      }
      if (plan.kind === "above" && options.continueFrom === true) this.state.numbering.cardNext = plan.requested + 1;
      this.emit({ type: "card-number-updated", componentId: card.id, value: formatted, policy: options.compact ? "compact" : options.continueFrom ? "continue" : "keep" });
      return card;
    }

    getProductCard(componentOrId) {
      const componentId = typeof componentOrId === "string" ? componentOrId : componentOrId?.id;
      const record = this.findComponent(componentId);
      return productCardForRecord(record);
    }

    getProducts() {
      return this.getCollection("products")?.items || [];
    }

    getProduct(productId) {
      return this.getProducts().find(item => item.id === productId) || null;
    }

    createProduct(values = {}) {
      const normalizedValues = productValues(values);
      if (normalizedValues.assetId && !this.getAsset(normalizedValues.assetId)) normalizedValues.assetId = null;
      const metadata = productMetadata(values, normalizedValues);
      const product = this.upsertCollectionItem("products", {
        id: id("product"),
        label: normalizedValues.title,
        metadata: { ...metadata, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        reference: null
      });
      this.emit({ type: "product-created", productId: product.id });
      return product;
    }

    getProductVariants(productId) {
      return this.getProduct(productId)?.metadata?.variants || [];
    }

    materializeProductVariant(cardId, variant, sourceRow = null, options = {}) {
      const card = this.getProductCard(cardId);
      if (!card || !variant) return null;
      let artItem = null;
      if (options.art !== false) {
        let gallery = (card.children || []).find(child => child.type === "art-gallery" && child.slot?.name === "art");
        if (!gallery) {
          const art = (card.children || []).find(child => child.type === "art" && child.slot?.name === "art");
          if (art) gallery = this.addArtVariation(art.id);
          else gallery = this.addComponent("art-gallery", { x: 0, y: 0, width: Math.max(150, card.frame.width - 24), height: 110 }, { parentId: card.id, slotName: "art", props: { label: "VARIAÇÕES" } });
        }
        artItem = (gallery.children || []).find(child => child.type === "art" && child.props?.variantId === variant.id)
          || (gallery.children || []).find((child, index) => child.type === "art" && index > 0 && !child.props?.variantId);
        if (!artItem) artItem = this.addComponent("art", { x: 0, y: 0, width: 96, height: 80 }, { parentId: gallery.id, constraints: { minWidth: 44, minHeight: 44 }, layoutItem: { managed: true, grow: 1, span: 1 } });
        this.updateComponent(artItem.id, { props: {
          variantId: variant.id,
          label: String(variant.label || "Variação").toUpperCase(),
          caption: String(variant.label || "Variação"),
          captionPosition: "below",
          role: "product",
          assetId: variant.assetIds?.[0] || null,
          galleryItem: true,
          semanticBinding: "variant"
        } });
      }

      let tableRow = null;
      if (options.row !== false && sourceRow) {
        const table = cardDataTable(card);
        if (table) {
          tableRow = this.getTableRows(table).find(row => row.metadata?.sourceRowId === sourceRow.id || row.metadata?.variantId === variant.id);
          if (!tableRow) tableRow = this.addTableRow(table.id, sourceRow.values || {});
          tableRow.metadata = {
            ...(tableRow.metadata || {}),
            values: tableRowValues(sourceRow.values || {}, table.props?.columns),
            legendKeys: { ...(sourceRow.legendKeys || {}) },
            sourceRowId: sourceRow.id,
            variantId: variant.id
          };
          this.refreshTableLayout(table.id);
        }
      }
      return { card, art: artItem, row: tableRow };
    }

    addProductVariant(productId, values = {}, options = {}) {
      const product = this.getProduct(productId);
      if (!product) throw new Error("O produto selecionado não existe.");
      return this.runCompoundChange({ type: "product-variant-added", productId }, () => {
        const previousEditor = clone(this.state.editor);
        const labelInput = String(values.label || "").trim();
        const label = labelInput || "Variação sem nome";
        const usedVariantIds = new Set((product.metadata?.variants || []).map(item => item.id));
        const baseId = window.CatalogSource?.key?.(values.id || label, "variant") || "variant";
        let variantId = baseId;
        let suffix = 2;
        while (usedVariantIds.has(variantId)) variantId = `${baseId}-${suffix++}`;
        const rows = [...(product.metadata?.commercialRows || [])];
        const usedRowIds = new Set(rows.map(row => row.id));
        let sourceRow = null;
        if (options.materializeRow !== false) {
          let rowId = `${variantId}-commercial`;
          let rowSuffix = 2;
          while (usedRowIds.has(rowId)) rowId = `${variantId}-commercial-${rowSuffix++}`;
          sourceRow = {
            id: rowId,
            variantId,
            values: window.CatalogSource.normalizeRowValues(values.commercialValues || {}, product.metadata?.tableColumns),
            legendKeys: { ...(values.legendKeys || {}) }
          };
          rows.push(sourceRow);
        }
        const assetId = values.assetId && this.getAsset(values.assetId) ? String(values.assetId) : null;
        const variant = window.CatalogSource.normalizeVariant({
          id: variantId,
          label,
          attributes: values.attributes || [],
          assetIds: assetId ? [assetId] : [],
          commercialRowIds: sourceRow ? [sourceRow.id] : []
        });
        product.metadata = productMetadata({
          ...(product.metadata || {}),
          variants: [...(product.metadata?.variants || []), variant],
          commercialRows: rows
        }, productItemValues(product));
        product.metadata.needsReview = product.metadata.needsReview === true || !labelInput;
        product.metadata.updatedAt = new Date().toISOString();
        if (options.materializeVisual !== false || options.materializeRow !== false) {
          this.getProductUsage(productId).forEach(cardId => this.materializeProductVariant(cardId, variant, sourceRow, {
            art: options.materializeVisual !== false,
            row: options.materializeRow !== false
          }));
        }
        this.state.editor = previousEditor;
        this.emit({ type: "product-variant-added", productId, variantId, materializedCards: this.getProductUsage(productId).length });
        return variant;
      });
    }

    updateProductVariant(productId, variantId, patch = {}) {
      const product = this.getProduct(productId);
      const current = product?.metadata?.variants?.find(item => item.id === variantId);
      if (!product || !current) return null;
      return this.runCompoundChange({ type: "product-variant-updated", productId, variantId }, () => {
        const label = patch.label === undefined ? current.label : String(patch.label || "Variação sem nome").trim() || "Variação sem nome";
        const assetId = patch.assetId === undefined ? current.assetIds?.[0] || null : patch.assetId && this.getAsset(patch.assetId) ? String(patch.assetId) : null;
        const variants = product.metadata.variants.map(item => item.id === variantId ? window.CatalogSource.normalizeVariant({ ...item, label, assetIds: assetId ? [assetId] : [] }) : item);
        const rows = (product.metadata.commercialRows || []).map(row => {
          if (row.variantId !== variantId || !patch.commercialValues) return row;
          return { ...row, values: window.CatalogSource.normalizeRowValues({ ...(row.values || {}), ...patch.commercialValues }, product.metadata.tableColumns) };
        });
        product.metadata = productMetadata({ ...product.metadata, variants, commercialRows: rows }, productItemValues(product));
        this.getProductUsage(productId).forEach(cardId => {
          const card = this.getProductCard(cardId);
          visitSubtree(card, node => {
            if (node.type === "art" && node.props?.variantId === variantId) {
              node.props.assetId = assetId;
              if (node.props.semanticBinding === "variant") node.props.label = label.toUpperCase();
            }
            if (node.type === "data-table") this.getTableRows(node).forEach(row => {
              const source = rows.find(item => item.id === row.metadata?.sourceRowId && item.variantId === variantId);
              if (source) row.metadata.values = tableRowValues(source.values, node.props?.columns);
            });
          });
        });
        product.metadata.updatedAt = new Date().toISOString();
        this.emit({ type: "product-variant-updated", productId, variantId });
        return variants.find(item => item.id === variantId);
      });
    }

    removeProductVariant(productId, variantId, options = {}) {
      const product = this.getProduct(productId);
      const variant = product?.metadata?.variants?.find(item => item.id === variantId);
      if (!product || !variant) return false;
      return this.runCompoundChange({ type: "product-variant-removed", productId, variantId }, () => {
        const sourceRowIds = new Set(variant.commercialRowIds || []);
        product.metadata = productMetadata({
          ...product.metadata,
          variants: product.metadata.variants.filter(item => item.id !== variantId),
          commercialRows: (product.metadata.commercialRows || []).filter(row => row.variantId !== variantId && !sourceRowIds.has(row.id))
        }, productItemValues(product));
        if (options.keepRepresentations !== true) this.getProductUsage(productId).forEach(cardId => {
          const card = this.getProductCard(cardId);
          const removals = [];
          visitSubtree(card, node => {
            if (node.type === "art" && node.props?.variantId === variantId) removals.push({ kind: "component", id: node.id });
            if (node.type === "data-table") this.getTableRows(node).filter(row => row.metadata?.variantId === variantId || sourceRowIds.has(row.metadata?.sourceRowId)).forEach(row => removals.push({ kind: "row", tableId: node.id, id: row.id }));
          });
          removals.forEach(item => {
            if (item.kind === "component") this.deleteComponent(item.id);
            else {
              const table = this.findComponent(item.tableId)?.component;
              if ((table?.props?.rowIds?.length || 0) > 1) this.removeTableRow(item.tableId, item.id);
              else {
                const row = this.getTableRows(table)[0];
                row.metadata = { ...(row.metadata || {}), values: tableRowValues({}, table.props?.columns), legendKeys: {}, sourceRowId: null, variantId: null };
              }
            }
          });
        });
        product.metadata.updatedAt = new Date().toISOString();
        this.emit({ type: "product-variant-removed", productId, variantId });
        return true;
      });
    }

    createProductsBulk(entries = []) {
      const validEntries = (Array.isArray(entries) ? entries : [])
        .filter(entry => entry && String(entry.title || "").trim())
        .slice(0, 500);
      if (!validEntries.length) return [];
      return this.runCompoundChange({ type: "product-bulk-created", count: validEntries.length }, () => validEntries.map(entry => this.createProduct(entry)));
    }

    createCardsForProducts(productIds = [], options = {}) {
      const products = Array.from(new Set((productIds || []).map(String))).map(productId => this.getProduct(productId)).filter(Boolean);
      if (!products.length) return { area: null, cards: [] };
      const columns = Math.max(1, Math.min(4, Math.round(Number(options.columns) || 3)));
      const density = ["compact", "standard", "comfortable"].includes(options.density) ? options.density : "compact";
      return this.runCompoundChange({ type: "product-cards-created", count: products.length, columns, density }, () => {
        let area = null;
        const contextId = options.parentId !== undefined ? options.parentId : this.state.editor.editingContextId;
        const context = contextId ? this.findComponent(contextId)?.component : null;
        if (context?.type === "layout-container") area = context;
        if (!area) {
          const page = this.getPage();
          const margin = Math.max(0, Number(page.grid?.safeMargin) || 24);
          const gap = 12;
          const limit = page.size.height - margin;
          const occupied = (page.children || []).map(component => ({
            top: Math.max(margin, Number(component.frame?.y) || 0),
            bottom: Math.min(limit, (Number(component.frame?.y) || 0) + (Number(component.frame?.height) || 0))
          })).filter(item => item.bottom > margin && item.top < limit).sort((left, right) => left.top - right.top);
          const bands = [];
          let cursor = margin;
          occupied.forEach(item => {
            if (item.top - gap > cursor) bands.push({ y: cursor, height: item.top - gap - cursor });
            cursor = Math.max(cursor, item.bottom + gap);
          });
          if (cursor < limit) bands.push({ y: cursor, height: limit - cursor });
          if (!bands.length) bands.push({ y: margin, height: limit - margin });
          bands.sort((left, right) => right.height - left.height);
          const band = bands[0];
          if (band.height < 120) throw new Error("Não há uma faixa livre suficiente na página para criar a composição.");
          const rows = Math.ceil(products.length / columns);
          const wantedHeight = 16 + rows * (density === "compact" ? 220 : 260) + Math.max(0, rows - 1) * gap;
          area = this.addComponent("layout-container", {
            x: margin,
            y: band.y,
            width: page.size.width - margin * 2,
            height: Math.min(band.height, Math.max(120, wantedHeight))
          }, {
            parentId: null,
            props: { label: `GRADE DE PRODUTOS · ${columns} COLUNAS` },
            layout: { mode: "grid", columns, padding: 8, gap, align: "stretch", distribution: "fill", responsive: { enabled: false, breakpoint: 300, mode: "grid" } }
          });
        } else {
          this.updateComponent(area.id, { layout: { mode: "grid", columns, responsive: { enabled: false, mode: "grid" } } });
        }

        const cards = products.map(product => {
          const card = this.addComponent("product-card", { x: 0, y: 0, width: 270, height: density === "compact" ? 220 : 260 }, { parentId: area.id });
          this.bindProduct(card.id, product.id);
          this.setComponentPresentation(card.id, { presetId: "product-standard", mode: "standard", density, responsiveState: density === "compact" ? "compact" : "auto" });
          const table = cardDataTable(card);
          if (table) {
            this.updateComponent(table.id, { props: { density } });
            this.updateTableColumns(table.id, product.metadata?.tableColumns || table.props?.columns);
            this.replaceTableRowsBulk(table.id, product.metadata?.commercialRows || [{ values: product.metadata?.values || {} }], { mode: "replace", bindingSync: true });
          }
          return card;
        });
        this.state.editor.editingContextId = area.id;
        this.state.editor.selectedComponentId = cards[cards.length - 1]?.id || area.id;
        return { area, cards };
      });
    }

    createHeroGridStripForProducts(productIds = [], options = {}) {
      const products = Array.from(new Set((productIds || []).map(String))).map(productId => this.getProduct(productId)).filter(Boolean);
      if (!products.length) return { composition: null, hero: null, cards: [], strip: null };
      const columns = Math.max(2, Math.min(4, Math.round(Number(options.columns) || 3)));
      return this.runCompoundChange({ type: "hero-grid-strip-created", count: products.length, columns }, () => {
        const requestedParentId = options.parentId !== undefined ? options.parentId : this.state.editor.editingContextId;
        const parentId = requestedParentId && this.isTypeAllowed("layout-container", requestedParentId) ? requestedParentId : null;
        const template = this.getInsertableTemplate("section-hero-grid-strip");
        const frame = this.getSuggestedFrame(template.metadata.component.frame, parentId);
        const composition = this.addComponentFromTemplate("section-hero-grid-strip", frame, { parentId });
        let heroRegion = null;
        let gridRegion = null;
        let strip = null;
        visitSubtree(composition, component => {
          if (component.props?.recipeRole === "hero") heroRegion = component;
          if (component.props?.recipeRole === "grid") gridRegion = component;
          if (component.props?.recipeRole === "strip") strip = component;
        });
        if (!heroRegion || !gridRegion || !strip) throw new Error("A receita hero + grade + faixa está incompleta.");
        gridRegion.layout.columns = columns;

        const createBoundCard = (product, parent, presentation) => {
          const card = this.addComponent("product-card", { x: 0, y: 0, width: parent.frame.width, height: presentation.mode === "hero" ? 280 : 220 }, { parentId: parent.id });
          this.bindProduct(card.id, product.id);
          this.setComponentPresentation(card.id, presentation);
          const table = cardDataTable(card);
          if (table) {
            this.updateComponent(table.id, { props: { density: presentation.density } });
            this.updateTableColumns(table.id, product.metadata?.tableColumns || table.props?.columns);
            this.replaceTableRowsBulk(table.id, product.metadata?.commercialRows || [{ values: product.metadata?.values || {} }], { mode: "replace", bindingSync: true });
          }
          return card;
        };

        const hero = createBoundCard(products[0], heroRegion, { presetId: "product-hero", mode: "hero", density: "comfortable", responsiveState: "auto" });
        const cards = products.slice(1).map(product => createBoundCard(product, gridRegion, { presetId: "product-standard", mode: "standard", density: "compact", responsiveState: "compact" }));
        this.ensureContainerMinimum(heroRegion, composition.id);
        this.ensureContainerMinimum(gridRegion, composition.id);
        reflowTree(heroRegion);
        reflowTree(gridRegion);
        this.state.editor.editingContextId = gridRegion.id;
        this.state.editor.selectedComponentId = cards[cards.length - 1]?.id || hero.id;
        this.state.editor.selectedComponentIds = [this.state.editor.selectedComponentId];
        return { composition, hero, cards, strip };
      });
    }

    updateProduct(productId, patch = {}) {
      const product = this.getProduct(productId);
      if (!product) return null;
      const values = productValues({ ...productItemValues(product), ...patch });
      if (values.assetId && !this.getAsset(values.assetId)) values.assetId = null;
      product.label = values.title;
      product.metadata = { ...productMetadata({ ...(product.metadata || {}), ...patch }, values), updatedAt: new Date().toISOString() };
      this.refreshBoundCards(productId, { emit: false });
      this.emit({ type: "product-updated", productId });
      return product;
    }

    getProductUsage(productId) {
      return productCards(this.state).filter(card => card.binding?.productId === productId).map(card => card.id);
    }

    removeProduct(productId, options = {}) {
      const usage = this.getProductUsage(productId);
      if (usage.length && options.detach !== true) return false;
      if (usage.length) usage.forEach(cardId => this.unbindProduct(cardId, { emit: false }));
      (this.getSubcatalogs() || []).forEach(subcatalog => {
        subcatalog.metadata.productIds = (subcatalog.metadata.productIds || []).filter(idValue => idValue !== productId);
      });
      const removed = this.removeCollectionItem("products", productId);
      if (removed) this.emit({ type: "product-removed", productId, detachedCards: usage });
      return removed;
    }

    getSubcatalogs() {
      return this.getCollection("subcatalogs")?.items || [];
    }

    createSubcatalog(label, productIds = []) {
      const validIds = Array.from(new Set(productIds.map(String))).filter(productId => this.getProduct(productId));
      const subcatalog = this.upsertCollectionItem("subcatalogs", {
        id: id("subcatalog"),
        label: String(label || "Novo subcatálogo").trim() || "Novo subcatálogo",
        metadata: { productIds: validIds, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        reference: null
      });
      this.emit({ type: "subcatalog-created", subcatalogId: subcatalog.id });
      return subcatalog;
    }

    updateSubcatalog(subcatalogId, patch = {}) {
      const subcatalog = this.getSubcatalogs().find(item => item.id === subcatalogId);
      if (!subcatalog) return null;
      if (patch.label !== undefined) subcatalog.label = String(patch.label).trim() || subcatalog.label;
      if (patch.productIds) subcatalog.metadata.productIds = Array.from(new Set(patch.productIds.map(String))).filter(productId => this.getProduct(productId));
      subcatalog.metadata.updatedAt = new Date().toISOString();
      this.emit({ type: "subcatalog-updated", subcatalogId });
      return subcatalog;
    }

    removeSubcatalog(subcatalogId) {
      const removed = this.removeCollectionItem("subcatalogs", subcatalogId);
      if (removed) this.emit({ type: "subcatalog-removed", subcatalogId });
      return removed;
    }

    getProductTemplates() {
      return this.getComponentTemplates().filter(template => (template.metadata?.rootType || template.metadata?.component?.type) === "product-card");
    }

    applyProductToCard(cardOrId, productOrId, options = {}) {
      const card = typeof cardOrId === "string" ? this.getProductCard(cardOrId) : cardOrId;
      const product = typeof productOrId === "string" ? this.getProduct(productOrId) : productOrId;
      if (!card || card.type !== "product-card" || !product) return null;
      card.binding = normalizeProductBinding(card.binding);
      const fields = options.fields || PRODUCT_FIELDS.filter(field => card.binding.overrides[field] !== true);
      this.bindingSyncDepth += 1;
      try {
        applyCardContent(this.state, card, productItemValues(product), fields);
      } finally {
        this.bindingSyncDepth -= 1;
      }
      if (options.emit !== false) this.emit({ type: "product-binding-refreshed", cardId: card.id, productId: product.id, fields });
      return card;
    }

    refreshBoundCards(productId, options = {}) {
      const product = this.getProduct(productId);
      if (!product) return [];
      const cards = productCards(this.state).filter(card => card.binding?.productId === productId);
      cards.forEach(card => this.applyProductToCard(card, product, { emit: false }));
      if (options.emit !== false && cards.length) this.emit({ type: "product-bindings-refreshed", productId, cardIds: cards.map(card => card.id) });
      return cards;
    }

    bindProduct(componentId, productId, options = {}) {
      let card = this.getProductCard(componentId);
      const product = this.getProduct(productId);
      if (!card || !product) return null;
      if (options.templateId) card = this.applyProductTemplate(card.id, options.templateId, { emit: false }) || card;
      card.binding = normalizeProductBinding({
        ...card.binding,
        productId: product.id,
        templateId: options.templateId || card.binding?.templateId,
        overrides: options.preserveOverrides ? card.binding?.overrides : {}
      });
      this.applyProductToCard(card, product, { emit: false });
      this.state.editor.selectedComponentId = card.id;
      this.emit({ type: "product-bound", cardId: card.id, productId: product.id, templateId: card.binding.templateId });
      return card;
    }

    unbindProduct(componentId, options = {}) {
      const card = this.getProductCard(componentId);
      if (!card) return null;
      const productId = card.binding?.productId || null;
      card.binding = normalizeProductBinding({ templateId: card.binding?.templateId });
      if (options.emit !== false) this.emit({ type: "product-unbound", cardId: card.id, productId });
      return card;
    }

    setCardOverride(componentId, field, enabled) {
      const card = this.getProductCard(componentId);
      if (!card || !PRODUCT_FIELDS.includes(field)) return false;
      card.binding = normalizeProductBinding(card.binding);
      card.binding.overrides[field] = enabled === true;
      if (!enabled && card.binding.productId) this.applyProductToCard(card, card.binding.productId, { fields: [field], emit: false });
      this.emit({ type: "product-override-changed", cardId: card.id, field, enabled: card.binding.overrides[field] });
      return true;
    }

    applyProductTemplate(componentId, templateId, options = {}) {
      const record = this.findComponent(componentId);
      const card = productCardForRecord(record);
      const cardRecord = card ? this.findComponent(card.id) : null;
      const template = this.getProductTemplates().find(item => item.id === templateId);
      const snapshot = template?.metadata?.component;
      if (!cardRecord || !snapshot) return null;

      const currentContent = extractCardContent(this.state, card);
      const currentNumber = numericCardNumber(card) ?? cardNumberNode(card)?.props?.number ?? card.props?.number;
      const currentBinding = normalizeProductBinding({ ...card.binding, templateId });
      const oldRowIds = [];
      visitSubtree(card, node => {
        if (node.type === "data-table") oldRowIds.push(...(node.props?.rowIds || []));
      });

      const instance = normalizeNode(cloneNodeWithNewIds(snapshot));
      instance.id = card.id;
      instance.name = card.name;
      instance.frame = clone(card.frame);
      instance.constraints = clone(card.constraints);
      instance.slot = clone(card.slot);
      instance.layoutItem = clone(card.layoutItem);
      instance.binding = currentBinding;
      instance.presentation = window.CatalogPresentations?.normalizePresentation?.({ ...(instance.presentation || {}), templateId }, instance.type) || instance.presentation;
      materializeTemplateTableRows(this.state, instance, template.metadata.tableRows);
      setCardNumberValue(instance, currentNumber);
      applyCardContent(this.state, instance, currentContent);
      cardRecord.parentChildren[cardRecord.index] = instance;
      oldRowIds.forEach(rowId => {
        if (this.getTableRowUsage(rowId).length) return;
        const rows = this.getCollection("tableRows")?.items || [];
        const index = rows.findIndex(item => item.id === rowId);
        if (index >= 0) rows.splice(index, 1);
      });
      if (instance.binding.productId) this.applyProductToCard(instance, instance.binding.productId, { emit: false });
      if (definitionFor(instance.type)?.container) reflowTree(instance);
      this.state.editor.selectedComponentId = instance.id;
      if (options.emit !== false) this.emit({ type: "product-template-applied", cardId: instance.id, templateId, productId: instance.binding.productId });
      return instance;
    }

    setCardPresentationTemplate(componentId, templateId) {
      const card = this.getProductCard(componentId);
      if (!card) return null;
      if (!templateId) {
        card.binding = normalizeProductBinding({ ...card.binding, templateId: null });
        card.presentation = window.CatalogPresentations?.normalizePresentation?.({ ...(card.presentation || {}), templateId: null }, card.type) || card.presentation;
        this.emit({ type: "product-template-cleared", cardId: card.id });
        return card;
      }
      return this.applyProductTemplate(card.id, templateId);
    }

    getComponentTemplates() {
      return this.getCollection("templates")?.items || [];
    }

    getSectionRecipes() {
      const parent = this.getEditingContext();
      const contextType = parent?.type || "page";
      return (window.CatalogSectionRecipes?.list?.() || []).filter(recipe => (recipe.contexts || ["page", "layout-container"]).includes(contextType) && this.isTypeAllowed(recipe.component?.type, parent?.id || null));
    }

    getInsertableTemplate(templateId) {
      const saved = this.getComponentTemplates().find(item => item.id === templateId);
      if (saved) return saved;
      const recipe = window.CatalogSectionRecipes?.get?.(templateId);
      if (!recipe) return null;
      return {
        id: recipe.id,
        label: recipe.label,
        metadata: {
          rootType: recipe.component?.type,
          kind: "section-recipe",
          official: true,
          version: recipe.version,
          description: recipe.description,
          icon: recipe.icon,
          contexts: recipe.contexts,
          focusRole: recipe.focusRole || null,
          component: recipe.component,
          tableRows: []
        },
        reference: null
      };
    }

    saveComponentAsTemplate(componentId, label) {
      const source = this.findComponent(componentId)?.component;
      if (!source) return null;
      const snapshot = clone(source);
      snapshot.slot = null;
      snapshot.layoutItem = null;
      snapshot.frame = { ...snapshot.frame, x: 0, y: 0 };
      if (snapshot.type === "product-card") snapshot.binding = normalizeProductBinding();
      const template = this.upsertCollectionItem("templates", {
        id: id("template"),
        label: String(label || source.name || definitionFor(source.type)?.label || "Componente salvo").trim(),
        metadata: window.CatalogPresentations?.normalizeTemplateMetadata?.({
          rootType: source.type,
          kind: source.type === "product-card" ? "product-presentation" : "snapshot",
          savedAt: new Date().toISOString(),
          sourceComponentId: source.id,
          component: snapshot,
          tableRows: collectTemplateTableRows(this.state, source)
        }, snapshot) || {
          rootType: source.type,
          kind: source.type === "product-card" ? "product-presentation" : "snapshot",
          savedAt: new Date().toISOString(),
          sourceComponentId: source.id,
          component: snapshot,
          tableRows: collectTemplateTableRows(this.state, source)
        },
        reference: null
      });
      this.emit({ type: "component-template-saved", componentId: source.id, templateId: template.id });
      return template;
    }

    removeComponentTemplate(templateId) {
      const removed = this.removeCollectionItem("templates", templateId);
      if (removed) this.emit({ type: "component-template-removed", templateId });
      return removed;
    }

    addComponentFromTemplate(templateId, frame, options = {}) {
      const template = this.getInsertableTemplate(templateId);
      const snapshot = template?.metadata?.component;
      const type = template?.metadata?.rootType || snapshot?.type;
      if (!snapshot || !type || !definitionFor(type)) throw new Error("O componente salvo não possui uma subárvore válida.");
      const parentId = options.parentId !== undefined ? options.parentId : this.state.editor.editingContextId;
      const contextType = parentId ? this.findComponent(parentId)?.component?.type : "page";
      if (Array.isArray(template.metadata?.contexts) && !template.metadata.contexts.includes(contextType)) throw new Error("Esta estrutura pronta não é compatível com o contexto atual.");
      if (!this.isTypeAllowed(type, parentId)) throw new Error("Este componente salvo não é aceito no contexto atual.");
      const parent = parentId ? this.findComponent(parentId)?.component : null;
      const children = parent ? parent.children : this.getPage().children;
      let slot = null;
      let requestedSlotSpan = 1;

      if (options.slotName && parent) {
        slot = slotDefinition(parent, options.slotName);
        if (!slot || !slot.accepts.includes(type)) throw new Error("O tipo do componente salvo não é aceito neste slot.");
        requestedSlotSpan = normalizedSlotSpan(options.slotSpan, slot.capacity);
        const occupants = this.getSlotOccupants(parentId, options.slotName);
        let usage = slotUsage(parent.children, options.slotName, slot);
        if (usage + requestedSlotSpan > slot.capacity) {
          if (!options.replace) {
            const error = new Error("O slot já está ocupado.");
            error.code = "SLOT_FULL";
            throw error;
          }
          occupants.slice().reverse().forEach(occupant => {
            if (usage + requestedSlotSpan <= slot.capacity) return;
            const index = parent.children.findIndex(child => child.id === occupant.id);
            if (index >= 0) {
              usage -= slotSpan(occupant, slot);
              parent.children.splice(index, 1);
            }
          });
        }
      }

      const instance = normalizeNode(cloneNodeWithNewIds(snapshot));
      visitSubtree(instance, hydrateDefaultChildren);
      instance.name = template.label || instance.name;
      instance.frame = { ...instance.frame, ...(frame || {}), x: Math.round(frame?.x ?? instance.frame.x), y: Math.round(frame?.y ?? instance.frame.y) };
      instance.slot = slot ? { name: slot.name, order: this.getSlotOccupants(parentId, slot.name).length, managed: true, span: requestedSlotSpan } : null;
      instance.layoutItem = definitionFor(parent?.type)?.container?.autoLayout ? { managed: true, grow: 1, span: 1 } : null;
      materializeTemplateTableRows(this.state, instance, template.metadata.tableRows);
      ensureTableRowsForSubtree(this.state, instance);
      this.assignFreshCardNumbers(instance);
      children.push(instance);
      if (definitionFor(instance.type)?.container) {
        this.ensureContainerMinimum(instance, parentId);
        reflowTree(instance);
      }
      if (parent && slot) layoutSlot(parent, slot.name);
      if (parent && usesAutoReflow(parent)) {
        this.ensureContainerMinimum(parent, this.getParentId(parent.id));
        reflowTree(parent);
      }
      let focus = null;
      if (template.metadata?.focusRole) visitSubtree(instance, component => {
        if (!focus && component.props?.recipeRole === template.metadata.focusRole && definitionFor(component.type)?.container) focus = component;
      });
      this.state.editor.editingContextId = focus?.id || this.state.editor.editingContextId;
      this.state.editor.selectedComponentId = focus?.id || instance.id;
      this.state.editor.selectedComponentIds = [this.state.editor.selectedComponentId];
      this.emit({ type: template.metadata?.official ? "section-recipe-inserted" : "component-template-inserted", componentId: instance.id, selectedComponentId: this.state.editor.selectedComponentId, templateId, parentId, slotName: slot?.name || null });
      return instance;
    }

    insertComponentFromTemplate(templateId, options = {}) {
      const template = this.getInsertableTemplate(templateId);
      const type = template?.metadata?.rootType || template?.metadata?.component?.type;
      if (!template || !type) return null;
      const previousContextId = this.state.editor.editingContextId;
      const parentId = this.getContextualInsertionTarget(type, options);
      const contexts = template.metadata?.contexts;
      const contextType = parentId ? this.findComponent(parentId)?.component?.type : "page";
      if (Array.isArray(contexts) && !contexts.includes(contextType)) return null;
      const compatibleSlots = parentId ? this.getSlotDefinitions(parentId).filter(item => item.accepts.includes(type)) : [];
      const slot = options.slotName ? this.getSlotDefinitions(parentId).find(item => item.name === options.slotName) : this.getPreferredSlot(parentId, type);
      if (compatibleSlots.length && !slot) throw new Error("Todos os slots compatíveis estão ocupados. Remova uma peça ou arraste para criar um override livre.");
      const frame = slot ? { ...template.metadata.component.frame, x: 0, y: 0 } : this.getSuggestedFrame(template.metadata.component.frame, parentId);
      if (parentId !== previousContextId && parentId) this.state.editor.editingContextId = parentId;
      return this.addComponentFromTemplate(templateId, frame, { ...options, parentId, slotName: slot?.name || null });
    }

    setSelection(componentId, options = {}) {
      const component = this.findComponent(componentId)?.component || null;
      if (!component) {
        this.state.editor.selectedComponentId = null;
        this.state.editor.selectedComponentIds = [];
        this.emit({ type: "selection", componentId: null, componentIds: [] });
        return;
      }

      const additive = options.additive === true || options.toggle === true;
      let selectedIds = additive ? this.getSelectedIds() : [];
      if (additive && selectedIds.length) {
        const parentId = this.getParentId(component.id);
        const sameParent = selectedIds.every(selectedId => this.getParentId(selectedId) === parentId);
        if (!sameParent) selectedIds = [];
      }
      if (options.toggle === true && selectedIds.includes(component.id)) {
        selectedIds = selectedIds.filter(selectedId => selectedId !== component.id);
      } else if (!selectedIds.includes(component.id)) {
        selectedIds.push(component.id);
      }
      this.state.editor.selectedComponentIds = selectedIds;
      this.state.editor.selectedComponentId = selectedIds.includes(component.id) ? component.id : selectedIds[selectedIds.length - 1] || null;
      this.emit({ type: "selection", componentId: this.state.editor.selectedComponentId, componentIds: selectedIds.slice() });
    }

    selectComponentInContext(componentId, options = {}) {
      const record = this.findComponent(componentId);
      if (!record) return false;
      const parentId = record.parent?.id || null;
      const previousContextId = this.state.editor.editingContextId;
      this.state.editor.editingContextId = parentId;
      if (options.additive === true || options.toggle === true) {
        this.setSelection(componentId, options);
        return true;
      }
      this.state.editor.selectedComponentId = componentId;
      this.state.editor.selectedComponentIds = [componentId];
      this.emit({
        type: "selection",
        componentId,
        componentIds: [componentId],
        source: "layers",
        contextChanged: previousContextId !== parentId,
        previousContextId,
        editingContextId: parentId
      });
      return true;
    }

    selectContextChildren() {
      const componentIds = this.getContextChildren().map(component => component.id);
      this.state.editor.selectedComponentIds = componentIds;
      this.state.editor.selectedComponentId = componentIds[componentIds.length - 1] || null;
      this.emit({ type: "selection", componentId: this.state.editor.selectedComponentId, componentIds: componentIds.slice(), source: "context" });
      return componentIds;
    }

    setEditingContext(componentId) {
      if (componentId && !this.isContainer(componentId)) return false;
      this.state.editor.editingContextId = componentId || null;
      this.state.editor.selectedComponentId = componentId || null;
      this.state.editor.selectedComponentIds = componentId ? [componentId] : [];
      this.emit({ type: "editing-context", componentId: componentId || null });
      return true;
    }

    exitEditingContext() {
      const currentId = this.state.editor.editingContextId;
      if (!currentId) return;
      const record = this.findComponent(currentId);
      const parentId = record?.parent?.id || null;
      this.state.editor.editingContextId = parentId;
      this.state.editor.selectedComponentId = currentId;
      this.state.editor.selectedComponentIds = currentId ? [currentId] : [];
      this.emit({ type: "editing-context", componentId: parentId, exitedId: currentId });
    }

    setEditorSetting(key, value) {
      if (!(key in this.state.editor)) return;
      this.setEditorSettings({ [key]: value });
    }

    setEditorSettings(patch) {
      const applied = {};
      Object.entries(patch || {}).forEach(([key, value]) => {
        if (!(key in this.state.editor)) return;
        this.state.editor[key] = value;
        applied[key] = value;
      });
      const keys = Object.keys(applied);
      if (!keys.length) return;
      this.emit({ type: "editor-setting", key: keys.length === 1 ? keys[0] : null, value: keys.length === 1 ? applied[keys[0]] : null, patch: applied });
    }

    clampFrame(frame, component, parentId = this.getParentId(component.id)) {
      const size = this.getContainerSize(parentId);
      const proposed = { ...component.frame, ...frame };
      const minimum = this.getReflowMinimum(component, proposed);
      const minWidth = Math.min(minimum.width, size.width);
      const minHeight = Math.min(minimum.height, size.height);
      const width = Math.max(minWidth, Math.min(Number(frame.width), size.width));
      const height = Math.max(minHeight, Math.min(Number(frame.height), size.height));
      return {
        x: Math.max(0, Math.min(Number(frame.x), size.width - width)),
        y: Math.max(0, Math.min(Number(frame.y), size.height - height)),
        width,
        height
      };
    }

    ensureContainerMinimum(component, parentId = this.getParentId(component.id)) {
      if (!definitionFor(component?.type)?.container) return;
      const minimum = this.getReflowMinimum(component, component.frame);
      if (component.frame.width >= minimum.width && component.frame.height >= minimum.height) return;
      component.frame = this.clampFrame({
        ...component.frame,
        width: Math.max(component.frame.width, minimum.width),
        height: Math.max(component.frame.height, minimum.height)
      }, component, parentId);
    }

    createGeometryDraftStore() {
      const draft = new this.constructor(clone(this.state));
      draft.listeners.clear();
      draft.historyUndo = [];
      draft.historyRedo = [];
      draft.historySuspended = true;
      draft.geometryResolutions = new Map();
      draft.lastGeometryTransaction = null;
      return draft;
    }

    planGeometryTransaction(requests = [], options = {}) {
      const source = Array.isArray(requests) ? requests.slice(0, 40) : [];
      const requestedIds = new Set();
      const invalid = Array.isArray(requests) && requests.length > 40
        ? [{ componentId: null, code: "too-many-requests", maximum: 40, received: requests.length }]
        : [];
      const normalized = source.map(request => {
        const componentId = String(request?.componentId || "");
        const component = this.findComponent(componentId)?.component;
        const framePatch = request?.frame && typeof request.frame === "object" ? request.frame : null;
        const keys = framePatch ? Object.keys(framePatch).filter(key => ["x", "y", "width", "height"].includes(key)) : [];
        if (!component || !keys.length || keys.some(key => !Number.isFinite(Number(framePatch[key]))) || requestedIds.has(componentId)) {
          invalid.push({
            componentId: componentId || null,
            code: !component ? "component-missing" : requestedIds.has(componentId) ? "duplicate-request" : "invalid-frame"
          });
          return null;
        }
        requestedIds.add(componentId);
        return {
          componentId,
          frame: {
            ...component.frame,
            ...Object.fromEntries(keys.map(key => [key, Number(framePatch[key])]))
          },
          releaseAuthority: request.releaseAuthority === true
        };
      }).filter(Boolean);

      const blocked = conflicts => ({
        status: "blocked",
        requested: normalized.map(request => ({ componentId: request.componentId, frame: { ...request.frame } })),
        resolved: normalized.map(request => ({ componentId: request.componentId, frame: { ...this.findComponent(request.componentId).component.frame } })),
        changes: [],
        authorityChanges: [],
        reasons: [...new Set(conflicts.map(conflict => conflict.code))],
        conflicts
      });
      if (!normalized.length || invalid.length) return blocked(invalid.length ? invalid : [{ componentId: null, code: "empty-request" }]);

      const before = geometrySnapshot(this);
      const draft = this.createGeometryDraftStore();
      normalized.forEach(request => {
        if (request.releaseAuthority) {
          draft.markSlotFree(request.componentId);
          draft.markLayoutFree(request.componentId);
        }
        draft.updateComponent(request.componentId, { frame: request.frame });
      });

      if (options.selection?.componentIds) {
        draft.state.editor.selectedComponentIds = options.selection.componentIds.slice();
        draft.state.editor.selectedComponentId = options.selection.primaryId || options.selection.componentIds.at(-1) || null;
      }
      draft.emit(options.change || { type: "geometry-transaction-planned", componentIds: normalized.map(request => request.componentId) }, { ephemeral: true });
      (draft.getPage()?.children || []).forEach(component => {
        if (definitionFor(component.type)?.container && component.reflow?.mode !== "manual") draft.reflowComponentTree(component, { derived: true });
      });

      const after = geometrySnapshot(draft);
      const directIds = new Set(normalized.map(request => request.componentId));
      const changes = [];
      const authorityChanges = [];
      new Set([...before.keys(), ...after.keys()]).forEach(componentId => {
        const previous = before.get(componentId);
        const next = after.get(componentId);
        if (!previous || !next) return;
        if (!frameEquals(previous.frame, next.frame)) {
          changes.push({
            componentId,
            direct: directIds.has(componentId),
            before: { ...previous.frame },
            after: { ...next.frame }
          });
        }
        if (previous.slotManaged !== next.slotManaged || previous.layoutManaged !== next.layoutManaged) {
          authorityChanges.push({
            componentId,
            before: { slotManaged: previous.slotManaged, layoutManaged: previous.layoutManaged },
            after: { slotManaged: next.slotManaged, layoutManaged: next.layoutManaged }
          });
        }
      });

      const affectedIds = geometryAffectedIds(before, after, directIds);
      const conflicts = worsenedGeometryConflicts(
        geometryConflicts(this, affectedIds),
        geometryConflicts(draft, affectedIds)
      );
      const resolved = normalized.map(request => ({
        componentId: request.componentId,
        frame: { ...after.get(request.componentId).frame }
      }));
      const reasons = [];
      normalized.forEach(request => {
        const resolution = draft.getLastGeometryResolution(request.componentId);
        reasons.push(...(resolution?.reasons || []));
      });
      if (changes.some(change => !change.direct)) reasons.push("derived-reflow");
      if (authorityChanges.length) reasons.push("layout-authority-released");
      if (conflicts.length) reasons.push(...conflicts.map(conflict => conflict.code));

      const plan = {
        status: conflicts.length
          ? "blocked"
          : resolved.some((entry, index) => !frameEquals(entry.frame, normalized[index].frame)) || changes.some(change => !change.direct)
            ? "adjusted"
            : "applied",
        requested: normalized.map(request => ({ componentId: request.componentId, frame: { ...request.frame } })),
        resolved,
        changes,
        authorityChanges,
        reasons: [...new Set(reasons)],
        conflicts
      };
      Object.defineProperty(plan, GEOMETRY_PLAN_DRAFT, { value: draft });
      return plan;
    }

    applyGeometryTransaction(requests = [], options = {}) {
      const plan = this.planGeometryTransaction(requests, options);
      const report = publicGeometryPlan(plan);
      this.lastGeometryTransaction = report;
      if (plan.status === "blocked") return report;

      const draft = plan[GEOMETRY_PLAN_DRAFT];
      synchronizeGeometryState(this, draft);
      if (options.selection?.componentIds) {
        this.state.editor.selectedComponentIds = options.selection.componentIds.slice();
        this.state.editor.selectedComponentId = options.selection.primaryId || options.selection.componentIds.at(-1) || null;
      }
      plan.requested.forEach((request, index) => {
        this.geometryResolutions.set(request.componentId, {
          requested: { ...request.frame },
          resolved: { ...plan.resolved[index].frame },
          reasons: report.reasons.slice(),
          status: report.status
        });
      });
      const change = options.change || { type: "components-transformed", componentIds: plan.requested.map(request => request.componentId) };
      this.emit({ ...change, geometryTransaction: report });
      return report;
    }

    updateComponentGeometry(componentId, frame, options = {}) {
      return this.applyGeometryTransaction([{
        componentId,
        frame,
        releaseAuthority: options.releaseAuthority !== false
      }], {
        change: options.change || { type: "component-updated", componentId, patch: { frame: clone(frame) } },
        selection: options.selection
      });
    }

    addComponent(type, frame, options = {}) {
      const parentId = options.parentId !== undefined ? options.parentId : this.state.editor.editingContextId;
      if (!this.isTypeAllowed(type, parentId)) throw new Error("Este componente não é aceito no contexto atual.");
      const parent = parentId ? this.findComponent(parentId)?.component : null;
      const children = parent ? parent.children : this.getPage().children;
      let slot = null;
      let requestedSlotSpan = 1;

      if (options.slotName && parent) {
        slot = slotDefinition(parent, options.slotName);
        if (!slot || !slot.accepts.includes(type)) throw new Error("O tipo não é aceito neste slot.");
        requestedSlotSpan = normalizedSlotSpan(options.slotSpan, slot.capacity);
        const occupants = this.getSlotOccupants(parentId, options.slotName);
        let usage = slotUsage(parent.children, options.slotName, slot);
        if (usage + requestedSlotSpan > slot.capacity) {
          if (!options.replace) {
            const error = new Error("O slot já está ocupado.");
            error.code = "SLOT_FULL";
            throw error;
          }
          occupants.slice().reverse().forEach(occupant => {
            if (usage + requestedSlotSpan <= slot.capacity) return;
            const index = parent.children.findIndex(child => child.id === occupant.id);
            if (index >= 0) {
              usage -= slotSpan(occupant, slot);
              parent.children.splice(index, 1);
            }
          });
        }
      }

      const parentDefinition = parent ? definitionFor(parent.type) : null;
      const componentProps = { ...(options.props || {}) };
      if (type === "product-card" && componentProps.number == null) componentProps.number = this.allocateCardNumber();
      const componentConstraints = parent?.type === "art-gallery" && type === "art"
        ? { minWidth: 44, minHeight: 44, ...(options.constraints || {}) }
        : options.constraints;
      const component = createNode(type, frame, {
        props: componentProps,
        style: options.style,
        constraints: componentConstraints,
        layout: options.layout,
        reflow: options.reflow,
        layoutItem: parentDefinition?.container?.autoLayout ? { managed: true, grow: 1, span: 1, ...(options.layoutItem || {}) } : options.layoutItem,
        slot: options.slotName || null,
        slotSpan: requestedSlotSpan,
        slotCapacity: slot?.capacity,
        order: slot ? this.getSlotOccupants(parentId, slot.name).length : 0,
        managed: Boolean(slot)
      });
      children.push(component);
      hydrateDefaultChildren(component);
      ensureTableRowsForSubtree(this.state, component);
      if (definitionFor(component.type)?.container) {
        this.ensureContainerMinimum(component, parentId);
        reflowTree(component);
      }
      if (parent && slot) layoutSlot(parent, slot.name);
      if (parent && usesAutoReflow(parent)) {
        this.ensureContainerMinimum(parent, this.getParentId(parent.id));
        reflowTree(parent);
      }
      this.state.editor.selectedComponentId = component.id;
      this.emit({ type: "component-added", componentId: component.id, parentId, slotName: options.slotName || null });
      return component;
    }

    updateComponent(componentId, patch) {
      const record = this.findComponent(componentId);
      if (!record) return;
      const component = record.component;
      const overrideFields = this.bindingSyncDepth ? [] : productOverrideFieldsForPatch(record, patch);
      const requestedFrame = patch.frame ? { ...component.frame, ...patch.frame } : null;
      if (patch.frame) component.frame = this.clampFrame(requestedFrame, component, record.parent?.id || null);
      if (patch.constraints) Object.assign(component.constraints, patch.constraints);
      if (patch.props) {
        const props = { ...patch.props };
        if (component.type === "text" && hasOwn(props, "align")) props.alignExplicit = true;
        if (component.type === "text" && hasOwn(props, "overflow")) props.overflowExplicit = true;
        if (component.type === "art") {
          for (const key of ["focalX", "focalY"]) {
            if (props[key] !== undefined) props[key] = Math.max(0, Math.min(100, Number(props[key]) || 0));
          }
        }
        Object.assign(component.props, props);
      }
      if (patch.style) Object.assign(component.style, patch.style);
      if (patch.layout && component.layout) {
        const responsive = patch.layout.responsive ? { ...(component.layout.responsive || {}), ...patch.layout.responsive } : component.layout.responsive;
        Object.assign(component.layout, patch.layout, { responsive });
      }
      if (patch.reflow && definitionFor(component.type)?.container) component.reflow = normalizedReflow(definitionFor(component.type), { ...(component.reflow || {}), ...patch.reflow });
      if (patch.layoutItem) component.layoutItem = { managed: true, grow: 1, span: 1, ...(component.layoutItem || {}), ...patch.layoutItem };
      if (patch.slot !== undefined) component.slot = patch.slot;
      if (patch.name !== undefined) component.name = patch.name;
      if (definitionFor(component.type)?.container && (patch.frame || patch.layout || patch.reflow)) {
        this.ensureContainerMinimum(component, record.parent?.id || null);
        reflowTree(component);
      }
      if (requestedFrame) {
        const resolvedFrame = { ...component.frame };
        const reasons = [];
        if (resolvedFrame.width !== requestedFrame.width || resolvedFrame.height !== requestedFrame.height) reasons.push("minimum-or-content");
        if (resolvedFrame.x !== requestedFrame.x || resolvedFrame.y !== requestedFrame.y) reasons.push("bounds-or-grid");
        if (component.slot?.name && component.slot.managed !== false) reasons.push("managed-slot");
        if (component.layoutItem?.managed !== false && record.parent && definitionFor(record.parent.type)?.container?.autoLayout) reasons.push("managed-layout");
        this.geometryResolutions.set(componentId, { requested: requestedFrame, resolved: resolvedFrame, reasons: [...new Set(reasons)] });
      }
      if (overrideFields.length) {
        const card = productCardForRecord(record);
        card.binding = normalizeProductBinding(card.binding);
        overrideFields.forEach(field => { card.binding.overrides[field] = true; });
      }
      this.emit({ type: "component-updated", componentId, patch, geometry: this.getLastGeometryResolution(componentId) });
    }

    markSlotFree(componentId) {
      const record = this.findComponent(componentId);
      if (!record?.component.slot) return;
      record.component.slot.managed = false;
    }

    markLayoutFree(componentId) {
      const record = this.findComponent(componentId);
      if (!record?.parent || !definitionFor(record.parent.type)?.container?.autoLayout) return;
      record.component.layoutItem = { grow: 1, span: 1, ...(record.component.layoutItem || {}), managed: false };
    }

    setComponentLayoutAuthority(componentId, managed) {
      const record = this.findComponent(componentId);
      if (!record?.parent) return false;
      if (record.component.slot?.name) record.component.slot.managed = Boolean(managed);
      if (definitionFor(record.parent.type)?.container?.autoLayout && !record.component.slot?.name) {
        record.component.layoutItem = { grow: 1, span: 1, ...(record.component.layoutItem || {}), managed: Boolean(managed) };
      }
      if (managed) {
        if (record.component.slot?.name) this.fitComponentToSlot(componentId);
        else this.fitComponentToAutoLayout(componentId);
      } else {
        this.emit({ type: "component-layout-authority-changed", componentId, managed: false });
      }
      return true;
    }

    fitComponentToAutoLayout(componentId) {
      const record = this.findComponent(componentId);
      if (!record?.parent || !definitionFor(record.parent.type)?.container?.autoLayout) return false;
      record.component.layoutItem = { managed: true, grow: 1, span: 1, ...(record.component.layoutItem || {}), managed: true };
      this.ensureContainerMinimum(record.parent, this.getParentId(record.parent.id));
      window.CatalogLayoutEngine?.applyAutoLayout(record.parent);
      this.emit({ type: "component-fitted-to-layout", componentId, parentId: record.parent.id });
      return true;
    }

    applyAutoLayout(componentId) {
      const component = this.findComponent(componentId)?.component;
      if (!component || !definitionFor(component.type)?.container?.autoLayout) return false;
      this.ensureContainerMinimum(component, this.getParentId(component.id));
      window.CatalogLayoutEngine?.applyAutoLayout(component);
      this.emit({ type: "auto-layout-applied", componentId });
      return true;
    }

    fitComponentToSlot(componentId) {
      const record = this.findComponent(componentId);
      if (!record?.parent || !record.component.slot?.name) return;
      record.component.slot.managed = true;
      if (usesAutoReflow(record.parent)) reflowTree(record.parent);
      else layoutSlot(record.parent, record.component.slot.name);
      this.emit({ type: "component-fitted-to-slot", componentId, slotName: record.component.slot.name });
    }

    updateSlotSpan(componentId, value) {
      const record = this.findComponent(componentId);
      if (!record?.parent || !record.component.slot?.name) return false;
      const slot = slotDefinition(record.parent, record.component.slot.name);
      if (!slot) return false;
      const span = normalizedSlotSpan(value, slot.capacity);
      const usage = slotUsage(record.parent.children, slot.name, slot, componentId);
      if (usage + span > slot.capacity) return false;
      record.component.slot.span = span;
      record.component.slot.managed = true;
      if (usesAutoReflow(record.parent)) reflowTree(record.parent);
      else layoutSlot(record.parent, slot.name);
      this.emit({ type: "component-slot-span-changed", componentId, slotName: slot.name, span });
      return true;
    }

    moveComponentToSlot(componentId, slotName, options = {}) {
      const record = this.findComponent(componentId);
      if (!record?.parent) return false;
      const component = record.component;
      const parent = record.parent;
      const previousSlot = component.slot?.name || null;

      if (!slotName) {
        component.slot = null;
        if (previousSlot && usesAutoReflow(parent)) reflowTree(parent);
        else if (previousSlot) layoutSlot(parent, previousSlot);
        this.emit({ type: "component-slot-changed", componentId, slotName: null });
        return true;
      }

      const slot = slotDefinition(parent, slotName);
      if (!slot || !slot.accepts.includes(component.type)) return false;
      const occupants = this.getSlotOccupants(parent.id, slotName, componentId);
      const requestedSpan = normalizedSlotSpan(options.slotSpan ?? component.slot?.span, slot.capacity);
      let usage = slotUsage(parent.children, slotName, slot, componentId);
      if (usage + requestedSpan > slot.capacity) {
        if (!options.replace) return false;
        occupants.slice().reverse().forEach(occupant => {
          if (usage + requestedSpan <= slot.capacity) return;
          const index = parent.children.findIndex(child => child.id === occupant.id);
          if (index >= 0) {
            usage -= slotSpan(occupant, slot);
            parent.children.splice(index, 1);
          }
        });
      }
      component.slot = { name: slotName, order: occupants.length, managed: true, span: requestedSpan };
      if (usesAutoReflow(parent)) reflowTree(parent);
      else {
        if (previousSlot && previousSlot !== slotName) layoutSlot(parent, previousSlot);
        layoutSlot(parent, slotName);
      }
      this.emit({ type: "component-slot-changed", componentId, slotName });
      return true;
    }

    reorderComponent(componentId, direction) {
      const record = this.findComponent(componentId);
      if (!record) return false;
      const siblings = record.parentChildren;
      const sameGroup = siblings.filter(child => (child.slot?.name || null) === (record.component.slot?.name || null));
      const currentIndex = sameGroup.findIndex(child => child.id === componentId);
      const target = sameGroup[currentIndex + direction];
      if (!target) return false;
      const sourceArrayIndex = siblings.findIndex(child => child.id === componentId);
      const targetArrayIndex = siblings.findIndex(child => child.id === target.id);
      [siblings[sourceArrayIndex], siblings[targetArrayIndex]] = [siblings[targetArrayIndex], siblings[sourceArrayIndex]];
      if (record.component.slot?.name && record.parent) {
        const sourceOrder = record.component.slot.order ?? currentIndex;
        record.component.slot.order = target.slot?.order ?? (currentIndex + direction);
        if (target.slot) target.slot.order = sourceOrder;
        layoutSlot(record.parent, record.component.slot.name);
      }
      if (record.parent && usesAutoReflow(record.parent)) reflowTree(record.parent);
      this.emit({ type: "component-reordered", componentId, direction });
      return true;
    }

    getBatchSelection(componentIds = this.getSelectedIds(), minimum = 2) {
      const uniqueIds = Array.from(new Set(componentIds || []));
      const records = uniqueIds.map(componentId => this.findComponent(componentId)).filter(Boolean);
      if (records.length < minimum) return null;
      const parentId = records[0].parent?.id || null;
      if (!records.every(record => (record.parent?.id || null) === parentId)) return null;
      return { parentId, records };
    }

    releaseBatchLayout(records) {
      records.forEach(record => {
        if (record.component.slot?.name) this.markSlotFree(record.component.id);
        if (record.parent && definitionFor(record.parent.type)?.container?.autoLayout) this.markLayoutFree(record.component.id);
      });
    }

    alignComponents(componentIds, alignment) {
      const allowed = new Set(["left", "center", "right", "top", "middle", "bottom"]);
      const selection = this.getBatchSelection(componentIds);
      if (!selection || !allowed.has(alignment)) return false;
      const components = selection.records.map(record => record.component);
      const left = Math.min(...components.map(component => component.frame.x));
      const right = Math.max(...components.map(component => component.frame.x + component.frame.width));
      const top = Math.min(...components.map(component => component.frame.y));
      const bottom = Math.max(...components.map(component => component.frame.y + component.frame.height));
      const requests = components.map(component => {
        const frame = {};
        if (alignment === "left") frame.x = left;
        if (alignment === "center") frame.x = left + (right - left - component.frame.width) / 2;
        if (alignment === "right") frame.x = right - component.frame.width;
        if (alignment === "top") frame.y = top;
        if (alignment === "middle") frame.y = top + (bottom - top - component.frame.height) / 2;
        if (alignment === "bottom") frame.y = bottom - component.frame.height;
        return { componentId: component.id, frame, releaseAuthority: true };
      });
      const componentIdsInOrder = components.map(component => component.id);
      const plan = this.applyGeometryTransaction(requests, {
        change: { type: "components-aligned", componentIds: componentIdsInOrder, alignment },
        selection: { componentIds: componentIdsInOrder, primaryId: componentIdsInOrder.at(-1) }
      });
      return plan.status !== "blocked";
    }

    distributeComponents(componentIds, axis) {
      const selection = this.getBatchSelection(componentIds, 3);
      if (!selection || !["horizontal", "vertical"].includes(axis)) return false;
      const horizontal = axis === "horizontal";
      const components = selection.records.map(record => record.component).sort((left, right) => {
        const leftCenter = left.frame[horizontal ? "x" : "y"] + left.frame[horizontal ? "width" : "height"] / 2;
        const rightCenter = right.frame[horizontal ? "x" : "y"] + right.frame[horizontal ? "width" : "height"] / 2;
        return leftCenter - rightCenter;
      });
      const position = horizontal ? "x" : "y";
      const size = horizontal ? "width" : "height";
      const firstCenter = components[0].frame[position] + components[0].frame[size] / 2;
      const lastCenter = components[components.length - 1].frame[position] + components[components.length - 1].frame[size] / 2;
      const step = (lastCenter - firstCenter) / (components.length - 1);
      const placementById = new Map(components.map((component, index) => [
        component.id,
        index === 0 || index === components.length - 1
          ? component.frame[position]
          : firstCenter + step * index - component.frame[size] / 2
      ]));
      const componentIdsInOrder = selection.records.map(record => record.component.id);
      const plan = this.applyGeometryTransaction(selection.records.map(record => ({
        componentId: record.component.id,
        frame: { [position]: placementById.get(record.component.id) },
        releaseAuthority: true
      })), {
        change: { type: "components-distributed", componentIds: componentIdsInOrder, axis },
        selection: { componentIds: componentIdsInOrder, primaryId: componentIdsInOrder.at(-1) }
      });
      return plan.status !== "blocked";
    }

    transformComponents(componentIds, operation = {}) {
      const selection = this.getBatchSelection(componentIds);
      if (!selection) return false;
      const allowedPaths = new Set(["x", "y", "width", "height"]);
      const values = operation.values && typeof operation.values === "object"
        ? Object.fromEntries(Object.entries(operation.values).filter(([key, value]) => allowedPaths.has(key) && Number.isFinite(Number(value))).map(([key, value]) => [key, Number(value)]))
        : null;
      const path = allowedPaths.has(operation.path) ? operation.path : null;
      const kind = String(operation.kind || "set");
      if ((!path && !Object.keys(values || {}).length) || !["set", "delta", "equalize"].includes(kind)) return false;
      const requested = Number(operation.value);
      if (!values && kind !== "equalize" && !Number.isFinite(requested)) return false;
      const referenceId = selection.records.some(record => record.component.id === operation.referenceId)
        ? operation.referenceId
        : this.state.editor.selectedComponentId;
      const reference = selection.records.find(record => record.component.id === referenceId)?.component || selection.records[selection.records.length - 1].component;
      const componentIdsInOrder = selection.records.map(record => record.component.id);
      const operationReport = { kind, path, values, value: kind === "equalize" ? reference.frame[path] : requested, referenceId: reference.id };
      const requests = selection.records.map(record => {
        const frame = values
          ? Object.fromEntries(Object.entries(values).map(([key, value]) => [key, kind === "delta" ? record.component.frame[key] + value : value]))
          : { [path]: kind === "delta" ? record.component.frame[path] + requested : kind === "equalize" ? reference.frame[path] : requested };
        return { componentId: record.component.id, frame, releaseAuthority: true };
      });
      const plan = this.applyGeometryTransaction(requests, {
        change: { type: "components-transformed", componentIds: componentIdsInOrder, operation: operationReport },
        selection: { componentIds: componentIdsInOrder, primaryId: reference.id }
      });
      return plan.status !== "blocked";
    }

    applyComponentFramesBulk(entries = []) {
      const valid = entries.slice(0, 40).filter(entry => entry?.id && [entry.x, entry.y, entry.width, entry.height].every(value => Number.isFinite(Number(value))));
      const selection = this.getBatchSelection(valid.map(entry => entry.id), 1);
      if (!selection || selection.records.length !== valid.length) throw new Error("A lista deve conter exatamente componentes irmãos da seleção atual.");
      const selectedIds = new Set(this.getSelectedIds());
      if (valid.some(entry => !selectedIds.has(entry.id)) || selectedIds.size !== valid.length) throw new Error("A geometria só pode ser aplicada ao conjunto atualmente selecionado.");
      const byId = new Map(valid.map(entry => [entry.id, entry]));
      const componentIdsInOrder = valid.map(entry => entry.id);
      const plan = this.applyGeometryTransaction(selection.records.map(record => {
        const frame = byId.get(record.component.id);
        return {
          componentId: record.component.id,
          frame: { x: Number(frame.x), y: Number(frame.y), width: Number(frame.width), height: Number(frame.height) },
          releaseAuthority: true
        };
      }), {
        change: { type: "component-frames-bulk-applied", componentIds: componentIdsInOrder },
        selection: { componentIds: componentIdsInOrder, primaryId: componentIdsInOrder.at(-1) }
      });
      if (plan.status === "blocked") {
        const error = new Error("A geometria solicitada não possui uma solução estrutural válida.");
        error.code = "GEOMETRY_TRANSACTION_BLOCKED";
        error.geometryTransaction = plan;
        throw error;
      }
      return componentIdsInOrder.map(componentId => this.findComponent(componentId).component);
    }

    inferSpacingAxis(records, requested = "auto") {
      if (requested === "horizontal" || requested === "vertical") return requested;
      const components = records.map(record => record.component);
      const left = Math.min(...components.map(component => component.frame.x));
      const right = Math.max(...components.map(component => component.frame.x + component.frame.width));
      const top = Math.min(...components.map(component => component.frame.y));
      const bottom = Math.max(...components.map(component => component.frame.y + component.frame.height));
      return right - left >= bottom - top ? "horizontal" : "vertical";
    }

    addSeparatorsForComponents(selection, components, axis, presetId = "subtle", contextual = false) {
      const parent = selection.records[0]?.parent || null;
      const children = parent ? parent.children : this.getPage().children;
      const preset = window.CATALOG_SEPARATOR_PRESETS?.[presetId] || window.CATALOG_SEPARATOR_PRESETS?.subtle || { id: "subtle", thickness: 2, cap: "round", marker: "none" };
      const horizontal = axis === "horizontal";
      const created = [];
      for (let index = 0; index < components.length - 1; index += 1) {
        const before = components[index];
        const after = components[index + 1];
        const existing = children.find(child => child.type === "separator" && child.props?.beforeId === before.id && child.props?.afterId === after.id);
        if (existing) {
          Object.assign(existing.props, { presetId: preset.id, thickness: preset.thickness, cap: preset.cap, marker: preset.marker });
          created.push(existing);
          continue;
        }
        const start = horizontal ? before.frame.x + before.frame.width : before.frame.y + before.frame.height;
        const end = horizontal ? after.frame.x : after.frame.y;
        const crossStart = horizontal ? Math.max(before.frame.y, after.frame.y) : Math.max(before.frame.x, after.frame.x);
        const crossEnd = horizontal
          ? Math.min(before.frame.y + before.frame.height, after.frame.y + after.frame.height)
          : Math.min(before.frame.x + before.frame.width, after.frame.x + after.frame.width);
        const frame = horizontal
          ? { x: start, y: crossStart, width: Math.max(8, end - start), height: Math.max(8, crossEnd - crossStart) }
          : { x: crossStart, y: start, width: Math.max(8, crossEnd - crossStart), height: Math.max(8, end - start) };
        const separator = createNode("separator", frame, {
          props: {
            orientation: horizontal ? "vertical" : "horizontal",
            cap: preset.cap,
            marker: preset.marker,
            thickness: preset.thickness,
            presetId: preset.id,
            contextual,
            batchGenerated: true,
            beforeId: before.id,
            afterId: after.id
          },
          style: { accentColor: parent?.style?.accentColor || "brand.primary" },
          layoutItem: { managed: false, grow: 0, span: 1, overlay: true }
        });
        children.push(separator);
        created.push(separator);
      }
      if (contextual && parent) window.CatalogLayoutEngine?.applyAutoLayout(parent);
      return created;
    }

    applySpacingMutation(componentIds, options = {}) {
      const selection = this.getBatchSelection(componentIds, 2);
      if (!selection) throw new Error("Selecione ao menos dois componentes irmãos.");
      const gap = Math.max(0, Math.min(1000, Number(options.gap) || 0));
      const axis = this.inferSpacingAxis(selection.records, options.axis);
      const addSeparators = options.separators === true;
      const threshold = Math.max(1, Number(definitionFor("separator")?.minThickness) || 2) * 3;
      if (addSeparators && gap <= threshold) throw new Error(`Use espaçamento maior que ${threshold} px para adicionar separadores.`);
      const parent = selection.records[0].parent || null;
      const mode = parent ? (window.CatalogLayoutEngine?.effectiveMode(parent) || parent.layout?.mode) : "free";
      const managed = parent?.children?.filter(child => !child.slot?.name && child.layoutItem?.managed !== false && child.layoutItem?.overlay !== true) || [];
      const selectedSet = new Set(selection.records.map(record => record.component.id));
      const allManaged = Boolean(parent
        && definitionFor(parent.type)?.container?.autoLayout
        && ((axis === "horizontal" && mode === "row") || (axis === "vertical" && mode === "column"))
        && managed.length === selection.records.length
        && managed.every(component => selectedSet.has(component.id)));
      let components;
      if (allManaged) {
        parent.layout.gap = gap;
        parent.layout.distribution = "fill";
        reflowTree(parent);
        components = selection.records.map(record => record.component).sort((left, right) => axis === "horizontal" ? left.frame.x - right.frame.x : left.frame.y - right.frame.y);
      } else {
        this.releaseBatchLayout(selection.records);
        components = selection.records.map(record => record.component).sort((left, right) => axis === "horizontal" ? left.frame.x - right.frame.x : left.frame.y - right.frame.y);
        const position = axis === "horizontal" ? "x" : "y";
        const size = axis === "horizontal" ? "width" : "height";
        const limit = this.getContainerSize(selection.parentId)[size];
        let cursor = components[0].frame[position];
        const placements = components.map((component, index) => {
          const value = index ? cursor : component.frame[position];
          cursor = value + component.frame[size] + gap;
          return value;
        });
        if (cursor - gap > limit) throw new Error("O espaçamento solicitado ultrapassa o contexto atual.");
        components.slice(1).forEach((component, index) => this.updateComponent(component.id, { frame: { [position]: placements[index + 1] } }));
      }
      const separators = addSeparators ? this.addSeparatorsForComponents(selection, components, axis, options.separatorPresetId, allManaged) : [];
      this.state.editor.selectedComponentIds = components.map(component => component.id);
      this.state.editor.selectedComponentId = components[components.length - 1].id;
      return { components, separators, axis, gap };
    }

    planSpacingTransaction(componentIds, options = {}) {
      const requestedIds = Array.isArray(componentIds) ? [...new Set(componentIds.map(String))] : [];
      const blocked = (code, message, conflicts = []) => ({
        status: "blocked",
        requested: { componentIds: requestedIds, options: clone(options) },
        resolved: null,
        changes: [],
        structuralChanges: [],
        authorityChanges: [],
        reasons: [code],
        conflicts: conflicts.length ? conflicts : [{ componentId: null, code, message }]
      });
      if (requestedIds.length < 2) return blocked("invalid-selection", "Selecione ao menos dois componentes irmãos.");

      const before = geometrySnapshot(this);
      const draft = this.createGeometryDraftStore();
      let result;
      try {
        result = draft.applySpacingMutation(requestedIds, options);
      } catch (error) {
        return blocked(error.message.includes("ultrapassa") ? "bounds" : "invalid-spacing", error.message);
      }
      const after = geometrySnapshot(draft);
      const directIds = new Set(requestedIds);
      const changes = [];
      const authorityChanges = [];
      new Set([...before.keys(), ...after.keys()]).forEach(componentId => {
        const previous = before.get(componentId);
        const next = after.get(componentId);
        if (previous && next && !frameEquals(previous.frame, next.frame)) {
          changes.push({ componentId, direct: directIds.has(componentId), before: { ...previous.frame }, after: { ...next.frame } });
        }
        if (previous && next && (previous.slotManaged !== next.slotManaged || previous.layoutManaged !== next.layoutManaged)) {
          authorityChanges.push({
            componentId,
            before: { slotManaged: previous.slotManaged, layoutManaged: previous.layoutManaged },
            after: { slotManaged: next.slotManaged, layoutManaged: next.layoutManaged }
          });
        }
      });
      const structuralChanges = [];
      after.forEach((entry, componentId) => {
        const previous = before.get(componentId);
        if (!previous) {
          structuralChanges.push({ type: "component-added", componentId, parentId: entry.parentId, componentType: entry.component.type });
          return;
        }
        if (entry.component.type === "separator" && JSON.stringify(previous.component.props) !== JSON.stringify(entry.component.props)) {
          structuralChanges.push({ type: "component-updated", componentId, parentId: entry.parentId, componentType: entry.component.type, field: "props" });
        }
        if (JSON.stringify(previous.component.layout) !== JSON.stringify(entry.component.layout)) {
          structuralChanges.push({ type: "component-updated", componentId, parentId: entry.parentId, componentType: entry.component.type, field: "layout" });
        }
      });
      before.forEach((entry, componentId) => {
        if (!after.has(componentId)) structuralChanges.push({ type: "component-removed", componentId, parentId: entry.parentId, componentType: entry.component.type });
      });
      const affectedIds = geometryAffectedIds(before, after, directIds);
      structuralChanges.forEach(change => {
        affectedIds.add(change.componentId);
        if (change.parentId) affectedIds.add(change.parentId);
      });
      const previousAffectedIds = new Set([...affectedIds].filter(componentId => before.has(componentId)));
      const conflicts = worsenedGeometryConflicts(geometryConflicts(this, previousAffectedIds), geometryConflicts(draft, affectedIds));
      const plan = {
        status: conflicts.length ? "blocked" : changes.some(change => !change.direct) ? "adjusted" : "applied",
        requested: { componentIds: requestedIds, options: clone(options) },
        resolved: {
          componentIds: result.components.map(component => component.id),
          frames: result.components.map(component => ({ componentId: component.id, frame: { ...component.frame } })),
          separatorIds: result.separators.map(separator => separator.id),
          axis: result.axis,
          gap: result.gap
        },
        changes,
        structuralChanges,
        authorityChanges,
        reasons: [...new Set([
          ...(changes.some(change => !change.direct) ? ["derived-reflow"] : []),
          ...(authorityChanges.length ? ["layout-authority-released"] : []),
          ...(structuralChanges.length ? ["structural-change"] : []),
          ...conflicts.map(conflict => conflict.code)
        ])],
        conflicts
      };
      Object.defineProperty(plan, SPACING_PLAN_DRAFT, { value: draft });
      return plan;
    }

    applySpacingTransaction(componentIds, options = {}) {
      const plan = this.planSpacingTransaction(componentIds, options);
      const report = publicSpacingPlan(plan);
      if (plan.status === "blocked") {
        const error = new Error(plan.conflicts[0]?.message || "O espaçamento solicitado não possui uma solução estrutural válida.");
        error.code = "SPACING_TRANSACTION_BLOCKED";
        error.spacingTransaction = report;
        throw error;
      }
      const draft = plan[SPACING_PLAN_DRAFT];
      synchronizeStructuralState(this, draft);
      this.emit({
        type: "components-spaced",
        componentIds: report.resolved.componentIds,
        axis: report.resolved.axis,
        gap: report.resolved.gap,
        separators: options.separators === true,
        spacingTransaction: report
      });
      return {
        components: report.resolved.componentIds.map(componentId => this.findComponent(componentId).component),
        separators: report.resolved.separatorIds.map(componentId => this.findComponent(componentId).component),
        axis: report.resolved.axis,
        gap: report.resolved.gap,
        transaction: report
      };
    }

    spaceComponents(componentIds, options = {}) {
      if (!this.getBatchSelection(componentIds, 2)) return false;
      return this.applySpacingTransaction(componentIds, options);
    }

    setPresentationBatch(componentIds, patch = {}) {
      const cards = Array.from(new Map((componentIds || []).map(componentId => this.getProductCard(componentId)).filter(Boolean).map(card => [card.id, card])).values());
      if (!cards.length) return [];
      return this.runCompoundChange({ type: "components-presentation-updated", componentIds: cards.map(card => card.id), patch: clone(patch) }, () => {
        cards.forEach(card => this.setComponentPresentation(card.id, patch));
        this.state.editor.selectedComponentIds = cards.map(card => card.id);
        this.state.editor.selectedComponentId = cards[cards.length - 1].id;
        return cards;
      });
    }

    setStyleBatch(componentIds, patch = {}) {
      const components = (componentIds || []).map(componentId => this.findComponent(componentId)?.component).filter(Boolean);
      const applicable = components.filter(component => Object.keys(patch).some(key => definitionFor(component.type)?.styleFields?.includes(key)));
      if (!applicable.length) return [];
      return this.runCompoundChange({ type: "components-style-updated", componentIds: applicable.map(component => component.id), patch: clone(patch) }, () => {
        applicable.forEach(component => {
          const allowedPatch = Object.fromEntries(Object.entries(patch).filter(([key]) => definitionFor(component.type)?.styleFields?.includes(key)));
          this.updateComponent(component.id, { style: allowedPatch });
        });
        this.state.editor.selectedComponentIds = components.map(component => component.id);
        this.state.editor.selectedComponentId = components[components.length - 1]?.id || null;
        return applicable;
      });
    }

    duplicateComponents(componentIds = this.getSelectedIds(), options = {}) {
      const selection = this.getBatchSelection(componentIds);
      if (!selection) return [];
      return this.runCompoundChange({ type: "components-duplicated", sourceComponentIds: selection.records.map(record => record.component.id) }, () => {
        const copies = selection.records.map(record => this.duplicateComponent(record.component.id, options)).filter(Boolean);
        this.state.editor.selectedComponentIds = copies.map(component => component.id);
        this.state.editor.selectedComponentId = copies[copies.length - 1]?.id || null;
        return copies;
      });
    }

    deleteComponents(componentIds = this.getSelectedIds()) {
      const selection = this.getBatchSelection(componentIds);
      if (!selection) return false;
      return this.runCompoundChange({ type: "components-deleted", componentIds: selection.records.map(record => record.component.id) }, () => {
        selection.records.slice().sort((left, right) => right.index - left.index).forEach(record => this.deleteComponent(record.component.id));
        this.state.editor.selectedComponentIds = [];
        this.state.editor.selectedComponentId = null;
        return true;
      });
    }

    duplicateComponent(componentId, options = {}) {
      const record = this.findComponent(componentId);
      if (!record) return null;
      const source = record.component;
      const duplicate = cloneNodeWithNewIds(source);
      cloneTableRowsForSubtree(this.state, duplicate);
      this.assignFreshCardNumbers(duplicate);
      const parent = record.parent;
      const parentId = parent?.id || null;
      const parentDefinition = parent ? definitionFor(parent.type) : null;
      const offsetX = Number(options.offsetX ?? 16);
      const offsetY = Number(options.offsetY ?? 16);

      duplicate.name = `${source.name || definitionFor(source.type)?.label || "Componente"} — cópia`;

      if (duplicate.slot?.name && parent) {
        const slot = slotDefinition(parent, duplicate.slot.name);
        const occupants = this.getSlotOccupants(parent.id, duplicate.slot.name);
        const duplicateSpan = slot ? slotSpan(duplicate, slot) : 1;
        if (!slot || slotUsage(parent.children, duplicate.slot.name, slot) + duplicateSpan > slot.capacity) {
          duplicate.slot = null;
        } else {
          const nextOrder = (source.slot?.order ?? record.index) + 1;
          occupants.forEach(item => {
            if ((item.slot?.order ?? 0) >= nextOrder) item.slot.order += 1;
          });
          duplicate.slot = { ...duplicate.slot, order: nextOrder, managed: true, span: duplicateSpan };
        }
      }

      const autoManaged = Boolean(parentDefinition?.container?.autoLayout && source.layoutItem?.managed !== false);
      if (parentDefinition?.container?.autoLayout) {
        duplicate.layoutItem = { managed: autoManaged, grow: 1, span: 1, ...(duplicate.layoutItem || {}), managed: autoManaged };
      }

      record.parentChildren.splice(record.index + 1, 0, duplicate);
      if (!duplicate.slot?.managed && !autoManaged) {
        duplicate.frame = this.clampFrame({
          ...duplicate.frame,
          x: duplicate.frame.x + offsetX,
          y: duplicate.frame.y + offsetY
        }, duplicate, parentId);
      }
      if (parent && duplicate.slot?.name) layoutSlot(parent, duplicate.slot.name);
      if (parent && usesAutoReflow(parent)) {
        this.ensureContainerMinimum(parent, this.getParentId(parent.id));
        reflowTree(parent);
      }
      if (this.state.editor.editingContextId === source.id) this.state.editor.editingContextId = parentId;
      this.state.editor.selectedComponentId = duplicate.id;
      this.emit({ type: "component-duplicated", componentId: duplicate.id, sourceComponentId: source.id, parentId });
      return duplicate;
    }

    duplicateComponentSeries(componentId, options = {}) {
      const source = this.findComponent(componentId)?.component;
      if (!source) return [];
      const direction = ["left", "right", "up", "down"].includes(options.direction) ? options.direction : "right";
      const mode = options.mode === "offset" ? "offset" : "gap";
      const distance = Math.max(0, Math.min(1000, Number(options.distance) || 0));
      const count = Math.max(1, Math.min(20, Math.round(Number(options.count) || 1)));
      const horizontal = direction === "left" || direction === "right";
      const sign = direction === "left" || direction === "up" ? -1 : 1;
      const step = (mode === "gap" ? (horizontal ? source.frame.width : source.frame.height) : 0) + distance;
      const copies = [];
      for (let index = 1; index <= count; index += 1) {
        const duplicate = this.duplicateComponent(componentId, {
          offsetX: horizontal ? sign * step * index : 0,
          offsetY: horizontal ? 0 : sign * step * index
        });
        if (duplicate) copies.push(duplicate);
      }
      if (copies.length) {
        this.state.editor.selectedComponentId = copies[copies.length - 1].id;
        this.emit({ type: "component-duplicated-series", sourceComponentId: componentId, componentIds: copies.map(item => item.id), count: copies.length, direction, mode, distance });
      }
      return copies;
    }

    deleteComponent(componentId) {
      const record = this.findComponent(componentId);
      if (!record) return;
      const oldSlot = record.component.slot?.name || null;
      const selectedRecord = this.findComponent(this.state.editor.selectedComponentId);
      const contextRecord = this.findComponent(this.state.editor.editingContextId);
      const removesSelection = Boolean(selectedRecord?.path.some(item => item.id === componentId));
      const removesContext = Boolean(contextRecord?.path.some(item => item.id === componentId));
      record.parentChildren.splice(record.index, 1);
      if (record.parent && oldSlot) layoutSlot(record.parent, oldSlot);
      if (record.parent && usesAutoReflow(record.parent)) reflowTree(record.parent);
      if (removesSelection) this.state.editor.selectedComponentId = null;
      if (removesContext) this.state.editor.editingContextId = record.parent?.id || null;
      this.emit({ type: "component-deleted", componentId });
    }

    getCollection(collectionId) {
      return (this.state.collections || []).find(collection => collection.id === collectionId) || null;
    }

    getTableRows(componentOrId) {
      const component = typeof componentOrId === "string" ? this.findComponent(componentOrId)?.component : componentOrId;
      if (!component || component.type !== "data-table") return [];
      const collection = this.getCollection(component.props?.collectionId || "tableRows");
      return (component.props?.rowIds || []).map(rowId => collection?.items.find(item => item.id === rowId)).filter(Boolean);
    }

    getTableRowUsage(rowId) {
      const usage = [];
      const visit = children => (children || []).forEach(component => {
        if (component.type === "data-table" && component.props?.rowIds?.includes(rowId)) usage.push(component.id);
        visit(component.children);
      });
      this.state.pages.forEach(page => visit(page.children));
      return usage;
    }

    refreshTableLayout(componentId) {
      const record = this.findComponent(componentId);
      if (!record || record.component.type !== "data-table") return;
      const table = record.component;
      if (record.parent && table.slot?.name) {
        this.ensureContainerMinimum(record.parent, this.getParentId(record.parent.id));
        reflowTree(record.parent);
        const grandparent = this.findComponent(record.parent.id)?.parent;
        if (grandparent && usesAutoReflow(grandparent)) {
          this.ensureContainerMinimum(grandparent, this.getParentId(grandparent.id));
          reflowTree(grandparent);
        }
      } else {
        const minimum = this.getContentMinimum(table);
        table.frame = this.clampFrame({ ...table.frame, height: Math.max(table.frame.height, minimum.height) }, table, record.parent?.id || null);
      }
    }

    addTableRow(componentId, values = {}) {
      const component = this.findComponent(componentId)?.component;
      if (!component || component.type !== "data-table") throw new Error("O componente selecionado não é uma tabela.");
      ensureTableRows(this.state, component);
      const row = createTableRow(this.state, values, `${component.name || "Tabela"} · linha ${component.props.rowIds.length + 1}`, { columns: component.props.columns });
      component.props.rowIds.push(row.id);
      this.refreshTableLayout(componentId);
      this.emit({ type: "table-row-added", componentId, rowId: row.id });
      return row;
    }

    replaceTableRowsBulk(componentId, entries = [], options = {}) {
      const mode = options.mode === "append" ? "append" : "replace";
      return this.runCompoundChange({ type: "table-rows-replaced", componentId, mode, count: entries.length }, () => {
        const record = this.findComponent(componentId);
        const component = record?.component;
        if (!component || component.type !== "data-table") throw new Error("O componente selecionado não é uma tabela.");
        const normalizedEntries = (Array.isArray(entries) ? entries : []).filter(Boolean);
        const currentIds = component.props?.rowIds?.slice() || [];
        const available = Math.max(0, 12 - (mode === "append" ? currentIds.length : 0));
        const limited = normalizedEntries.slice(0, available);
        if (!limited.length) throw new Error("Nenhuma linha válida foi fornecida.");

        if (mode === "replace" && options.bindingSync !== true && !this.bindingSyncDepth) {
          const card = productCardForRecord(record);
          const table = cardDataTable(card);
          const values = limited[0]?.values || limited[0] || {};
          if (card?.binding?.productId && table?.id === component.id) {
            card.binding = normalizeProductBinding(card.binding);
            TABLE_BINDING_FIELDS.forEach(field => {
              if (Object.hasOwn(values, field)) card.binding.overrides[field] = true;
            });
          }
        }

        const nextIds = mode === "append" ? currentIds.slice() : [];
        limited.forEach((entry, index) => {
          const values = entry.values || entry;
          const row = createTableRow(this.state, values, `${component.name || "Tabela"} · linha ${nextIds.length + 1}`, {
            columns: component.props.columns,
            legendKeys: entry.legendKeys || {},
            sourceRowId: entry.id || entry.sourceRowId || null,
            variantId: entry.variantId || null
          });
          nextIds.push(row.id);
        });
        component.props.rowIds = nextIds;
        if (mode === "replace") {
          const collection = this.getCollection(component.props.collectionId || "tableRows");
          currentIds.forEach(rowId => {
            if (this.getTableRowUsage(rowId).length) return;
            const index = collection?.items.findIndex(item => item.id === rowId) ?? -1;
            if (index >= 0) collection.items.splice(index, 1);
          });
        }
        this.refreshTableLayout(componentId);
        this.state.editor.selectedComponentId = component.id;
        return this.getTableRows(component);
      });
    }

    updateTableRow(componentId, rowId, patch = {}) {
      const record = this.findComponent(componentId);
      const component = record?.component;
      if (!component || component.type !== "data-table" || !component.props?.rowIds?.includes(rowId)) return null;
      const collection = this.getCollection(component.props.collectionId || "tableRows");
      const row = collection?.items.find(item => item.id === rowId);
      if (!row) return null;
      const columns = tableColumns(component.props?.columns);
      row.metadata = {
        ...(row.metadata || {}),
        values: tableRowValues({ ...(row.metadata?.values || {}), ...patch }, columns),
        legendKeys: { ...(row.metadata?.legendKeys || {}) }
      };
      if (!this.bindingSyncDepth) {
        const card = productCardForRecord(record);
        const table = cardDataTable(card);
        if (card?.binding?.productId && table?.id === component.id && table.props?.rowIds?.[0] === rowId) {
          card.binding = normalizeProductBinding(card.binding);
          ["code", "package", "price"].forEach(field => {
            if (Object.hasOwn(patch, field)) card.binding.overrides[field] = true;
          });
        }
      }
      this.emit({ type: "table-row-updated", componentId, rowId, patch });
      return row;
    }

    updateTableColumns(componentId, columns) {
      const component = this.findComponent(componentId)?.component;
      if (!component || component.type !== "data-table") return false;
      const previous = tableColumns(component.props?.columns);
      const next = tableColumns(columns);
      const previousKeys = new Set(previous.map(column => column.key));
      const nextKeys = new Set(next.map(column => column.key));
      component.props.columns = next;
      this.getTableRows(component).forEach(row => {
        const values = { ...(row.metadata?.values || {}) };
        next.forEach(column => { if (!Object.hasOwn(values, column.key)) values[column.key] = ""; });
        previousKeys.forEach(key => { if (!nextKeys.has(key)) delete values[key]; });
        const legendKeys = { ...(row.metadata?.legendKeys || {}) };
        Object.keys(legendKeys).forEach(key => { if (!nextKeys.has(key)) delete legendKeys[key]; });
        row.metadata = { ...(row.metadata || {}), values: tableRowValues(values, next), legendKeys };
      });
      this.emit({ type: "table-columns-updated", componentId, columns: clone(next) });
      return true;
    }

    addTableColumn(componentId, column = {}) {
      const component = this.findComponent(componentId)?.component;
      if (!component || component.type !== "data-table") return false;
      const columns = tableColumns(component.props?.columns);
      if (columns.length >= 12) return false;
      columns.push({ key: column.key || `column-${columns.length + 1}`, label: column.label || `Coluna ${columns.length + 1}`, role: column.role || "value", align: column.align || "center", width: column.width || 1 });
      return this.updateTableColumns(componentId, columns);
    }

    removeTableColumn(componentId, columnKey) {
      const component = this.findComponent(componentId)?.component;
      if (!component || component.type !== "data-table") return false;
      const columns = tableColumns(component.props?.columns);
      if (columns.length <= 1) return false;
      return this.updateTableColumns(componentId, columns.filter(column => column.key !== columnKey));
    }

    setTableCellLegend(componentId, rowId, columnKey, legendKey) {
      const component = this.findComponent(componentId)?.component;
      const row = this.getTableRows(component).find(item => item.id === rowId);
      if (!component || component.type !== "data-table" || !row || !tableColumns(component.props.columns).some(column => column.key === columnKey)) return false;
      row.metadata ||= {};
      row.metadata.legendKeys = { ...(row.metadata.legendKeys || {}) };
      if (legendKey) row.metadata.legendKeys[columnKey] = String(legendKey);
      else delete row.metadata.legendKeys[columnKey];
      this.emit({ type: "table-cell-legend-updated", componentId, rowId, columnKey, legendKey: legendKey || null });
      return true;
    }

    removeTableRow(componentId, rowId) {
      const component = this.findComponent(componentId)?.component;
      if (!component || component.type !== "data-table" || component.props.rowIds.length <= 1) return false;
      const index = component.props.rowIds.indexOf(rowId);
      if (index < 0) return false;
      component.props.rowIds.splice(index, 1);
      if (!this.getTableRowUsage(rowId).length) {
        const collection = this.getCollection(component.props.collectionId || "tableRows");
        const itemIndex = collection?.items.findIndex(item => item.id === rowId) ?? -1;
        if (itemIndex >= 0) collection.items.splice(itemIndex, 1);
      }
      this.refreshTableLayout(componentId);
      this.emit({ type: "table-row-removed", componentId, rowId });
      return true;
    }

    reorderTableRow(componentId, rowId, direction) {
      const component = this.findComponent(componentId)?.component;
      if (!component || component.type !== "data-table") return false;
      const current = component.props.rowIds.indexOf(rowId);
      const target = current + (Number(direction) < 0 ? -1 : 1);
      if (current < 0 || target < 0 || target >= component.props.rowIds.length) return false;
      [component.props.rowIds[current], component.props.rowIds[target]] = [component.props.rowIds[target], component.props.rowIds[current]];
      this.emit({ type: "table-row-reordered", componentId, rowId, direction: target - current });
      return true;
    }

    getTableColumns(componentOrId) {
      const component = typeof componentOrId === "string" ? this.findComponent(componentOrId)?.component : componentOrId;
      return component?.type === "data-table" ? tableColumns(component.props?.columns) : [];
    }

    getTableSchemas() {
      return window.CatalogTableSchemas?.list?.() || [];
    }

    getTablesForComponents(componentIds = []) {
      const tables = [];
      const seen = new Set();
      (Array.isArray(componentIds) ? componentIds : [componentIds]).forEach(componentId => {
        const component = typeof componentId === "string" ? this.findComponent(componentId)?.component : componentId;
        if (!component) return;
        visitSubtree(component, child => {
          if (child.type !== "data-table" || seen.has(child.id)) return;
          seen.add(child.id);
          tables.push(child);
        });
      });
      return tables;
    }

    applyTableSchema(componentIds, schemaId) {
      const schema = window.CatalogTableSchemas?.get?.(schemaId);
      const tables = this.getTablesForComponents(componentIds);
      if (!schema || !tables.length) return [];
      const changeType = tables.length > 1 ? "table-schema-batch-applied" : "table-schema-applied";
      return this.runCompoundChange({ type: changeType, schemaId, componentIds: tables.map(table => table.id) }, () => {
        const previousEditor = clone(this.state.editor);
        tables.forEach(table => {
          const previousColumns = this.getTableColumns(table);
          const previousRows = this.getTableRows(table).map(row => ({
            row,
            values: { ...(row.metadata?.values || {}) },
            legendKeys: { ...(row.metadata?.legendKeys || {}) }
          }));
          this.updateTableColumns(table.id, schema.columns);
          previousRows.forEach(({ row, values, legendKeys }) => {
            const valueByRole = Object.fromEntries(previousColumns.map(column => [column.role, values[column.key] ?? ""]));
            const legendByRole = Object.fromEntries(previousColumns.map(column => [column.role, legendKeys[column.key] || null]));
            row.metadata.values = Object.fromEntries(schema.columns.map(column => [column.key, values[column.key] ?? valueByRole[column.role] ?? ""]));
            row.metadata.legendKeys = Object.fromEntries(schema.columns.map(column => [column.key, legendKeys[column.key] || legendByRole[column.role]]).filter(([, value]) => value));
          });
          table.props.tableSchemaId = schema.id;
          this.refreshTableLayout(table.id);
        });
        this.state.editor = previousEditor;
        return tables;
      });
    }

    getColorLegends() {
      return this.getCollection("colorLegends")?.items || [];
    }

    getColorLegendByKey(legendKey) {
      return this.getColorLegends().find(item => item.metadata?.key === legendKey || item.id === legendKey) || null;
    }

    upsertColorLegend(values = {}, options = {}) {
      if (options.materialize === true && !options.insideCompound) {
        return this.runCompoundChange({ type: "legend-materialized" }, () => {
          const previousEditor = clone(this.state.editor);
          const item = this.upsertColorLegend(values, { ...options, materialize: false, insideCompound: true });
          this.materializeLegendDefinition(item.metadata.key, options);
          this.state.editor = previousEditor;
          return item;
        });
      }
      const legendKey = window.CatalogSource?.key?.(values.key || values.label || "legenda", "legenda") || "legenda";
      const existing = values.id ? this.getColorLegends().find(item => item.id === values.id) : this.getColorLegendByKey(legendKey);
      const groupLabel = String(values.groupLabel || existing?.metadata?.groupLabel || "Geral").trim() || "Geral";
      const groupId = window.CatalogSource?.key?.(values.groupId || groupLabel, "geral") || "geral";
      const item = this.upsertCollectionItem("colorLegends", {
        id: existing?.id || id("color-legend"),
        label: String(values.label || existing?.label || legendKey),
        metadata: {
          ...(existing?.metadata || {}),
          key: legendKey,
          token: String(values.token || existing?.metadata?.token || "surface.neutral"),
          textLabel: String(values.textLabel || values.label || existing?.metadata?.textLabel || legendKey),
          fallback: String(values.fallback || values.textLabel || values.label || existing?.metadata?.fallback || legendKey),
          groupId,
          groupLabel,
          groupOrder: Math.max(0, Math.round(Number(values.groupOrder ?? existing?.metadata?.groupOrder) || 0)),
          order: Math.max(0, Math.round(Number(values.order ?? existing?.metadata?.order) || this.getColorLegends().length)),
          emphasized: values.emphasized === true || existing?.metadata?.emphasized === true
        },
        reference: null
      });
      this.emit({ type: "color-legend-upserted", legendId: item.id, legendKey: item.metadata.key });
      return item;
    }

    upsertColorLegendsBulk(entries = [], options = {}) {
      const valid = entries.slice(0, 40).filter(entry => String(entry?.label || "").trim());
      if (!valid.length) throw new Error("Informe ao menos uma legenda válida.");
      return this.runCompoundChange({ type: "color-legends-bulk-applied", count: valid.length, materialize: options.materialize === true }, () => {
        const previousEditor = clone(this.state.editor);
        const items = valid.map((entry, index) => this.upsertColorLegend({
          label: String(entry.label).trim(),
          textLabel: String(entry.label).trim(),
          token: String(entry.token || "surface.neutral"),
          groupLabel: String(entry.groupLabel || "Geral"),
          order: index
        }, { insideCompound: true, materialize: false }));
        if (options.materialize === true) items.forEach(item => this.materializeLegendDefinition(item.metadata.key, { groupLabel: item.metadata.groupLabel }));
        this.state.editor = previousEditor;
        return items;
      });
    }

    getLegendPanels() {
      const panels = [];
      (this.getPage().children || []).forEach(component => visitSubtree(component, node => { if (node.type === "legend-panel") panels.push(node); }));
      return panels;
    }

    materializeLegendDefinition(legendKey, options = {}) {
      const definition = this.getColorLegendByKey(legendKey);
      if (!definition) throw new Error("A definição de legenda não existe.");
      const selected = this.getSelected();
      const context = this.getEditingContext();
      let panel = options.panelId ? this.findComponent(options.panelId)?.component : null;
      if (panel?.type !== "legend-panel") panel = null;
      if (!panel && selected?.type === "legend-panel") panel = selected;
      if (!panel && selected?.type === "legend-group") panel = this.findComponent(selected.id)?.path?.slice().reverse().find(node => node.type === "legend-panel") || null;
      if (!panel && context?.type === "legend-panel") panel = context;
      if (!panel) panel = this.getLegendPanels()[0] || null;
      if (!panel) {
        const frame = this.getSuggestedFrame({ width: 360, height: 92 }, null);
        panel = this.addComponent("legend-panel", frame, { parentId: null, props: { label: options.panelLabel || "LEGENDA" } });
      }
      const groupId = window.CatalogSource?.key?.(options.groupId || definition.metadata?.groupId || "geral", "geral") || "geral";
      const groupLabel = String(options.groupLabel || definition.metadata?.groupLabel || "Geral");
      let group = (panel.children || []).find(child => child.type === "legend-group" && child.props?.groupId === groupId);
      if (!group) {
        const emptyDefault = (panel.children || []).find(child => child.type === "legend-group" && !(child.children || []).some(item => item.type === "legend-item"));
        if (emptyDefault) {
          emptyDefault.props = { ...(emptyDefault.props || {}), groupId, label: groupLabel, emphasized: definition.metadata?.emphasized === true };
          group = emptyDefault;
        }
      }
      if (!group) group = this.addComponent("legend-group", { x: 0, y: 0, width: 320, height: 54 }, {
        parentId: panel.id,
        props: { groupId, label: groupLabel, emphasized: definition.metadata?.emphasized === true },
        layoutItem: { managed: true, grow: 1, span: 1 }
      });
      let item = null;
      visitSubtree(panel, node => { if (!item && node.type === "legend-item" && node.props?.legendKey === legendKey) item = node; });
      if (!item) item = this.addComponent("legend-item", { x: 0, y: 0, width: 96, height: 30 }, {
        parentId: group.id,
        props: { legendKey, labelOverride: "" },
        layoutItem: { managed: true, grow: 1, span: 1 }
      });
      this.emit({ type: "legend-materialized", legendKey, panelId: panel.id, groupId: group.id, componentId: item.id });
      return { panel, group, item };
    }

    createLegendGroup(panelId, label, options = {}) {
      const panel = this.findComponent(panelId)?.component;
      if (panel?.type !== "legend-panel") return null;
      const groupId = window.CatalogSource?.key?.(options.groupId || label, "grupo") || "grupo";
      const existing = panel.children.find(child => child.type === "legend-group" && child.props?.groupId === groupId);
      if (existing) return existing;
      return this.addComponent("legend-group", { x: 0, y: 0, width: 320, height: 54 }, {
        parentId: panel.id,
        props: { groupId, label: String(label || "Novo grupo"), emphasized: options.emphasized === true },
        layoutItem: { managed: true, grow: 1, span: 1 }
      });
    }

    removeColorLegend(legendId) {
      const legend = this.getColorLegends().find(item => item.id === legendId);
      if (!legend) return false;
      const legendKey = legend.metadata?.key;
      let usages = 0;
      this.state.pages.forEach(page => (page.children || []).forEach(component => visitSubtree(component, node => {
        if (node.type !== "data-table") return;
        this.getTableRows(node).forEach(row => {
          if (!row.metadata?.legendKeys) return;
          Object.values(row.metadata.legendKeys).forEach(value => { if (value === legendKey) usages += 1; });
        });
      })));
      const removed = this.removeCollectionItem("colorLegends", legendId);
      if (removed) this.emit({ type: "color-legend-removed", legendId, legendKey, usages, fallback: "neutral-text" });
      return removed;
    }

    setComponentPresentation(componentId, patch = {}) {
      const component = this.getProductCard(componentId);
      if (!component) return null;
      component.presentation = window.CatalogPresentations?.normalizePresentation?.({ ...(component.presentation || {}), ...patch }, component.type) || { ...(component.presentation || {}), ...patch };
      const record = this.findComponent(component.id);
      this.ensureContainerMinimum(component, record?.parent?.id || null);
      reflowTree(component);
      if (record?.parent && usesAutoReflow(record.parent)) {
        this.ensureContainerMinimum(record.parent, this.getParentId(record.parent.id));
        reflowTree(record.parent);
      }
      this.emit({ type: "component-presentation-updated", componentId: component.id, presentation: clone(component.presentation) });
      return component;
    }

    getMinimumProfile(componentOrId) {
      const component = typeof componentOrId === "string" ? this.findComponent(componentOrId)?.component : componentOrId;
      if (!component) return null;
      const definition = definitionFor(component.type);
      const source = component.constraints?.minimums || {};
      return {
        technical: { width: definition.minSize.width, height: definition.minSize.height, ...(source.technical || {}) },
        recommended: { width: definition.recommendedSize?.width || definition.defaultFrame.width, height: definition.recommendedSize?.height || definition.defaultFrame.height, ...(source.recommended || {}) },
        custom: source.custom ? { ...source.custom } : null,
        calculated: this.getContentMinimum(component)
      };
    }

    setRecommendedMinimum(componentId, patch = {}) {
      const component = this.findComponent(componentId)?.component;
      if (!component) return null;
      const profile = this.getMinimumProfile(component);
      const custom = patch.enabled === false ? null : {
        width: Math.max(profile.technical.width, Number(patch.width ?? profile.custom?.width ?? profile.recommended.width) || profile.recommended.width),
        height: Math.max(profile.technical.height, Number(patch.height ?? profile.custom?.height ?? profile.recommended.height) || profile.recommended.height)
      };
      component.constraints.minimums = { technical: profile.technical, recommended: profile.recommended, custom };
      this.emit({ type: "component-minimum-updated", componentId, minimums: clone(component.constraints.minimums) });
      return component.constraints.minimums;
    }

    getCatalogSource() {
      return window.CatalogSource?.buildCatalogSource?.(this.getExportDocument()) || null;
    }

    getPublicationReport(target = "draft") {
      return window.CatalogDocumentValidator?.validate?.(this.getExportDocument(), { target }) || { ok: true, target, issues: [] };
    }

    getSelectionGeometryReport(componentIds = this.getSelectedIds()) {
      const selected = new Set(componentIds || []);
      const geometryCodes = new Set(["COMPONENT_COLLISION", "PAGE_OVERFLOW", "CHILD_OVERFLOW"]);
      const report = this.getPublicationReport("draft");
      const issues = (report.issues || []).filter(issue => {
        if (!geometryCodes.has(issue.code)) return false;
        const ids = [issue.componentId, issue.sourceId, issue.targetId, ...(issue.componentIds || [])].filter(Boolean);
        return ids.some(componentId => selected.has(componentId));
      });
      return { ok: issues.length === 0, componentIds: [...selected], issues };
    }

    getAsset(assetId) {
      if (!assetId) return null;
      return this.getCollection("assets")?.items.find(item => item.id === assetId) || null;
    }

    getAssetUsage(assetId) {
      const usage = [];
      const visit = children => (children || []).forEach(component => {
        if (component.type === "art" && component.props?.assetId === assetId) usage.push(component.id);
        visit(component.children);
      });
      this.state.pages.forEach(page => visit(page.children));
      return usage;
    }

    setComponentAsset(componentId, assetId) {
      const record = this.findComponent(componentId);
      const component = record?.component;
      if (!component || component.type !== "art") throw new Error("Somente componentes de arte aceitam um asset.");
      if (assetId != null && !this.getAsset(assetId)) throw new Error(`Asset desconhecido: ${assetId}`);
      component.props.assetId = assetId || null;
      if (!this.bindingSyncDepth) {
        const card = productCardForRecord(record);
        if (card?.binding?.productId && cardArt(card)?.id === component.id) {
          card.binding = normalizeProductBinding(card.binding);
          card.binding.overrides.assetId = true;
        }
      }
      this.emit({ type: "component-asset-changed", componentId, assetId: component.props.assetId });
      return component;
    }

    upsertCollectionItem(collectionId, item) {
      const collection = this.getCollection(collectionId);
      if (!collection) throw new Error(`Coleção desconhecida: ${collectionId}`);
      const normalized = window.CatalogCollections?.normalizeItem?.(collection, item, collection.items.length) || clone(item);
      const index = collection.items.findIndex(current => current.id === normalized.id);
      if (index >= 0) collection.items[index] = normalized;
      else collection.items.push(normalized);
      this.emit({ type: "collection-item-upserted", collectionId, itemId: normalized.id });
      return normalized;
    }

    removeCollectionItem(collectionId, itemId) {
      const collection = this.getCollection(collectionId);
      if (!collection) return false;
      const index = collection.items.findIndex(item => item.id === itemId);
      if (index < 0) return false;
      collection.items.splice(index, 1);
      this.emit({ type: "collection-item-removed", collectionId, itemId });
      return true;
    }

    replaceDocument(document, options = {}) {
      const localEditor = clone(this.state.editor || {});
      const next = migrateDocument(normalizeLegacyTextPresentation(document));
      if (options.preserveEditor !== false) {
        next.editor = {
          ...next.editor,
          zoom: localEditor.zoom ?? next.editor.zoom,
          zoomMode: localEditor.zoomMode || next.editor.zoomMode,
          leftPanelCollapsed: localEditor.leftPanelCollapsed ?? next.editor.leftPanelCollapsed,
          rightPanelCollapsed: localEditor.rightPanelCollapsed ?? next.editor.rightPanelCollapsed,
          gridVisible: localEditor.gridVisible ?? next.editor.gridVisible,
          snapEnabled: localEditor.snapEnabled ?? next.editor.snapEnabled,
          smartSnapEnabled: localEditor.smartSnapEnabled ?? next.editor.smartSnapEnabled,
          equalSpacingEnabled: localEditor.equalSpacingEnabled ?? next.editor.equalSpacingEnabled,
          showGuides: localEditor.showGuides ?? next.editor.showGuides,
          snapTolerance: localEditor.snapTolerance ?? next.editor.snapTolerance,
          selectedComponentId: null,
          selectedComponentIds: [],
          editingContextId: null
        };
      }
      this.state = next;
      this.emit({ type: options.changeType || "document-replaced", importSummary: options.importSummary || null });
      return this.state;
    }

    reset() {
      const editor = clone(this.state.editor || {});
      this.state = createBlankDocument();
      this.state.editor = { ...this.state.editor, ...editor, selectedComponentId: null, selectedComponentIds: [], editingContextId: null };
      this.emit({ type: "document-reset" });
    }

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.markSaved();
      this.emit({ type: "document-saved" });
    }

    static load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return createBlankDocument();
        return migrateDocument(JSON.parse(raw));
      } catch (error) {
        console.warn("Não foi possível carregar o documento local.", error);
        return createBlankDocument();
      }
    }

    exportJSON() {
      const blob = new Blob([JSON.stringify(this.getExportDocument(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `catalogo-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    }

    getExportDocument() {
      const document = clone(this.state);
      delete document.editor;
      return document;
    }
  }

  Object.defineProperty(DocumentStore, "__textAlignmentContractVersion", { value: "05.18.2" });
  Object.defineProperty(DocumentStore, "__textOverflowContractVersion", { value: "05.18.4.1" });

  window.CatalogDocumentStore = DocumentStore;
  window.createBlankCatalogDocument = createBlankDocument;
  window.CATALOG_SCHEMA_VERSION = SCHEMA_VERSION;
  window.CatalogComponentGeometry = { slotDefinition, slotFrame, layoutSlot, layoutAllSlots };
})();
