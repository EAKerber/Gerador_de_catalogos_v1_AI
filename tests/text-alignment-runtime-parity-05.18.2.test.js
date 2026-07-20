/* DB-05.18.2 — o runtime principal e o espelho do kit devem ser idênticos. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app", "text-alignment-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "text-alignment-contract.js"), "utf8");

if (app !== kit) throw new Error("O contrato de alinhamento divergiu entre app e authoring-kit/runtime.");
if (!app.includes('CONTRACT_VERSION = "05.18.2"')) throw new Error("A versão do contrato não está identificada.");
if (!app.includes("alignExplicit")) throw new Error("O marcador de intenção explícita não faz parte do contrato.");

console.log("✓ Contrato de alinhamento idêntico no runtime principal e no AuthoringKit.");
