/* DB-05.18.9 — identidade do contrato variants entre editor e AuthoringKit. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app", "product-variants-contract.js"), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "product-variants-contract.js"), "utf8");
if (app !== kit) throw new Error("O contrato variants divergiu entre app e AuthoringKit.");
if (!app.includes('CONTRACT_VERSION = "05.18.9"')) throw new Error("Versão do contrato variants inesperada.");
if (!app.includes("CAPTION_BAND_HEIGHT = 24")) throw new Error("A política de legenda individual não está explícita.");
if (!app.includes("installStoreContract")) throw new Error("O contrato variants não sincroniza mudanças da store.");
console.log("✓ Contrato variants é idêntico no editor e no AuthoringKit.");
