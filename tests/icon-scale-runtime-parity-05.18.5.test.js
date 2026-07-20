/* DB-05.18.5 — contrato de escala de ícone idêntico no app e no kit. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app", "icon-scale-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "icon-scale-contract.js"), "utf8");

if (app !== kit) throw new Error("O contrato de escala de ícone divergiu entre app e authoring-kit/runtime.");
if (!app.includes('CONTRACT_VERSION = "05.18.5"')) throw new Error("A versão do contrato de ícone não está identificada.");
if (!app.includes("83.333333%")) throw new Error("O limite seguro para 120% no rodapé não está declarado.");

console.log("✓ Contrato de escala de ícone idêntico no runtime principal e no AuthoringKit.");
