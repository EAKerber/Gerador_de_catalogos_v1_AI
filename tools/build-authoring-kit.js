#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const kitRoot = path.join(root, "authoring-kit");
const schemaCopies = [
  "catalog-document.schema.json",
  "catalog-project-package.schema.json",
  "catalog-capabilities.schema.json",
  "catalog-source.schema.json",
  "catalog-generation-plan.schema.json"
];

schemaCopies.forEach(fileName => {
  fs.copyFileSync(path.join(root, "schemas", fileName), path.join(kitRoot, "schemas", fileName));
});

const runtimeRoot = path.join(kitRoot, "runtime");
fs.mkdirSync(runtimeRoot, { recursive: true });
[
  "tokens.js",
  "catalog-source.js",
  "table-schema-registry.js",
  "catalog-generation-plan.js",
  "presentation-registry.js",
  "catalog-icons.js",
  "layout-engine.js",
  "component-registry.js",
  "section-recipes.js",
  "collection-registry.js",
  "document-store.js",
  "catalog-validator.js",
  "catalog-compiler.js"
].forEach(fileName => fs.copyFileSync(path.join(root, "app", fileName), path.join(runtimeRoot, fileName)));

const window = {
  CATALOG_SCHEMA_VERSION: "1.16.0",
  CatalogEditorIcon() { return ""; }
};
const sandbox = {
  window,
  globalThis: null,
  TextEncoder,
  TextDecoder,
  Uint8Array,
  ArrayBuffer,
  DataView,
  Date,
  JSON,
  Object,
  Number,
  String,
  Boolean,
  Math,
  Map,
  Set,
  Blob,
  console
};
sandbox.globalThis = sandbox;
window.window = window;
vm.createContext(sandbox);

["app/tokens.js", "app/catalog-source.js", "app/table-schema-registry.js", "app/catalog-generation-plan.js", "app/presentation-registry.js", "app/catalog-icons.js", "app/component-registry.js", "app/section-recipes.js", "app/project-package.js"].forEach(relativePath => {
  vm.runInContext(fs.readFileSync(path.join(root, relativePath), "utf8"), sandbox, { filename: relativePath });
});

const capabilities = window.CatalogProjectManifests.buildCapabilitiesManifest();
fs.writeFileSync(path.join(kitRoot, "capabilities.json"), window.CatalogProjectManifests.stableJSON(capabilities));

const featureGuidePath = path.join(kitRoot, "feature-guide.json");
const featureGuide = JSON.parse(fs.readFileSync(featureGuidePath, "utf8"));
const featureGovernancePath = path.join(kitRoot, "feature-governance.json");
const featureGovernance = JSON.parse(fs.readFileSync(featureGovernancePath, "utf8"));
const capabilityIds = new Set(Object.keys(capabilities.capabilities));
const componentTypes = new Set(capabilities.components.map(component => component.type));
const recipeIds = new Set(capabilities.recipes.map(recipe => recipe.id));
const featureIds = new Set();

function requireText(entry, field) {
  if (typeof entry[field] !== "string" || !entry[field].trim()) throw new Error(`Feature ${entry.id || "sem id"}: ${field} é obrigatório.`);
}

featureGuide.entries.forEach(entry => {
  requireText(entry, "id");
  requireText(entry, "intention");
  requireText(entry, "access");
  requireText(entry, "result");
  requireText(entry, "example");
  if (featureIds.has(entry.id)) throw new Error(`Feature duplicada: ${entry.id}.`);
  featureIds.add(entry.id);
  (entry.capabilityIds || []).forEach(id => { if (!capabilityIds.has(id)) throw new Error(`Feature ${entry.id}: capability inexistente ${id}.`); });
  (entry.componentTypes || []).forEach(id => { if (!componentTypes.has(id)) throw new Error(`Feature ${entry.id}: componente inexistente ${id}.`); });
  (entry.recipeIds || []).forEach(id => { if (!recipeIds.has(id)) throw new Error(`Feature ${entry.id}: receita inexistente ${id}.`); });
});

const governanceStatuses = new Set(Object.keys(featureGovernance.statusVocabulary || {}));
const governanceDecisions = new Map();
featureGovernance.capabilityDecisions.forEach(decision => {
  if (!capabilityIds.has(decision.id)) throw new Error(`Governança: capability inexistente ${decision.id}.`);
  if (!governanceStatuses.has(decision.status)) throw new Error(`Governança ${decision.id}: status inexistente ${decision.status}.`);
  if (governanceDecisions.has(decision.id)) throw new Error(`Governança duplicada: ${decision.id}.`);
  requireText(decision, "reason");
  governanceDecisions.set(decision.id, decision);
});
capabilityIds.forEach(id => { if (!governanceDecisions.has(id)) throw new Error(`Governança ausente para ${id}.`); });
const governanceSummary = [...governanceDecisions.values()].reduce((summary, decision) => {
  summary[decision.status] = (summary[decision.status] || 0) + 1;
  return summary;
}, {});

