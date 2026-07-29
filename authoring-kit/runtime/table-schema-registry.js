(function () {
  "use strict";

  const VERSION = "1.0.0";
  const clone = value => JSON.parse(JSON.stringify(value));
  const column = (key, label, role, align = "center", width = 1) => ({ key, label, role, align, width });

  const schemas = Object.freeze({
    commercial: Object.freeze({
      id: "commercial",
      label: "Comercial",
      description: "Código, embalagem e preço.",
      columns: [
        column("code", "CÓDIGO", "identifier"),
        column("package", "EMBALAGEM", "package"),
        column("price", "PREÇO", "price", "end")
      ]
    }),
    measured: Object.freeze({
      id: "measured",
      label: "Medida e embalagem",
      description: "Código, medida, embalagem e preço.",
      columns: [
        column("code", "CÓDIGO", "identifier"),
        column("measure", "MEDIDA", "measure"),
        column("package", "EMBALAGEM", "package"),
        column("price", "PREÇO", "price", "end")
      ]
    }),
    variants: Object.freeze({
      id: "variants",
      label: "Variações",
      description: "Código, variação, embalagem e preço.",
      columns: [
        column("code", "CÓDIGO", "identifier"),
        column("variant", "VARIAÇÃO", "value"),
        column("package", "EMBALAGEM", "package"),
        column("price", "PREÇO", "price", "end")
      ]
    }),
    unit: Object.freeze({
      id: "unit",
      label: "Valor unitário",
      description: "Código, variação e valor unitário.",
      columns: [
        column("code", "CÓDIGO", "identifier"),
        column("variant", "VARIAÇÃO", "value"),
        column("price", "VALOR UNITÁRIO", "price", "end")
      ]
    })
  });

  function list() { return Object.values(schemas).map(clone); }
  function get(schemaId) { return schemas[schemaId] ? clone(schemas[schemaId]) : null; }

  window.CATALOG_TABLE_SCHEMAS = schemas;
  window.CatalogTableSchemas = Object.freeze({ VERSION, list, get });
})();
