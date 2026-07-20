/* DB-05.18.12.2 — integração do contrato no build Developer B. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const fileName = "footer-item-containment-contract.js";
const app = fs.readFileSync(path.join(root, "app", fileName), "utf8");
const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", fileName), "utf8");
const build = fs.readFileSync(path.join(root, "tools", "build-developer-b-authoring-kit.js"), "utf8");
const compiler = fs.readFileSync(path.join(root, "authoring-kit", "compiler", "compile-catalog.js"), "utf8");
const main = fs.readFileSync(path.join(root, "app", "main.js"), "utf8");

assert(app === kit, "O runtime do AuthoringKit divergiu do contrato do editor.");
assert(build.includes(`"${fileName}"`), "O build Developer B não sincroniza o contrato.");
assert(build.includes("authoring-kit-files.js"), "O build Developer B não regenera o bundle embutido.");
assert(compiler.includes(`"${fileName}"`) && compiler.includes("CatalogFooterItemContainmentContract.install()"), "O compilador não carrega e instala o contrato.");
assert(main.includes(`file: "${fileName}"`) && main.includes("CatalogFooterItemContainmentContract?.install()"), "O editor não carrega e instala o contrato.");
assert(!app.includes("schemaVersion"), "O contrato introduziu acoplamento indevido ao schema do documento.");

console.log("✓ DB-05.18.12.2 está sincronizado no editor, build Developer B e compilador do AuthoringKit.");
