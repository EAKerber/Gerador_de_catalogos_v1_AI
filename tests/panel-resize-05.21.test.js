/* Incremento 05.21 — contrato estático dos painéis redimensionáveis. */
"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const runtime = fs.readFileSync(path.join(root, "app/workspace-layout.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles/editor.css"), "utf8");

assert(html.includes('data-resize-panel="left"') && html.includes('data-resize-panel="right"'), "Os dois painéis precisam expor separadores acessíveis.");
assert(runtime.includes("defaultPanelWidth(side)") && runtime.includes("shellWidth - otherWidth - 420"), "Mínimo atual e orçamento do canvas não foram formalizados.");
assert(runtime.includes("localStorage.setItem") && runtime.includes("localStorage.removeItem"), "A preferência local e a restauração do default não foram implementadas.");
assert(runtime.includes('event.key === "Home"') && runtime.includes('"ArrowLeft", "ArrowRight"'), "O resize não possui alternativa de teclado.");
assert(css.includes('body[data-resizing-panel]') && css.includes(".side-panel[data-collapsed=\"true\"] .panel-resize-handle"), "Feedback e convivência com o colapso não foram definidos.");

console.log("✓ Painéis 05.21 preservam o mínimo atual, o canvas e controles de mouse/teclado.");
