/* Incremento 05.54 — revisão integral de proveniência, descoberta e execução isolada do kit. */
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const readJSON = relative => JSON.parse(read(relative));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const manifest = readJSON("authoring-kit/manifest.json");
const capabilities = readJSON("authoring-kit/capabilities.json");
const guide = readJSON("authoring-kit/feature-guide.json");
const governance = readJSON("authoring-kit/feature-governance.json");
const patterns = readJSON("authoring-kit/authoring-patterns.json");
const packageTemplate = readJSON("authoring-kit/examples/catalog-project.json");
const guideMarkdown = read("authoring-kit/GUIDE.md");

assert(manifest.kitVersion === "1.7.2", "O kit dirigido pela evidência 05.59B não possui a versão contratual esperada.");
assert([manifest.editorIncrement, capabilities.editor.increment, guide.editorIncrement, governance.editorIncrement, governance.v1State.currentIncrement, patterns.editorIncrement].every(value => value === "05.60"), "Metadados de proveniência do kit divergem.");
for (const field of ["guide", "capabilities", "featureInventory", "featureGuide", "featureGovernance", "authoringPatterns", "compiler", "runtime"]) {
  assert(fs.existsSync(path.join(root, "authoring-kit", manifest[field])), `Manifesto aponta para caminho ausente: ${field}.`);
}
for (const relative of [...manifest.schemas, ...manifest.examples]) assert(fs.existsSync(path.join(root, "authoring-kit", relative)), `Artefato declarado ausente: ${relative}.`);

const expectedPatterns = new Set(["product-card-arrangement", "specification-density", "semantic-piece-choice", "slot-span", "table-column-presentation", "factual-image-presentation", "missing-fact-resolution", "materialized-document-audit", "package-manifest-template"]);
assert(patterns.patterns.length === expectedPatterns.size && patterns.patterns.every(pattern => expectedPatterns.has(pattern.id)), "Padrões pós-compilação incompletos ou inesperados.");
assert(capabilities.capabilities.slotSpanControl === true, "slot.span continua escondido do manifesto de capacidades.");
assert(guide.entries.some(entry => entry.id === "layout.slot-span" && entry.contracts.includes("component.slot.span")), "O fluxo curado não ensina slot.span.");
assert(guide.entries.some(entry => entry.id === "content.semantic-pieces" && entry.recipeIds.includes("fact")), "O guia não distingue specification, fact e legenda.");
assert(guide.entries.find(entry => entry.id === "content.assets")?.contracts.includes("component.props.fit"), "O fluxo de assets não publica fit=contain.");
const factualImage = patterns.patterns.find(pattern => pattern.id === "factual-image-presentation");
assert(factualImage.decisionOrder.map(item => item.step).join(",") === "instance-framing,neutral-margin-crop,neutral-background-expansion", "A ordem factual do 05.59B não foi incorporada ao kit.");
assert(factualImage.occupationGuidance.kind === "contextual" && /não aplicar um percentual mínimo universal/.test(factualImage.occupationGuidance.rule), "Ocupação factual virou regra global indevida.");
const missingFacts = patterns.patterns.find(pattern => pattern.id === "missing-fact-resolution");
assert(missingFacts.order.map(item => item.step).join(",") === "ask,pending,explicit-omit", "O fluxo perguntar → pendência → omissão explícita divergiu.");
const materializedAudit = patterns.patterns.find(pattern => pattern.id === "materialized-document-audit");
assert(materializedAudit.authority === "editor-imported-catalog-document" && materializedAudit.parallelPreview === "diagnostic-only", "Preview paralelo ainda pode ser confundido com resultado final.");

assert(packageTemplate.exampleType === "non-importable-template" && packageTemplate.integrityPlaceholders === true, "O manifesto de exemplo não se declara template.");
assert(packageTemplate.files.every(file => file.size === 1 && /^0{64}$/.test(file.sha256)), "Os marcadores de integridade do template mudaram sem virar pacote real.");
assert(/template não importável/i.test(guideMarkdown) && /recorte essas margens antes de expandir o canvas/.test(guideMarkdown), "O guia não explica o limite do template ou a ordem factual do 05.59B.");
assert(/prévia paralela.*somente diagnóstico/i.test(guideMarkdown) && /defaults injetados/.test(guideMarkdown), "O guia não fixa a autoridade do documento materializado.");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-authoring-kit-05.54-"));
try {
  const isolated = path.join(temp, "authoring-kit");
  fs.cpSync(path.join(root, "authoring-kit"), isolated, { recursive: true });
  const output = path.join(temp, "catalog.json");
  const reportPath = path.join(temp, "catalog.report.json");
  const execution = spawnSync(process.execPath, [
    path.join(isolated, "compiler", "compile-catalog.js"),
    "--source", path.join(isolated, "examples", "reference-catalog-source.json"),
    "--output", output,
    "--report", reportPath
  ], { encoding: "utf8", timeout: 30000 });
  assert(execution.status === 0, `Compilador isolado falhou: ${execution.stderr || execution.stdout}`);
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  assert(report.ok && report.summary.products === 7 && report.summary.collisions === 0 && report.summary.overflows === 0, "Compilação isolada perdeu o baseline técnico.");
  assert(report.workflow.editorImportActions === 3 && report.workflow.unresolvedCorrections >= 3 && report.issues.filter(issue => issue.code === "FOOTER_CONTENT_PENDING").length === 3, "O relatório não preserva as três pendências factuais esperadas do footer.");
  assert(report.gates.structure.status === "passed" && report.gates.renderedText.status === "notRun" && report.gates.editorRoundTrip.status === "notRun", "O CLI promoveu um gate externo sem execução.");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

const technical = fs.readFileSync(path.join(root, "docs", "reference", "catalogo-base.jpeg"));
const technicalHash = crypto.createHash("sha256").update(technical).digest("hex");
const promotionalProfile = readJSON("tests/fixtures/promotional-reference-profile-05.20.9.json");
assert(technicalHash === "4262171d057c6daedd47cd192600fa9f826d739552b4a4c84f38c917c010f2f6", "A evidência técnica conhecida mudou.");
assert(promotionalProfile.source.sha256 === "dfdf29abd4d82f207071e482cb6f49bfd893f28a741039f1e38cffd02b4ab586" && promotionalProfile.interpretation.blocking === false, "O limite do benchmark promocional mudou.");

console.log("✓ Authoring Kit 1.7.2 incorpora o ensaio 05.59B sem promover referências a normas.");
