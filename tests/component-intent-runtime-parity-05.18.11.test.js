/* DB-05.18.11 — identidade da taxonomia e projeção entre app e AuthoringKit. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
for (const fileName of ["component-intent-registry.js", "component-intent-manifest-contract.js"]) {
  const app = fs.readFileSync(path.join(root, "app", fileName), "utf8");
  const kit = fs.readFileSync(path.join(root, "authoring-kit", "runtime", fileName), "utf8");
  if (app !== kit) throw new Error(`${fileName} divergiu entre app e AuthoringKit.`);
}
const registry = fs.readFileSync(path.join(root, "app", "component-intent-registry.js"), "utf8");
const main = fs.readFileSync(path.join(root, "app", "main.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const build = fs.readFileSync(path.join(root, "tools", "build-authoring-kit.js"), "utf8");
if (!registry.includes('VERSION = "05.18.11"')) throw new Error("Versão da taxonomia inesperada.");
if (!registry.includes('"layout-container": "advanced"')) throw new Error("A infraestrutura avançada não está explícita.");
for (const fileName of ["component-intent-registry.js", "component-intent-manifest-contract.js"]) {
  if (!index.includes(`src="app/${fileName}"`)) throw new Error(`O editor não carrega ${fileName} estaticamente.`);
  if (!build.includes(`"${fileName}"`)) throw new Error(`O build não copia ou executa ${fileName}.`);
}
if (!main.includes("CatalogComponentIntentManifestContract?.install()")) throw new Error("O editor não instala a projeção de manifesto.");
if (!build.includes("CatalogComponentIntentManifestContract.install()")) throw new Error("O build não instala a projeção de manifesto.");
if (!build.includes("componentIntents: capabilities.componentIntents")) throw new Error("O inventário gerado não preserva a taxonomia.");
if (!build.includes("Grupos de componentes por intenção")) throw new Error("O atlas gerado não documenta os grupos de intenção.");
console.log("✓ Taxonomia, projeção, carga e geração são idênticas no editor e no AuthoringKit.");
