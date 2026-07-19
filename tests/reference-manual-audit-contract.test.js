/* Incremento 05.12 — contrato estático das evidências da auditoria manual. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const evidenceDir = path.join(root, "docs", "evidence", "05.12");
const metricsPath = path.join(evidenceDir, "reference-manual.metrics.json");
const documentPath = path.join(evidenceDir, "reference-manual.document.json");
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

const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
const document = JSON.parse(fs.readFileSync(documentPath, "utf8"));

assert(metrics.audit.includes("05.12"), "O log não identifica o incremento auditado.");
assert(metrics.baselineActions === 319, "A linha de base histórica deve permanecer em 319 ações.");
assert(metrics.actions.total === 267, "O ensaio canônico deve registrar 267 ações.");
assert(metrics.actions.click === 138 && metrics.actions.fill === 93 && metrics.actions.selection === 35 && metrics.actions.download === 1, "A decomposição das ações divergiu do relatório.");
assert(metrics.actions.contextSwitches === 39 && metrics.actions.focusChanges === 43, "Trocas de contexto/foco divergiram da evidência.");
assert(metrics.actions.corrections === 29 && metrics.actions.noEffectAttempts === 7, "Correções/tentativas sem efeito divergiram da evidência.");
assert(metrics.reduction.absolute === 52 && metrics.reduction.percentage === 16.3, "A redução em relação à linha de base está incorreta.");
assert(metrics.actionLog.length === metrics.actions.total, "O total agregado não corresponde ao log individual.");
assert(metrics.pageErrors.length === 0 && metrics.consoleErrors.length === 0, "A auditoria canônica contém erros de runtime.");

assert(document.schemaVersion === "1.16.0", "A evidência deve permanecer compatível com o schema 1.16.0.");
const collections = new Map(document.collections.map(collection => [collection.id, collection]));
assert(collections.get("products")?.items.length === 7, "O documento não contém os sete produtos.");
assert(collections.get("tableRows")?.items.length === 16, "O documento não contém as dezesseis linhas de tabela.");
assert(collections.get("colorLegends")?.items.length === 8, "O documento não contém as oito legendas.");

const components = [];
const visit = component => {
  if (!component || typeof component !== "object") return;
  if (component.type) components.push(component);
  (component.children || []).forEach(visit);
};
document.pages.forEach(visit);
const countType = type => components.filter(component => component.type === type).length;
assert(countType("product-card") === 7, "O documento não contém os sete cards.");
assert(countType("art-gallery") === 2, "O documento não contém as duas galerias.");
const gallerySizes = components
  .filter(component => component.type === "art-gallery")
  .map(component => (component.children || []).length)
  .sort((a, b) => a - b);
assert(JSON.stringify(gallerySizes) === JSON.stringify([3, 5]), "As galerias não representam os grupos de três e cinco imagens.");

const summary = metrics.result.report.summary;
assert(metrics.result.products === 7 && metrics.result.cards === 7 && metrics.result.tableRows === 16, "Os totais editoriais do relatório divergiram.");
assert(JSON.stringify(metrics.result.galleries) === JSON.stringify([3, 5]) && metrics.result.legends === 8, "Galerias ou legendas divergiram do relatório.");
assert(summary.collisions === 8 && summary.overflows === 2, "A evidência deve preservar os problemas geométricos medidos.");
assert(metrics.result.viewport.width === 1366 && metrics.result.viewport.height === 768, "O ensaio não foi registrado no viewport contratual.");

console.log("✓ Evidências 05.12 preservam o ensaio manual de 267 ações e seus limites observados.");
