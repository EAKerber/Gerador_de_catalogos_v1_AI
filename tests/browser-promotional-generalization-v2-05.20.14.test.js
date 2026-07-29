/* DB-05.20.14 — benchmark V2 derivado do fluxo promocional original. */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(__dirname, "browser-promotional-generalization-05.20.test.js");
const generatedPath = path.join(__dirname, ".generated-browser-promotional-generalization-v2-05.20.14.test.js");
const outputDir = path.resolve(process.env.CATALOG_GENERALIZATION_OUTPUT_DIR || "/tmp/catalog-generalization-v2-05.20.14");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function replaceOnce(source, oldValue, newValue, label) {
  const count = source.split(oldValue).length - 1;
  if (count !== 1) throw new Error(`${label}: esperado um alvo, encontrados ${count}.`);
  return source.replace(oldValue, newValue);
}

function replaceRange(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`${label}: marcadores não encontrados.`);
  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

let source = fs.readFileSync(sourcePath, "utf8");
source = replaceOnce(source,
  'suite: "Developer B 05.20 — promotional generalization benchmark",',
  'suite: "Developer B 05.20.14 — promotional generalization benchmark V2",',
  "identidade do benchmark"
);
source = replaceOnce(source,
  'constructionPolicy: "Criação e edição por controles da interface; store usada somente para leitura e métricas.",',
  'constructionPolicy: "Criação e edição por controles da interface; núcleo comercial usa quatro receitas commerce-offer-unit independentes.",',
  "política do benchmark"
);
source = replaceOnce(source,
  'await page.waitForFunction(() => window.CatalogEditor && window.CatalogSectionRecipes?.get?.("fact") && window.CatalogSectionRecipes?.get?.("section-tip-callout"));',
  'await page.waitForFunction(() => window.CatalogEditor && window.CatalogSectionRecipes?.get?.("fact") && window.CatalogSectionRecipes?.get?.("section-tip-callout") && window.CatalogSectionRecipes?.get?.("commerce-offer-unit"));',
  "prontidão inicial"
);
source = replaceOnce(source,
  'await page.waitForFunction(() => window.CatalogEditor && window.CatalogSectionRecipes?.get?.("fact"));',
  'await page.waitForFunction(() => window.CatalogEditor && window.CatalogSectionRecipes?.get?.("fact") && window.CatalogSectionRecipes?.get?.("commerce-offer-unit"));',
  "prontidão após reload"
);
source = replaceOnce(source,
  '  await selectComponent(roles.icon);\n  await setProp("icon", values.icon);\n',
  '',
  "ícones secundários dos fatos"
);
source = replaceOnce(source,
  '  await setStyle("textColor", "text.strong");\n',
  '',
  "cor já correspondente ao padrão"
);
source = replaceOnce(source,
  '  const materialFactId = await insertFromPalette("recipe", "fact", { x: 24, y: 420, width: 210, height: 170 });',
  '  const materialFactId = await insertFromPalette("recipe", "fact", { x: 250, y: 205, width: 160, height: 170 });',
  "posição do fato material"
);
source = replaceOnce(source,
  '  const capacityFactId = await insertFromPalette("recipe", "fact", { x: 24, y: 595, width: 210, height: 170 });',
  '  const capacityFactId = await insertFromPalette("recipe", "fact", { x: 420, y: 205, width: 160, height: 170 });',
  "posição do fato capacidade"
);
source = replaceOnce(source,
  '  const headingId = await insertFromPalette("recipe", "section-heading", { x: 250, y: 24, width: 500, height: 170 });',
  '  const headingId = await insertFromPalette("recipe", "section-heading", { x: 250, y: 24, width: 320, height: 170 });',
  "largura do título promocional"
);
source = replaceOnce(source,
  '    support: "OFERTA VÁLIDA SOMENTE DE 20/05 A 25/05"',
  '    support: "📅 OFERTA VÁLIDA · 20/05 A 25/05"',
  "calendário da promoção"
);
source = replaceOnce(source,
  '    if (role === "title") await setProp("scale", 120);',
  `    if (role === "kicker") {
      await setStyle("typography", "type.promo-title");
      await setStyle("surface", "surface.promo-primary");
      await setStyle("textColor", "promo.on-primary");
    }
    if (role === "title") {
      await setProp("scale", 120);
      await setStyle("typography", "type.promo-title");
      await setStyle("surface", "surface.promo-secondary");
      await setStyle("textColor", "promo.on-secondary");
    }
    if (role === "support") {
      await setProp("scale", 120);
      await setStyle("typography", "type.promo-meta");
    }`,
  "hierarquia do título promocional"
);
source = replaceOnce(source,
  '  await editSectionHeading(headingId);',
  `  await editSectionHeading(headingId);

  const characterArtId = await insertFromPalette("component", "art", { x: 580, y: 24, width: 190, height: 170 });
  await setProp("label", "PERSONAGEM DA PROMOÇÃO");
  await setProp("hint", "Apresentador da oferta semanal");
  await setProp("role", "generic");
  await setProp("fit", "contain");`,
  "personagem promocional"
);
source = replaceOnce(source,
  '  const heroTitleId = await insertFromPalette("component", "text", { x: 24, y: 200, width: 210, height: 105 });',
  '  const heroTitleId = await insertFromPalette("component", "text", { x: 24, y: 200, width: 210, height: 85 });',
  "compactação do título lateral"
);
source = replaceOnce(source,
  '  const heroSupportId = await insertFromPalette("component", "text", { x: 24, y: 315, width: 210, height: 90 });',
  '  const heroSupportId = await insertFromPalette("component", "text", { x: 24, y: 295, width: 210, height: 90 });',
  "compactação do apoio lateral"
);

