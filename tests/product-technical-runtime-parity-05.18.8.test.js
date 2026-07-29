/* DB-05.18.8 — contrato técnico idêntico no app e no kit. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app", "product-technical-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "product-technical-contract.js"), "utf8");

if (app !== kit) throw new Error("O contrato técnico divergiu entre app e authoring-kit/runtime.");
if (!app.includes('CONTRACT_VERSION = "05.18.8"')) throw new Error("A versão do contrato técnico não está identificada.");
if (!app.includes("MAX_SPECIFICATIONS_GAIN = 24")) throw new Error("O limite de ganho das especificações não está declarado.");
if (!app.includes("Math.max(44")) throw new Error("O mínimo interno de galeria não acompanha o runtime canônico.");

console.log("✓ Contrato técnico idêntico no runtime principal e no AuthoringKit.");
