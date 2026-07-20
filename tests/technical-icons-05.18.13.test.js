/* DB-05.18.13 — contrato estático da iconografia técnica e de desempenho. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const window = {};
const sandbox = { window, console };
window.window = window;
vm.createContext(sandbox);

for (const relativePath of [
  "app/catalog-icons.js",
  "app/icon-library.js"
]) {
  vm.runInContext(fs.readFileSync(path.join(root, relativePath), "utf8"), sandbox, { filename: relativePath });
}

const expectedIds = ["corrosion-resistant", "diameter", "load-capacity", "torque"];
const batch = Object.entries(window.CATALOG_ICON_LIBRARY)
  .filter(([, icon]) => icon.batch === "technical-performance")
  .sort(([left], [right]) => left.localeCompare(right));

assert(batch.length === 4, `O lote deveria conter quatro ícones; recebeu ${batch.length}.`);
assert(JSON.stringify(batch.map(([id]) => id)) === JSON.stringify(expectedIds), `IDs inesperados: ${batch.map(([id]) => id).join(", ")}.`);
assert(Object.keys(window.CATALOG_ICON_LIBRARY).length >= 31, `A biblioteca perdeu entradas posteriores ao lote técnico: ${Object.keys(window.CATALOG_ICON_LIBRARY).length}.`);

for (const [id, icon] of batch) {
  assert(typeof icon.label === "string" && icon.label.trim(), `${id}: rótulo ausente.`);
  assert(["Técnica", "Desempenho"].includes(icon.category), `${id}: categoria fora do lote.`);
  assert(Array.isArray(icon.contexts) && icon.contexts.includes("specification") && icon.contexts.includes("icon"), `${id}: contextos incompletos.`);
  assert(Array.isArray(icon.examples) && icon.examples.length >= 2, `${id}: menos de dois usos plausíveis.`);
  assert(Array.isArray(icon.keywords) && icon.keywords.length >= 4, `${id}: vocabulário de busca insuficiente.`);
  assert(/<(?:path|circle|rect|line|polyline|polygon)\b/.test(icon.body), `${id}: corpo SVG vazio.`);
  assert(!/<svg\b|<script\b|\son\w+=|\bfill=|\bstyle=|#[0-9a-f]{3,8}/i.test(icon.body), `${id}: corpo incompatível com SVG monocromático seguro.`);

  const rendered = window.CatalogEditorIcon(id, "technical-icon-test");
  assert(rendered.includes('viewBox="0 0 24 24"'), `${id}: viewBox canônico ausente.`);
  assert(rendered.includes('stroke="currentColor"'), `${id}: recoloração por currentColor ausente.`);
  assert(rendered.includes(icon.body), `${id}: renderer não usou o corpo cadastrado.`);
}

const appSource = fs.readFileSync(path.join(root, "app", "catalog-icons.js"), "utf8");
const kitSource = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "catalog-icons.js"), "utf8");
assert(appSource === kitSource, "A biblioteca de ícones divergiu entre editor e AuthoringKit.");

console.log("✓ DB-05.18.13 validou quatro ícones técnicos, dois contextos, SVG monocromático e paridade do runtime.");
