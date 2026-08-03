/* Checkpoint 05.63 — disposição individual das capacidades e módulos V1. */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const readJSON = relative => JSON.parse(read(relative));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const checkpoint = readJSON("docs/project/CHECKPOINT.json");
const capabilities = readJSON("authoring-kit/capabilities.json").capabilities;
const disposition = readJSON("docs/v1/CAPABILITY-DISPOSITION.json");
const document = read("docs/v1/CAPABILITY-DISPOSITION.md");

assert(checkpoint.checkpointId === "05.63-v1-capability-disposition", "O checkpoint não aponta para a matriz 05.63.");
assert(checkpoint.analysisDeliverables.capabilityDisposition.status === "complete-pending-review", "A matriz não está concluída para revisão.");
assert(checkpoint.requiredGatesBeforeArchitectureDecision.includes("capability-disposition-approved"), "A matriz se autoaprovou ou perdeu seu gate.");
assert(checkpoint.nextAction.id === "v2-quality-contract" && checkpoint.nextAction.productCodeChangesAllowed === false, "O próximo passo não é o contrato de qualidade documental.");
assert(disposition.dispositionFormat === "CatalogV1CapabilityDisposition" && disposition.dispositionVersion === "1.0.0", "Formato da matriz consultável inválido.");

const expectedIds = Object.keys(capabilities).sort();
const actualIds = disposition.entries.map(entry => entry.id).sort();
assert(expectedIds.length === 51 && actualIds.length === 51, "A matriz não cobre as 51 capacidades.");
assert(new Set(actualIds).size === actualIds.length, "A matriz possui capacidade duplicada.");
assert(JSON.stringify(actualIds) === JSON.stringify(expectedIds), "A matriz diverge do manifesto 1.7.2.");

const allowed = new Set(["preserve", "extract", "rebuild", "discard", "defer", "open"]);
const counts = {};
for (const entry of disposition.entries) {
  assert(allowed.has(entry.disposition), `Disposição desconhecida em ${entry.id}.`);
  assert(["low", "medium", "high"].includes(entry.confidence), `Confiança ausente em ${entry.id}.`);
  assert(["low", "medium", "high"].includes(entry.migrationCost), `Custo ausente em ${entry.id}.`);
  assert(Array.isArray(entry.evidence) && entry.evidence.length, `Evidência ausente em ${entry.id}.`);
  assert(Array.isArray(entry.dependencies) && entry.dependencies.length, `Dependência ausente em ${entry.id}.`);
  assert(typeof entry.decision === "string" && entry.decision.length >= 30, `Decisão insuficiente em ${entry.id}.`);
  assert(typeof entry.refutation === "string" && entry.refutation.length >= 30, `Refutação insuficiente em ${entry.id}.`);
  counts[entry.disposition] = (counts[entry.disposition] || 0) + 1;
}
assert(JSON.stringify(counts) === JSON.stringify({ extract: 13, preserve: 1, open: 1, defer: 15, rebuild: 15, discard: 6 }), `Contagens inesperadas: ${JSON.stringify(counts)}.`);

for (const marker of [
  "Disposição das 51 capacidades",
  "Disposição dos módulos e contratos críticos",
  "Conclusões arquiteturais permitidas por esta matriz",
  "Ordem segura de eventual reutilização",
  "complete-pending-review"
]) assert(document.includes(marker), `Documento da matriz sem seção obrigatória: ${marker}.`);

for (const moduleMarker of [
  "`document-store.js`",
  "`layout-engine.js`",
  "`renderer.js`",
  "`visual-text-integrity.js`",
  "`catalog-validator.js`",
  "`project-package.js`",
  "Authoring Kit 1.7.2",
  "`app/authoring-kit-files.js`"
]) assert(document.includes(moduleMarker), `Módulo crítico não classificado: ${moduleMarker}.`);

assert(document.includes("não autoriza extração, V2 ou\n  migração"), "A matriz autorizou execução antes da decisão arquitetural.");
assert(!/framework recomendado|adotar (React|Vue|Svelte)|criar a V2 agora/i.test(document), "A matriz escolheu tecnologia ou implementação prematuramente.");

console.log("✓ Matriz 05.63 cobre 51/51 capacidades e mantém arquitetura/implementação bloqueadas.");
