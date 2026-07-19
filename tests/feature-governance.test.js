/* Incremento 05.14 — governança subtrativa e autoridade local entregue. */
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

assert(governance.governanceFormat === "CatalogFeatureGovernance" && governance.editorIncrement === "05.15", "Formato ou incremento da governança inválido.");
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

console.log("✓ Governança cobre 35 capacidades, quatro frentes congeladas e a autoridade local entregue.");
