/* DB-05.20.3 — relatório detalhado de referências obrigatórias, inválidas e opcionais. */
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const appPath = path.join(root, "app", "catalog-validator.js");
const kitPath = path.join(root, "authoring-kit", "runtime", "catalog-validator.js");
const appSource = fs.readFileSync(appPath, "utf8");
const kitSource = fs.readFileSync(kitPath, "utf8");
assert.strictEqual(appSource, kitSource, "O validador do app divergiu do espelho do AuthoringKit.");

const window = {
  CATALOG_COMPONENT_REGISTRY: Object.fromEntries([
    "product-card", "art", "data-table", "legend-item", "text"
  ].map(type => [type, {}])),
  CATALOG_EDITOR_TOKENS: {
    colors: {
      "brand.primary": { value: "#fd0807" },
      "surface.neutral": { value: "#f5f6f7" }
    }
  }
};
vm.runInNewContext(appSource, { window, console }, { filename: appPath });
const validator = window.CatalogDocumentValidator;
assert.strictEqual(validator.VERSION, "1.1.0", "Versão inesperada do validador.");

const clone = value => JSON.parse(JSON.stringify(value));
const component = (id, type, x, props = {}, extra = {}) => ({
  id,
  type,
  name: id,
  frame: { x, y: 20, width: 120, height: 100 },
  props,
  style: {},
  children: [],
  ...extra
});
const documentWith = ({ children = [], products = [], rows = [], assets = [], legends = [] } = {}) => ({
  schemaVersion: "1.16.0",
  collections: [
    { id: "products", items: products },
    { id: "tableRows", items: rows },
    { id: "assets", items: assets },
    { id: "colorLegends", items: legends }
  ],
  pages: [{ id: "page-1", size: { width: 794, height: 1123 }, children }]
});

{
  const localCard = component("card-local", "product-card", 20, {}, { binding: { productId: null, templateId: null, overrides: {} } });
  const placeholder = component("art-placeholder", "art", 160, { assetId: null, role: "product" });
  const report = validator.validate(documentWith({ children: [localCard, placeholder] }), { target: "publication" });
  assert.strictEqual(report.summary.missingReferences, 0, "Card local ou placeholder vazio foi contado como ausente.");
  assert.strictEqual(report.references.missing.length, 0, "Referências opcionais vazias foram classificadas como obrigatórias.");
  assert.strictEqual(report.references.invalid.length, 0, "Documento local criou referência inválida.");
  assert.deepStrictEqual(Array.from(report.references.optional, item => `${item.kind}:${item.reason}`).sort(), [
    "asset:placeholder-without-asset",
    "product:local-content"
  ]);
  assert.strictEqual(report.ok, true, "Conteúdo autônomo e placeholder deliberado deveriam ser publicáveis.");
}

{
  const missingProduct = component("card-missing", "product-card", 20, {}, { binding: { productId: "product-404", templateId: null, overrides: {} } });
  const missingAsset = component("art-missing", "art", 160, { assetId: "asset-404", role: "product" });
  const missingRow = component("table-missing", "data-table", 300, { rowIds: ["row-404"] });
  const missingLegend = component("legend-missing", "legend-item", 440, { legendKey: "legend-404" });
  const draft = validator.validate(documentWith({ children: [missingProduct, missingAsset, missingRow, missingLegend] }), { target: "draft" });
  assert.strictEqual(draft.summary.missingReferences, 4, "A contagem não foi derivada das quatro referências ausentes.");
  assert.strictEqual(draft.summary.missingReferences, draft.references.missing.length, "Resumo e detalhes de referências divergiram.");
  assert.deepStrictEqual(Array.from(draft.references.missing, item => `${item.kind}:${item.referenceId}`).sort(), [
    "asset:asset-404",
    "legend:legend-404",
    "product:product-404",
    "table-row:row-404"
  ]);
  assert.strictEqual(draft.references.missing.find(item => item.kind === "asset").severity, "warning", "Asset ausente deveria ser aviso no rascunho.");
  assert.strictEqual(draft.references.missing.find(item => item.kind === "product").severity, "error", "Produto explicitamente ausente deve continuar bloqueante.");
  const publication = validator.validate(documentWith({ children: [missingProduct, missingAsset, missingRow, missingLegend] }), { target: "publication" });
  assert(publication.references.missing.every(item => item.severity === "error"), "Referências obrigatórias não ficaram bloqueantes na publicação.");
}

{
  const product = {
    id: "product-1",
    label: "Produto",
    metadata: {
      values: { title: "Produto", code: "001", package: "CX", price: "R$ 1,00" },
      variants: [{ id: "variant-1", label: "Variação 1", commercialRowIds: ["commercial-1"] }],
      commercialRows: [{ id: "commercial-1", variantId: "variant-other" }]
    }
  };
  const report = validator.validate(documentWith({ products: [product] }), { target: "publication" });
  assert.strictEqual(report.summary.missingReferences, 0, "Vínculo existente, porém incompatível, não deve ser contado como ausente.");
  assert.strictEqual(report.references.invalid.length, 1, "A incompatibilidade de propriedade da linha não foi detalhada.");
  assert.strictEqual(report.references.invalid[0].kind, "variant-row");
  assert.strictEqual(report.references.invalid[0].referenceId, "commercial-1");
  assert.strictEqual(report.references.invalid[0].actualVariantId, "variant-other");
  assert.strictEqual(report.ok, false, "Referência incompatível deve continuar bloqueante.");
}

{
  const product = {
    id: "product-2",
    label: "Produto 2",
    metadata: {
      values: { title: "Produto 2", code: "002", package: "CX", price: "R$ 2,00" },
      variants: [],
      commercialRows: []
    }
  };
  const row = { id: "row-1", label: "Linha", metadata: { values: {}, variantId: "variant-404", legendKeys: { price: "legend-404" } } };
  const legend = { id: "legend-1", label: "Legenda", metadata: { key: "legend-1", token: "token-404" } };
  const report = validator.validate(documentWith({ products: [product], rows: [row], legends: [legend] }), { target: "publication" });
  assert.strictEqual(report.summary.missingReferences, 3, "Variação, legenda de célula e token ausentes deveriam ser detalhados.");
  assert.deepStrictEqual(Array.from(report.references.missing, item => item.kind).sort(), ["color-token", "legend", "variant"]);
}

{
  const original = documentWith({
    children: [component("card-valid", "product-card", 20, {}, { binding: { productId: "product-valid", templateId: null, overrides: {} } })],
    products: [{
      id: "product-valid",
      label: "Produto válido",
      metadata: { values: { title: "Produto válido", code: "001", package: "CX", price: "R$ 1,00" }, variants: [], commercialRows: [] }
    }]
  });
  const before = clone(original);
  validator.validate(original, { target: "publication" });
  assert.deepStrictEqual(original, before, "A validação modificou o documento recebido.");
}

console.log("✓ DB-05.20.3 distingue referências ausentes, inválidas e opcionais com paridade app/AuthoringKit.");
