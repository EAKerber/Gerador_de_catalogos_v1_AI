/* Incremento 05.16 — contrato estático da reconstrução manual comparável. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const evidenceDir = path.join(root, "docs", "evidence", "05.16");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

for (const file of [
  "reference-manual.metrics.json",
  "reference-manual.document.json",
  "reference-manual.editor.png",
  "reference-manual.canvas.png",
  "reference-manual.pdf"
]) {
  const filePath = path.join(evidenceDir, file);
  assert(fs.existsSync(filePath), `Evidência ausente: ${file}`);
  assert(fs.statSync(filePath).size > 0, `Evidência vazia: ${file}`);
}

const metrics = JSON.parse(fs.readFileSync(path.join(evidenceDir, "reference-manual.metrics.json"), "utf8"));
const document = JSON.parse(fs.readFileSync(path.join(evidenceDir, "reference-manual.document.json"), "utf8"));

assert(metrics.audit.includes("05.16"), "O log não identifica o incremento auditado.");
assert(metrics.historicalBaselineActions === 319 && metrics.previousComparableActions === 267, "As bases comparáveis divergiram.");
assert(metrics.actions.total === 223, "O ensaio canônico deve registrar 223 ações.");
assert(metrics.actions.click === 110 && metrics.actions.fill === 83 && metrics.actions.selection === 19 && metrics.actions.keypress === 10 && metrics.actions.download === 1, "A decomposição das ações divergiu.");
assert(metrics.actions.contextSwitches === 28 && metrics.actions.corrections === 18, "Trocas de contexto ou correções divergiram.");
assert(metrics.actions.noEffectAttempts === 6, "As tentativas sem efeito devem permanecer observáveis.");
assert(metrics.reductions.fromPreviousComparable.absolute === 44 && metrics.reductions.fromPreviousComparable.percentage === 16.5, "A redução desde 05.12 está incorreta.");
assert(metrics.reductions.fromHistoricalBaseline.absolute === 96 && metrics.reductions.fromHistoricalBaseline.percentage === 30.1, "A redução histórica está incorreta.");
assert(metrics.actionLog.length === metrics.actions.total, "O agregado não corresponde ao log individual.");
assert(metrics.pageErrors.length === 0 && metrics.consoleErrors.length === 0, "A auditoria contém erros de runtime.");

assert(document.schemaVersion === "1.16.0", "A evidência deve permanecer no schema 1.16.0.");
const collections = new Map(document.collections.map(collection => [collection.id, collection]));
assert(collections.get("products")?.items.length === 7, "O documento não contém sete produtos.");
assert(collections.get("tableRows")?.items.length === 16, "O documento não contém dezesseis linhas.");
assert(collections.get("colorLegends")?.items.length === 8, "O documento não contém oito legendas.");

const components = [];
const visit = component => {
  if (!component || typeof component !== "object") return;
  if (component.type) components.push(component);
  (component.children || []).forEach(visit);
};
document.pages.forEach(visit);
assert(components.filter(component => component.type === "product-card").length === 7, "O documento não contém sete cards.");
const gallerySizes = components.filter(component => component.type === "art-gallery").map(component => component.children.length).sort((a, b) => a - b);
assert(JSON.stringify(gallerySizes) === JSON.stringify([3, 5]), "As galerias não preservam três e cinco imagens.");

const summary = metrics.result.report.summary;
assert(summary.collisions === 8 && summary.overflows === 0, "O resultado geométrico canônico divergiu.");
assert(metrics.result.viewport.width === 1366 && metrics.result.viewport.height === 768, "O viewport contratual divergiu.");

console.log("✓ Evidências 05.16 preservam a reconstrução comparável de 223 ações.");
