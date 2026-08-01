(function () {
  "use strict";

  const VERSION = "1.1.0";
  const clone = value => JSON.parse(JSON.stringify(value));
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const invalidPlaceholder = value => window.CatalogFooterRecipes?.isPlaceholder?.(value) || /^\[[^\]]+\]$/.test(String(value || "").trim()) || /^\(00\)\s*0{4,5}-0{4}$/.test(String(value || "").trim());

  function collection(document, id) {
    return (document?.collections || []).find(item => item.id === id) || { items: [] };
  }

  function intersection(left, right) {
    const width = Math.max(0, Math.min(number(left.x) + number(left.width), number(right.x) + number(right.width)) - Math.max(number(left.x), number(right.x)));
    const height = Math.max(0, Math.min(number(left.y) + number(left.height), number(right.y) + number(right.height)) - Math.max(number(left.y), number(right.y)));
    return { width, height, area: width * height };
  }

  function isAllowedOverlap(left, right) {
    return left?.layoutItem?.overlay === true
      || right?.layoutItem?.overlay === true
      || left?.props?.allowOverlap === true
      || right?.props?.allowOverlap === true
      || left?.type === "separator"
      || right?.type === "separator";
  }

  function relativeLuminance(hex) {
    const match = String(hex || "").match(/^#([0-9a-f]{6})$/i);
    if (!match) return null;
    const channels = [0, 2, 4].map(offset => parseInt(match[1].slice(offset, offset + 2), 16) / 255)
      .map(value => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  }

  function contrastAgainstWhite(hex) {
    const luminance = relativeLuminance(hex);
    return luminance == null ? null : 1.05 / (luminance + .05);
  }

  function validate(document, options = {}) {
    const target = options.target === "publication" ? "publication" : "draft";
    const issues = [];
    const missingReferences = [];
    const invalidReferences = [];
    const optionalReferences = [];
    const add = (severity, code, message, details = {}) => issues.push({ severity, code, message, ...details });
    const recordMissing = (severity, code, message, reference, details = {}) => {
      const entry = { status: "missing", required: true, severity, code, message, kind: reference.kind, referenceId: reference.referenceId ?? null, ...details };
      missingReferences.push(entry);
      add(severity, code, message, details);
      return entry;
    };
    const recordInvalid = (severity, code, message, reference, details = {}) => {
      const entry = { status: "invalid", required: true, severity, code, message, kind: reference.kind, referenceId: reference.referenceId ?? null, ...details };
      invalidReferences.push(entry);
      add(severity, code, message, details);
      return entry;
    };
    const recordOptional = (kind, reason, details = {}, referenceId = null) => {
      const entry = { status: "optional-unbound", required: false, kind, referenceId, reason, ...details };
      optionalReferences.push(entry);
      return entry;
    };
    const componentIds = new Set();
    const productItems = collection(document, "products").items;
    const products = new Set(productItems.map(item => item.id));
    const rowItems = collection(document, "tableRows").items;
    const rows = new Set(rowItems.map(item => item.id));
    const assets = new Set(collection(document, "assets").items.map(item => item.id));
    const legendItems = collection(document, "colorLegends").items;
    const legendKeys = new Set(legendItems.map(item => item.metadata?.key).filter(Boolean));
    const variantIds = new Set(productItems.flatMap(item => item.metadata?.variants || []).map(item => item.id));
    const summary = { pages: document?.pages?.length || 0, components: 0, products: products.size, tableRows: rows.size, collisions: 0, overflows: 0, missingReferences: 0 };
    const references = { missing: missingReferences, invalid: invalidReferences, optional: optionalReferences };

    if (!document || typeof document !== "object" || Array.isArray(document)) {
      add("error", "DOCUMENT_TYPE", "O documento compilado precisa ser um objeto JSON.");
      return { ok: false, target, validatorVersion: VERSION, summary, references, issues };
    }
    if (!Array.isArray(document.pages) || !document.pages.length) add("error", "PAGE_REQUIRED", "O documento precisa conter ao menos uma página.");

    const visitChildren = (children, bounds, parentPath, pageId) => {
      const siblings = Array.isArray(children) ? children : [];
      const isPageRoot = parentPath === `page:${pageId}`;
      siblings.forEach((component, index) => {
        const path = `${parentPath}/${component?.id || index}`;
        summary.components += 1;
        if (!component || typeof component !== "object") {
          add("error", "COMPONENT_TYPE", `O componente em ${path} é inválido.`, { path, pageId });
          return;
        }
        if (!window.CATALOG_COMPONENT_REGISTRY?.[component.type]) add("error", "COMPONENT_UNKNOWN", `O tipo “${component.type || "sem tipo"}” não existe no manifesto.`, { path, componentId: component.id, pageId });
        if (!component.id) add("error", "COMPONENT_ID_REQUIRED", `O componente em ${path} não possui ID.`, { path, pageId });
        else if (componentIds.has(component.id)) add("error", "COMPONENT_ID_DUPLICATE", `O ID “${component.id}” está duplicado.`, { path, componentId: component.id, pageId });
        else componentIds.add(component.id);

        const frame = component.frame || {};
        const invalidFrame = !Number.isFinite(Number(frame.x)) || !Number.isFinite(Number(frame.y)) || !(number(frame.width) > 0) || !(number(frame.height) > 0);
        if (invalidFrame) add("error", "FRAME_INVALID", `O componente “${component.name || component.id}” possui frame inválido.`, { path, componentId: component.id, pageId });
        else {
          const overflow = {
            left: Math.max(0, -number(frame.x)),
            top: Math.max(0, -number(frame.y)),
            right: Math.max(0, number(frame.x) + number(frame.width) - number(bounds.width)),
            bottom: Math.max(0, number(frame.y) + number(frame.height) - number(bounds.height))
          };
          const amount = Math.max(overflow.left, overflow.top, overflow.right, overflow.bottom);
          if (amount > 2) {
            summary.overflows += 1;
            add("error", isPageRoot ? "PAGE_OVERFLOW" : "CHILD_OVERFLOW", `“${component.name || component.id}” ultrapassa ${Math.ceil(amount)} px do limite de ${isPageRoot ? "página" : "seu componente pai"}.`, { path, componentId: component.id, pageId, overflow });
          }
        }

        if (component.type === "product-card") {
          const productId = component.binding?.productId || null;
          if (!productId) {
            recordOptional("product", "local-content", { path, componentId: component.id, pageId });
          } else if (!products.has(productId)) {
            recordMissing("error", "PRODUCT_REFERENCE_MISSING", `O card “${component.name || component.id}” aponta para o produto ausente “${productId}”.`, { kind: "product", referenceId: productId }, { path, componentId: component.id, pageId, productId });
          }
        }
        if (component.type === "data-table") {
          const columns = window.CatalogSource?.normalizeColumns?.(component.props?.columns) || [];
          const expectedKeys = new Set(columns.map(column => column.key));
          const expectedByCase = new Map(columns.map(column => [column.key.toLowerCase(), column.key]));
          (component.props?.rowIds || []).forEach(rowId => {
            if (!rows.has(rowId)) {
              recordMissing("error", "TABLE_ROW_REFERENCE_MISSING", `A linha “${rowId}” não existe na coleção tableRows.`, { kind: "table-row", referenceId: rowId }, { path, componentId: component.id, pageId, collectionId: "tableRows", rowId });
              return;
            }
            const row = rowItems.find(item => item.id === rowId);
            Object.keys(row?.metadata?.values || {}).forEach(actualKey => {
              if (expectedKeys.has(actualKey)) return;
              const expectedKey = expectedByCase.get(actualKey.toLowerCase());
              if (!expectedKey) return;
              add("error", "TABLE_COLUMN_KEY_CASE_MISMATCH", `A linha “${row.label || row.id}” usa “${actualKey}”, mas a coluna declara “${expectedKey}”.`, {
                path, componentId: component.id, pageId, rowId, actualKey, expectedKey
              });
            });
          });
        }
        if (component.type === "footer-item" && (component.props?.contentState === "pending" || component.props?.placeholder === true || invalidPlaceholder(component.props?.title) || invalidPlaceholder(component.props?.subtitle))) {
          add(target === "publication" ? "error" : "warning", "FOOTER_CONTENT_PENDING", `O item de rodapé “${component.name || component.id}” contém conteúdo pendente.`, { path, componentId: component.id, pageId, role: component.props?.role || "custom" });
        }
        if (component.type === "legend-item" && (!component.props?.legendKey || !legendKeys.has(component.props.legendKey))) {
          const legendKey = component.props?.legendKey || null;
          recordMissing(target === "publication" ? "error" : "warning", "LEGEND_REFERENCE_MISSING", `O item visual “${component.name || component.id}” não aponta para uma legenda semântica válida.`, { kind: "legend", referenceId: legendKey }, { path, componentId: component.id, pageId, collectionId: "colorLegends", legendKey });
        }
        if (component.type === "art") {
          const assetId = component.props?.assetId || null;
          if (!assetId) {
            recordOptional("asset", "placeholder-without-asset", { path, componentId: component.id, pageId, role: component.props?.role || "generic" });
          } else if (!assets.has(assetId)) {
            recordMissing(target === "publication" ? "error" : "warning", "ASSET_REFERENCE_MISSING", `O asset “${assetId}” não acompanha o documento e usará placeholder.`, { kind: "asset", referenceId: assetId }, { path, componentId: component.id, pageId, collectionId: "assets", assetId });
          }
        }
        visitChildren(component.children || [], { width: frame.width, height: frame.height }, path, pageId);
      });

      for (let leftIndex = 0; leftIndex < siblings.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < siblings.length; rightIndex += 1) {
          const left = siblings[leftIndex];
          const right = siblings[rightIndex];
          if (!left?.frame || !right?.frame || isAllowedOverlap(left, right)) continue;
          const overlap = intersection(left.frame, right.frame);
          if (overlap.area <= 4 || overlap.width <= 2 || overlap.height <= 2) continue;
          summary.collisions += 1;
          add("error", "COMPONENT_COLLISION", `“${left.name || left.id}” e “${right.name || right.id}” se sobrepõem (${Math.ceil(overlap.width)}×${Math.ceil(overlap.height)} px).`, {
            path: parentPath,
            pageId,
            componentIds: [left.id, right.id],
            overlap
          });
        }
      }
    };

    (document.pages || []).forEach((page, pageIndex) => {
      const pageId = page?.id || `page-${pageIndex + 1}`;
      const width = number(page?.size?.width);
      const height = number(page?.size?.height);
      if (!(width > 0) || !(height > 0)) add("error", "PAGE_SIZE_INVALID", `A página “${pageId}” possui tamanho inválido.`, { pageId });
      visitChildren(page?.children || [], { width, height }, `page:${pageId}`, pageId);
    });

    productItems.forEach(product => {
      const values = product.metadata?.values || {};
      if (!String(values.title || product.label || "").trim()) add("error", "PRODUCT_TITLE_REQUIRED", `O produto “${product.id}” não possui título.`, { productId: product.id });
      const commercialRows = product.metadata?.commercialRows || [];
      const commercialColumns = window.CatalogSource?.normalizeColumns?.(product.metadata?.tableColumns) || [];
      commercialColumns.forEach(column => {
        if (commercialRows.some(row => String(row.values?.[column.key] || "").trim())) return;
        add("warning", "PRODUCT_COMMERCIAL_COLUMN_EMPTY", `O produto “${product.label || product.id}” não informa valores para a coluna “${column.label}”.`, { productId: product.id, columnKey: column.key, role: column.role });
      });
      const commercialById = new Map(commercialRows.map(row => [row.id, row]));
      (product.metadata?.variants || []).forEach(variant => {
        if (product.metadata?.needsReview === true || !String(variant.label || "").trim() || variant.label === "Variação sem nome") {
          add(target === "publication" ? "error" : "warning", "VARIANT_REVIEW_REQUIRED", `A variação “${variant.id}” do produto “${product.label || product.id}” precisa de revisão.`, { productId: product.id, variantId: variant.id });
        }
        (variant.commercialRowIds || []).forEach(rowId => {
          const row = commercialById.get(rowId);
          if (row && row.variantId === variant.id) return;
          const details = { productId: product.id, variantId: variant.id, rowId };
          if (!row) {
            recordMissing("error", "VARIANT_ROW_REFERENCE_INVALID", `A variação “${variant.label || variant.id}” aponta para a linha comercial ausente “${rowId}”.`, { kind: "variant-row", referenceId: rowId }, details);
          } else {
            recordInvalid("error", "VARIANT_ROW_REFERENCE_INVALID", `A linha comercial “${rowId}” pertence à variação “${row.variantId || "sem vínculo"}”, não a “${variant.id}”.`, { kind: "variant-row", referenceId: rowId }, { ...details, actualVariantId: row.variantId || null });
          }
        });
      });
    });

    rowItems.forEach(row => {
      if (row.metadata?.variantId && !variantIds.has(row.metadata.variantId)) {
        recordMissing(target === "publication" ? "error" : "warning", "TABLE_VARIANT_REFERENCE_MISSING", `A linha “${row.label || row.id}” aponta para a variação inexistente “${row.metadata.variantId}”.`, { kind: "variant", referenceId: row.metadata.variantId }, { rowId: row.id, variantId: row.metadata.variantId });
      }
      Object.entries(row.metadata?.legendKeys || {}).forEach(([columnKey, legendKey]) => {
        if (legendKeys.has(legendKey)) return;
        recordMissing(target === "publication" ? "error" : "warning", "TABLE_LEGEND_REFERENCE_MISSING", `A célula “${columnKey}” da linha “${row.label || row.id}” aponta para a legenda ausente “${legendKey}”.`, { kind: "legend", referenceId: legendKey }, { rowId: row.id, columnKey, collectionId: "colorLegends", legendKey });
      });
    });

    legendItems.forEach(legend => {
      const token = legend.metadata?.token;
      const color = window.CATALOG_EDITOR_TOKENS?.colors?.[token]?.value;
      if (!color) {
        recordMissing(target === "publication" ? "error" : "warning", "LEGEND_TOKEN_MISSING", `A legenda “${legend.label || legend.id}” usa o token de cor inexistente “${token || "vazio"}”.`, { kind: "color-token", referenceId: token || null }, { legendId: legend.id, token: token || null });
        return;
      }
      const ratio = contrastAgainstWhite(color);
      if (ratio != null && ratio < 1.2) add("warning", "LEGEND_CONTRAST_LOW", `A amostra da legenda “${legend.label || legend.id}” quase não se distingue do papel branco (${ratio.toFixed(2)}:1).`, { legendId: legend.id, token, contrast: ratio });
    });

    summary.missingReferences = missingReferences.length;
    if (!issues.length) add("info", "VALIDATION_READY", "Documento estrutural, referencial, editorial e geometricamente válido.");
    return {
      ok: !issues.some(issue => issue.severity === "error"),
      target,
      validatorVersion: VERSION,
      summary,
      references,
      issues
    };
  }

  function repair(document) {
    const next = clone(document);
    const repairs = [];
    (next.pages || []).forEach(page => {
      const width = number(page.size?.width);
      const height = number(page.size?.height);
      (page.children || []).forEach(component => {
        const frame = component.frame || {};
        const right = number(frame.x) + number(frame.width) - width;
        const bottom = number(frame.y) + number(frame.height) - height;
        const left = -number(frame.x);
        const top = -number(frame.y);
        if (Math.max(right, bottom, left, top) <= 2 && Math.max(right, bottom, left, top) > 0) {
          frame.x = Math.max(0, Math.min(number(frame.x), width - number(frame.width)));
          frame.y = Math.max(0, Math.min(number(frame.y), height - number(frame.height)));
          repairs.push({ code: "FRAME_ROUNDING_CLAMPED", componentId: component.id, message: `Ajuste subpixel seguro aplicado a “${component.name || component.id}”.` });
        }
      });
    });
    return { document: next, repairs };
  }

  window.CatalogDocumentValidator = Object.freeze({ VERSION, validate, repair, intersection });
})();
