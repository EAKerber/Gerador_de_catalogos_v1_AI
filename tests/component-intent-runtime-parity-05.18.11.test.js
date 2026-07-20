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
if (!registry.includes('VERSION = "05.18.11"')) throw new Error("Versão da taxonomia inesperada.");
if (!registry.includes('"layout-container": "advanced"')) throw new Error("A infraestrutura avançada não está explícita.");
console.log("✓ Taxonomia por intenção e projeção de manifesto são idênticas no editor e no AuthoringKit.");
