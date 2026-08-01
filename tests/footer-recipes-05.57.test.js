/* Incremento 05.57A — receitas factualmente inertes e validação comercial determinística. */
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
const baseSource = {
  sourceFormat: "CatalogSource",
  sourceVersion: "1.1.0",
  catalog: { id: "footer-test", title: "CATÁLOGO DE TESTE" },
  products: [{
    id: "product-1",
    label: "PRODUTO DE TESTE",
    values: { title: "PRODUTO DE TESTE" },
    tableColumns: [{ key: "unitprice", label: "Preço unit.", role: "price", align: "center", width: 1 }],
    commercialRows: [{ id: "row-1", values: { unitprice: "R$ 00,00" } }]
  }]
};

const pendingPlan = CatalogGenerationPlan.normalize(baseSource, {});
assert(pendingPlan.planVersion === "1.1.0", "O plano não adotou o contrato 1.1.0.");
assert(pendingPlan.footer.state === "pending" && pendingPlan.footer.recommendation.status === "needs-input", "A ausência de dados não solicitou decisão sobre o rodapé.");
assert(pendingPlan.footer.items.length === 3 && pendingPlan.footer.items.filter(item => item.placeholder).length === 2, "A receita de contato não materializou dois papéis pendentes e paginação.");
assert(!JSON.stringify(pendingPlan.footer).includes("Top Mobili") && !JSON.stringify(pendingPlan.footer).includes("98977"), "Fatos comerciais vazaram para o plano padrão.");

const omittedPlan = CatalogGenerationPlan.normalize(baseSource, { footer: { enabled: false } });
assert(omittedPlan.footer.state === "omitted" && omittedPlan.footer.items.length === 0, "A remoção explícita do rodapé não foi preservada.");

const partialPlan = CatalogGenerationPlan.normalize({ ...baseSource, catalog: { ...baseSource.catalog, store: "Empresa confirmada" } }, {});
assert(partialPlan.footer.recommendation.status === "needs-input" && partialPlan.footer.items[0].title === "Empresa confirmada", "Dados parciais não preservaram o fato confirmado nem solicitaram os papéis ausentes.");

for (const exampleName of ["catalog-source.json", "reference-catalog-source.json"]) {
  const example = JSON.parse(fs.readFileSync(path.join(root, "authoring-kit/examples", exampleName), "utf8"));
  assert(/^\[/.test(example.catalog.title) && /^\[/.test(example.catalog.store), `${exampleName} ainda contém identidade didática válida.`);
  example.products.forEach(product => {
    assert(/^\[/.test(product.label) && /^\[/.test(product.values.title), `${exampleName} ainda contém produto didático válido.`);
    [product.values.code, product.values.package, product.values.price].filter(Boolean).forEach(value => assert(/^\[/.test(value), `${exampleName} ainda contém valor comercial didático válido.`));
    (product.commercialRows || []).forEach(row => Object.values(row.values || {}).forEach(value => assert(/^\[/.test(value), `${exampleName} ainda contém célula comercial didática válida.`)));
  });
}

const cliSource = fs.readFileSync(path.join(root, "authoring-kit/compiler/compile-catalog.js"), "utf8");
assert(cliSource.includes('"footer-recipes.js"') && cliSource.includes("gates: result.gates"), "O CLI distribuído não carrega receitas de footer ou omite os estados de gate no relatório.");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const footer = store.addComponent("catalog-footer", { x: 24, y: 990, width: 746, height: 100 });
const historyBefore = store.getHistoryState().undoCount;
store.applyFooterRecipe(footer.id, "informative", 4);
assert(footer.children.length === 4 && footer.children.every(item => item.props.role), "A receita informativa não criou quatro papéis semânticos.");
assert(store.getHistoryState().undoCount === historyBefore + 1 && store.getHistoryState().undoLabel === "Ajustar receita do rodapé", "A troca de receita não foi uma ação reversível única.");
store.undo();
assert(store.findComponent(footer.id).component.children.length === 3, "Desfazer não restaurou a receita anterior.");

const validDraft = CatalogCompiler.compile(baseSource);
assert(validDraft.ok && !validDraft.issues.some(item => item.code === "PRODUCT_COMMERCIAL_COLUMN_EMPTY"), "A coluna comercial preenchida continuou exigindo duplicação em values.");
assert(validDraft.decisions.some(item => item.code === "FOOTER_INPUT_REQUIRED"), "O compilador não registrou a consulta pendente do rodapé.");
assert(validDraft.gates.renderedText.status === "notRun" && validDraft.gates.editorRoundTrip.status === "notRun", "Um gate externo ao compilador foi aprovado sem execução.");

const invalidCase = JSON.parse(JSON.stringify(baseSource));
invalidCase.products[0].commercialRows[0].values = { unitPrice: "R$ 00,00" };
const invalidResult = CatalogCompiler.compile(invalidCase, { footer: { enabled: false } });
assert(!invalidResult.ok && invalidResult.issues.some(item => item.code === "TABLE_COLUMN_KEY_CASE_MISMATCH"), "unitPrice versus unitprice não bloqueou a compilação.");

const publication = CatalogCompiler.compile(baseSource, null, { target: "publication" });
assert(!publication.ok && publication.issues.some(item => item.code === "FOOTER_CONTENT_PENDING"), "Placeholders do rodapé não bloquearam publicação.");

const omitted = CatalogCompiler.compile(baseSource, { footer: { enabled: false } });
assert(omitted.ok && !omitted.document.pages[0].children.some(component => component.type === "catalog-footer"), "O caso de borda explícito preservou um rodapé vazio.");

console.log("✓ 05.57A valida receitas de footer, consulta pendente, chaves comerciais e gates notRun.");
