/* Incremento 05.10 — variantes semânticas e legendas visuais hierárquicas. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
[
  "app/tokens.js", "app/catalog-source.js", "app/presentation-registry.js", "app/catalog-icons.js",
  "app/layout-engine.js", "app/component-registry.js", "app/collection-registry.js",
  "app/document-store.js", "app/catalog-validator.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const product = store.createProduct({ title: "CANTONEIRA", code: "1037", package: "PCT 100", price: "R$ 22,90" });
const card = store.addComponent("product-card", { x: 20, y: 20, width: 350, height: 300 });
store.bindProduct(card.id, product.id);

const variant = store.addProductVariant(product.id, {
  label: "Cromado",
  commercialValues: { code: "1037", package: "PCT 100", price: "R$ 22,90" }
}, { materializeVisual: true, materializeRow: true });
const normalizedProduct = store.getProduct(product.id);
const sourceRow = normalizedProduct.metadata.commercialRows.find(row => row.variantId === variant.id);
const gallery = card.children.find(child => child.type === "art-gallery");
const art = gallery?.children.find(child => child.props?.variantId === variant.id);
const table = card.children.find(child => child.type === "data-table");
const row = store.getTableRows(table).find(item => item.metadata?.variantId === variant.id);
assert(sourceRow && variant.commercialRowIds.includes(sourceRow.id), "A variante não vinculou sua linha comercial semântica.");
assert(art?.props.semanticBinding === "variant" && row?.metadata.sourceRowId === sourceRow.id, "A materialização visual/comercial não preservou os vínculos.");

art.props.caption = "Legenda editorial local";
store.updateProductVariant(product.id, variant.id, { label: "Cromado premium", commercialValues: { price: "R$ 24,90" } });
assert(art.props.label === "CROMADO PREMIUM" && art.props.caption === "Legenda editorial local", "Atualizar a semântica sobrescreveu a legenda editorial local.");
assert(row.metadata.values.price === "R$ 24,90", "A linha visual não acompanhou o valor comercial vinculado.");

const legend = store.upsertColorLegend({ label: "CX 250", token: "pack.250", groupLabel: "Embalagens", emphasized: true }, { materialize: true, groupLabel: "Embalagens" });
const panel = store.getLegendPanels()[0];
const group = panel.children.find(child => child.type === "legend-group" && child.props.groupId === "embalagens");
const legendItem = group?.children.find(child => child.type === "legend-item" && child.props.legendKey === legend.metadata.key);
store.setTableCellLegend(table.id, row.id, "package", legend.metadata.key);
assert(panel && group && legendItem, "A definição semântica não criou painel, grupo e item vinculados.");
assert(row.metadata.legendKeys.package === legend.metadata.key, "A célula não preservou o vínculo real com a legenda.");

const source = store.getCatalogSource();
assert(source.sourceVersion === "1.1.0" && source.legends[0].groupId === "embalagens", "CatalogSource 1.1 não exportou a hierarquia de legendas.");
assert(source.products[0].variants[0].commercialRowIds.includes(sourceRow.id), "CatalogSource não exportou a relação variante–linha.");
const validation = CatalogDocumentValidator.validate(store.getExportDocument(), { target: "publication" });
assert(!validation.issues.some(issue => ["VARIANT_ROW_REFERENCE_INVALID", "TABLE_LEGEND_REFERENCE_MISSING", "LEGEND_REFERENCE_MISSING"].includes(issue.code)), "O documento vinculado falhou na validação referencial.");

const legacy = createBlankCatalogDocument();
legacy.schemaVersion = "1.15.0";
legacy.collections.find(collection => collection.id === "products").items.push({
  id: "legacy-product", label: "Legado", reference: null,
  metadata: { values: { title: "Legado", code: "1", package: "PCT", price: "R$ 1", assetId: null }, sourceVersion: "1.0.0", variants: [{ id: "branco", label: "Branco", attributes: [], assetIds: [] }] }
});
const migrated = new CatalogDocumentStore(legacy);
assert(migrated.getState().schemaVersion === "1.16.0" && migrated.getProduct("legacy-product").metadata.variants[0].commercialRowIds.length === 0, "A migração 1.15 → 1.16 não normalizou variantes antigas.");

console.log("✓ Variantes semânticas, materialização vinculada e legendas hierárquicas 05.10 validadas.");
