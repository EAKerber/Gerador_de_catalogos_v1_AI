(function () {
  "use strict";

  const PRODUCT_FIELDS = ["title", "code", "package", "price", "specOne", "specTwo", "attributesText", "highlightsText", "applicationsText", "assetId"];
  const aliases = {
    title: ["titulo", "nome", "produto", "descricao", "title", "name", "product"],
    code: ["codigo", "cod", "sku", "referencia", "ref", "code"],
    package: ["embalagem", "pacote", "package", "pack"],
    price: ["preco", "valor", "valoravista", "valorunitario", "price"],
    specOne: ["especificacao1", "espec1", "destaque1", "atributo1", "specone"],
    specTwo: ["especificacao2", "espec2", "destaque2", "atributo2", "spectwo"],
    attributesText: ["atributos", "attributes"],
    highlightsText: ["destaques", "highlights"],
    applicationsText: ["aplicacoes", "aplicacao", "applications"],
    assetId: ["asset", "assetid", "arte", "imagem", "image"]
  };

  const fold = value => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  const aliasMap = new Map(Object.entries(aliases).flatMap(([field, values]) => values.map(value => [fold(value), field])));

  function detectDelimiter(text) {
    const firstLine = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).find(line => line.trim()) || "";
    const candidates = ["\t", ";", ","];
    const counts = candidates.map(delimiter => ({ delimiter, count: firstLine.split(delimiter).length - 1 }));
    counts.sort((left, right) => right.count - left.count || candidates.indexOf(left.delimiter) - candidates.indexOf(right.delimiter));
    return counts[0].count ? counts[0].delimiter : "\t";
  }

  function parseDelimited(text, delimiter = detectDelimiter(text)) {
    const input = String(text || "").replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < input.length; index += 1) {
      const character = input[index];
      if (character === '"') {
        if (quoted && input[index + 1] === '"') { value += '"'; index += 1; }
        else quoted = !quoted;
      } else if (character === delimiter && !quoted) {
        row.push(value.trim());
        value = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && input[index + 1] === "\n") index += 1;
        row.push(value.trim());
        if (row.some(cell => cell !== "")) rows.push(row);
        row = [];
        value = "";
      } else value += character;
    }
    row.push(value.trim());
    if (row.some(cell => cell !== "")) rows.push(row);
    return { rows, delimiter };
  }

  function parseProducts(text) {
    const parsed = parseDelimited(text);
    const issues = [];
    if (!parsed.rows.length) return { rows: [], issues: [{ severity: "error", code: "EMPTY", message: "Cole ao menos uma linha de produtos." }], delimiter: parsed.delimiter };
    const mappedHeader = parsed.rows[0].map(cell => aliasMap.get(fold(cell)) || null);
    const hasHeader = mappedHeader.includes("title");
    const fields = hasHeader ? mappedHeader : PRODUCT_FIELDS.slice(0, parsed.rows[0].length);
    const sourceRows = hasHeader ? parsed.rows.slice(1) : parsed.rows;
    const rows = [];
    sourceRows.forEach((cells, index) => {
      const item = {};
      fields.forEach((field, cellIndex) => { if (field && cells[cellIndex] !== undefined) item[field] = cells[cellIndex]; });
      if (!String(item.title || "").trim()) {
        issues.push({ severity: "warning", code: "TITLE_MISSING", row: index + (hasHeader ? 2 : 1), message: `Linha ${index + (hasHeader ? 2 : 1)} ignorada porque não possui título.` });
        return;
      }
      rows.push(item);
    });
    if (!rows.length) issues.push({ severity: "error", code: "NO_VALID_PRODUCTS", message: "Nenhum produto válido foi encontrado." });
    return { rows, issues, delimiter: parsed.delimiter, hasHeader };
  }

  function parseTable(text, columns = []) {
    const parsed = parseDelimited(text);
    const normalizedColumns = (columns || []).map(column => ({ ...column, foldedKey: fold(column.key), foldedLabel: fold(column.label) }));
    const resolveColumn = value => normalizedColumns.find(column => column.foldedKey === fold(value) || column.foldedLabel === fold(value))?.key || null;
    if (!parsed.rows.length) return { rows: [], issues: [{ severity: "error", code: "EMPTY", message: "Cole ao menos uma linha da tabela." }], delimiter: parsed.delimiter };
    const mappedHeader = parsed.rows[0].map(resolveColumn);
    const hasHeader = mappedHeader.some(Boolean) && mappedHeader.filter(Boolean).length >= Math.min(2, normalizedColumns.length);
    const keys = hasHeader ? mappedHeader : normalizedColumns.map(column => column.key);
    const sourceRows = (hasHeader ? parsed.rows.slice(1) : parsed.rows).slice(0, 12);
    const rows = sourceRows.map(cells => ({
      values: Object.fromEntries(keys.map((key, index) => [key, cells[index] ?? ""]).filter(([key]) => key))
    })).filter(row => Object.values(row.values).some(value => String(value).trim()));
    const issues = [];
    if ((hasHeader ? parsed.rows.length - 1 : parsed.rows.length) > 12) issues.push({ severity: "warning", code: "ROW_LIMIT", message: "Somente as primeiras 12 linhas foram aplicadas." });
    if (!rows.length) issues.push({ severity: "error", code: "NO_VALID_ROWS", message: "Nenhuma linha válida foi encontrada." });
    return { rows, issues, delimiter: parsed.delimiter, hasHeader };
  }

  function parseGallery(text) {
    const parsed = parseDelimited(text);
    const rows = parsed.rows.slice(0, 24).map((cells, index) => ({
      caption: String(cells[0] || `Variação ${index + 1}`).trim(),
      assetId: String(cells[1] || "").trim() || null
    })).filter(item => item.caption || item.assetId);
    const issues = [];
    if (parsed.rows.length > 24) issues.push({ severity: "warning", code: "ITEM_LIMIT", message: "Somente as primeiras 24 variações foram aplicadas." });
    if (!rows.length) issues.push({ severity: "error", code: "NO_VALID_ITEMS", message: "Cole ao menos uma legenda de imagem." });
    return { rows, issues, delimiter: parsed.delimiter };
  }

  function parseLegends(text) {
    const parsed = parseDelimited(text);
    const header = parsed.rows[0]?.map(fold) || [];
    const hasHeader = header.some(value => ["legenda", "nome", "label"].includes(value));
    const sourceRows = (hasHeader ? parsed.rows.slice(1) : parsed.rows).slice(0, 40);
    const rows = sourceRows.map(cells => ({
      label: String(cells[0] || "").trim(),
      token: String(cells[1] || "surface.neutral").trim() || "surface.neutral",
      groupLabel: String(cells[2] || "Geral").trim() || "Geral"
    })).filter(item => item.label);
    const issues = [];
    if (sourceRows.length < (hasHeader ? parsed.rows.length - 1 : parsed.rows.length)) issues.push({ severity: "warning", code: "ITEM_LIMIT", message: "Somente as primeiras 40 legendas foram aplicadas." });
    if (!rows.length) issues.push({ severity: "error", code: "NO_VALID_LEGENDS", message: "Cole ao menos uma legenda válida." });
    return { rows, issues, delimiter: parsed.delimiter, hasHeader };
  }

  window.CatalogManualEntry = Object.freeze({ PRODUCT_FIELDS, detectDelimiter, parseDelimited, parseProducts, parseTable, parseGallery, parseLegends, fold });
})();
