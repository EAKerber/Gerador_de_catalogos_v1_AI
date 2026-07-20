/* DB-05.18.14 — lote comercial no manifesto de capacidades. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
global.CatalogEditorIcon = () => "";
[
  "app/tokens.js",
  "app/catalog-source.js",
  "app/table-schema-registry.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/icon-library.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/component-intent-registry.js",
  "app/section-recipes.js",
  "app/project-package.js",
  "app/component-intent-manifest-contract.js"
].forEach(file => vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
assert(CatalogComponentIntentManifestContract.VERSION === "05.18.14", "Versão do contrato de manifesto inesperada.");
assert(CatalogComponentIntentManifestContract.install(), "O contrato de manifesto não foi instalado.");

const manifest = CatalogProjectManifests.buildCapabilitiesManifest();
assert(manifest.iconBatches?.length === 2, `O manifesto deveria publicar dois lotes; recebeu ${manifest.iconBatches?.length || 0}.`);
const commercial = manifest.iconBatches.find(item => item.id === "commercial-contact-trust");
const technical = manifest.iconBatches.find(item => item.id === "technical-performance");
assert(commercial?.version === "05.18.14", `Versão comercial inesperada: ${commercial?.version}.`);
assert(technical?.version === "05.18.13", `O lote técnico perdeu sua versão de origem: ${technical?.version}.`);
assert(JSON.stringify(commercial.iconIds) === JSON.stringify(["email", "payment", "phone", "warranty"]), `IDs comerciais inesperados: ${JSON.stringify(commercial.iconIds)}.`);
assert(JSON.stringify(commercial.requiredContexts) === JSON.stringify(["footer-item", "icon", "specification"]), `Contextos comerciais inesperados: ${JSON.stringify(commercial.requiredContexts)}.`);

const icons = manifest.icons.filter(icon => icon.batch === "commercial-contact-trust");
assert(icons.length === 4, `O manifesto deveria conter quatro ícones comerciais; recebeu ${icons.length}.`);
for (const icon of icons) {
  assert(icon.label && icon.category && icon.svgBody, `${icon.id}: campos canônicos ausentes.`);
  assert(icon.contexts?.includes("icon") && icon.contexts.length >= 2, `${icon.id}: contextos não projetados.`);
  assert(icon.examples?.length >= 2, `${icon.id}: exemplos não projetados.`);
  assert(icon.keywords?.length >= 4, `${icon.id}: palavras-chave não projetadas.`);
}

const rebuilt = CatalogProjectManifests.buildCapabilitiesManifest();
assert(JSON.stringify(rebuilt.iconBatches) === JSON.stringify(manifest.iconBatches), "A ordem ou versão dos lotes não é determinística.");
assert(JSON.stringify(rebuilt.icons.filter(icon => icon.batch === "commercial-contact-trust")) === JSON.stringify(icons), "Os metadados comerciais não são determinísticos.");
assert(manifest.editor.schemaVersion === "1.16.0", "O lote comercial alterou o schema do documento.");

console.log("✓ DB-05.18.14 publicou o lote comercial sem alterar o lote técnico ou o schema.");
