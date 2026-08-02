/* Incremento 05.55 — complemento visual pesquisável, íntegro e separado do núcleo embutido. */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");

const root = path.resolve(__dirname, "..");
const visualRoot = path.join(root, "authoring-kit-visual");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const readJSON = relative => JSON.parse(read(relative));
const digest = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const core = readJSON("authoring-kit/manifest.json");
const manifestBytes = fs.readFileSync(path.join(visualRoot, "manifest.json"));
const manifest = JSON.parse(manifestBytes);
const index = readJSON("authoring-kit-visual/visual-index.json");
const schema = readJSON("authoring-kit-visual/schemas/visual-index.schema.json");
const capabilities = readJSON("authoring-kit/capabilities.json");
const guide = readJSON("authoring-kit/feature-guide.json");

assert(core.kitVersion === "1.7.2" && core.editorIncrement === "05.60", "O núcleo não identifica a revisão dirigida pela evidência.");
assert(core.visualCompanion?.format === "CatalogAuthoringVisualGuide" && core.visualCompanion.version === "1.0.1", "O núcleo não declara o complemento visual revisado.");
assert(core.visualCompanion.distribution === "standalone-kit-only" && core.visualCompanion.requiredForCompilation === false, "A fronteira de distribuição do complemento visual mudou.");
assert(core.visualCompanion.manifestSha256 === digest(manifestBytes), "O hash do manifesto visual diverge do núcleo.");
assert(manifest.policy.embeddedInCatalogPackages === false && manifest.policy.includedInStandaloneAuthoringKitExport === true, "A política de duplicação do guia visual mudou.");
assert(manifest.policy.imagesAreGoldenBaselines === false && manifest.policy.blindTrialReference === "third-unseen-reference", "Capturas tutoriais foram promovidas ou o ensaio cego foi contaminado.");
assert(manifest.policy.resultAuthority === "editor-imported-document", "O guia visual não fixa a autoridade do resultado importado.");
assert(index.coreKitVersion === "1.7.2" && index.editorIncrement === "05.60", "O índice visual não acompanha o núcleo 1.7.2.");

const seenPaths = new Set();
for (const file of manifest.files) {
  assert(!seenPaths.has(file.path), `Arquivo duplicado no manifesto visual: ${file.path}.`);
  seenPaths.add(file.path);
  const bytes = fs.readFileSync(path.join(visualRoot, file.path));
  assert(bytes.byteLength === file.size && digest(bytes) === file.sha256, `Integridade visual divergente: ${file.path}.`);
}
assert(manifest.files.length >= 37, "O manifesto perdeu parte dos tutoriais ou estudos de caso.");

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);
assert(validate(index), `visual-index.json inválido: ${ajv.errorsText(validate.errors, { separator: " | " })}`);
const ids = new Set();
const featureIds = new Set(guide.entries.map(entry => entry.id));
const capabilityIds = new Set(Object.keys(capabilities.capabilities));
const componentTypes = new Set(capabilities.components.map(component => component.type));
const recipeIds = new Set(capabilities.recipes.map(recipe => recipe.id));
for (const entry of index.entries) {
  assert(!ids.has(entry.id), `Entrada visual duplicada: ${entry.id}.`);
  ids.add(entry.id);
  entry.featureGuideIds.forEach(id => assert(featureIds.has(id), `${entry.id}: featureGuideId ausente ${id}.`));
  entry.capabilityIds.forEach(id => assert(capabilityIds.has(id), `${entry.id}: capabilityId ausente ${id}.`));
  entry.componentTypes.forEach(id => assert(componentTypes.has(id), `${entry.id}: componentType ausente ${id}.`));
  entry.recipeIds.forEach(id => assert(recipeIds.has(id), `${entry.id}: recipeId ausente ${id}.`));
}
assert(index.entries.filter(entry => entry.kind === "tutorial").length === 7, "O guia não possui os sete microtutoriais aprovados.");
assert(index.entries.filter(entry => entry.kind === "cookbook").length >= 5, "O cookbook visual ficou incompleto.");
assert(ids.has("case-study.technical-catalog") && ids.has("case-study.promotional") && ids.has("interface.editor-map"), "Estudos de caso ou mapa da interface ausentes.");

const technical = fs.readFileSync(path.join(visualRoot, "case-studies/catalogo-tecnico/reference.jpeg"));
const promotional = fs.readFileSync(path.join(visualRoot, "case-studies/promocional/reference.jpeg"));
assert(digest(technical) === "4262171d057c6daedd47cd192600fa9f826d739552b4a4c84f38c917c010f2f6", "A referência técnica do guia diverge da V1.");
assert(digest(promotional) === "dfdf29abd4d82f207071e482cb6f49bfd893f28a741039f1e38cffd02b4ab586", "A referência promocional do guia diverge do anexo aprovado.");
const operationalVisualText = [
  read("authoring-kit-visual/START-HERE.md"),
  read("authoring-kit-visual/case-studies/catalogo-tecnico/README.md"),
  read("authoring-kit-visual/visual-index.json"),
  read("authoring-kit-visual/case-studies/catalogo-tecnico/decomposition.svg")
].join("\n");
assert(!/referência forte|critério canônico da V1/i.test(operationalVisualText), "A evidência técnica ainda recebe papel normativo no guia atual.");
assert(/preview paralelo/i.test(read("authoring-kit-visual/tutorials/07-delivery-gates/README.md")), "O tutorial de entrega não veta o preview paralelo como resultado.");

const report = readJSON("authoring-kit-visual/examples/first-page.report.json");
const document = readJSON("authoring-kit-visual/examples/first-page.document.json");
assert(document.schemaVersion === "1.16.0", "O exemplo visual alterou CatalogDocument.");
assert(report.ok && report.summary.products === 7 && report.summary.collisions === 0 && report.summary.overflows === 0, "O exemplo visual executável não passa pelos gates estruturais.");
assert(report.workflow.unresolvedCorrections >= 2 && report.issues.filter(issue => issue.code === "FOOTER_CONTENT_PENDING").length === 2, "O exemplo didático deixou de manter dados de footer inválidos e bloqueáveis.");
const embedded = read("app/authoring-kit-files.js");
assert(!embedded.includes("editor-reference.png") && !embedded.includes("case-studies/catalogo-tecnico/reference.jpeg"), "Os binários do complemento visual foram embutidos no bundle textual do editor.");
assert(fs.existsSync(path.join(root, "tools/capture-visual-guide.js")), "O procedimento de atualização das capturas não é reproduzível.");

console.log(`✓ Guia visual 05.55 validado: ${index.entries.length} entradas, ${manifest.files.length} arquivos e duas referências classificadas sem baseline pixel a pixel.`);
