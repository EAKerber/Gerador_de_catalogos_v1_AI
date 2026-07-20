/* DB-05.18.7 — contrato hero idêntico no app e no kit. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app", "product-hero-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "product-hero-contract.js"), "utf8");

if (app !== kit) throw new Error("O contrato hero divergiu entre app e authoring-kit/runtime.");
if (!app.includes('CONTRACT_VERSION = "05.18.7"')) throw new Error("A versão do contrato hero não está identificada.");
if (!app.includes("MAX_ART_GAIN = 24")) throw new Error("O limite de ganho da arte não está declarado.");

console.log("✓ Contrato hero idêntico no runtime principal e no AuthoringKit.");
