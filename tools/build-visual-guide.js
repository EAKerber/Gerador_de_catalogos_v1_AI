#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const visualRoot = path.join(root, "authoring-kit-visual");
const coreRoot = path.join(root, "authoring-kit");
const VISUAL_VERSION = "1.0.0";
const CORE_VERSION = "1.7.1";
const EDITOR_INCREMENT = "05.56";

const stableValue = value => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((result, key) => {
    if (value[key] !== undefined) result[key] = stableValue(value[key]);
    return result;
  }, {});
};
const stableJSON = value => `${JSON.stringify(stableValue(value), null, 2)}\n`;
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;"
})[character]);
const ensureParent = filePath => fs.mkdirSync(path.dirname(filePath), { recursive: true });
const write = (relative, value) => {
  const target = path.join(visualRoot, relative);
  ensureParent(target);
  fs.writeFileSync(target, value);
};

function flowSvg(title, subtitle, steps, accent = "#dc2626") {
  const width = 1200;
  const cardWidth = 252;
  const gap = 28;
  const startX = 56;
  const cards = steps.map((step, index) => {
    const row = Math.floor(index / 4);
    const column = index % 4;
    const x = startX + column * (cardWidth + gap);
    const y = 190 + row * 190;
    const number = String(index + 1).padStart(2, "0");
    const lines = Array.isArray(step) ? step : [step];
    return `<g><rect x="${x}" y="${y}" width="${cardWidth}" height="142" rx="18" fill="#ffffff" stroke="#d7dce3" stroke-width="2"/><circle cx="${x + 30}" cy="${y + 30}" r="18" fill="${accent}"/><text x="${x + 30}" y="${y + 36}" text-anchor="middle" class="number">${number}</text>${lines.map((line, lineIndex) => `<text x="${x + 24}" y="${y + 72 + lineIndex * 24}" class="step">${escape(line)}</text>`).join("")}</g>`;
  }).join("");
  const arrows = steps.slice(0, -1).map((_, index) => {
    if (index === 3) return "";
    const row = Math.floor(index / 4);
    const column = index % 4;
    const x = startX + column * (cardWidth + gap) + cardWidth;
    const y = 261 + row * 190;
    return `<path d="M ${x + 6} ${y} H ${x + gap - 7}" stroke="${accent}" stroke-width="4" marker-end="url(#arrow)"/>`;
  }).join("");
  const height = steps.length > 4 ? 600 : 410;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">${escape(title)}</title><desc id="desc">${escape(subtitle)}</desc><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${accent}"/></marker><style>.title{font:700 40px Arial,sans-serif;fill:#15191f}.subtitle{font:22px Arial,sans-serif;fill:#505865}.step{font:600 18px Arial,sans-serif;fill:#20252b}.number{font:700 14px Arial,sans-serif;fill:#fff}</style></defs><rect width="100%" height="100%" fill="#f5f7fa"/><rect x="0" y="0" width="16" height="100%" fill="${accent}"/><text x="56" y="76" class="title">${escape(title)}</text><text x="56" y="116" class="subtitle">${escape(subtitle)}</text>${arrows}${cards}</svg>`;
}

function comparisonSvg(title, columns) {
  const width = 1200;
  const columnWidth = 338;
  const cards = columns.map((column, index) => {
    const x = 58 + index * 382;
    const rows = column.rows.map((row, rowIndex) => `<g><circle cx="${x + 22}" cy="${238 + rowIndex * 44}" r="7" fill="${column.color}"/><text x="${x + 42}" y="${245 + rowIndex * 44}" class="row">${escape(row)}</text></g>`).join("");
    return `<g><rect x="${x}" y="150" width="${columnWidth}" height="330" rx="22" fill="#fff" stroke="${column.color}" stroke-width="4"/><rect x="${x}" y="150" width="${columnWidth}" height="64" rx="20" fill="${column.color}"/><rect x="${x}" y="194" width="${columnWidth}" height="20" fill="${column.color}"/><text x="${x + 24}" y="191" class="heading">${escape(column.heading)}</text>${rows}<text x="${x + 22}" y="445" class="contract">${escape(column.contract)}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="540" viewBox="0 0 ${width} 540" role="img" aria-labelledby="title"><title id="title">${escape(title)}</title><style>.title{font:700 38px Arial,sans-serif;fill:#171b21}.heading{font:700 22px Arial,sans-serif;fill:#fff}.row{font:18px Arial,sans-serif;fill:#262b31}.contract{font:600 15px monospace;fill:#555d68}</style><rect width="100%" height="100%" fill="#f5f7fa"/><text x="58" y="76" class="title">${escape(title)}</text>${cards}</svg>`;
}

function decompositionSvg(title, imagePath, regions, note) {
  const boxes = regions.map(region => `<g><rect x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}" fill="${region.color}" fill-opacity="0.16" stroke="${region.color}" stroke-width="5"/><rect x="${region.labelX}" y="${region.labelY}" width="${region.labelWidth}" height="42" rx="8" fill="${region.color}"/><text x="${region.labelX + 12}" y="${region.labelY + 28}" class="region">${escape(region.label)}</text></g>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="900" viewBox="0 0 1280 900" role="img" aria-labelledby="title desc"><title id="title">${escape(title)}</title><desc id="desc">${escape(note)}</desc><style>.title{font:700 34px Arial,sans-serif;fill:#171b21}.note{font:18px Arial,sans-serif;fill:#505865}.region{font:700 16px Arial,sans-serif;fill:#fff}</style><rect width="100%" height="100%" fill="#f5f7fa"/><text x="540" y="62" class="title">${escape(title)}</text><text x="540" y="96" class="note">${escape(note)}</text><image href="${escape(imagePath)}" x="28" y="28" width="480" height="720" preserveAspectRatio="xMidYMid meet"/><g transform="translate(28 28) scale(.46875)">${boxes}</g><g transform="translate(540 150)"><rect width="680" height="520" rx="22" fill="#fff" stroke="#d7dce3" stroke-width="2"/><text x="30" y="52" class="title">Leitura de capacidade</text>${regions.map((region, index) => `<rect x="30" y="${88 + index * 86}" width="22" height="22" rx="4" fill="${region.color}"/><text x="70" y="${106 + index * 86}" class="note">${escape(region.legend)}</text>`).join("")}</g></svg>`;
}

function mimeFor(relative) {
  if (relative.endsWith(".json")) return "application/json";
  if (relative.endsWith(".md")) return "text/markdown";
  if (relative.endsWith(".svg")) return "image/svg+xml";
  if (relative.endsWith(".png")) return "image/png";
  if (/\.jpe?g$/i.test(relative)) return "image/jpeg";
  return "application/octet-stream";
}

function roleFor(relative) {
  if (relative === "START-HERE.md") return "entrypoint";
  if (relative === "visual-index.json") return "index";
  if (relative.startsWith("interface/")) return "interface-reference";
  if (relative.startsWith("tutorials/")) return "tutorial";
  if (relative.startsWith("cookbook/")) return "cookbook";
  if (relative.startsWith("case-studies/")) return "case-study";
  if (relative.startsWith("troubleshooting/")) return "troubleshooting";
  if (relative.startsWith("examples/")) return "executable-example";
  if (relative.startsWith("schemas/")) return "schema";
  return "support";
}

function walk(directory, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap(entry => {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (["manifest.json"].includes(relative)) return [];
      const absolute = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(absolute, relative) : [relative];
    });
}

function assertVisualIndex(index) {
  if (index.indexFormat !== "CatalogAuthoringVisualIndex" || index.indexVersion !== "1.0.0") throw new Error("visual-index.json possui formato inválido.");
  const ids = new Set();
  const declaredPaths = new Set(walk(visualRoot));
  for (const entry of index.entries || []) {
    if (!entry.id || ids.has(entry.id)) throw new Error(`Entrada visual duplicada ou sem ID: ${entry.id || "?"}.`);
    ids.add(entry.id);
    for (const relative of [entry.guidePath, entry.previewPath, ...(entry.artifactPaths || [])].filter(Boolean)) {
      if (relative.startsWith("../")) {
        const coreRelative = relative.slice(3);
        if (coreRelative.startsWith("../") || !fs.existsSync(path.join(coreRoot, coreRelative))) throw new Error(`Entrada ${entry.id} aponta para arquivo ausente no núcleo: ${relative}.`);
        continue;
      }
      if (!declaredPaths.has(relative)) throw new Error(`Entrada ${entry.id} aponta para arquivo ausente: ${relative}.`);
    }
  }
  if (ids.size < 16) throw new Error("O índice visual não cobre os tutoriais, cookbooks e estudos aprovados.");
}

function generate() {
  fs.mkdirSync(visualRoot, { recursive: true });

  const copies = [
    ["docs/reference/catalogo-base.jpeg", "case-studies/catalogo-tecnico/reference.jpeg"],
    ["docs/reference/promocional-base.jpeg", "case-studies/promocional/reference.jpeg"]
  ];
  for (const [source, target] of copies) {
    const sourcePath = path.join(root, source);
    if (!fs.existsSync(sourcePath)) throw new Error(`Referência visual ausente: ${source}.`);
    const targetPath = path.join(visualRoot, target);
    ensureParent(targetPath);
    fs.copyFileSync(sourcePath, targetPath);
  }

  const screenshotPath = path.join(visualRoot, "interface/editor-reference.png");
  if (!fs.existsSync(screenshotPath)) fs.copyFileSync(path.join(root, "docs/evidence/05.17/reference-manual.editor.png"), screenshotPath);
  const canvasPath = path.join(visualRoot, "tutorials/01-first-page/reference-canvas-05.17.png");
  if (!fs.existsSync(canvasPath)) fs.copyFileSync(path.join(root, "docs/evidence/05.17/reference-manual.canvas.png"), canvasPath);

  write("interface/editor-map.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="930" viewBox="0 0 1800 930" role="img" aria-labelledby="title desc"><title id="title">Mapa anotado da interface do Catálogo V1</title><desc id="desc">Captura real 05.17 da interface com as superfícies principais numeradas e contratos verificados no 05.55.</desc><defs><marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto"><path d="M0,0 L0,8 L11,4 z" fill="#dc2626"/></marker><style>.title{font:700 34px Arial,sans-serif;fill:#171b21}.label{font:700 20px Arial,sans-serif;fill:#fff}.note{font:18px Arial,sans-serif;fill:#343a42}.line{stroke:#dc2626;stroke-width:5;fill:none;marker-end:url(#arrow)}</style></defs><rect width="100%" height="100%" fill="#f5f7fa"/><text x="50" y="55" class="title">Mapa da interface — captura 05.17 + contratos verificados no 05.55</text><image href="editor-reference.png" x="50" y="90" width="1093" height="614" preserveAspectRatio="xMidYMid meet"/><g><path class="line" d="M 1220 160 L 1045 180"/><circle cx="1260" cy="150" r="27" fill="#dc2626"/><text x="1260" y="157" text-anchor="middle" class="label">1</text><text x="1300" y="157" class="note">Toolbar, importação e exportação</text><path class="line" d="M 1220 260 L 190 320"/><circle cx="1260" cy="250" r="27" fill="#dc2626"/><text x="1260" y="257" text-anchor="middle" class="label">2</text><text x="1300" y="257" class="note">Biblioteca, produtos e camadas</text><path class="line" d="M 1220 360 L 720 390"/><circle cx="1260" cy="350" r="27" fill="#dc2626"/><text x="1260" y="357" text-anchor="middle" class="label">3</text><text x="1300" y="357" class="note">Canvas A4 e contexto atual</text><path class="line" d="M 1220 460 L 1035 400"/><circle cx="1260" cy="450" r="27" fill="#dc2626"/><text x="1260" y="457" text-anchor="middle" class="label">4</text><text x="1300" y="457" class="note">Inspetor: Conteúdo, Layout, Visual</text><path class="line" d="M 1220 560 L 735 690"/><circle cx="1260" cy="550" r="27" fill="#dc2626"/><text x="1260" y="557" text-anchor="middle" class="label">5</text><text x="1300" y="557" class="note">Status, atalhos e diagnóstico</text></g><rect x="50" y="750" width="1690" height="130" rx="18" fill="#fff" stroke="#d7dce3" stroke-width="2"/><text x="80" y="796" class="note">A captura é material tutorial, não golden image. Use os nomes de controles e caminhos JSON do tutorial como contrato;</text><text x="80" y="832" class="note">use a imagem para orientação espacial. Viewport: 1366×768 · origem: evidência real 05.17.</text></svg>`);

  const tutorials = [
    ["01-first-page", "De dados a uma página importável", "Fluxo preferencial e determinístico", [["Leia o START-HERE", "e os fatos"], ["Preencha", "CatalogSource"], ["Compile e valide", "Document + report"], ["Importe no editor", "e revise"], ["Exporte pacote", "e PDF sem guias"]]],
    ["02-factual-assets", "Imagem factual sem deformação", "Preservar produto, ampliar apenas o canvas neutro", [["Selecione a arte", "ou placeholder"], ["Escolha asset real", "biblioteca ou arquivo"], ["Use fit = contain", "sem recorte"], ["Se faltar respiro", "neutral-canvas-padding"], ["Recalcule hash", "e proveniência"]]],
    ["03-product-arrangement", "Modo editorial versus arranjo", "Semântica e geometria são decisões independentes", [["Escolha o modo", "hero / technical / variants"], ["Avalie a região", "arte + informação"], ["Defina arrangement", "auto / horizontal / stacked"], ["Valide mínimos", "clipping e leitura"]]],
    ["04-table-columns", "Tabela comercial completa", "Editar projeção sem destruir a identidade semântica", [["Adicione ou cole", "linhas comerciais"], ["Renomeie label", "preserve key"], ["Reordene colunas", "sem trocar valores"], ["Oculte visible=false", "sem apagar conteúdo"], ["Valide última coluna", "sempre visível"]]],
    ["05-variants-legends", "Variações e legendas vinculadas", "Identidade explícita entre imagem, linha e classificação", [["Crie variants[]", "com IDs estáveis"], ["Vincule linhas", "commercialRowIds"], ["Adicione imagens", "com legenda individual"], ["Use legendKey", "em vez de posição"], ["Materialize painel", "somente se útil"]]],
    ["06-footer-span", "Rodapé com ocupação ponderada", "Um item pode ocupar duas posições sem duplicar conteúdo", [["Selecione footer-item", "no slot items"], ["Defina slot.span=2", "no primeiro item"], ["Mantenha span=1", "nos demais"], ["Aplique text.scale=80", "aos textos internos"], ["Reajuste e valide", "capacidade do pai"]]],
    ["07-delivery-gates", "Gate de entrega", "Distinguir ações de interface de correções reais", [["Compile a fonte", "e leia issues"], ["Resolva clipping", "colisão e referências"], ["Importe e revise", "3 ações não são erros"], ["Exporte rascunho", "ou publicação"], ["Gere PDF", "sem chrome do editor"]]]
  ];
  tutorials.forEach(([id, title, subtitle, steps]) => write(`tutorials/${id}/walkthrough.svg`, flowSvg(title, subtitle, steps)));

  write("cookbook/product-arrangements.svg", comparisonSvg("Cookbook — modo editorial e arranjo", [
    { heading: "hero + horizontal", color: "#b91c1c", rows: ["arte em destaque", "informação ao lado", "card amplo"], contract: "mode=hero · arrangement=horizontal" },
    { heading: "technical + stacked", color: "#1d4ed8", rows: ["arte acima", "especificações abaixo", "densidade técnica"], contract: "mode=technical · arrangement=stacked" },
    { heading: "variants + auto", color: "#7c3aed", rows: ["galeria priorizada", "legendas vinculadas", "auto empilha"], contract: "mode=variants · arrangement=auto" }
  ]));
  write("cookbook/semantic-pieces.svg", comparisonSvg("Cookbook — specification, fact ou legenda", [
    { heading: "specification", color: "#b91c1c", rows: ["atributo curto", "ligado ao produto", "normalmente com ícone"], contract: "component.type=specification" },
    { heading: "fact", color: "#1d4ed8", rows: ["rótulo + valor + unidade", "dado autônomo", "ex.: carga 40 kg"], contract: "recipeId=fact" },
    { heading: "legend-item", color: "#047857", rows: ["classificação compartilhada", "resolvida por legendKey", "não por posição"], contract: "component.type=legend-item" }
  ]));
  write("cookbook/table-columns.svg", comparisonSvg("Cookbook — identidade e apresentação de colunas", [
    { heading: "key", color: "#334155", rows: ["binding estável", "identidade da célula", "não renomear por estética"], contract: "columns[].key" },
    { heading: "label + ordem", color: "#b91c1c", rows: ["texto do cabeçalho", "ordem no array", "mudança editorial segura"], contract: "columns[].label" },
    { heading: "visible", color: "#047857", rows: ["false oculta projeção", "dados continuam presentes", "uma coluna sempre visível"], contract: "columns[].visible" }
  ]));
  write("cookbook/footer-span.svg", comparisonSvg("Cookbook — span e escala interna do rodapé", [
    { heading: "primeiro item", color: "#b91c1c", rows: ["ocupa duas posições", "um único conteúdo", "maior área útil"], contract: "slot.span = 2" },
    { heading: "demais itens", color: "#1d4ed8", rows: ["uma posição cada", "capacidade preservada", "ordem independente"], contract: "slot.span = 1" },
    { heading: "texto interno", color: "#047857", rows: ["hierarquia mais discreta", "frame externo igual", "legibilidade validada"], contract: "text.props.scale = 80" }
  ]));
  write("cookbook/factual-image-fit.svg", comparisonSvg("Cookbook — imagem factual", [
    { heading: "incorreto: stretch", color: "#b91c1c", rows: ["produto deformado", "proporção perdida", "fato visual alterado"], contract: "não usar" },
    { heading: "incorreto: cover", color: "#d97706", rows: ["produto recortado", "detalhe pode sumir", "fidelidade quebrada"], contract: "evitar para produto factual" },
    { heading: "correto: contain", color: "#047857", rows: ["proporção preservada", "canvas neutro opcional", "novo hash derivado"], contract: "fit=contain" }
  ]));

  write("case-studies/catalogo-tecnico/decomposition.svg", decompositionSvg("Estudo de caso — catálogo técnico", "reference.jpeg", [
    { x: 16, y: 22, width: 980, height: 192, labelX: 28, labelY: 32, labelWidth: 250, label: "DIRETA · cabeçalho", color: "#047857", legend: "Direta — header, título, aplicações e desenho técnico." },
    { x: 20, y: 220, width: 970, height: 292, labelX: 34, labelY: 232, labelWidth: 300, label: "COMPOSIÇÃO · hero", color: "#1d4ed8", legend: "Composição — product-card hero, specifications e tabela." },
    { x: 20, y: 520, width: 970, height: 820, labelX: 34, labelY: 532, labelWidth: 310, label: "DIRETA · grade/cards", color: "#047857", legend: "Direta — grade 3×2, variantes, tabelas e aplicações." },
    { x: 20, y: 1348, width: 970, height: 172, labelX: 34, labelY: 1360, labelWidth: 330, label: "COMPOSIÇÃO · rodapé", color: "#1d4ed8", legend: "Composição — painel de legendas, callout e footer com spans." }
  ], "Referência forte da V1; ensaio cego final deve usar uma terceira referência inédita."));
  write("case-studies/promocional/decomposition.svg", decompositionSvg("Estudo de caso — peça promocional", "reference.jpeg", [
    { x: 0, y: 0, width: 1024, height: 430, labelX: 20, labelY: 20, labelWidth: 370, label: "APROXIMAÇÃO · campanha", color: "#d97706", legend: "Aproximação — títulos publicitários e faixa de período." },
    { x: 0, y: 430, width: 1024, height: 600, labelX: 20, labelY: 442, labelWidth: 390, label: "FORA DA V1 · composição livre", color: "#b91c1c", legend: "Fora da V1 — personagem recortado e sobreposições livres." },
    { x: 20, y: 1010, width: 760, height: 330, labelX: 34, labelY: 1022, labelWidth: 360, label: "DIRETA · ofertas repetidas", color: "#047857", legend: "Direta — quatro commerce-offer-unit e price blocks." },
    { x: 20, y: 1340, width: 980, height: 180, labelX: 34, labelY: 1352, labelWidth: 350, label: "DIRETA · benefícios/footer", color: "#047857", legend: "Direta — facts, benefícios, callouts e rodapé." }
  ], "Benchmark pós-V1 não bloqueante; mede compatibilidade de categoria, não pixels."));

  write("troubleshooting/gates.svg", flowSvg("Troubleshooting — do erro ao gate verde", "Toda falha deve apontar para um contrato e uma correção verificável", [["Leia code + severity", "em issues[]"], ["Localize componentId", "assetId ou path"], ["Corrija o fato", "vínculo ou geometria"], ["Recompile e valide", "zero bloqueadores"], ["Revise no editor", "e exporte novamente"]], "#b91c1c"));

  const exampleOutput = path.join(visualRoot, "examples/first-page.document.json");
  const exampleReport = path.join(visualRoot, "examples/first-page.report.json");
  const compile = spawnSync(process.execPath, [
    path.join(coreRoot, "compiler/compile-catalog.js"),
    "--source", path.join(coreRoot, "examples/reference-catalog-source.json"),
    "--plan", path.join(coreRoot, "examples/catalog-generation-plan.json"),
    "--output", exampleOutput,
    "--report", exampleReport
  ], { encoding: "utf8", timeout: 30000 });
  if (compile.status !== 0) throw new Error(`O exemplo visual executável não compilou: ${compile.stderr || compile.stdout}`);

  const indexPath = path.join(visualRoot, "visual-index.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  assertVisualIndex(index);

  const files = walk(visualRoot).map(relative => {
    const bytes = fs.readFileSync(path.join(visualRoot, relative));
    return { path: relative, role: roleFor(relative), mimeType: mimeFor(relative), size: bytes.byteLength, sha256: sha256(bytes) };
  });
  const manifest = {
    guideFormat: "CatalogAuthoringVisualGuide",
    guideVersion: VISUAL_VERSION,
    editorIncrement: EDITOR_INCREMENT,
    coreKit: { format: "CatalogAuthoringKit", version: CORE_VERSION, relativeRoot: ".." },
    entrypoint: "START-HERE.md",
    index: "visual-index.json",
    policy: {
      embeddedInCatalogPackages: false,
      includedInStandaloneAuthoringKitExport: true,
      imagesAreGoldenBaselines: false,
      blindTrialReference: "third-unseen-reference"
    },
    files
  };
  const manifestBytes = Buffer.from(stableJSON(manifest));
  fs.writeFileSync(path.join(visualRoot, "manifest.json"), manifestBytes);

  const coreManifestPath = path.join(coreRoot, "manifest.json");
  const coreManifest = JSON.parse(fs.readFileSync(coreManifestPath, "utf8"));
  coreManifest.kitVersion = CORE_VERSION;
  coreManifest.editorIncrement = EDITOR_INCREMENT;
  coreManifest.visualCompanion = {
    format: manifest.guideFormat,
    version: VISUAL_VERSION,
    root: "visual-guide",
    manifestPath: "visual-guide/manifest.json",
    manifestSha256: sha256(manifestBytes),
    distribution: "standalone-kit-only",
    requiredForCompilation: false
  };
  fs.writeFileSync(coreManifestPath, stableJSON(coreManifest));

  return { manifest, manifestSha256: coreManifest.visualCompanion.manifestSha256, fileCount: files.length };
}

if (require.main === module) {
  const result = generate();
  console.log(`✓ CatalogAuthoringVisualGuide ${VISUAL_VERSION} gerado com ${result.fileCount} arquivos e manifesto ${result.manifestSha256.slice(0, 12)}.`);
}

module.exports = { generate, VISUAL_VERSION, CORE_VERSION, EDITOR_INCREMENT };
