/* DB-05.18.5 — contrato de escala de ícone idêntico no app e no kit. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app", "icon-scale-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "icon-scale-contract.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles", "components.css"), "utf8");

if (app !== kit) throw new Error("O contrato de escala de ícone divergiu entre app e authoring-kit/runtime.");
if (!app.includes('CONTRACT_VERSION = "05.18.5"')) throw new Error("A versão do contrato de ícone não está identificada.");
if (!app.includes("width: min(100%, 26px)") || !app.includes("max-width: 100%")) throw new Error("A contenção do invólucro no rodapé não está declarada.");
if (!styles.includes(".component-icon__svg svg { width: 83.333333%; height: 83.333333%;")) throw new Error("A reserva interna para escala de 120% não está declarada.");

console.log("✓ Contrato de escala de ícone idêntico no runtime principal e no AuthoringKit.");
