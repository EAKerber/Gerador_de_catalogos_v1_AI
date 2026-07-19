(function () {
  "use strict";

  const clone = value => JSON.parse(JSON.stringify(value));
  const definitions = {
    assets: {
      id: "assets",
      label: "Artes e mídia",
      itemType: "asset",
      storagePolicy: "reference-only"
    },
    products: {
      id: "products",
      label: "Produtos",
      itemType: "product",
      storagePolicy: "document"
    },
    subcatalogs: {
      id: "subcatalogs",
      label: "Subcatálogos",
      itemType: "subcatalog",
      storagePolicy: "document"
    },
    templates: {
      id: "templates",
      label: "Meus componentes",
      itemType: "template",
      storagePolicy: "document"
    },
    tableRows: {
      id: "tableRows",
      label: "Linhas de tabela",
      itemType: "table-row",
      storagePolicy: "document"
    },
    colorLegends: {
      id: "colorLegends",
      label: "Legendas semânticas",
      itemType: "color-legend",
      storagePolicy: "document"
    }
  };

  function containsEmbeddedBinary(value) {
    if (typeof value === "string") return /^data:[^;]+;base64,/i.test(value);
    if (Array.isArray(value)) return value.some(containsEmbeddedBinary);
    if (!value || typeof value !== "object") return false;
    return Object.entries(value).some(([key, nested]) => /base64|binary|bytes/i.test(key) || containsEmbeddedBinary(nested));
  }

  function normalizeItem(collection, item, index = 0) {
    const next = clone(item || {});
    next.id = String(next.id || `${collection.id}-item-${index + 1}`);
    next.label = String(next.label || next.name || next.id);
    next.metadata = next.metadata && typeof next.metadata === "object" ? next.metadata : {};
    next.reference = next.reference && typeof next.reference === "object" ? next.reference : null;
    if (collection.itemType === "asset" && containsEmbeddedBinary(next)) {
      throw new Error("Assets devem usar referências; dados binários/base64 não pertencem ao documento.");
    }
    if (collection.itemType === "asset") {
      const provenance = next.metadata.provenance || {};
      const approval = next.metadata.approval || {};
      next.metadata.provenance = {
        origin: provenance.origin || (next.reference?.provider === "bundled" ? "official" : "provided"),
        role: provenance.role || "generic",
        relatedProductIds: Array.isArray(provenance.relatedProductIds) ? provenance.relatedProductIds.map(String) : [],
        sourceAssetIds: Array.isArray(provenance.sourceAssetIds) ? provenance.sourceAssetIds.map(String) : [],
        method: provenance.method || "direct-import",
        fidelity: provenance.fidelity || (next.reference?.provider === "bundled" ? "deterministic" : "product-faithful"),
        generator: provenance.generator == null ? null : String(provenance.generator)
      };
      next.metadata.approval = {
        status: approval.status || "review-required",
        publishAllowed: approval.publishAllowed === true,
        reviewedAt: approval.reviewedAt || null
      };
    }
    if (collection.itemType === "color-legend") {
      const legendKey = window.CatalogSource?.key?.(next.metadata.key || next.label, next.id) || next.id;
      next.metadata = {
        ...next.metadata,
        key: legendKey,
        token: String(next.metadata.token || "surface.neutral"),
        textLabel: String(next.metadata.textLabel || next.label || legendKey),
        fallback: String(next.metadata.fallback || next.metadata.textLabel || next.label || legendKey),
        groupId: window.CatalogSource?.key?.(next.metadata.groupId || next.metadata.groupLabel || "geral", "geral") || "geral",
        groupLabel: String(next.metadata.groupLabel || "Geral"),
        groupOrder: Math.max(0, Math.round(Number(next.metadata.groupOrder) || 0)),
        order: Math.max(0, Math.round(Number(next.metadata.order) || index)),
        emphasized: next.metadata.emphasized === true
      };
    }
    return next;
  }

  function normalizeCollection(collection, index = 0) {
    const source = collection && typeof collection === "object" ? collection : {};
    const definition = definitions[source.id] || {};
    const next = {
      id: String(source.id || definition.id || `collection-${index + 1}`),
      label: String(source.label || definition.label || source.id || `Coleção ${index + 1}`),
      itemType: String(source.itemType || definition.itemType || "generic"),
      storagePolicy: String(source.storagePolicy || definition.storagePolicy || "document"),
      items: Array.isArray(source.items) ? source.items : []
    };
    next.items = next.items.map((item, itemIndex) => normalizeItem(next, item, itemIndex));
    return next;
  }

  function createDefaults() {
    return Object.values(definitions).map(normalizeCollection);
  }

  function normalizeCollections(collections) {
    const source = Array.isArray(collections)
      ? collections
      : collections && typeof collections === "object"
        ? Object.values(collections)
        : [];
    const normalized = source.map(normalizeCollection);
    for (const definition of Object.values(definitions)) {
      if (!normalized.some(collection => collection.id === definition.id)) normalized.push(normalizeCollection(definition));
    }
    return normalized;
  }

  window.CATALOG_COLLECTION_REGISTRY = definitions;
  window.CatalogCollections = { createDefaults, normalizeCollections, normalizeCollection, normalizeItem, containsEmbeddedBinary };
})();
