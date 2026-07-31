"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const fixtureDir = path.join(root, "docs", "evidence", "05.52", "practical-flow-2026-07-30");
const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDir, "fixture.json"), "utf8"));
const fflate = require(path.join(root, "vendor", "fflate.js"));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const decodeJson = (archive, entry) => {
  assert(archive[entry], `Entrada ausente no pacote: ${entry}`);
  return JSON.parse(new TextDecoder().decode(archive[entry]));
};

assert(fixture.fixtureFormat === "CatalogPracticalFlowFixture" && fixture.fixtureVersion === "1.0.0", "Formato da fixture prática inválido.");
assert(fs.existsSync(path.join(fixtureDir, fixture.conversation)), "As instruções do ensaio não foram preservadas.");
assert(new Set(fixture.findings.map(finding => finding.owner)).size === 5, "A fixture não distingue agente, kit, compilador, editor e asset.");

for (const artifact of fixture.artifacts) {
  const filePath = path.join(fixtureDir, artifact.path);
  assert(fs.existsSync(filePath), `Artefato ausente: ${artifact.path}`);
  const bytes = fs.readFileSync(filePath);
  assert(bytes.length === artifact.size, `Tamanho divergente: ${artifact.path}`);
  assert(sha256(bytes) === artifact.sha256, `SHA-256 divergente: ${artifact.path}`);
  if (artifact.role === "printed-output") assert(bytes.subarray(0, 5).toString() === "%PDF-", `PDF inválido: ${artifact.path}`);
  if (artifact.role.endsWith("preview") || artifact.role === "authorial-target" || artifact.role === "factual-input") {
    assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `PNG inválido: ${artifact.path}`);
  }
}

function inspectPackage(relativePath) {
  const bytes = fs.readFileSync(path.join(fixtureDir, relativePath));
  const archive = fflate.unzipSync(bytes);
  const manifest = decodeJson(archive, "catalog-project.json");
  const document = decodeJson(archive, manifest.document.path);
  const source = decodeJson(archive, manifest.catalogSource.path);
  const report = decodeJson(archive, manifest.report.path);

  for (const file of manifest.files) {
    const entry = archive[file.path];
    assert(entry, `${relativePath}: arquivo manifestado ausente (${file.path}).`);
    assert(entry.byteLength === file.size, `${relativePath}: tamanho interno divergente (${file.path}).`);
    assert(sha256(entry) === file.sha256, `${relativePath}: hash interno divergente (${file.path}).`);
  }

  assert(manifest.packageFormat === "CatalogProjectPackage", `${relativePath}: formato de pacote inválido.`);
  assert(document.schemaVersion === fixture.replay.expectedSchemaVersion, `${relativePath}: schema divergente.`);
  assert(source.products.length === fixture.replay.expectedProducts, `${relativePath}: produtos divergentes.`);
  assert(manifest.assets.length === fixture.replay.expectedAssets, `${relativePath}: assets divergentes.`);
  assert(
    report.ok === true
      && report.summary?.collisions === 0
      && report.summary?.overflows === 0,
    `${relativePath}: relatório não preserva resultado válido e geometria limpa.`
  );

  return { bytes, archive, manifest, document, source, report };
}

const initial = inspectPackage("initial/catalog-project-package.zip");
const revised = inspectPackage("revised/catalog-project-package.zip");
const factualInputs = fixture.artifacts.filter(artifact => artifact.role === "factual-input");
const reportedInputs = new Set(
  initial.report.sources
    .filter(source => source.kind === "user-provided")
    .map(source => source.path)
);
assert(factualInputs.length === fixture.replay.expectedFactualInputs, "A fixture não preserva os dois anexos factuais.");
assert(factualInputs.every(input => reportedInputs.has(input.sourceName)), "O relatório inicial não rastreia os anexos factuais preservados.");
const initialColumns = initial.source.products[0].tableColumns;
const revisedColumns = revised.source.products[0].tableColumns;

assert(initialColumns.some(column => column.key === "package"), "A saída inicial não preserva a coluna de unidade observada.");
assert(initialColumns.some(column => column.label === "Preço 15+"), "A saída inicial não preserva o rótulo incorreto observado.");
assert(!initialColumns.some(column => column.key === "unitprice"), "A saída inicial contém preço unitário que deveria estar ausente.");
assert(!revisedColumns.some(column => column.key === "package"), "A revisão não removeu a coluna visual de unidade.");
assert(revisedColumns.some(column => column.key === "unitprice" && column.label === "Preço unit."), "A revisão não materializou o preço unitário.");
assert(revisedColumns.some(column => column.key === "price15" && column.label === "Preço 15 un."), "A revisão não corrigiu o rótulo da condição.");

const layoutRevision = decodeJson(revised.archive, "reports/layout-revision.json");
assert(JSON.stringify(layoutRevision.footerSpans) === JSON.stringify([2, 1, 1, 1, 1, 1]), "O primeiro item do rodapé não ocupa dois slots.");
assert(JSON.stringify(layoutRevision.footerTextScales) === JSON.stringify([80]), "A escala tipográfica de 80% do rodapé não foi preservada.");
assert(layoutRevision.artCaptionUsage === "none", "A decisão de não usar legendas de arte não foi registrada.");
assert(layoutRevision.technicalFactRepresentation === "specification", "As especificações não foram registradas como representação técnica.");

global.window = global;
global.fflate = fflate;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
delete global.indexedDB;

for (const file of [
  "app/tokens.js",
  "app/table-schema-registry.js",
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

const fileFrom = (name, bytes) => ({
  name,
  type: "application/zip",
  size: bytes.byteLength,
  async arrayBuffer() {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
});

(async () => {
  for (const [stage, entry] of Object.entries({ initial, revised })) {
    const store = new CatalogDocumentStore(createBlankCatalogDocument());
    const manager = new CatalogProjectPackageManager(store, new CatalogAssetStorage({ databaseName: `practical-flow-${stage}` }));
    const analysis = await manager.analyzePackage(fileFrom(`${stage}.zip`, entry.bytes));
    assert(analysis.ok, `${stage}: o importador real rejeitou a fixture.`);
    assert(analysis.packageAssets.length === fixture.replay.expectedAssets, `${stage}: assets analisados divergentes.`);
  }

  console.log("✓ Fixture 05.52 preserva e reimporta o ensaio real inicial/revisado com atribuição de falhas.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
