#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function argumentsMap(values) {
  const result = {};
  for (let index = 2; index < values.length; index += 2) {
    const name = values[index];
    const value = values[index + 1];
    if (!name?.startsWith("--") || !value) throw new Error(`Argumento inválido: ${name || "ausente"}.`);
    result[name.slice(2)] = value;
  }
  return result;
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
}

const args = argumentsMap(process.argv);
if (!args.source || !args.output) {
  console.error("Uso: node compile-catalog.js --source catalog-source.json [--plan catalog-generation-plan.json] --output catalog.json [--report report.json]");
  process.exit(2);
}

global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
const runtimeRoot = path.resolve(__dirname, "..", "runtime");
[
  "tokens.js",
  "catalog-source.js",
  "catalog-generation-plan.js",
  "presentation-registry.js",
  "catalog-icons.js",
  "layout-engine.js",
  "component-registry.js",
  "collection-registry.js",
  "document-store.js",
  "text-alignment-contract.js",
  "text-scale-contract.js",
  "text-overflow-contract.js",
  "footer-item-containment-contract.js",
  "icon-scale-contract.js",
  "product-hero-contract.js",
  "product-technical-contract.js",
  "product-variants-contract.js",
  "product-data-only-contract.js",
  "catalog-validator.js",
  "catalog-compiler.js"
].forEach(fileName => vm.runInThisContext(fs.readFileSync(path.join(runtimeRoot, fileName), "utf8"), { filename: fileName }));

CatalogTextAlignmentContract.install();
CatalogTextScaleContract.install();
CatalogTextOverflowContract.install();
CatalogFooterItemContainmentContract.install();
CatalogIconScaleContract.install();
CatalogProductHeroContract.install();
CatalogProductTechnicalContract.install();
CatalogProductVariantsContract.install();
CatalogProductDataOnlyContract.install();

const source = readJSON(args.source);
const plan = args.plan ? readJSON(args.plan) : null;
const result = CatalogCompiler.compile(source, plan);
const reportPath = path.resolve(args.report || `${args.output}.report.json`);
fs.writeFileSync(reportPath, `${JSON.stringify({
  ok: result.ok,
  compilerVersion: result.compilerVersion,
  sourceVersion: result.sourceVersion,
  targetVersion: result.targetVersion,
  summary: result.summary,
  decisions: result.decisions || [],
  repairs: result.repairs || [],
  issues: result.issues || []
}, null, 2)}\n`);

if (!result.ok) {
  console.error(`Compilação bloqueada. Consulte ${reportPath}.`);
  process.exit(1);
}

const outputPath = path.resolve(args.output);
fs.writeFileSync(outputPath, `${JSON.stringify(result.document, null, 2)}\n`);
console.log(`✓ ${result.summary.products} produto(s), ${result.summary.components} componente(s), ${result.summary.collisions} colisão(ões); documento salvo em ${outputPath}.`);
