const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const matrix = fs.readFileSync(path.join(root, "docs/REFERENCE-IMAGE-COVERAGE.md"), "utf8");
const baseline = path.join(root, "docs/reference/catalogo-base.jpeg");
const expectedComponents = [
  "catalog-header",
  "product-card",
  "catalog-footer",
  "art",
  "icon",
  "title-symbol",
  "specification",
  "data-table"
];

for (const type of expectedComponents) {
  if (!matrix.includes(`\`${type}\``)) throw new Error(`A matriz não cobre o componente ${type}.`);
}
if (!matrix.includes("Coberto") || !matrix.includes("Adiado")) throw new Error("A matriz precisa distinguir cobertura entregue e adiada.");
if (!matrix.includes("IndexedDB") || !matrix.includes("ponto focal")) throw new Error("A matriz não registra a cobertura funcional das artes.");
if (!fs.existsSync(baseline) || fs.statSync(baseline).size === 0) throw new Error("A imagem-base versionada não está disponível.");
if (!matrix.includes("itens 04 e 07") || !matrix.includes("`art-gallery`") || !matrix.includes("galeria em auto-layout")) throw new Error("A matriz não registra a cobertura das composições multiarte.");
if (!matrix.includes("Legenda de cores vinculada") || !matrix.includes("Descoberta")) throw new Error("A matriz não separa a descoberta de legenda cromática para tabelas.");

console.log("✓ Matriz de cobertura referencia todas as regiões editoriais do catálogo.");