const offerHelpers = `async function recursiveRoleMap(rootId) {
  return page.evaluate(componentId => {
    const root = CatalogEditor.store.findComponent(componentId)?.component;
    const all = [];
    const visit = component => { all.push(component); (component.children || []).forEach(visit); };
    if (root) visit(root);
    return Object.fromEntries(all.filter(component => component.props?.recipeRole).map(component => [component.props.recipeRole, component.id]));
  }, rootId);
}

async function editOfferUnit(rootId, values) {
  const roles = await recursiveRoleMap(rootId);
  for (const [role, content] of [["code", values.code], ["measure", values.measure], ["amount", values.amount]]) {
    await selectComponent(roles[role]);
    await setProp("content", content);
  }
  await exitAllContexts();
  return roles;
}

async function duplicateOfferUnits(firstId) {
  await selectComponent(firstId);
  await activateTab("structure");
  await changeControl("[data-duplicate-direction]", "right", "Duplicar ofertas para a direita");
  await changeControl("[data-duplicate-mode]", "gap", "Usar gap entre ofertas");
  await changeControl("[data-duplicate-distance]", 7, "Definir gap comercial de 7px");
  await changeControl("[data-duplicate-count]", 3, "Criar três ofertas adicionais");
  const before = await page.evaluate(() => CatalogEditor.store.getPage().children.filter(component => component.props?.recipeRole === "offer-unit").length);
  await act("Duplicar quatro unidades comerciais", () => page.locator("[data-duplicate-series]").click());
  await page.waitForFunction(count => CatalogEditor.store.getPage().children.filter(component => component.props?.recipeRole === "offer-unit").length === count + 3, before, { timeout: 3000 });
  return page.evaluate(() => CatalogEditor.store.getPage().children
    .filter(component => component.props?.recipeRole === "offer-unit")
    .sort((left, right) => left.frame.x - right.frame.x)
    .map(component => component.id));
}

`;
source = replaceRange(source, "async function editProductCard(cardId) {", "async function editCallout(rootId) {", offerHelpers, "helpers comerciais");

