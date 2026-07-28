/* Incremento 05.39 — projeções no gerador canônico do manifesto. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const load = file => vm.runInThisContext(read(file), { filename: file });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

global.window = global;
global.CATALOG_SCHEMA_VERSION = "1.16.0";
global.CatalogEditorIcon = () => "";
[
  "app/tokens.js",
  "app/catalog-source.js",
  "app/table-schema-registry.js",
  "app/catalog-generation-plan.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/icon-library.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/component-intent-registry.js",
  "app/component-placement-registry.js",
  "app/section-recipes.js",
  "app/project-package.js"
].forEach(load);

const canonicalBuilder = CatalogProjectManifests.buildCapabilitiesManifest;

// Ordem inversa à usada pelo editor: a instalação não pode encadear wrappers.
load("app/component-placement-manifest-contract.js");
assert(CatalogComponentPlacementManifestContract.install() === true, "O contrato de posicionamento não reconheceu o gerador canônico.");
load("app/component-intent-manifest-contract.js");
assert(CatalogComponentIntentManifestContract.install() === true, "O contrato de intenção não reconheceu o gerador canônico.");

assert(CatalogProjectManifests.buildCapabilitiesManifest === canonicalBuilder, "A instalação substituiu buildCapabilitiesManifest.");
assert(CatalogComponentIntentManifestContract.install() === true, "A reinstalação de intenção deixou de ser idempotente.");
assert(CatalogComponentPlacementManifestContract.install() === true, "A reinstalação de posicionamento deixou de ser idempotente.");
assert(CatalogProjectManifests.buildCapabilitiesManifest === canonicalBuilder, "A reinstalação alterou a identidade do gerador.");

const manifest = CatalogProjectManifests.buildCapabilitiesManifest();
assert(manifest.componentIntents?.groups?.length === 5, "A projeção por intenção foi perdida na ordem inversa.");
assert(manifest.componentPlacements?.hints?.length === 2, "A projeção de posicionamento foi perdida na ordem inversa.");
assert(manifest.components.length === 16, "O manifesto deixou de cobrir os 16 tipos.");
assert(manifest.components.every(component => component.intent?.id), "Há componente sem intenção editorial.");
assert(manifest.components.find(component => component.type === "catalog-header")?.initialPlacement?.blockAnchor === "top", "A posição provável do cabeçalho foi perdida.");
assert(manifest.components.find(component => component.type === "catalog-footer")?.initialPlacement?.blockAnchor === "bottom", "A posição provável do rodapé foi perdida.");
assert(manifest.editor?.schemaVersion === "1.16.0", "A consolidação alterou o schema declarado.");

const intentSource = read("app/component-intent-manifest-contract.js");
const placementSource = read("app/component-placement-manifest-contract.js");
assert(!intentSource.includes("manifests.buildCapabilitiesManifest ="), "O contrato de intenção voltou a substituir o gerador.");
assert(!placementSource.includes("manifests.buildCapabilitiesManifest ="), "O contrato de posicionamento voltou a substituir o gerador.");

console.log("✓ Manifesto canônico preserva intenção e posicionamento sem wrappers dependentes da ordem.");
