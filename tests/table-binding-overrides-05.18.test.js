/* Auditoria 05.18 â€” ediÃ§Ã£o tabular em lote deve preservar overrides de cards vinculados. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {}, clear() {} };
global.CatalogEditorIcon = () => "";

[
  "app/catalog-source.js",
  "app/presentation-registry.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/reflow-history-stability-contract.js",
  "app/table-binding-overrides-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

CatalogReflowHistoryStabilityContract.install();
CatalogTableBindingOverridesContract.install();

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));
const findType = (component, type) => {
  if (component?.type === type) return component;
  for (const child of component?.children || []) {
    const found = findType(child, type);
    if (found) return found;
  }
  return null;
};
const commercial = store => {
  const card = store.getProductCard(cardId);
  const table = findType(card, "data-table");
  const row = store.getTableRows(table)[0];
  return {
    card,
    table,
    values: clone(row?.metadata?.values || {}),
    overrides: clone(card?.binding?.overrides || {})
  };
};

const seed = new CatalogDocumentStore(createBlankCatalogDocument());
const product = seed.createProduct({
  title: "Produto vinculado",
  code: "ST-0001",
  package: "CAIXA 100",
  price: "R$ 111,99"
});
const createdCard = seed.addComponent("product-card", { x: 24, y: 24, width: 360, height: 300 }, { parentId: null });
seed.bindProduct(createdCard.id, product.id);
const cardId = createdCard.id;
const store = new CatalogDocumentStore(seed.getExportDocument());

let state = commercial(store);
assert(state.values.code === "ST-0001" && state.values.package === "CAIXA 100" && state.values.price === "R$ 111,99", `A fixture vinculada nÃ£o recebeu os dados do produto: ${JSON.stringify(state.values)}.`);
assert(["code", "package", "price"].every(field => state.overrides[field] !== true), `A fixture comeÃ§ou com overrides indevidos: ${JSON.stringify(state.overrides)}.`);

store.replaceTableRowsBulk(state.table.id, [{
  values: { code: "VAR-001", package: "PACOTE 1", price: "R$ 17,00" }
}], { mode: "replace" });

state = commercial(store);
assert(state.values.code === "VAR-001" && state.values.package === "PACOTE 1" && state.values.price === "R$ 17,00", `A substituiÃ§Ã£o em lote nÃ£o persistiu: ${JSON.stringify(state.values)}.`);
assert(["code", "package", "price"].every(field => state.overrides[field] === true), `A substituiÃ§Ã£o em lote nÃ£o marcou os overrides: ${JSON.stringify(state.overrides)}.`);
assert(store.getHistoryState().undoCount === 1, `A substituiÃ§Ã£o em lote deveria criar uma Ãºnica aÃ§Ã£o"G´¥4ôâç7G&–æv–g’‡7F÷&RævWD†—7F÷'•7FFR‚’—Òæ“° ¦6öç7B–×÷'FVBÒæWr6FÆötFö7VÖVçE7F÷&R‡7F÷&RævWDW‡÷'DFö7VÖVçB‚’“°¦ÆWB–×÷'FVE7FFRÒ‚‚’Óâ°¢6öç7B6&BÒ–×÷'FVBævWE&öGV7D6&B†6&D–B“°¢6öç7BF&ÆRÒf–æEG—R†6&BÂ&FF×F&ÆR"“°¢6öç7B&÷rÒ–×÷'FVBævWEF&ÆU&÷w2‡F&ÆR•³Ó°¢&WGW&â²fÇVW3¢6ÆöæR‡&÷sòæÖWFFFòçfÇVW2ÇÂ·Ò’Â÷fW'&–FW3¢6ÆöæR†6&Còæ&–æF–æsòæ÷fW'&–FW2ÇÂ·Ò’Ó°§Ò’‚“°¦76W'B†–×÷'FVE7FFRçfÇVW2æ6öFRÓÓÒ%d"Ó"bb–×÷'FVE7FFRçfÇVW2ç6¶vRÓÓÒ%4õDR"bb–×÷'FVE7FFRçfÇVW2ç&–6RÓÓÒ%"BrÃ"Â–×÷'F:|:6òW&FWRVFœ:|:6òF'VÆ#¢G´¥4ôâç7G&–æv–g’†–×÷'FVE7FFRçfÇVW2—Òæ“°¦76W'B…²&6öFR"Â'6¶vR"Â'&–6R%ÒæWfW'’†f–VÆBÓâ–×÷'FVE7FFRæ÷fW'&–FW5¶f–VÆEÒÓÓÒG'VR’Â–×÷'F:|:6òW&FWR÷2÷fW'&–FW3¢G´¥4ôâç7G&–æv–g’†–×÷'FVE7FFRæ÷fW'&–FW2—Òæ“° §7F÷&RæFD6ö×öæVçB‚'FW‡B"Â²ƒ¢C#Â“¢#BÂv–GFƒ¢#Â†V–v‡C¢CÒÂ²&VçD–C¢çVÆÂÂ&÷3¢²6öçFVçC¢$:|:6ò÷7FW&–÷""ÒÒ“°¦76W'B‡7F÷&RçVæFò‚’Â$ì:6òfö’÷7<:×fVÂFW6f¦W":|:6ò÷7FW&–÷"â"“°§7FFRÒ6öÖÖW&6–Â‡7F÷&R“°¦76W'B‡7FFRçfÇVW2æ6öFRÓÓÒ%d"Ó"bb7FFRçfÇVW2ç6¶vRÓÓÒ%4õDR"bb7FFRçfÇVW2ç&–6RÓÓÒ%"BrÃ"ÂVæFò÷7FW&–÷"&W7FW&÷RFF÷2Fò&öGWFò6ö'&Rò÷fW'&–FS¢G´¥4ôâç7G&–æv–g’‡7FFRçfÇVW2—Òæ“°¦76W'B…²&6öFR"Â'6¶vR"Â'&–6R%ÒæWfW'’†f–VÆBÓâ7FFRæ÷fW'&–FW5¶f–VÆEÒÓÓÒG'VR’Â%VæFò÷7FW&–÷"&VÖ÷fWR÷2÷fW'&–FW2â"“° ¦76W'B‡7F÷&RçVæFò‚’Â$ì:6òfö’÷7<:×fVÂFW6f¦W"7V'7F—GVœ:|:6òVÒÆ÷FRâ"“°§7FFRÒ6öÖÖW&6–Â‡7F÷&R“°¦76W'B‡7FFRçfÇVW2æ6öFRÓÓÒ%5BÓ"bb7FFRçfÇVW2ç6¶vRÓÓÒ$4•„"bb7FFRçfÇVW2ç&–6RÓÓÒ%"BÃ“’"ÂVæFòF7V'7F—GVœ:|:6òì:6ò&W7FW"÷Rò&öGWFó¢G´¥4ôâç7G&–æv–g’‡7FFRçfÇVW2—Òæ“°¦76W'B…²&6öFR"Â'6¶vR"Â'&–6R%ÒæWfW'’†f–VÆBÓâ7FFRæ÷fW'&–FW5¶f–VÆEÒÓÒG'VR’ÂVæFòF7V'7F—GVœ:|:6òÖçFWfR÷fW'&–FW3¢G´¥4ôâç7G&–æv–g’‡7FFRæ÷fW'&–FW2—Òæ“° ¦76W'B‡7F÷&Rç&VFò‚’Â$ì:6òfö’÷7<:×fVÂ&Vf¦W"7V'7F—GVœ:|:6òVÒÆ÷FRâ"“°§7FFRÒ6öÖÖW&6–Â‡7F÷&R“°¦76W'B‡7FFRçfÇVW2æ6öFRÓÓÒ%d"Ó"bb7FFRçfÇVW2ç6¶vRÓÓÒ%4õDR"bb7FFRçfÇVW2ç&–6RÓÓÒ%"BrÃ"Â&VFòF7V'7F—GVœ:|:6òW&FWRVFœ:|:6ò: ${JSON.stringify(state.values)}.`);
assert(["code", "package", "price"].every(field => state.overrides[field] === true), "Redo da substituiÃ§Ã£o nÃ£o restaur ou os overrides.");

const generated = new CatalogDocumentStore(createBlankCatalogDocument());
const generatedProduct = generated.createProduct({
  title: "Produto gerado",
  code: "GEN-001",
  package: "CAIXA 50",
  price: "R$ 50,00"
});
const composition = generated.createCardsForProducts([generatedProduct.id], { columns: 1, density: "compact", parentId: null });
const generatedCard = composition.cards[0];
const generatedTable = findType(generatedCard, "data-table");
const generatedRow = generated.getTableRows(generatedTable)[0];
assert(generatedRow?.metadata?.values?.code === "GEN-001", `A geraÃ§Ã£o interna nÃ£o materializou o produto: ${JSON.stringify(generatedRow?.metadata?.values)}.`);
assert(["code", "package", "price"].every(field => generatedCard.binding?.overrides?.[field] !== true), `A geraÃ§Ã£o interna foi confundida com override local: ${JSON.stringify(generatedCard.binding?.overrides)}.`);

const app = fs.readFileSync(path.join(root, "app", "table-binding-overrides-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "table-binding-overrides-contract.js"), "utf8");
assert(app === kit, "O contrato de overrides divergiu entre editor e AuthoringKit.");
assert(CatalogTableBindingOverridesContract.VERSION === "05.18.audit.2", "VersÃ§o inesperada do contrato.");

console.log("âœ“ Overrides de tabela em lote sobrevivem a importaÃ§Ã£o, undo/redo e nÃ£o contaminam sincronizaÃ§Ã£o interna.");
