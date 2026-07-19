/* Incrementos 05.3/05.4 — pacote, integridade, AuthoringKit e gates. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.fflate = require(path.join(root, "vendor/fflate.js"));
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
delete global.indexedDB;

for (const file of [
  "app/tokens.js",
  "app/catalog-icons.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/section-recipes.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/asset-storage.js",
  "app/authoring-kit-files.js",
  "app/project-package.js"
]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const fileFrom = (name, bytes) => ({
  name,
  type: "application/zip",
  size: bytes.byteLength,
  async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }
});

(async () => {
  const store = new CatalogDocumentStore(createBlankCatalogDocument());
  store.getState().title = "Pacote portátil";
  const storage = new CatalogAssetStorage({ databaseName: "package-source" });
  const svg = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10"/></svg>'], { type: "image/svg+xml" });
  await storage.put("source-key", svg);
  store.upsertCollectionItem("assets", {
    id: "asset-product",
    label: "Produto",
    metadata: {
      fileName: "produto.svg",
      mimeType: "image/svg+xml",
      size: svg.size,
      width: 20,
      height: 10,
      createdAt: "2026-07-14T00:00:00.000Z",
      isVector: true,
      provenance: { origin: "provided", role: "product-main", relatedProductIds: [], sourceAssetIds: [], method: "direct-upload", fidelity: "product-faithful", generator: null },
      approval: { status: "review-required", publishAllowed: false, reviewedAt: null }
    },
    reference: { provider: "indexeddb", key: "source-key" }
  });
  const art = store.addComponent("art", { x: 30, y: 30, width: 180, height: 120 });
  store.setComponentAsset(art.id, "asset-product");

  const manager = new CatalogProjectPackageManager(store, storage);
  const built = await manager.buildPackage();
  assert(built.bytes.byteLength > 0 && built.manifest.packageFormat === "CatalogProjectPackage", "O exportador não materializou o pacote.");
  assert(built.manifest.policy.assetMode === "assisted", "A política Assistida não foi registrada no manifesto.");
  assert(built.manifest.policy.publicationGate === "draft" && built.gate.ok, "O pacote padrão não foi classificado como rascunho.");
  assert(built.manifest.assets.length === 1 && built.manifest.assets[0].sha256.length === 64, "Asset, tamanho e hash não foram manifestados.");
  assert(built.manifest.files.every(file => /^[a-f0-9]{64}$/.test(file.sha256)), "Nem todos os arquivos possuem SHA-256.");

  const archive = fflate.unzipSync(built.bytes);
  assert(archive["catalog-project.json"] && archive["document/catalog.json"] && archive["source/catalog-source.json"] && archive["manifests/catalog-capabilities.json"], "A estrutura mínima do pacote está incompleta.");
  assert(archive["authoring-kit/GUIDE.md"] && archive["reports/export-report.json"], "Kit e relatório não acompanharam o pacote.");
  const portableDocument = JSON.parse(new TextDecoder().decode(archive["document/catalog.json"]));
  const portableAsset = portableDocument.collections.find(collection => collection.id === "assets").items[0];
  assert(portableAsset.reference.provider === "package" && portableAsset.reference.key === built.manifest.assets[0].path, "A referência não foi convertida para o caminho portátil.");

  let publicationBlocked = false;
  try { await manager.buildPackage({ target: "publication" }); } catch (error) { publicationBlocked = error.code === "PUBLICATION_GATE"; }
  assert(publicationBlocked, "A publicação não foi bloqueada pelo asset ainda em revisão.");
  store.getAsset("asset-product").metadata.approval = { status: "publish-ready", publishAllowed: true, reviewedAt: "2026-07-14T12:00:00.000Z" };
  const publication = await manager.buildPackage({ target: "publication" });
  assert(publication.manifest.policy.publicationGate === "publication" && publication.fileName.includes("publicacao"), "O pacote aprovado não foi marcado para publicação.");

  const targetStore = new CatalogDocumentStore(createBlankCatalogDocument());
  const previousId = targetStore.getState().id;
  const targetStorage = new CatalogAssetStorage({ databaseName: "package-target" });
  const targetManager = new CatalogProjectPackageManager(targetStore, targetStorage);
  const analysis = await targetManager.analyzePackage(fileFrom("projeto.catalogo.zip", built.bytes));
  assert(analysis.ok && analysis.packageAssets.length === 1, "Um pacote íntegro foi bloqueado na análise.");
  assert(analysis.issues.some(issue => issue.code === "PACKAGE_READY"), "O relatório não confirmou que o pacote está pronto.");
  await targetManager.commitPackage(analysis);
  const importedAsset = targetStore.getAsset("asset-product");
  assert(importedAsset.reference.provider === "indexeddb" && importedAsset.reference.key.startsWith("package-"), "O asset portátil não foi remapeado para storage local.");
  assert(await targetStorage.has(importedAsset.reference.key), "Os bytes verificados não foram persistidos.");
  assert(targetStore.getState().title === "Pacote portátil", "O documento do pacote não foi aplicado.");
  assert(targetStore.undo() && targetStore.getState().id === previousId, "A importação do pacote não permaneceu reversível.");

  const rollbackStore = new CatalogDocumentStore(createBlankCatalogDocument());
  const rollbackStorage = new CatalogAssetStorage({ databaseName: "package-rollback" });
  const rollbackManager = new CatalogProjectPackageManager(rollbackStore, rollbackStorage);
  const rollbackAnalysis = await rollbackManager.analyzePackage(fileFrom("rollback.zip", built.bytes));
  rollbackStore.replaceDocument = () => { throw new Error("Falha simulada no documento"); };
  let rollbackFailed = false;
  try { await rollbackManager.commitPackage(rollbackAnalysis); } catch (_) { rollbackFailed = true; }
  assert(rollbackFailed && rollbackStorage.memory.size === 0, "Falha no documento deixou blobs parciais no storage.");

  const tamperedEntries = fflate.unzipSync(built.bytes);
  const assetPath = built.manifest.assets[0].path;
  tamperedEntries[assetPath] = new Uint8Array(tamperedEntries[assetPath]);
  tamperedEntries[assetPath][0] ^= 0xff;
  const tampered = fflate.zipSync(tamperedEntries, { level: 6, mtime: new Date("2000-01-01T00:00:00.000Z") });
  const tamperedAnalysis = await targetManager.analyzePackage(fileFrom("alterado.zip", tampered));
  assert(!tamperedAnalysis.ok && tamperedAnalysis.issues.some(issue => ["HASH_MISMATCH", "ASSET_MIME", "ASSET_INTEGRITY"].includes(issue.code)), "Alteração de bytes não foi bloqueada.");

  const unsafe = fflate.zipSync({ "../escape.txt": new Uint8Array([1]) }, { level: 0, mtime: new Date("2000-01-01T00:00:00.000Z") });
  let unsafeBlocked = false;
  try { CatalogProjectPackageUtils.inspectZip(unsafe); } catch (error) { unsafeBlocked = error.code === "UNSAFE_PATH"; }
  assert(unsafeBlocked, "Path traversal no ZIP não foi bloqueado no preflight.");

  const kitBytes = manager.buildAuthoringKit();
  const kitEntries = Object.keys(fflate.unzipSync(kitBytes));
  assert(kitEntries.some(name => name.endsWith("/GUIDE.md")) && kitEntries.some(name => name.endsWith("/capabilities.json")) && kitEntries.some(name => name.endsWith("/feature-inventory.json")) && kitEntries.some(name => name.endsWith("/feature-guide.json")), "O download do AuthoringKit não é autocontido ou perdeu o atlas funcional.");
  const capabilities = CatalogProjectManifests.buildCapabilitiesManifest(store.getExportDocument());
  assert(capabilities.components.length === Object.keys(CATALOG_COMPONENT_REGISTRY).length && capabilities.icons.length === Object.keys(CATALOG_ICON_LIBRARY).length, "O manifesto declarativo diverge dos registros runtime.");
  assert(capabilities.editor.increment === "05.14" && capabilities.recipes.length === 4 && capabilities.capabilities.officialSectionRecipes, "O kit não publicou as receitas oficiais do 05.14.");
  assert(capabilities.separatorPresets.length === 5 && capabilities.capabilities.contextualTableRows && capabilities.capabilities.batchSeparators, "Ações contextuais e presets de separador não foram publicados no kit.");

  const missingStore = new CatalogDocumentStore(createBlankCatalogDocument());
  missingStore.upsertCollectionItem("assets", {
    id: "asset-missing",
    label: "Ausente",
    metadata: { fileName: "ausente.png", mimeType: "image/png", size: 10, width: 1, height: 1, createdAt: "2026-07-14T00:00:00.000Z", isVector: false },
    reference: { provider: "indexeddb", key: "missing-key" }
  });
  let missingBlocked = false;
  try { await new CatalogProjectPackageManager(missingStore, new CatalogAssetStorage()).buildPackage(); } catch (error) { missingBlocked = error.code === "ASSET_BYTES_MISSING"; }
  assert(missingBlocked, "O exportador criou um pacote supostamente portátil sem os bytes de um asset registrado.");

  console.log("✓ Pacote, hashes, assets, CatalogSource, gates e AuthoringKit 1.5.3 validados.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
