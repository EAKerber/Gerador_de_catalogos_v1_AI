const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const readJSON = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const capabilities = readJSON("authoring-kit/capabilities.json");
const inventory = readJSON("authoring-kit/feature-inventory.json");
const guide = readJSON("authoring-kit/feature-guide.json");
const governance = readJSON("authoring-kit/feature-governance.json");
const manifest = readJSON("authoring-kit/manifest.json");
const catalog = fs.readFileSync(path.join(root, "docs/FEATURE-CATALOG.md"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const capabilityIds = Object.keys(capabilities.capabilities).sort();
const inventoryCapabilityIds = inventory.capabilities.map(item => item.id).sort();
const componentTypes = new Set(capabilities.components.map(component => component.type));
const recipeIds = new Set(capabilities.recipes.map(recipe => recipe.id));

assert(manifest.kitVersion === "1.7.1", "O manifesto não preserva a versão contratual do atlas.");
assert(manifest.editorIncrement === governance.editorIncrement, "Manifesto e governança divergem sobre o incremento do editor.");
assert(manifest.featureInventory === "feature-inventory.json" && manifest.featureGuide === "feature-guide.json" && manifest.featureGovernance === "feature-governance.json" && manifest.authoringPatterns === "authoring-patterns.json", "O manifesto não publica os quatro artefatos do atlas.");
assert(JSON.stringify(capabilityIds) === JSON.stringify(inventoryCapabilityIds), "O inventário não cobre exatamente as capacidades do manifesto.");
assert(JSON.stringify(capabilityIds) === JSON.stringify(governance.capabilityDecisions.map(item => item.id).sort()), "A governança não cobre exatamente as capacidades do manifesto.");
assert(inventory.components.length === capabilities.components.length && inventory.recipes.length === capabilities.recipes.length, "Componentes ou receitas divergiram do manifesto.");
assert(inventory.summary.curatedFlows === guide.entries.length && guide.entries.length >= 12, "O guia curado não possui cobertura operacional mínima.");
assert(inventory.capabilities.every(item => item.governance && item.governanceReason), "O inventário não publica status e motivo de governança.");
assert(governance.frozenLanes.length === 4 && governance.interactionDecisions.some(item => item.id === "layout-authority"), "O congelamento ou a auditoria de autoridade de layout não foi canonizado.");

const seen = new Set();
guide.entries.forEach(entry => {
  assert(!seen.has(entry.id), `ID curado duplicado: ${entry.id}.`);
  seen.add(entry.id);
  for (const field of ["intention", "access", "result", "example"]) assert(typeof entry[field] === "string" && entry[field].trim(), `${entry.id} não define ${field}.`);
  entry.capabilityIds.forEach(id => assert(capabilityIds.includes(id), `${entry.id} referencia capability inexistente ${id}.`));
  entry.componentTypes.forEach(id => assert(componentTypes.has(id), `${entry.id} referencia componente inexistente ${id}.`));
  entry.recipeIds.forEach(id => assert(recipeIds.has(id), `${entry.id} referencia receita inexistente ${id}.`));
  assert(catalog.includes(`\`${entry.id}\``), `${entry.id} não foi publicado no guia humano.`);
});

assert(catalog.includes(`${capabilityIds.length} capacidades de produto`) && catalog.includes(`${capabilities.components.length} tipos de componente`), "O resumo humano diverge do inventário gerado.");
assert(catalog.includes("Governança") && catalog.includes("feature-governance.json"), "O atlas humano não expõe a governança subtrativa.");
console.log(`✓ Atlas validado: ${capabilityIds.length} capacidades, ${capabilities.components.length} componentes e ${guide.entries.length} fluxos curados.`);
