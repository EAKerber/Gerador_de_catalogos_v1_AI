/* DB-05.18.3 — o contrato de escala deve ser idêntico no app e no kit. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app", "text-scale-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "text-scale-contract.js"), "utf8");

if (app !== kit) throw new Error("O contrato de escala divergiu entre app e authoring-kit/runtime.");
if (!app.includes('CONTRACT_VERSION = "05.18.3"')) throw new Error("A versão do contrato de escala não está identificada.");
if (!app.includes("--text-content-scale")) throw new Error("O contrato não consome o multiplicador tipográfico canônico.");

console.log("✓ Contrato de escala idêntico no runtime principal e no AuthoringKit.");