const featureInventory = {
  inventoryFormat: "CatalogFeatureInventory",
  inventoryVersion: "1.0.0",
  editor: capabilities.editor,
  sources: {
    capabilities: "capabilities.json",
    curatedGuide: "feature-guide.json",
    governance: "feature-governance.json"
  },
  summary: {
    capabilities: capabilityIds.size,
    components: capabilities.components.length,
    recipes: capabilities.recipes.length,
    presentations: Object.keys(capabilities.presentations.presets || {}).length,
    separatorPresets: capabilities.separatorPresets.length,
    icons: capabilities.icons.length,
    curatedFlows: featureGuide.entries.length,
    governance: governanceSummary
  },
  capabilities: Object.entries(capabilities.capabilities).map(([id, value]) => ({
    id,
    value,
    contract: `CatalogCapabilities.capabilities.${id}`,
    governance: governanceDecisions.get(id).status,
    governanceReason: governanceDecisions.get(id).reason
  })),
  components: capabilities.components.map(component => ({
    type: component.type,
    label: component.label,
    category: component.category,
    container: Boolean(component.container),
    accepts: component.container?.accepts || [],
    slots: component.container?.slots || [],
    contentFields: component.contentFields.map(field => ({ path: field.path, label: field.label, type: field.type })),
    styleFields: component.styleFields,
    minimum: component.minimum,
    recommendedMinimum: component.recommendedMinimum || component.minimum,
    capabilities: component.capabilities
  })),
  recipes: capabilities.recipes,
  presentations: capabilities.presentations,
  separatorPresets: capabilities.separatorPresets,
  tokenGroups: Object.keys(capabilities.tokens).sort(),
  icons: capabilities.icons.map(icon => ({ id: icon.id, label: icon.label, category: icon.category })),
  curatedFlows: featureGuide.entries.map(entry => ({ id: entry.id, capabilityIds: entry.capabilityIds, componentTypes: entry.componentTypes, recipeIds: entry.recipeIds }))
};
fs.writeFileSync(path.join(kitRoot, "feature-inventory.json"), window.CatalogProjectManifests.stableJSON(featureInventory));

const markdownCell = value => String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
const list = values => values?.length ? values.map(value => `\`${value}\``).join(", ") : "—";
const catalogLines = [
  "# Atlas de funcionalidades — Incremento 05.17",
  "",
  "Referência operacional para pessoas e agentes. `authoring-kit/capabilities.json` é a fonte técnica; `feature-inventory.json` é gerado; `feature-guide.json` contém a curadoria por intenção; `feature-governance.json` define foco, congelamento e auditoria subtrativa. Execute `node tools/build-authoring-kit.js` para regenerar e validar referências.",
  "",
  "## Resumo",
  "",
  `- ${featureInventory.summary.capabilities} capacidades de produto;`,
  `- ${featureInventory.summary.components} tipos de componente;`,
  `- ${featureInventory.summary.recipes} receitas oficiais;`,
  `- ${featureInventory.summary.curatedFlows} fluxos curados;`,
  `- ${featureInventory.summary.icons} ícones declarados.`,
  `- governança: ${Object.entries(governanceSummary).map(([status, count]) => `${count} ${status}`).join(", ")}.`,
  "",
  "## Fluxos por intenção",
  "",
  "| ID | Intenção | Acesso | Resultado |",
  "| --- | --- | --- | --- |"
];
featureGuide.entries.forEach(entry => catalogLines.push(`| \`${entry.id}\` | ${markdownCell(entry.intention)} | ${markdownCell(entry.access)} | ${markdownCell(entry.result)} |`));
featureGuide.entries.forEach(entry => {
  catalogLines.push("", `## ${entry.intention}`, "", `- **ID:** \`${entry.id}\``, `- **Acesso:** ${entry.access}`, `- **Pré-condições:** ${entry.preconditions.join("; ") || "Nenhuma adicional"}`, `- **Resultado:** ${entry.result}`, `- **Exemplo:** ${entry.example}`, `- **Limites:** ${entry.limits.join("; ") || "Nenhum adicional"}`, `- **Capacidades:** ${list(entry.capabilityIds)}`, `- **Componentes:** ${list(entry.componentTypes)}`, `- **Receitas:** ${list(entry.recipeIds)}`, `- **Contratos:** ${list(entry.contracts)}`);
});
catalogLines.push("", "## Inventário completo de capacidades", "", "| ID | Valor | Governança | Motivo | Contrato |", "| --- | --- | --- | --- | --- |");
featureInventory.capabilities.forEach(item => catalogLines.push(`| \`${item.id}\` | \`${JSON.stringify(item.value)}\` | **${item.governance}** | ${markdownCell(item.governanceReason)} | \`${item.contract}\` |`));
catalogLines.push("", "## Inventário de componentes", "", "| Tipo | Categoria | Contêiner | Mínimo técnico | Recomendado |", "| --- | --- | --- | --- | --- |");
featureInventory.components.forEach(component => catalogLines.push(`| \`${component.type}\` — ${markdownCell(component.label)} | ${markdownCell(component.category)} | ${component.container ? "sim" : "não"} | ${component.minimum.width}×${component.minimum.height} | ${component.recommendedMinimum.width}×${component.recommendedMinimum.height} |`));
catalogLines.push("");
fs.writeFileSync(path.join(root, "docs", "FEATURE-CATALOG.md"), `${catalogLines.join("\n")}\n`);

function walk(directory, prefix = "") {
  const result = {};
  fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .forEach(entry => {
      const absolute = path.join(directory, entry.name);
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) Object.assign(result, walk(absolute, relative));
      else result[relative] = fs.readFileSync(absolute, "utf8");
    });
  return result;
}

const files = walk(kitRoot);
const output = `(function () {\n  "use strict";\n  window.CATALOG_AUTHORING_KIT_FILES = Object.freeze(${JSON.stringify(files, null, 2)});\n})();\n`;
fs.writeFileSync(path.join(root, "app", "authoring-kit-files.js"), output);

  console.log(`✓ CatalogAuthoringKit 1.5.8 gerado com ${Object.keys(files).length} arquivos, ${capabilities.components.length} componentes, ${capabilities.recipes.length} receitas, ${featureGuide.entries.length} fluxos curados e ${capabilityIds.size} capacidades governadas.`);
