/* DB-05.19.5 — escala de ícone usa CSS canônico; contrato permanece apenas como shim. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app", "icon-scale-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "icon-scale-contract.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles", "components.css"), "utf8");

if (app !== kit) throw new Error("O shim de escala de ícone divergiu entre app e authoring-kit/runtime.");
if (!app.includes('CONTRACT_VERSION = "05.19.5"')) throw new Error("A versão do shim de ícone não está identificada.");
if (app.includes("document.createElement") || app.includes("style.textContent")) throw new Error("O shim ainda injeta CSS em tempo de execução.");
if (!styles.includes('.editor-component--footer-item > .component-children-layer > .editor-component--icon[data-slot-name="icon"] .component-icon__svg')) throw new Error("A contenção do invólucro no rodapé não está no CSS canônico.");
if (!styles.includes("width: min(100%, 26px)") || !styles.includes("max-width: 100%")) throw new Error("Os limites canônicos do invólucro do rodapé não estão declarados.");
if (!styles.includes(".component-icon__svg svg { width: 83.333333%; height: 83.333333%;")) throw new Error("A reserva interna para escala de 120% não está declarada.");

console.log("✓ Escala de ícone mantém shim sem injeção e contenção no CSS canônico.");
