"use strict";

const fs = require("fs");
const assert = require("assert");

const renderer = fs.readFileSync("app/renderer.js", "utf8");
const styles = fs.readFileSync("styles/editor.css", "utf8");
const increment = fs.readFileSync("docs/INCREMENT-05.21.md", "utf8");

assert(renderer.includes("collapsedLayerIds = new Set()"), "O recolhimento de Camadas não permaneceu efêmero no renderer.");
assert(renderer.includes("data-toggle-layer=") && renderer.includes('aria-expanded="${String(!isCollapsed)}"'), "A árvore não expõe um controle de recolhimento acessível.");
assert(renderer.includes('change?.type === "selection"') && renderer.includes("revealLayerPath(primaryId)") && renderer.includes("focusLayer(primaryId || state.editor.editingContextId)"), "A seleção não revela e focaliza deterministicamente seu caminho.");
assert(renderer.includes('data-primary-selection="${String(primaryId === component.id)}"'), "A seleção primária não possui estado próprio.");
assert(renderer.includes('data-selection-ancestor="${String(selectedAncestorIds.has(component.id))}"'), "Os ancestrais da seleção não possuem estado próprio.");
assert(styles.includes('.layer-toggle[aria-expanded="false"]') && styles.includes('.layer-item[data-active-context="true"]'), "O CSS não distingue recolhimento e contexto ativo.");
assert(increment.includes("reordenação e reparenting permanecem fora deste recorte"), "Os limites de Camadas 05.21 não estão documentados.");

console.log("✓ Contrato de Camadas 05.21 preserva estado efêmero, revelação e distinções visuais.");
