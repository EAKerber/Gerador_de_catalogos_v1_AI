"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(path.resolve(__dirname, "../styles/components.css"), "utf8");

assert(
  css.includes('.editor-component[data-selected="true"] > .editor-component__label { display: block; }'),
  "A seleção primária deve revelar somente o próprio rótulo."
);
assert(
  !css.includes('.editor-component[data-selected="true"] .editor-component__label { display: block; }'),
  "A seleção não pode revelar recursivamente todos os rótulos descendentes."
);
assert(
  css.includes("> .editor-component:hover > .editor-component__label") &&
    css.includes("> .editor-component:focus-within > .editor-component__label"),
  "Rótulos filhos devem permanecer disponíveis por mouse e teclado."
);
assert(
  css.includes(".editor-component__label, .resize-handle"),
  "A projeção de impressão deve continuar ocultando rótulos do editor."
);

console.log("✓ Rótulos do editor usam revelação progressiva sem propagação recursiva.");
