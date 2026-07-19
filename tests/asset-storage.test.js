const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
delete global.indexedDB;

for (const file of ["app/asset-storage.js", "app/asset-library.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const storage = new CatalogAssetStorage({ databaseName: "test-assets" });
  const blob = new Blob(["vetor"], { type: "image/svg+xml" });
  await storage.put("asset-test", blob);
  assert(await storage.has("asset-test"), "O fallback de armazenamento não confirmou o asset.");
  const restored = await storage.get("asset-test");
  assert(restored && restored.type === "image/svg+xml", "O blob não foi restaurado com seu MIME type.");
  assert(await storage.delete("asset-test"), "O asset não foi removido.");
  assert(!(await storage.has("asset-test")), "O asset continuou disponível após remoção.");
  await storage.putMany([
    { id: "asset-a", blob: new Blob(["a"], { type: "text/plain" }) },
    { id: "asset-b", blob: new Blob(["b"], { type: "text/plain" }) }
  ]);
  assert(await storage.has("asset-a") && await storage.has("asset-b"), "O lote atômico não persistiu todos os assets.");
  await storage.deleteMany(["asset-a", "asset-b"]);
  assert(!(await storage.has("asset-a")) && !(await storage.has("asset-b")), "A limpeza em lote não removeu todos os assets.");

  assert(CatalogAssetUtils.isAcceptedAssetFile({ type: "image/svg+xml", size: 20 }), "SVG deveria ser aceito.");
  assert(CatalogAssetUtils.isAcceptedAssetFile({ type: "image/png", size: 20 }), "PNG deveria ser aceito.");
  assert(CatalogAssetUtils.isAcceptedAssetFile({ type: "image/jpeg", size: 20 }), "JPG deveria ser aceito.");
  assert(CatalogAssetUtils.isAcceptedAssetFile({ type: "image/webp", size: 20 }), "WebP deveria ser aceito.");
  assert(CatalogAssetUtils.isAcceptedAssetFile({ name: "vetor.SVG", type: "", size: 20 }), "A extensão deve cobrir navegadores sem MIME type.");
  assert(!CatalogAssetUtils.isAcceptedAssetFile({ type: "image/gif", size: 20 }), "GIF não pertence ao contrato do incremento.");
  assert(!CatalogAssetUtils.isAcceptedAssetFile({ type: "image/png", size: CatalogAssetUtils.MAX_FILE_SIZE + 1 }), "Arquivos acima do limite deveriam ser rejeitados.");

  console.log("✓ Armazenamento binário e formatos da biblioteca de artes validados.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
