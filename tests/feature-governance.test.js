/* Incremento 05.24 — governança subtrativa e estado canônico da V1. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const readJSON = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const capabilities = readJSON("authoring-kit/capabilities.json");
const governance = readJSON("authoring-kit/feature-governance.json");
const manifest = readJSON("authoring-kit/manifest.json");
const capabilityIds = Object.keys(capabilities.capabilities).sort();
const decisions = new Map(governance.capabilityDecisions.map(item => [item.id, item]));
const allowedStatuses = new Set(["active", "maintain", "audit", "frozen", "paused"]);

assert(governance.governanceFormat === "CatalogFeatureGovernance" && governance.editorIncrement === "05.24", "Formato ou incremento da governança inválido.");
assert(manifest.editorIncrement === governance.editorIncrement, "Manifesto e governança divergem sobre o incremento atual.");
assert(
  governance.v1State?.scope === "single-page"
    && governance.v1State?.status === "stable"
    && governance.v1State?.closedByIncrement === "05.23"
    && governance.v1State?.nextExpansion === "paused",
  "O estado canônico da V1 single-page está ausente ou inconsistente."
);
assert(manifest.featureGovernance === "feature-governance.json", "O kit não publica a governança.");
assert(decisions.size === capabilityIds.length && capabilityIds.every(id => decisions.has(id)), "Toda capacidade deve ter exatamente uma decisão.");
assert([...decisions.values()].every(item => allowedStatuses.has(item.status) && item.reason), "Status ou motivo de governança ausente.");
assert(governance.frozenLanes.map(item => item.id).sort().join("|") === ["multimedia-expansion", "online-platform", "publication-workflow", "touch-mobile-expansion"].sort().join("|"), "As quatro frentes congeladas divergiram.");
assert(decisions.get("printPdf").status === "active" && decisions.get("generationPlanCompiler").status === "active", "PDF e compilador devem permanecer no núcleo ativo.");
assert(decisions.get("assetFormats").status === "frozen" && decisions.get("draftPublicationGates").status === "frozen", "Expansão multimídia/publicação não foi congelada.");
assert(decisions.get("multiplePages").status === "paused", "Multipágina deve permanecer pausado, não removido.");
assert(decisions.get("batchSeparators").status === "audit" && decisions.get("linkedVariantRepresentations").status === "audit", "Candidatos de consolidação perderam o estado de auditoria.");

const layoutAuthority = governance.interactionDecisions.find(item => item.id === "layout-authority");
assert(layoutAuthority?.status === "active" && layoutAuthority.currentMechanisms.includes("Reintegrar ao layout"), "A autoridade local entregue não foi registrada.");
assert(governance.removalPolicy.length >= 5 && governance.debtExceptionCriteria.length >= 5, "Política de remoção ou exceção por dívida incompleta.");

for (const relative of [
  "docs/PRODUCT-DEFINITION.md",
  "docs/ROADMAP.md",
  "docs/BACKLOG.md",
  "docs/ADR-025-governanca-subtrativa-e-autoridade-de-layout.md",
  "docs/SUBTRACTIVE-FEATURE-AUDIT-05.13.md"
]) {
  const content = read(relative);
  assert(content.includes("05.13") || content.includes("governança"), `${relative} não reflete a decisão subtrativa.`);
}

const backlog = read("docs/BACKLOG.md");
const roadmap = read("docs/ROADMAP.md");
assert(backlog.includes("V1 single-page estável") && backlog.includes("Concluído — Incremento 05.23"), "O backlog não publica o encerramento da V1.");
assert(!backlog.includes("Em execução — Incremento 05.23"), "O backlog voltou a marcar um incremento integrado como em execução.");
assert(roadmap.includes("Incremento 05.23 — Transação estrutural e fechamento da V1 ✅"), "O roadmap não publica o estado concluído do 05.23.");
assert(!roadmap.includes("## Incremento 05.23 — Transação estrutural e fechamento da V1\n\nEm execução:"), "O roadmap voltou a abrir o 05.23.");

console.log(`✓ Governança cobre ${capabilityIds.length} capacidades e fixa a V1 single-page como estável após o 05.23.`);
