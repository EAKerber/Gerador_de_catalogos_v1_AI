/* Incremento 05.15 — composição hero + grade + faixa. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
for (const file of ["app/tokens.js", "app/catalog-source.js", "app/table-schema-registry.js", "app/presentation-registry.js", "app/catalog-icons.js", "app/layout-engine.js", "app/component-registry.js", "app/section-recipes.js", "app/collection-registry.js", "app/document-store.js", "app/catalog-validator.js"]) vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const store = new CatalogDocumentStore(createBlankCatalogDocument());
const products = Array.from({ length: 7 }, (_, index) => store.createProduct({ title: `PRODUTO ${index + 1}`, code: String(1001 + index), package: "CX 100", price: `R$ ${index + 1},00` }));
const before = store.getHistoryState().undoCount;
const result = store.createHeroGridStripForProducts(products.map(product => product.id), { columns: 3 });
assert(result.hero.binding.productId === products[0].id && result.hero.presentation.mode === "hero", "O primeiro produto não assumiu o papel de destaque.");
assert(result.cards.length === 6 && result.cards.every((card, index) => card.binding.productId === products[index + 1].id), "A grade não preservou a ordem dos demais produtos.");
assert(result.strip.children.length === 3 && result.strip.children.every(child => child.type === "specification"), "A faixa complementar não permaneceu editável por peças comuns.");
assert(result.composition.children.map(child => child.props?.recipeRole).join(",") === "hero,grid,strip", "A hierarquia da receita perdeu seus papéis estáveis.");
assert(store.getHistoryState().undoCount === before + 1 && store.getHistoryState().undoLabel === "Criar hero, grade e faixa", "A composição não foi uma transação reversível única.");
store.undo();
assert(!store.findComponent(result.composition.id), "Desfazer não removeu a composição inteira.");
console.log("✓ Hero + grade + faixa materializa sete produtos e três regiões editáveis em uma ação.");
