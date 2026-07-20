/* Developer B — integração dos contratos incrementais no AuthoringKit autocontido. */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const contracts = [
  "text-alignment-contract.js",
  "text-scale-contract.js",
  "text-overflow-contract.js",
  "icon-scale-contract.js",
  "product-hero-contract.js",
  "product-technical-contract.js",
  "product-variants-contract.js",
  "product-data-only-contract.js"
];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const buildSource = fs.readFileSync(path.join(root, "tools", "build-authoring-kit.js"), "utf8");
const compilerSource = fs.readFileSync(path.join(root, "authoring-kit", "compiler", "compile-catalog.js"), "utf8");
const mainSource = fs.readFileSync(path.join(root, "app", "main.js"), "utf8");

for (const fileName of contracts) {
  const appPath = path.join(root, "app", fileName);
  const kitPath = path.join(root, "authoring-kit", "runtime", fileName);
  assert(fs.existsSync(appPath), `Contrato ausente no app: ${fileName}.`);
  assert(fs.existsSync(kitPath), `Contrato ausente no runtime do kit: ${fileName}.`);
  assert(fs.readFileSync(appPath, "utf8") === fs.readFileSync(kitPath, "utf8"), `Contrato divergente entre app e kit: ${fileName}.`);
  assert(buildSource.includes(`"${fileName}"`), `O build não copia ${fileName}.`);
  assert(compilerSource.includes(`"${fileName}"`), `O compilador não carrega ${fileName}.`);
  assert(mainSource.includes(`file: "${fileName}"`), `O editor não carrega ${fileName}.`);
}

const documentStoreIndex = compilerSource.indexOf('"document-store.js"');
const validatorIndex = compilerSource.indexOf('"catalog-validator.js"');
const compilerRuntimeIndex = compilerSource.indexOf('"catalog-compiler.js"');
const compileCallIndex = compilerSource.indexOf("CatalogCompiler.compile");
assert(documentStoreIndex >= 0 && validatorIndex > documentStoreIndex && compilerRuntimeIndex > validatorIndex, "A ordem-base do runtime do compilador está inválida.");
for (const fileName of contracts) {
  const index = compilerSource.indexOf(`"${fileName}"`);
  assert(index > documentStoreIndex && index < validatorIndex, `${fileName} deve ser carregado entre store e validador.`);
}
for (const globalName of [
  "CatalogTextAlignmentContract",
  "CatalogTextScaleContract",
  "CatalogTextOverflowContract",
  "CatalogIconScaleContract",
  "CatalogProductHeroContract",
  "CatalogProductTechnicalContract",
  "CatalogProductVariantsContract",
  "CatalogProductDataOnlyContract"
]) {
  const installIndex = compilerSource.indexOf(`${globalName}.install()`);
  assert(installIndex > compilerRuntimeIndex && installIndex < compileCallIndex, `${globalName} não é instalado antes da compilação.`);
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-authoring-kit-contracts-"));
const output = path.join(temporary, "catalog.json");
const report = path.join(temporary, "report.json");
const execution = spawnSync(process.execPath, [
  path.join(root, "authoring-kit", "compiler", "compile-catalog.js"),
  "--source", path.join(root, "authoring-kit", "examples", "catalog-source.json"),
  "--output", output,
  "--report", report
], { cwd: root, encoding: "utf8" });

assert(execution.status === 0, `O compilador do kit falhou: ${execution.stderr || execution.stdout}`);
assert(fs.existsSync(output) && fs.existsSync(report), "O compilador não produziu documento e relatório.");
const document = JSON.parse(fs.readFileSync(output, "utf8"));
const reportData = JSON.parse(fs.readFileSync(report, "utf8"));
assert(document.schemaVersion === "1.16.0", `Schema compilado inesperado: ${document.schemaVersion}.`);
assert(reportData.ok === true, `Relatório de compilação bloqueado: ${JSON.stringify(reportData.issues || [])}.`);

console.log("✓ AuthoringKit copia, carrega, instala e executa os contratos incrementais antes da compilação.");
