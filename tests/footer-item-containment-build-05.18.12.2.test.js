/* DB-05.19.4 — contenção do footer-item integrada sem contrato de runtime separado. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const fileName = "footer-item-containment-contract.js";
const appRegistry = fs.readFileSync(path.join(root, "app", "component-registry.js"), "utf8");
const kitRegistry = fs.readFileSync(path.join(root, "authoring-kit", "runtime", "component-registry.js"), "utf8");
const build = fs.readFileSync(path.join(root, "tools", "build-developer-b-authoring-kit.js"), "utf8");
const compiler = fs.readFileSync(path.join(root, "authoring-kit", "compiler", "compile-catalog.js"), "utf8");
const main = fs.readFileSync(path.join(root, "app", "main.js"), "utf8");
const bundle = fs.readFileSync(path.join(root, "app", "authoring-kit-files.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles", "components.css"), "utf8");

assert(!fs.existsSync(path.join(root, "app", fileName)), "O shim ainda existe no app.");
assert(!fs.existsSync(path.join(root, "authoring-kit", "runtime", fileName)), "O shim ainda existe no runtime do AuthoringKit.");
assert(appRegistry === kitRegistry, "O registro canônico divergiu entre editor e AuthoringKit.");
assert(!build.includes(`"${fileName}"`), "O build Developer B ainda sincroniza o shim.");
assert(!compiler.includes(`"${fileName}"`) && !compiler.includes("CatalogFooterItemContainmentContract"), "O compilador ainda carrega ou instala o shim.");
assert(!main.includes(`file: "${fileName}"`) && !main.includes("CatalogFooterItemContainmentContract"), "O editor ainda carrega ou instala o shim.");
assert(!bundle.includes(fileName), "O bundle embutido ainda transporta o shim.");
assert(css.includes('.editor-component--footer-item:not([data-active-context="true"]) > .component-children-layer'), "O CSS canônico perdeu o recorte do footer-item.");
assert(appRegistry.includes("function footerItemTextFrame"), "O registro canônico perdeu a geometria do footer-item.");

console.log("✓ DB-05.19.4 mantém a contenção no registro e CSS canônicos sem contrato de runtime separado.");
