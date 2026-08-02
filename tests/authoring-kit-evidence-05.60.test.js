/* Incremento 05.60 — kit 1.7.2 dirigido pela evidência causal do 05.59B. */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const readJSON = relative => JSON.parse(read(relative));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const metrics = readJSON("docs/evidence/05.59B/art-framing-causal/results/metrics.actual.json");
const byId = new Map(metrics.results.map(result => [result.id, result]));
const original = byId.get("original-contain");
const expanded = byId.get("neutral-expanded");
const cropped = byId.get("external-crop");
const framed = byId.get("editor-framed");
assert(metrics.conclusion.editorMatchesExternalCrop && metrics.conclusion.assetIntegrityPreserved && metrics.conclusion.screenPrintParity, "A evidência causal perdeu a conclusão aprovada.");
assert(cropped.screen.usefulPixelRatio / original.screen.usefulPixelRatio >= 1.8, "O recorte externo não sustenta o ganho incorporado ao kit.");
assert(framed.screen.usefulPixelRatio / original.screen.usefulPixelRatio >= 1.8, "O enquadramento do editor não sustenta o ganho incorporado ao kit.");
assert(Math.abs(framed.screen.usefulPixelRatio - cropped.screen.usefulPixelRatio) / cropped.screen.usefulPixelRatio <= 0.15, "O editor diverge materialmente do recorte externo.");
assert(expanded.screen.neutralBackgroundRatio > original.screen.neutralBackgroundRatio && Math.abs(expanded.screen.usefulPixelRatio - original.screen.usefulPixelRatio) <= 0.01, "A expansão neutra deixou de representar continuidade de fundo sem ganho de ocupação.");

const patterns = readJSON("authoring-kit/authoring-patterns.json");
const factual = patterns.patterns.find(pattern => pattern.id === "factual-image-presentation");
assert(factual.decisionOrder.map(item => item.step).join(",") === "instance-framing,neutral-margin-crop,neutral-background-expansion", "O kit não incorporou a ordem causal observada.");
assert(factual.occupationGuidance.kind === "contextual" && factual.derivativePolicy.perUse === true, "O kit transformou a evidência contextual em regra universal ou derivado genérico.");

const materialized = readJSON("authoring-kit-visual/examples/first-page.document.json");
const materializedText = JSON.stringify(materialized);
for (const plausibleDefault of ["NOVO PRODUTO", "PCT 100 UNID.", "R$ 0,00", '"code":"0000"']) {
  assert(!materializedText.includes(plausibleDefault), `O documento materializado ainda contém o default plausível ${plausibleDefault}.`);
}
assert(materializedText.includes("[PRODUTO") && materializedText.includes("[EMBALAGEM]"), "O exemplo materializado não preserva placeholders inválidos por construção.");

global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CatalogEditorIcon = () => "";
[
  "app/tokens.js",
  "app/catalog-source.js",
  "app/catalog-generation-plan.js",
  "app/presentation-registry.js",
  "app/catalog-icons.js",
  "app/footer-recipes.js",
  "app/layout-engine.js",
  "app/component-registry.js",
  "app/collection-registry.js",
  "app/document-store.js",
  "app/catalog-validator.js",
  "app/catalog-compiler.js"
].forEach(file => vm.runInThisContext(read(file), { filename: file }));

const source = readJSON("authoring-kit/examples/catalog-source.json");
const draft = CatalogCompiler.compile(source);
const publication = CatalogDocumentValidator.validate(draft.document, { target: "publication" });
assert(draft.ok && CatalogDocumentValidator.VERSION === "1.2.0", "O rascunho didático ou a versão do gate divergiu.");
assert(!publication.ok && publication.issues.some(issue => issue.code === "PRODUCT_CONTENT_PENDING") && publication.issues.some(issue => issue.code === "TABLE_CONTENT_PENDING") && publication.issues.some(issue => issue.code === "FOOTER_CONTENT_PENDING"), "A auditoria do documento materializado não bloqueia todas as classes de fatos pendentes.");

const guide = read("authoring-kit/GUIDE.md");
assert(/prévia paralela.*somente diagnóstico/i.test(guide) && /documento materializado/i.test(guide), "O guia não fixa a autoridade da saída importada no editor.");
console.log("✓ Authoring Kit 1.7.2 preserva a evidência 05.59B e bloqueia defaults factuais pendentes na publicação.");
