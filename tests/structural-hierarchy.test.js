/* Contratos de cabeçalho/rodapé compostos e migração corrente. */
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

for (const file of ["app/footer-recipes.js", "app/layout-engine.js", "app/component-registry.js", "app/collection-registry.js", "app/document-store.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());
const header = store.addComponent("catalog-header", { x: 24, y: 24, width: 746, height: 130 }, { props: { kicker: "LINHA", title: "FERRAGENS" } });
const footer = store.addComponent("catalog-footer", { x: 24, y: 990, width: 746, height: 100 });

assert(header.children.length === 5, "O cabeçalho deve nascer com logo, textos e duas linhas editáveis.");
assert(header.children.map(child => child.slot.name).join(",") === "logo,kicker,title,rule,divider", "Os slots semânticos do cabeçalho estão incorretos.");
assert(header.children.find(child => child.slot.name === "kicker").props.content === "LINHA", "O conteúdo legado do cabeçalho não foi transferido ao átomo.");
assert(footer.children.length === 3 && footer.children.every(child => child.type === "footer-item"), "O rodapé deve nascer com a receita estrutural de contato.");
assert(footer.children.every(child => child.children.some(atom => atom.type === "icon") && child.children.filter(atom => atom.type === "text").length === 2), "Cada molécula do rodapé deve conter ícone, título e complemento atômicos.");

store.setEditingContext(footer.id);
const added = store.addComponent("footer-item", { x: 0, y: 0 }, { parentId: footer.id, slotName: "items", props: { icon: "tag", title: "Oferta", subtitle: "Até sexta" } });
assert(footer.children.length === 4 && added.frame.width > 0, "O rodapé não aceitou um novo item no slot coletivo.");
store.updateComponent(added.id, { props: { title: "Oferta especial" } });
assert(added.props.title === "Oferta especial", "A molécula do rodapé não permaneceu editável.");

const legacy = {
  schemaVersion: "1.5.0",
  id: "legacy-structure",
  activePageId: "page-1",
  editor: {},
  pages: [{
    id: "page-1", type: "page", name: "Página", size: { width: 794, height: 1123 }, grid: { unit: 4 }, children: [
      { id: "legacy-header", type: "catalog-header", name: "Cabeçalho", frame: { x: 24, y: 24, width: 746, height: 130 }, constraints: {}, props: { kicker: "ANTIGO", title: "PRESERVADO" }, style: {}, children: [] },
      { id: "legacy-footer", type: "catalog-footer", name: "Rodapé", frame: { x: 24, y: 999, width: 746, height: 100 }, constraints: {}, props: { store: "Loja antiga", city: "Cidade", phone: "000", pageLabel: "Página 9", updatedAt: "Hoje" }, style: {}, children: [] }
    ]
  }]
};
const migrated = new CatalogDocumentStore(legacy);
const migratedHeader = migrated.findComponent("legacy-header").component;
const migratedFooter = migrated.findComponent("legacy-footer").component;
assert(migrated.getState().schemaVersion === "1.16.0", "A estrutura antiga não migrou para 1.16.0.");
assert(migratedHeader.children.find(child => child.slot.name === "title").props.content === "PRESERVADO", "O título legado foi perdido.");
assert(migratedHeader.children.filter(child => child.type === "separator").length === 2, "As linhas do cabeçalho legado não foram atomizadas.");
assert(migratedFooter.children[0].props.title === "Loja antiga" && migratedFooter.children[2].props.title === "Página 9", "Os dados legados do rodapé foram perdidos.");
assert(migratedFooter.children.every(item => item.children.length === 3), "Os itens legados do rodapé não foram atomizados.");
assert(migratedFooter.children[0].children.find(child => child.slot?.name === "title").props.content === "Loja antiga", "O título legado não foi transferido ao átomo de texto.");

console.log("✓ Cabeçalho, rodapé atomizado e migração estrutural 1.16.0 validados.");
