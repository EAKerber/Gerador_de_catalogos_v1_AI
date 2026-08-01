/* Incremento 05.56 — contrato estático do gate tipográfico e da política factual de imagens. */
"use strict";

const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const fixture = JSON.parse(read("tests/fixtures/text-integrity-blind-test-05.56.json"));
const auditor = read("app/visual-text-integrity.js");
const packageSource = read("app/project-package.js");
const index = read("index.html");
const guide = read("authoring-kit/GUIDE.md");
const patterns = JSON.parse(read("authoring-kit/authoring-patterns.json"));

assert(fixture.cases.length === 10 && new Set(fixture.cases.map(item => item.componentId)).size === 10, "A fixture não preserva exatamente os dez truncamentos distintos do ensaio.");
["TEXT_ELLIPSIS_APPLIED", "TEXT_CONTENT_CLIPPED", "TEXT_TEXT_COLLISION", "TEXT_OBJECT_COLLISION", "TEXT_BELOW_MINIMUM"].forEach(code => assert(auditor.includes(code), `Diagnóstico ${code} ausente.`));
assert(packageSource.includes("renderedTextIntegrityGate: true") && packageSource.includes("gate.visualIntegrity"), "O pacote não declara nem exporta o gate renderizado.");
assert(index.includes('src="app/visual-text-integrity.js"') && index.indexOf('src="app/visual-text-integrity.js"') < index.indexOf('src="app/project-package.js"'), "O auditor não carrega antes do empacotador.");
assert(guide.includes("Edições não imaginativas") && guide.includes("expansão de fundo uniforme") && guide.includes("não inventem partes"), "O guia não formaliza a edição factual autorizada.");
const imagePattern = patterns.patterns.find(pattern => pattern.id === "factual-image-presentation");
assert(imagePattern && imagePattern.allowedMethods.includes("neutral-background-expansion") && imagePattern.rules.some(rule => rule.includes("reversível")), "O padrão factual de imagem não é determinístico ou rastreável.");

console.log("✓ Gate textual 05.56 e política factual de imagens permanecem contratados.");
