/* DB-05.18.14 — contrato estático da iconografia comercial, contato e confiança. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const window = {};
const sandbox = { window, console };
window.window = window;
vm.createContext(sandbox);
for (const file of ["app/catalog-icons.js", "app/icon-library.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
}

const expectedIds = ["email", "payment", "phone", "warranty"];
const expectedCategories = { email: "Contato", payment: "Comercial", phone: "Contato", warranty: "Confiança" };
const batch = Object.entries(window.CATALOG_ICON_LIBRARY)
  .filter(([, icon]) => icon.batch === "commercial-contact-trust")
  .sort(([left], [right]) => left.localeCompare(right));

assert(batch.length === 4, `O lote comercial deveria conter quatro ícones; recebeu ${batch.length}.`);
assert(JSON.stringify(batch.map(([id]) => id)) === JSON.stringify(expectedIds), `IDs comerciais inesperados: ${batch.map(([id]) => id).join(", ")}.`);
assert(Object.keys(window.CATALOG_ICON_LIBRARY).length >= 35, `A biblioteca deveria conter ao menos 35 entradas; recebeu ${Object.keys(window.CATALOG_ICON_LIBRARY).length}.`);

for (const [id, icon] of batch) {
  assert(icon.label?.trim(), `${id}: rótulo ausente.`);
  assert(icon.category === expectedCategories[id], `${id}: categoria inesperada (${icon.category}).`);
  assert(Array.isArray(icon.contexts) && icon.contexts.includes("icon") && icon.contexts.length >= 2, `${id}: menos de dois contextos.`);
  assert(Array.isArray(icon.examples) && icon.examples.length >= 2, `${id}: menos de dois usos plausíveis.`);
  assert(Array.isArray(icon.keywords) && icon.keywords.length >= 4, `${id}: palavras-chave insuficientes.`);
  assert(/<(?:path|circle|rect|line|polyline|polygon)\b/.test(icon.body), `${id}: corpo SVG vazio.`);
  assert(!/<svg\b|<script\b|\son\w+=|\bfill=|\bstyle=|#[0-9a-f]{3,8}/i.test(icon.body), `${id}: SVG incompatível com o renderer monocromático.`);
  const rendered = window.CatalogEditorIcon(id, "commercial-icon-test");
  assert(rendered.includes('viewBox="0 0 24 24"'), `${id}: viewBox canônico ausente.`);
  assert(rendered.includes('stroke="currentColor"'), `${id}: currentColor ausente.`);
  assert(rendered.includes(icon.body), `${id}: corpo não utilizado pelo renderer.`);
}

const technicalIds = Object.entries(window.CATALOG_ICON_LIBRARY)
  .filter(([, icon]) => icon.batch === "technical-performance")
  .map(([id]) => id)
  .sort();
assert(JSON.stringify(technicalIds) === JSON.stringify(["corrosion-resistant", "diameter", "load-capacity", "torque"]), "O lote comercial alterou o lote técnico anterior.");

const appSource = fs.readFileSync(path.join(root, "app", "catalog-icons.js"), "utf8");
const kitSource = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "catalog-icons.js"), "utf8");
assert(appSource === kitSource, "A biblioteca comercial divergiu entre editor e AuthoringKit.");

console.log("✓ DB-05.18.14 validou quatro ícones comerciais, múltiplos contextos e paridade do runtime.");
