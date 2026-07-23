/* DB-05.18.10 — identidade do contrato data-only entre editor e AuthoringKit. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app", "product-data-only-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "product-data-only-contract.js"), "utf8");
if (app !== kit) throw new Error("O contrato data-only divergiu entre app e AuthoringKit.");
if (!app.includes('CONTRACT_VERSION = "05.18.10"')) throw new Error("Versão do contrato data-only inesperada.");
if (!app.includes("0.65")) throw new Error("A prioridade compacta de informações não está explícita.");
if (!app.includes("installStoreContract")) throw new Error("O contrato data-only não sincroniza mudanças da store.");
console.log("✓ Contrato data-only é idêntico no editor e no AuthoringKit.");
