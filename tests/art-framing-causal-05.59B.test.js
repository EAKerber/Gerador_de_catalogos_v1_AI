/* Incremento 05.59B — contrato portátil do protocolo e dos derivados factuais. */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const fflate = require(path.resolve(__dirname, "..", "vendor", "fflate.js"));

const root = path.resolve(__dirname, "..");
const evidenceRoot = path.join(root, "docs", "evidence", "05.59B", "art-framing-causal");
const packagePath = path.join(root, "docs", "evidence", "05.52", "practical-flow-2026-07-30", "revised", "catalog-project-package.zip");
const protocol = JSON.parse(fs.readFileSync(path.join(evidenceRoot, "protocol.json"), "utf8"));
const resultsRoot = path.join(evidenceRoot, "results");
const report = JSON.parse(fs.readFileSync(path.join(resultsRoot, "metrics.actual.json"), "utf8"));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

function pngDimensions(bytes) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert(bytes.subarray(0, 8).equals(signature), "O derivado não é PNG.");
  assert(bytes.subarray(12, 16).toString("ascii") === "IHDR", "O PNG não contém IHDR na posição canônica.");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

assert(protocol.experimentFormat === "CatalogArtFramingCausalTrial" && protocol.experimentVersion === "1.0.0", "Formato do ensaio causal inválido.");
assert(protocol.conditions.length === 4 && new Set(protocol.conditions.map(condition => condition.id)).size === 4, "O protocolo não preserva quatro condições distintas.");
assert(protocol.target.componentType === "art" && protocol.target.parentType === "product-card" && protocol.target.slot === "art", "Componente, card e slot não estão fixos.");
assert(protocol.target.width === 351 && protocol.target.height === 204, "As dimensões controladas do slot factual mudaram.");
assert(protocol.target.renderedViewport.screen.width === 349 && protocol.target.renderedViewport.screen.height === 202, "O viewport interno de tela não está fixado.");
assert(protocol.target.renderedViewport.print.width === 350 && protocol.target.renderedViewport.print.height === 202, "O viewport interno de impressão não está fixado.");
assert(protocol.target.controlledSetup.operation === "isolate-existing-art-slot" && protocol.target.controlledSetup.cardHeight === 220, "A preparação causal do mesmo card não está explícita.");
assert(protocol.policy.referencesAreNormative === false && protocol.policy.commercialFactsIntroduced === false, "O ensaio promoveu referência ou dado comercial a norma.");
assert(protocol.policy.externalNetworkRequired === false && protocol.policy.authoringKitVersionChange === false, "O protocolo ampliou rede ou versão do kit.");

const archive = fflate.unzipSync(fs.readFileSync(packagePath));
const source = Buffer.from(archive[protocol.source.packageEntry]);
assert(source.length > 0 && sha256(source) === protocol.source.sha256, "O asset oficial divergiu da fixture 05.52.");
assert(JSON.stringify(pngDimensions(source)) === JSON.stringify({ width: protocol.source.width, height: protocol.source.height }), "As dimensões do asset oficial divergiram.");

for (const condition of protocol.conditions) {
  assert(Object.keys(condition.props).sort().join(",") === "fit,focalX,focalY,offsetX,offsetY,zoom", `${condition.id}: propriedades de enquadramento incompletas.`);
  if (condition.asset === "source") continue;
  const bytes = fs.readFileSync(path.join(evidenceRoot, condition.asset));
  assert(sha256(bytes) === condition.sha256, `${condition.id}: hash do derivado divergiu.`);
  assert(JSON.stringify(pngDimensions(bytes)) === JSON.stringify({ width: condition.width, height: condition.height }), `${condition.id}: dimensões do derivado divergiram.`);
  assert(condition.derivation.inventedPixels === false && condition.derivation.resampledProduct === false, `${condition.id}: a derivação deixou de ser factual e não destrutiva.`);
}

const original = protocol.conditions.find(condition => condition.id === "original-contain");
const framed = protocol.conditions.find(condition => condition.id === "editor-framed");
assert(original.asset === "source" && framed.asset === "source", "Original e editor não compartilham o mesmo asset.");
assert(original.props.fit === "contain" && framed.props.fit === "cover" && framed.props.zoom > 100, "As condições de base e editor não isolam o enquadramento.");
assert(Array.isArray(framed.interaction) && framed.interaction.some(step => step.includes("Preencher mantendo foco")), "A condição do editor não usa o comando público 05.59.");

assert(report.experimentFormat === protocol.experimentFormat && report.id === protocol.id, "O relatório final não pertence ao protocolo 05.59B.");
assert(report.schemaVersion === "1.16.0" && report.results.length === 4, "O relatório final divergiu do schema ou das quatro condições.");
const resultById = Object.fromEntries(report.results.map(result => [result.id, result]));
const originalResult = resultById["original-contain"];
const expandedResult = resultById["neutral-expanded"];
const croppedResult = resultById["external-crop"];
const framedResult = resultById["editor-framed"];
assert(croppedResult.screen.usefulPixelRatio >= originalResult.screen.usefulPixelRatio * 1.8, "A evidência final perdeu o ganho mínimo do recorte externo.");
assert(framedResult.screen.usefulPixelRatio >= originalResult.screen.usefulPixelRatio * 1.8, "A evidência final perdeu o ganho mínimo do editor.");
assert(Math.abs(framedResult.screen.usefulPixelRatio - croppedResult.screen.usefulPixelRatio) <= croppedResult.screen.usefulPixelRatio * 0.15, "Editor e recorte externo deixaram de ser equivalentes no limite aceito.");
assert(expandedResult.screen.neutralBackgroundRatio >= originalResult.screen.neutralBackgroundRatio + 0.18, "O canvas neutro deixou de melhorar materialmente a continuidade do fundo.");
assert(report.results.every(result => !result.screen.clipped && !result.print.clipped), "A evidência final contém corte factual.");
assert(report.results.every(result => Math.abs(result.screen.usefulPixelRatio - result.print.usefulPixelRatio) <= 0.02), "A evidência final perdeu paridade tela/impressão.");
assert(originalResult.asset.assetId === framedResult.asset.assetId && originalResult.asset.sha256 === framedResult.asset.sha256, "O enquadramento final não preservou o asset original.");
assert(report.conclusion.editorMatchesExternalCrop === true && report.conclusion.assetIntegrityPreserved === true && report.conclusion.screenPrintParity === true, "A conclusão causal não está sustentada pelos gates.");
assert(Array.isArray(report.pageErrors) && report.pageErrors.length === 0, "O ensaio final registrou erro de página.");

for (const relativePath of [
  "comparison.png",
  "comparison.pdf",
  ...protocol.conditions.flatMap(condition => [
    `screen/${condition.id}-preview.png`,
    `print/${condition.id}-preview.png`,
    `pdf/${condition.id}.pdf`
  ])
]) {
  const bytes = fs.readFileSync(path.join(resultsRoot, relativePath));
  assert(bytes.length > 1000, `${relativePath}: evidência final ausente ou vazia.`);
  if (relativePath.endsWith(".pdf")) assert(bytes.subarray(0, 5).toString("ascii") === "%PDF-", `${relativePath}: saída não é PDF.`);
}

console.log("✓ 05.59B preserva protocolo, quatro condições, resultados tela/PDF e atribuição causal auditável.");
