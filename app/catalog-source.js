(function () {
  "use strict";

  const VERSION = "1.1.0";
  const clone = value => JSON.parse(JSON.stringify(value));
  const DEFAULT_TABLE_COLUMNS = Object.freeze([
    { key: "code", label: "Código", role: "identifier", align: "center", width: 1, visible: true },
    { key: "package", label: "Embalagem", role: "package", align: "center", width: 1.25, visible: true },
    { key: "price", label: "Preço", role: "price", align: "center", width: 1.15, visible: true }
  ]);

  function key(value, fallback = "item") {
    const normalized = String(value || fallback)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return normalized || fallback;
  }

  function uniqueKey(value, used, fallback) {
    const base = key(value, fallback);
    let candidate = base;
    let index = 2;
    while (used.has(candidate)) candidate = `${base}-${index++}`;
    used.add(candidate);
    return candidate;
  }

  function normalizeColumns(columns) {
    const source = Array.isArray(columns) && columns.length ? columns : DEFAULT_TABLE_COLUMNS;
    const used = new Set();
    return source.slice(0, 12).map((column, index) => {
      const label = String(column?.label || column?.key || `Coluna ${index + 1}`);
      return {
        key: uniqueKey(column?.key || label, used, `column-${index + 1}`),
        label,
        role: String(column?.role || "value"),
        align: ["start", "center", "end"].includes(column?.align) ? column.align : "center",
        width: Math.max(.25, Math.min(6, Number(column?.width) || 1)),
        format: column?.format ? String(column.format) : null,
        visible: column?.visible !== false
      };
    });
  }

  function normalizeRowValues(source = {}, columns = DEFAULT_TABLE_COLUMNS) {
    const values = source && typeof source === "object" && !Array.isArray(source) ? source : {};
    const normalized = {};
    normalizeColumns(columns).forEach(column => { normalized[column.key] = String(values[column.key] ?? ""); });
    Object.entries(values).forEach(([entryKey, value]) => {
      if (!Object.hasOwn(normalized, entryKey) && ["string", "number", "boolean"].includes(typeof value)) normalized[entryKey] = String(value);
    });
    return normalized;
  }

  function normalizeSemanticList(source, prefix) {
    const entries = Array.isArray(source) ? source : [];
    const used = new Set();
    return entries.filter(Boolean).slice(0, 48).map((entry, index) => {
      const object = typeof entry === "object" ? entry : { label: entry };
      const label = String(object.label ?? object.value ?? "").trim();
      return {
        key: uniqueKey(object.key || label, used, `${prefix}-${index + 1}`),
        label,
        value: object.value == null ? null : String(object.value),
        unit: object.unit == null ? null : String(object.unit),
        icon: object.icon == null ? null : String(object.icon)
      };
    }).filter(entry => entry.label || entry.value);
  }

  function parseLines(value, kind = "attribute") {
    return String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, index) => {
      const separator = line.indexOf(":");
      if (kind === "attribute" && separator > 0) {
        const label = line.slice(0, separator).trim();
        return { key: key(label, `attribute-${index + 1}`), label, value: line.slice(separator + 1).trim() };
      }
      return { key: key(line, `${kind}-${index + 1}`), label: line };
    });
  }

  function formatLines(entries, kind = "attribute") {
    return (entries || []).map(entry => kind === "attribute" && entry.value != null ? `${entry.label}: ${entry.value}${entry.unit ? ` ${entry.unit}` : ""}` : entry.label).join("\n");
  }

  function normalizeAssetRoles(source = {}, legacyAssetId = null) {
    const clean = value => value ? String(value) : null;
    const list = value => Array.from(new Set((Array.isArray(value) ? value : []).map(clean).filter(Boolean)));
    return {
      main: clean(source.main || legacyAssetId),
      gallery: list(source.gallery),
      technical: list(source.technical),
      application: list(source.application)
    };
  }

  function normalizeVariant(variant, index = 0) {
    const id = String(variant?.id || `variant-${index + 1}`);
    return {
      id,
      label: String(variant?.label || id),
      attributes: normalizeSemanticList(variant?.attributes, "attribute"),
      assetIds: Array.from(new Set((variant?.assetIds || []).map(String).filter(Boolean))),
      commercialRowIds: Array.from(new Set((variant?.commercialRowIds || []).map(String).filter(Boolean)))
    };
  }

  function normalizeCommercialRows(source, fallbackValues = {}) {
    const rows = Array.isArray(source) && source.length ? source : [fallbackValues];
    const used = new Set();
    return rows.slice(0, 12).map((row, index) => ({
      id: uniqueKey(row?.id || `commercial-row-${index + 1}`, used, `commercial-row-${index + 1}`),
      variantId: row?.variantId ? String(row.variantId) : null,
      values: normalizeRowValues(row?.values || row || {}, row?.columns || DEFAULT_TABLE_COLUMNS),
      legendKeys: row?.legendKeys && typeof row.legendKeys === "object" ? Object.fromEntries(Object.entries(row.legendKeys).map(([entryKey, value]) => [String(entryKey), String(value)])) : {}
    }));
  }

  function normalizeLegendDefinition(legend, index = 0) {
    const label = String(legend?.textLabel || legend?.label || legend?.key || `Legenda ${index + 1}`);
    return {
      key: key(legend?.key || label, `legend-${index + 1}`),
      label,
      token: String(legend?.token || "surface.neutral"),
      fallback: String(legend?.fallback || label),
      groupId: key(legend?.groupId || legend?.groupLabel || "geral", "geral"),
      groupLabel: String(legend?.groupLabel || "Geral"),
      groupOrder: Math.max(0, Math.round(Number(legend?.groupOrder) || 0)),
      order: Math.max(0, Math.round(Number(legend?.order) || index)),
      emphasized: legend?.emphasized === true
    };
  }

  function normalizeLegendDefinitions(source) {
    const seen = new Set();
    return (Array.isArray(source) ? source : []).slice(0, 96).map(normalizeLegendDefinition).filter(item => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
  }

  function normalizeProductMetadata(source = {}, legacyValues = {}) {
    const metadata = source && typeof source === "object" ? source : {};
    const commercialRows = normalizeCommercialRows(metadata.commercialRows, legacyValues);
    const rowIds = new Set(commercialRows.map(row => row.id));
    const variants = (Array.isArray(metadata.variants) ? metadata.variants : []).slice(0, 48).map(normalizeVariant);
    variants.forEach(variant => {
      commercialRows.forEach(row => { if (row.variantId === variant.id && !variant.commercialRowIds.includes(row.id)) variant.commercialRowIds.push(row.id); });
      variant.commercialRowIds = variant.commercialRowIds.filter(rowId => rowIds.has(rowId));
      variant.commercialRowIds.forEach(rowId => {
        const row = commercialRows.find(item => item.id === rowId);
        if (row && !row.variantId) row.variantId = variant.id;
      });
    });
    return {
      ...clone(metadata),
      sourceVersion: VERSION,
      attributes: normalizeSemanticList(metadata.attributes, "attribute"),
      highlights: normalizeSemanticList(metadata.highlights, "highlight"),
      applications: normalizeSemanticList(metadata.applications, "application"),
      variants,
      assetRoles: normalizeAssetRoles(metadata.assetRoles, legacyValues.assetId),
      tableColumns: normalizeColumns(metadata.tableColumns || metadata.commercialColumns),
      commercialRows
    };
  }

  function buildCatalogSource(document) {
    const products = (document?.collections || []).find(collection => collection.id === "products")?.items || [];
    const legends = (document?.collections || []).find(collection => collection.id === "colorLegends")?.items || [];
    return {
      sourceFormat: "CatalogSource",
      sourceVersion: VERSION,
      catalog: { id: document?.id || null, title: document?.title || "" },
      legends: normalizeLegendDefinitions(legends.map(item => ({ label: item.label, ...(item.metadata || {}) }))),
      products: products.map(product => ({
        id: product.id,
        label: product.label,
        values: clone(product.metadata?.values || {}),
        ...normalizeProductMetadata(product.metadata, product.metadata?.values)
      }))
    };
  }

  window.CatalogSource = Object.freeze({
    VERSION,
    DEFAULT_TABLE_COLUMNS,
    key,
    normalizeColumns,
    normalizeRowValues,
    normalizeSemanticList,
    normalizeAssetRoles,
    normalizeVariant,
    normalizeCommercialRows,
    normalizeLegendDefinition,
    normalizeLegendDefinitions,
    normalizeProductMetadata,
    parseLines,
    formatLines,
    buildCatalogSource
  });
})();
