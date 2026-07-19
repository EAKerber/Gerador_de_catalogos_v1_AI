const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(root, "app/workspace-layout.js"), "utf8"), { filename: "app/workspace-layout.js" });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Viewport alvo: janela 1366×768, toolbar 56, breadcrumb 40, status 30,
// painéis simétricos de 294/294 e padding interno de 14 px.
const viewport = { width: 1366 - 294 - 294, height: 768 - 56 - 40 - 30 };
const scale = CatalogWorkspaceGeometry.computeFitScale({
  viewportWidth: viewport.width,
  viewportHeight: viewport.height,
  pageWidth: 794,
  pageHeight: 1123,
  padding: { left: 14, right: 14, top: 14, bottom: 14 }
});

assert(scale > 0.5, "A página ficou menor que o necessário no viewport 1366×768.");
assert(794 * scale <= viewport.width - 28, "A largura A4 não cabe na área disponível.");
assert(1123 * scale <= viewport.height - 28, "A altura A4 não cabe na área disponível.");

const collapsedScale = CatalogWorkspaceGeometry.computeFitScale({
  viewportWidth: 1366 - 42 - 42,
  viewportHeight: viewport.height,
  pageWidth: 794,
  pageHeight: 1123,
  padding: { left: 14, right: 14, top: 14, bottom: 14 }
});
assert(collapsedScale >= scale, "Recolher painéis não deve reduzir a escala ajustada.");
const css = fs.readFileSync(path.join(root, "styles/editor.css"), "utf8");
assert(css.includes("--left-panel-width: 310px") && css.includes("--right-panel-width: 310px"), "Painéis amplos não possuem largura equivalente.");
assert(css.includes("--left-panel-width: 294px; --right-panel-width: 294px"), "Painéis do viewport de notebook não usam a mesma largura.");
assert(CatalogWorkspaceGeometry.nextWheelZoom(0.55, -100) === 0.6, "Ctrl+roda para cima deve ampliar o zoom lógico.");
assert(CatalogWorkspaceGeometry.nextWheelZoom(0.55, 100) === 0.5, "Ctrl+roda para baixo deve reduzir o zoom lógico.");
assert(CatalogWorkspaceGeometry.nextWheelZoom(2, -100) === 2, "O zoom por roda deve respeitar o máximo.");

console.log(`✓ Página A4 ajustada a 1366×768 e zoom lógico por roda validados em ${Math.round(scale * 100)}%.`);
