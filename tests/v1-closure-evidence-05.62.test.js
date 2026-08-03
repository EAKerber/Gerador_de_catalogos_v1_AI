/* Checkpoint 05.62 — encerramento factual e cadeia de evidências da V1. */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const readJSON = relative => JSON.parse(read(relative));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const checkpoint = readJSON("docs/project/CHECKPOINT.json");
assert(checkpoint.checkpointId === "05.62-v1-closure-evidence", "O checkpoint não aponta para a unidade de encerramento 05.62.");
assert(checkpoint.productState.v1 === "frozen-technical-prototype", "O encerramento reabriu a V1.");
assert(checkpoint.productState.v2ImplementationAuthorized === false, "A unidade documental autorizou V2 prematuramente.");
assert(checkpoint.repositoryState.archiveCreated === false, "O checkpoint antecipou o snapshot histórico.");
assert(checkpoint.evidenceState.finalColdStartArtifactsInRepository === false, "O checkpoint declara artefatos finais ainda não ingeridos.");
assert(checkpoint.evidenceState.finalColdStartFindings === "observed-not-reproduced", "O ensaio final foi promovido indevidamente a reprodução.");
assert(checkpoint.nextAction.id === "v1-capability-disposition" && checkpoint.nextAction.productCodeChangesAllowed === false, "O próximo passo não é a matriz documental bloqueante.");

const deliverables = checkpoint.analysisDeliverables;
for (const key of ["v1ClosureReport", "evidenceIndex", "knownFailures", "prLedger"]) {
  const item = deliverables[key];
  assert(item.status === "complete-pending-review", `${key} não está concluído para revisão.`);
  assert(fs.existsSync(path.join(root, item.path)), `${key} aponta para arquivo ausente: ${item.path}.`);
}
assert(deliverables.capabilityDisposition.status === "not-started", "A matriz foi marcada pronta sem análise.");
assert(checkpoint.requiredGatesBeforeArchitectureDecision.includes("v1-closure-report-approved"), "O relatório se autoaprovou ao ser criado.");

const closure = read(deliverables.v1ClosureReport.path);
for (const marker of [
  "Veredito executivo",
  "Trajetória mensurável",
  "Caminho crítico e perda de garantia",
  "Patrimônio demonstrado",
  "Motivos formais do encerramento",
  "Não conclusões",
  "Limitações da reconstrução"
]) assert(closure.includes(marker), `Relatório de encerramento sem seção obrigatória: ${marker}.`);
assert(closure.includes("não `reproduced`"), "O relatório não preserva o limite do ensaio cego final.");
assert(!/V2 (deve|será) (usar|adotar|implementar)/i.test(closure), "O relatório decidiu implementação V2 antes dos gates.");

const evidence = read(deliverables.evidenceIndex.path);
for (const evidenceId of Array.from({ length: 12 }, (_, index) => `E-${String(index + 1).padStart(3, "0")}`)) {
  assert(evidence.includes(evidenceId), `Evidência primária ausente: ${evidenceId}.`);
}
for (const observationId of Array.from({ length: 7 }, (_, index) => `O-${String(index + 1).padStart(3, "0")}`)) {
  assert(evidence.includes(observationId), `Observação não ingerida ausente: ${observationId}.`);
}
for (const relative of [
  "docs/evidence/05.12/reference-manual.metrics.json",
  "docs/evidence/05.16/reference-manual.metrics.json",
  "docs/evidence/05.17/reference-manual.metrics.json",
  "docs/evidence/05.52/practical-flow-2026-07-30/fixture.json",
  "docs/evidence/05.59B/art-framing-causal/protocol.json",
  "docs/evidence/05.59B/art-framing-causal/results/metrics.actual.json",
  "docs/reference/catalogo-base.jpeg",
  "docs/reference/promocional-base.jpeg"
]) assert(fs.existsSync(path.join(root, relative)), `O índice depende de evidência ausente: ${relative}.`);

const failures = read(deliverables.knownFailures.path);
for (const failureId of Array.from({ length: 10 }, (_, index) => `KF-${String(index + 1).padStart(3, "0")}`)) {
  assert(failures.includes(`## ${failureId}`), `Falha conhecida não possui registro detalhado: ${failureId}.`);
}
assert(failures.includes("Como refutar"), "As falhas não mantêm critérios falsificáveis.");

const ledger = read(deliverables.prLedger.path);
for (const fact of ["48 PRs", "44 integradas", "4 encerradas sem merge", "16 commits atrás", "`archive/v1`", "`v1.0.0-prototype`"]) {
  assert(ledger.includes(fact), `Ledger não preserva o fato remoto: ${fact}.`);
}

const status = read("docs/project/STATUS.md");
assert(status.includes("Checkpoint de governança:** `05.62`"), "STATUS diverge do checkpoint 05.62.");
assert(status.includes("Produzir `docs/v1/CAPABILITY-DISPOSITION.md`"), "STATUS não oferece próximo passo exato.");
assert(/Produção documental não é\s+autoaprovação/.test(status), "STATUS confunde criação com aprovação do gate.");

console.log("✓ Encerramento 05.62 é rastreável, falsificável e não antecipa a V2.");
