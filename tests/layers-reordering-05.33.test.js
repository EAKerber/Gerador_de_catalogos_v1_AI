"use strict";

const fs = require("fs");
const assert = require("assert");

const renderer = fs.readFileSync("app/renderer.js", "utf8");
const interactions = fs.readFileSync("app/interactions.js", "utf8");
const store = fs.readFileSync("app/document-store.js", "utf8");
const styles = fs.readFileSync("styles/editor.css", "utf8");

assert(renderer.includes('data-reorder-layer="${escapeHtml(component.id)}"'), "Camadas não expõe a ação de reordenação.");
assert(renderer.includes('data-reorder-direction="-1"') && renderer.includes('data-reorder-direction="1"'), "Camadas não oferece as duas direções.");
assert(renderer.includes("groupIndex <= 0") && renderer.includes("groupIndex >= group.length - 1"), "Os controles não respeitam os limites do grupo/slot.");
assert(renderer.includes('aria-label="Mover ${escapeHtml(component.name || definition?.label || component.type)} para cima"'), "A reordenação não possui nome acessível.");
assert(interactions.includes('this.store.reorderComponent(reorder.dataset.reorderLayer, Number(reorder.dataset.reorderDirection))'), "A ação de Camadas não reutiliza reorderComponent.");
assert(store.includes('"component-reordered": "Reordenar camada"'), "O histórico não identifica a reordenação.");
assert(styles.includes(".layer-order-actions button:focus-visible"), "Os controles de teclado não possuem foco visível.");

console.log("✓ Camadas 05.33 expõe reordenação acessível entre irmãos sem reparenting.");
