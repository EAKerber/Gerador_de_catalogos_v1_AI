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
assert(protocol.target.renderedViewport.width === 349 && protocol.target.renderedViewport.height === 202, "O viewport interno mensurável não está fixado.");
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

console.log("✓ 05.59B preserva protocolo, asset oficial, quatro condições e derivados não imaginativos.");
