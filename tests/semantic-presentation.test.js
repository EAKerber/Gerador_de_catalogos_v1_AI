/* Incremento 05.4 — CatalogSource, tabelas genéricas, apresentações, mínimos e legendas. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";

for (const file of [
  "app/tokens.js",
  "app/catalog-source.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/collection-registry.js",
  "app/document-store.js"
]) vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());
assert(store.getState().schemaVersion === "1.16.0", "O documento não iniciou no schema 1.16.0.");
assert(store.getState().collections.length === 6 && store.getCollection("colorLegends"), "A coleção de legendas não foi criada.");

const product = store.createProduct({
  title: "PARAFUSO SEMÂNTICO",
  code: "1176",
  package: "CX 250",
  price: "R$ 35,90",
  specOne: "Alta resistência",
  specTwo: "Aço cromado",
  attributesText: "Material: Aço cromado\nMedida: 4,0×16",
  highlightsText: "Alta resistência\nCabeça oval",
  applicationsText: "MDF\nMadeira maciça"
});
assert(product.metadata.sourceVersion === "1.1.0" && product.metadata.attributes.length === 2, "O produto não foi normalizado como CatalogSource.");
assert(product.metadata.highlights.length === 2 && product.metadata.applications.length === 2, "Destaques e aplicações não foram preservados.");

const card = store.addComponent("product-card", { x: 20, y: 20, width: 350, height: 300 });
store.bindProduct(card.id, product.id);
store.setComponentPresentation(card.id, { presetId: "product-technical", mode: "technical", density: "compact" });
assert(card.presentation.mode === "technical" && card.presentation.density === "compact", "Modo e densidade não foram aplicados.");
const profile = store.getMinimumProfile(card);
assert(profile.technical.width === 220 && profile.recommended.width === 270, "Mínimos técnico e recomendado não foram separados.");
store.setRecommendedMinimum(card.id, { enabled: true, width: 380, height: 320 });
assert(card.constraints.minimums.custom.width === 380, "O recomendado customizado não foi persistido.");

const table = card.children.find(child => child.type === "data-table");
store.addTableColumn(table.id, { key: "measure", label: "Medida", role: "measure", align: "center" });
const row = store.getTableRows(table)[0];
store.updateTableRow(table.id, row.id, { measure: "4,0×16" });
const legend = store.upsertColorLegend({ label: "CX 250", token: "pack.250" });
store.setTableCellLegend(table.id, row.id, "package", legend.metadata.key);
assert(store.getTableColumns(table).some(column => column.key === "measure"), "A coluna genérica não foi adicionada.");
assert(row.metadata.values.measure === "4,0×16" && row.metadata.legendKeys.package === "cx-250", "Valor ou vínculo de legenda não foi persistido.");

const template = store.saveComponentAsTemplate(card.id, "Ficha técnica oficial");
assert(template.metadata.family === "product-card" && template.metadata.version === "1.0.0", "O vocabulário do template está incompleto.");
assert(Array.isArray(template.metadata.assetRequirements) && template.metadata.presentation.mode === "technical", "Requisitos e apresentação não acompanharam o template.");

const source = store.getCatalogSource();
assert(source.sourceFormat === "CatalogSource" && source.products[0].attributes.length === 2, "A projeção CatalogSource não representa o inventário.");
store.removeColorLegend(legend.id);
assert(row.metadata.legendKeys.package === "cx-250" && !store.getColorLegendByKey("cx-250"), "Excluir a legenda não preservou a chave para fallback neutro/recriação.");

const legacy = createBlankCatalogDocument();
legacy.schemaVersion = "1.13.0";
legacy.collections = legacy.collections.filter(collection => collection.id !== "colorLegends");
const migrated = new CatalogDocumentStore(legacy);
assert(migrated.getState().schemaVersion === "1.16.0" && migrated.getCollection("colorLegends"), "A migração 1.13 → 1.14 não hidratou o novo contrato.");

console.log("✓ CatalogSource, apresentações, mínimos, tabela genérica e legenda semântica 05.4 validados.");
