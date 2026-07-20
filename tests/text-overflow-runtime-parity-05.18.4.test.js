/* DB-05.18.4 — contrato de overflow idêntico no app e no kit. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app", "text-overflow-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "text-overflow-contract.js"), "utf8");

if (app !== kit) throw new Error("O contrato de overflow divergiu entre app e authoring-kit/runtime.");
if (!app.includes('CONTRACT_VERSION = "05.18.4"')) throw new Error("A versão do contrato de overflow não está identificada.");
if (!app.includes("overflowExplicit")) throw new Error("O marcador de intenção explícita não faz parte do contrato.");

console.log("✓ Contrato de overflow idêntico no runtime principal e no AuthoringKit.");
