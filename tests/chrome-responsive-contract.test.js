const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const html = read("index.html");
const css = read("styles/editor.css");
const renderer = read("app/renderer.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(html.includes('id="visualizationMenu"'), "Preferências de canvas não foram agrupadas em Visualização.");
assert(html.includes('aria-label="Abrir preferências de visualização"'), "O agrupamento de Visualização não possui nome acessível.");
for (const id of ["gridToggle", "snapToggle", "smartSnapToggle", "equalSpacingToggle", "showGuidesToggle", "snapToleranceSelect", "zoomSelect"]) {
  assert(html.includes(`id="${id}"`), `O controle ${id} deixou de ser acessível no agrupamento.`);
}
assert(css.includes("@media (min-width: 1500px)") && css.includes("@media (max-width: 1499px)"), "A troca entre visualização inline e condensada não foi formalizada.");
assert(css.includes(".toolbar-visualization:not([open]) > .toolbar-visualization__controls"), "O menu de visualização não possui estado fechado explícito.");
assert(css.includes("grid-template-columns: 38px minmax(0, 1fr) 54px"), "Cards da biblioteca não reservam coluna própria para ações.");
assert(css.includes("-webkit-line-clamp: 2") && css.includes("-webkit-line-clamp: 3"), "Título e descrição não possuem truncamento deliberado.");
assert(css.includes(".palette-item__meta { overflow: hidden; }") && !css.includes(".palette-item__actions { position: absolute"), "Texto e ações ainda podem disputar a mesma região.");
assert(renderer.includes('class="palette-item__insert"') && renderer.includes('aria-label="Inserir'), "A ação primária da biblioteca perdeu rótulo acessível.");
assert(css.includes(".toolbar-button:focus-visible") && css.includes(".palette-item__actions button:focus-visible"), "O foco de teclado não está visível nas ações reparadas.");

console.log("✓ Contrato responsivo da toolbar e dos cards da biblioteca validado.");
