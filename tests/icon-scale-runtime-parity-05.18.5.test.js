/* DB-05.19.6 — escala de ícone integrada sem contrato de runtime separado. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const fileName = "icon-scale-contract.js";
const styles = fs.readFileSync(path.join(root, "styles", "components.css"), "utf8");
const registry = fs.readFileSync(path.join(root, "app", "component-registry.js"), "utf8");
const kitRegistry = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "component-registry.js"), "utf8");
const main = fs.readFileSync(path.join(root, "app", "main.js"), "utf8");
const build = fs.readFileSync(path.join(root, "tools", "build-developer-b-authoring-kit.js"), "utf8");
const compiler = fs.readFileSync(path.join(root, "authoring-kit", "compiler", "compile-catalog.js"), "utf8");
const bundle = fs.readFileSync(path.join(root, "app", "authoring-kit-files.js"), "utf8");

if (fs.existsSync(path.join(root, "app", fileName))) throw new Error("O shim de escala ainda existe no app.");
if (fs.existsSync(path.join(root, "authoring-kit", "runtime", fileName))) throw new Error("O shim de escala ainda existe no runtime do AuthoringKit.");
if (registry !== kitRegistry) throw new Error("O registro canônico divergiu entre app e AuthoringKit.");
if (!registry.includes('path: "iconScale"') || !registry.includes("--icon-content-scale")) throw new Error("A capacidade de escala não está no registro/render canônico.");
if (!styles.includes('.editor-component--footer-item > .component-children-layer > .editor-component--icon[data-slot-name="icon"] .component-icon__svg')) throw new Error("A contenção do invólucro no rodapé não está no CSS canônico.");
if (!styles.includes("width: min(100%, 26px)") || !styles.includes("max-width: 100%")) throw new Error("Os limites canônicos do invólucro não estão declarados.");
if (!styles.includes(".component-icon__svg svg { width: 83.333333%; height: 83.333333%;")) throw new Error("A reserva interna para escala de 120% não está declarada.");
for (const [label, source] of [["editor", main], ["build", build], ["compilador", compiler], ["bundle", bundle]]) {
  if (source.includes(fileName) || source.includes("CatalogIconScaleContract")) throw new Error(`O ${label} ainda referencia o shim de escala.`);
}

console.log("✓ Escala de ícone integrada ao registro, render e CSS canônicos sem shim.");
