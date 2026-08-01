/* Incremento 05.5 — plano editorial, compilação determinística e gate geométrico. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
[
  "app/tokens.js",
  "app/catalog-source.js",
  "app/catalog-generation-plan.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/footer-recipes.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/catalog-validator.js",
  "app/catalog-compiler.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const source = JSON.parse(fs.readFileSync(path.join(root, "authoring-kit/examples/reference-catalog-source.json"), "utf8"));
const first = CatalogCompiler.compile(source);
const second = CatalogCompiler.compile(source);

assert(first.ok, `A referência não compilou: ${first.issues.map(item => item.code).join(", ")}`);
assert(first.summary.products === 7 && first.summary.tableRows === 16, "Produtos ou linhas comerciais não foram materializados.");
assert(first.summary.actionsRequired === 3, "O fluxo de alto nível não preservou a meta de três ações.");
assert(first.summary.collisions === 0 && first.summary.overflows === 0, "O compilador produziu colisão ou overflow.");
assert(CatalogCompiler.stableJSON(first.document) === CatalogCompiler.stableJSON(second.document), "A mesma fonte e plano não produziram documentos determinísticos.");
assert(first.document.schemaVersion === "1.16.0" && first.document.generation?.plan?.planFormat === "CatalogGenerationPlan", "Metadados de compilação ou schema 1.16 estão ausentes.");

const cards = first.document.pages[0].children.filter(component => component.type === "product-card");
assert(cards.length === 7 && cards[0].binding.productId === "product-1176", "Ordem editorial ou binding dos cards divergiu.");
const rowCounts = cards.map(card => card.children.find(child => child.type === "data-table").props.rowIds.length);
assert(JSON.stringify(rowCounts) === JSON.stringify([1, 2, 2, 3, 1, 2, 5]), "As linhas comerciais da referência não foram preservadas.");
assert(!cards.some(card => card.children.some(child => child.type === "art-gallery")), "Linhas ou variantes sem assets criaram galerias automáticas.");
const explicitVariants = CatalogCompiler.compile(source, {
  products: [3, 6].map(index => ({ productId: source.products[index].id, presetId: "product-variants", mode: "variants" }))
});
assert(explicitVariants.document.pages[0].children.filter(component => component.type === "product-card").filter(card => card.children.some(child => child.type === "art-gallery")).length === 2, "A solicitação explícita de galeria deixou de materializar variantes.");
assert(first.gates.renderedText.status === "notRun" && first.gates.editorRoundTrip.status === "notRun", "Gates indisponíveis fora do editor foram apresentados como executados.");

const invalidGeometry = JSON.parse(JSON.stringify(first.document));
invalidGeometry.pages[0].children[2].frame.x = invalidGeometry.pages[0].children[1].frame.x;
invalidGeometry.pages[0].children[2].frame.y = invalidGeometry.pages[0].children[1].frame.y;
const geometryReport = CatalogDocumentValidator.validate(invalidGeometry, { target: "publication" });
assert(!geometryReport.ok && geometryReport.issues.some(item => item.code === "COMPONENT_COLLISION"), "O gate não detectou colisão de componentes raiz.");

const invalidChildGeometry = JSON.parse(JSON.stringify(first.document));
const childParent = invalidChildGeometry.pages[0].children.find(component => component.children?.length);
childParent.children[0].frame.x = childParent.frame.width;
const childGeometryReport = CatalogDocumentValidator.validate(invalidChildGeometry, { target: "publication" });
assert(!childGeometryReport.ok && childGeometryReport.issues.some(item => item.code === "CHILD_OVERFLOW"), "O gate não distinguiu overflow de filho do overflow de página.");

const gridOnly = CatalogCompiler.compile(source, { strategy: "grid-only", layout: { maxGridRows: 3 } });
assert(gridOnly.ok, `A estratégia grid-only falhou: ${gridOnly.issues.map(item => item.code).join(", ")}`);
assert(gridOnly.document.pages[0].children.filter(component => component.type === "product-card").length === 7, "A estratégia grid-only omitiu o primeiro produto.");
assert(gridOnly.plan.heroProductId === null && gridOnly.plan.products.every(item => item.role === "grid"), "O plano grid-only preservou um hero implícito.");

const tooMany = JSON.parse(JSON.stringify(source));
tooMany.products.push(...source.products.slice(0, 3).map((product, index) => ({ ...product, id: `extra-${index + 1}` })));
const capacity = CatalogCompiler.compile(tooMany);
assert(!capacity.ok && capacity.issues.some(item => item.code === "GRID_CAPACITY_EXCEEDED"), "Capacidade de página excedida não bloqueou a compilação.");

console.log("✓ CatalogGenerationPlan, estratégias hero-grid/grid-only, preset compacto e gate geométrico 05.5 validados.");
