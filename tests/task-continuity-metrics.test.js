const fs = require("fs");
const path = require("path");
const metrics = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../docs/evidence/05.16/task-continuity.metrics.json"), "utf8"));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
assert(metrics.scope === "manual-core-composition" && metrics.comparableToFullReferenceAudit === false, "A medição parcial foi apresentada como reconstrução integral.");
assert(metrics.actions.total === 9 && Object.values(metrics.actions).filter(value => typeof value === "number").slice(1).reduce((sum, value) => sum + value, 0) === 9, "A decomposição de ações diverge do total.");
assert(metrics.result.products === 7 && metrics.result.collisions === 0 && metrics.result.overflows === 0 && metrics.result.silentActions === 0, "O resultado mensurado não atende aos gates do checkpoint.");
assert(Object.values(metrics.continuity).every(Boolean), "A continuidade de tarefa não foi comprovada no checkpoint.");
console.log("✓ Medição parcial 05.16 preserva escopo, nove ações e gates geométricos/operacionais.");