const offerConstruction = `  const firstOfferId = await insertFromPalette("recipe", "commerce-offer-unit", { x: 24, y: 393, width: 180, height: 526 });
  const offerIds = await duplicateOfferUnits(firstOfferId);
  const offerValues = [
    { code: "CÓD. 1123", measure: "100mm", amount: "3,99" },
    { code: "CÓD. 1146", measure: "130mm", amount: "4,99" },
    { code: "CÓD. 1147", measure: "150mm", amount: "5,99" },
    { code: "CÓD. 1148", measure: "200mm", amount: "6,90" }
  ];
  const offerParts = [await recursiveRoleMap(offerIds[0])];
  for (let index = 1; index < offerIds.length; index += 1) offerParts.push(await editOfferUnit(offerIds[index], offerValues[index]));

`;
source = replaceRange(source, "  const productCardId = await insertFromPalette", "  const calloutId = await insertFromPalette", offerConstruction, "núcleo comercial");
source = replaceOnce(source,
  '  const calloutId = await insertFromPalette("recipe", "section-tip-callout", { x: 590, y: 720, width: 180, height: 160 });',
  '  const calloutId = await insertFromPalette("recipe", "section-tip-callout", { x: 590, y: 205, width: 180, height: 170 });',
  "posição do callout"
);
source = replaceOnce(source,
  '  const firstFeatureId = await insertFromPalette("component", "icon", { x: 24, y: 890, width: 160, height: 80 });',
  '  const firstFeatureId = await insertFromPalette("component", "icon", { x: 24, y: 949, width: 160, height: 70 });',
  "faixa de benefícios"
);
source = replaceOnce(source,
  '  await selectComponent(technicalArtId);\n  await setProp("caption", "Medidas técnicas em milímetros");\n  await exitAllContexts();',
  '  const terminalOfferRoles = await recursiveRoleMap(offerIds[3]);\n  await selectComponent(terminalOfferRoles.amount);\n  await setProp("content", "6,99");\n  await exitAllContexts();',
  "terceira edição de histórico"
);
source = replaceOnce(source,
  '    const table = components.find(component => component.type === "data-table");',
  '    const table = components.find(component => component.type === "data-table");\n    const offerUnits = components.filter(component => component.props?.recipeRole === "offer-unit");\n    const priceContainers = components.filter(component => component.props?.recipeRole === "price-block");',
  "métricas comerciais"
);
source = replaceOnce(source,
  '      tableRows: table ? CatalogEditor.store.getTableRows(table).length : 0,',
  '      tableRows: table ? CatalogEditor.store.getTableRows(table).length : 0,\n      offerUnits: offerUnits.length,\n      priceContainers: priceContainers.length,\n      primaryOfferPresentation: offerUnits.length >= 4 ? "independent-repeated-offers" : "insufficient-independent-offers",',
  "saída das métricas"
);
source = replaceOnce(source,
  '  if (metrics.tableRows !== 4) blockers.push({ code: "OFFER_ROWS", message: `A tabela promocional terminou com ${metrics.tableRows} linhas.` });',
  '  if (metrics.offerUnits !== 4) blockers.push({ code: "OFFER_UNITS", message: `A promoção terminou com ${metrics.offerUnits} ofertas independentes.` });\n  if (metrics.priceContainers !== 4) blockers.push({ code: "PRICE_CONTAINERS", message: `A promoção terminou com ${metrics.priceContainers} blocos de preço.` });\n  if (metrics.tableRows !== 0) blockers.push({ code: "TABULAR_FALLBACK", message: `A promoção V2 ainda contém ${metrics.tableRows} linhas tabulares.` });',
  "gates comerciais"
);
source = replaceOnce(source,
  '  if (optionalProducts.length !== 1 || optionalAssets.length !== metrics.placeholderArts) blockers.push({ code: "OPTIONAL_REFERENCE_CLASSIFICATION", expected: { products: 1, assets: metrics.placeholderArts }, observed: { products: optionalProducts.length, assets: optionalAssets.length }, items: metrics.references?.optional || [] });',
  '  if (optionalProducts.length !== 0 || optionalAssets.length !== metrics.placeholderArts) blockers.push({ code: "OPTIONAL_REFERENCE_CLASSIFICATION", expected: { products: 0, assets: metrics.placeholderArts }, observed: { products: optionalProducts.length, assets: optionalAssets.length }, items: metrics.references?.optional || [] });',
  "referências opcionais"
);
source = replaceOnce(source,
  '    { target: "Variações e quatro preços", representation: "product-card variants + data-table", status: "represented", componentId: productCardId, tableId: productParts.tableId },\n    { target: "Imagem principal do produto", representation: "art interna", status: "represented-with-placeholder", componentId: productParts.artId },\n    { target: "Desenho técnico", representation: "art role=technical", status: "represented-with-placeholder", componentId: technicalArtId },',
  '    { target: "Variações e quatro preços", representation: "quatro commerce-offer-unit independentes", status: "represented", componentIds: offerIds },\n    { target: "Imagens das quatro ofertas", representation: "art interna por unidade", status: "represented-with-placeholder", componentIds: offerParts.map(parts => parts.media) },\n    { target: "Desenho técnico", representation: "adiado para benchmark com assets reais", status: "deferred-to-assets" },',
  "cobertura comercial"
);

for (const forbidden of ["editProductCard", "productCardId", "productParts", "technicalArtId"]) {
  assert(!source.includes(forbidden), `Transformação V2 deixou referência obsoleta: ${forbidden}.`);
}

fs.writeFileSync(generatedPath, source);
fs.mkdirSync(outputDir, { recursive: true });
let result;
try {
  result = spawnSync(process.execPath, [generatedPath], {
    cwd: root,
    env: { ...process.env, CATALOG_GENERALIZATION_OUTPUT_DIR: outputDir },
    encoding: "utf8",
    stdio: "inherit"
  });
} finally {
  try { fs.unlinkSync(generatedPath); } catch {}
}
assert(result.status === 0, `Benchmark V2 falhou com status ${result.status}.`);
const report = JSON.parse(fs.readFileSync(path.join(outputDir, "promotional-generalization-report.json"), "utf8"));
assert(["pass", "pass-with-findings"].includes(report.status), `Status técnico inesperado: ${report.status}.`);
assert(report.actionCount <= 215, `Benchmark V2 excedeu 215 ações: ${report.actionCount}.`);
assert(report.metrics.offerUnits === 4, `Benchmark V2 não possui quatro ofertas: ${report.metrics.offerUnits}.`);
assert(report.metrics.priceContainers === 4, `Benchmark V2 não possui quatro preços: ${report.metrics.priceContainers}.`);
assert(report.metrics.tableRows === 0, "Benchmark V2 voltou à representação tabular.");
assert(report.metrics.primaryOfferPresentation === "independent-repeated-offers", "Apresentação comercial incorreta.");

console.log(`✓ DB-05.20.14 concluiu benchmark V2 com ${report.actionCount} ações, quatro ofertas e quatro preços independentes.`);
