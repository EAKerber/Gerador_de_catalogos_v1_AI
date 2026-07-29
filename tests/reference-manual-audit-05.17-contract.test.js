const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const metrics = JSON.parse(fs.readFileSync(path.join(root, "docs/evidence/05.17/reference-manual.metrics.json"), "utf8"));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(metrics.actions.total === 157, "A evidência 05.17 perdeu a linha de base de 157 ações.");
assert(metrics.result.report.summary.collisions === 0 && metrics.result.report.summary.overflows === 0, "A evidência 05.17 deixou de encerrar geometricamente válida.");
assert(metrics.result.products === 7 && metrics.result.cards === 7 && metrics.result.tableRows === 16, "A reconstrução não preserva produtos, cards e linhas.");
assert(metrics.result.galleries.join(",") === "3,5" && metrics.result.legends === 8, "Galerias ou legendas divergiram da referência.");
assert(metrics.pageErrors.length === 0 && metrics.consoleErrors.length === 0, "A evidência registrou erro de página ou console.");

console.log("✓ Evidência 05.17 preserva 157 ações e composição sem colisão/overflow.");
