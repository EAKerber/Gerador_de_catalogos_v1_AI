/* Incremento 05.4 — gates distintos para rascunho e publicação. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
global.fflate = require(path.join(root, "vendor/fflate.js"));

for (const file of [
  "app/tokens.js", "app/catalog-source.js", "app/presentation-registry.js", "app/catalog-icons.js",
  "app/layout-engine.js", "app/component-registry.js", "app/collection-registry.js", "app/document-store.js",
  "app/project-package.js"
]) vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const store = new CatalogDocumentStore(createBlankCatalogDocument());
store.upsertCollectionItem("assets", {
  id: "asset-main",
  label: "Produto principal",
  metadata: {
    fileName: "produto.png", mimeType: "image/png", size: 10, width: 100, height: 100,
    createdAt: "2026-07-14T00:00:00.000Z", isVector: false,
    provenance: { origin: "provided", role: "product-main", relatedProductIds: [], sourceAssetIds: [], method: "direct-upload", fidelity: "product-faithful", generator: null },
    approval: { status: "review-required", publishAllowed: false, reviewedAt: null }
  },
  reference: { provider: "indexeddb", key: "asset-main" }
});

const product = store.createProduct({ title: "Produto", assetId: "asset-main" });
const card = store.addComponent("product-card", { x: 20, y: 20, width: 350, height: 300 });
store.bindProduct(card.id, product.id);
store.setComponentPresentation(card.id, { presetId: "product-hero", mode: "hero", density: "comfortable" });

const draft = CatalogProjectPackageUtils.validateExportGate(store.getExportDocument(), "draft");
const blocked = CatalogProjectPackageUtils.validateExportGate(store.getExportDocument(), "publication");
assert(draft.ok && draft.issues.some(issue => issue.code === "ASSET_NOT_PUBLISH_READY" && issue.severity === "warning"), "O rascunho deveria aceitar a pendência como aviso.");
assert(!blocked.ok && blocked.issues.some(issue => issue.code === "ASSET_NOT_PUBLISH_READY"), "A publicação não foi bloqueada pelo asset sem aprovação.");

const asset = store.getAsset("asset-main");
asset.metadata.approval = { status: "publish-ready", publishAllowed: true, reviewedAt: "2026-07-14T12:00:00.000Z" };
const ready = CatalogProjectPackageUtils.validateExportGate(store.getExportDocument(), "publication");
assert(ready.ok && ready.issues.some(issue => issue.code === "PUBLICATION_READY"), "O gate não liberou uma publicação pronta.");

product.metadata.assetRoles.main = null;
product.metadata.values.assetId = null;
const cardArt = card.children.find(child => child.type === "art" && child.slot?.name === "art");
cardArt.props.assetId = null;
const missingRole = CatalogProjectPackageUtils.validateExportGate(store.getExportDocument(), "publication");
assert(!missingRole.ok && missingRole.issues.some(issue => issue.code === "REQUIRED_ASSET_ROLE_MISSING"), "O papel obrigatório do preset não foi validado.");

console.log("✓ Gates de rascunho/publicação e requisitos de assets 05.4 validados.");
