/* Incremento 05.1 — inventário, binding granular, templates de apresentação e subcatálogos. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
global.document = { createElement() { return { click() {} }; } };
global.URL = { createObjectURL() { return ""; }, revokeObjectURL() {} };
global.Blob = class Blob {};

for (const file of ["app/layout-engine.js", "app/component-registry.js", "app/collection-registry.js", "app/document-store.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const titleOf = card => card.children.find(child => child.type === "title-symbol" && child.slot?.name === "title");
const tableOf = card => card.children.find(child => child.type === "data-table" && child.slot?.name === "table");

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const product = store.createProduct({
  title: "PARAFUSO OVAL PHS",
  specOne: "Cabeça oval",
  specTwo: "Aço cromado",
  code: "1176",
  package: "CX 1000 UNID.",
  price: "R$ 35,90"
});
assert(store.getProducts().length === 1 && product.metadata.values.code === "1176", "O inventário não preservou os campos normalizados do produto.");

const card = store.addComponent("product-card", { x: 24, y: 120, width: 350, height: 300 });
const cardId = card.id;
const table = tableOf(card);
const rowId = table.props.rowIds[0];
store.bindProduct(card.id, product.id);
assert(card.binding.productId === product.id, "O card não registrou productId.");
assert(titleOf(card).props.title === "PARAFUSO OVAL PHS", "O título do produto não chegou ao card.");
assert(store.getTableRows(table)[0].metadata.values.price === "R$ 35,90", "O preço do produto não chegou à tabela.");

store.updateProduct(product.id, { price: "R$ 31,50" });
assert(store.findComponent(cardId).component === card, "Atualizar o produto reconstruiu a instância do card.");
assert(table.props.rowIds[0] === rowId, "Atualizar preço substituiu a linha vinculada em vez de atualizar seu valor.");
assert(store.getTableRows(table)[0].metadata.values.price === "R$ 31,50", "O preço atualizado não foi propagado.");

const title = titleOf(card);
store.updateComponent(title.id, { props: { title: "TÍTULO LOCAL" } });
assert(card.binding.overrides.title === true, "Editar um campo sincronizado não criou override explícito.");
store.updateProduct(product.id, { title: "PARAFUSO ATUALIZADO", price: "R$ 30,00" });
assert(title.props.title === "TÍTULO LOCAL", "A sincronização sobrescreveu o override local.");
assert(store.getTableRows(table)[0].metadata.values.price === "R$ 30,00", "Um override de título bloqueou indevidamente outro campo.");
store.setCardOverride(card.id, "title", false);
assert(title.props.title === "PARAFUSO ATUALIZADO", "Desativar override não restaurou o valor do inventário.");

const presentationSource = store.addComponent("product-card", { x: 400, y: 120, width: 350, height: 300 });
store.updateComponent(presentationSource.id, { style: { accentColor: "text.primary", radius: "radius.small" } });
const presentationTemplate = store.saveComponentAsTemplate(presentationSource.id, "Card técnico escuro");
assert(presentationTemplate.metadata.kind === "product-presentation", "O template de card não foi classificado como apresentação de produto.");
assert(presentationTemplate.metadata.component.binding.productId === null, "O snapshot de apresentação capturou indevidamente o produto da origem.");
const applied = store.applyProductTemplate(card.id, presentationTemplate.id);
assert(applied.id === cardId && applied.binding.productId === product.id, "Aplicar apresentação trocou o ID ou perdeu o productId.");
assert(applied.binding.templateId === presentationTemplate.id, "O vínculo não registra o template de apresentação.");
assert(applied.style.accentColor === "text.primary" && titleOf(applied).props.title === "PARAFUSO ATUALIZADO", "A apresentação e o conteúdo não permaneceram separados.");
const appliedRowId = tableOf(applied).props.rowIds[0];
store.updateProduct(product.id, { price: "R$ 29,90" });
assert(tableOf(applied).props.rowIds[0] === appliedRowId && store.getTableRows(tableOf(applied))[0].metadata.values.price === "R$ 29,90", "Atualizar preço após aplicar template reconstruiu a estrutura.");

const second = store.createProduct({ title: "BUCHA", code: "2000", price: "R$ 1,90" });
const subcatalog = store.createSubcatalog("Fixação principal", [product.id, second.id, "inexistente"]);
assert(subcatalog.metadata.productIds.join(",") === `${product.id},${second.id}`, "O subcatálogo não validou a seleção de produtos.");
store.updateSubcatalog(subcatalog.id, { productIds: [second.id] });
assert(subcatalog.metadata.productIds.length === 1 && subcatalog.metadata.productIds[0] === second.id, "A seleção do subcatálogo não foi atualizada.");

const legacyState = JSON.parse(JSON.stringify(store.getState()));
legacyState.schemaVersion = "1.10.0";
const legacyTemplate = legacyState.collections.find(collection => collection.id === "templates").items.find(item => item.id === presentationTemplate.id);
delete legacyTemplate.metadata.kind;
delete legacyTemplate.metadata.component.binding;
legacyState.collections = legacyState.collections.filter(collection => collection.id !== "subcatalogs");
const migrated = new CatalogDocumentStore(legacyState);
const migratedTemplate = migrated.getComponentTemplates().find(item => item.id === presentationTemplate.id);
assert(migratedTemplate.metadata.kind === "product-presentation" && migratedTemplate.metadata.component.binding.productId === null, "A migração não normalizou templates de card do 05.0.");
assert(migrated.getCollection("subcatalogs"), "A migração não criou a coleção de subcatálogos.");

assert(store.removeProduct(product.id) === false, "Um produto em uso foi removido sem política explícita de detach.");
assert(store.removeProduct(product.id, { detach: true }) === true, "A remoção confirmada do produto falhou.");
assert(store.findComponent(cardId).component.binding.productId === null, "A remoção não converteu o card em conteúdo local.");
assert(titleOf(store.findComponent(cardId).component).props.title === "PARAFUSO ATUALIZADO", "O detach apagou o último conteúdo apresentado.");

console.log("✓ Inventário, productId, overrides, apresentação e subcatálogos validados.");
