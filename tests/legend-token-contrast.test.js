const fs = require("fs");
const path = require("path");
const vm = require("vm");
global.window = global;
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, "../app/tokens.js"), "utf8"));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const luminance = hex => {
  const values = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255).map(value => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
};
const contrast = hex => 1.05 / (luminance(hex) + .05);
for (const token of ["pack.500", "pack.300"]) assert(contrast(CATALOG_EDITOR_TOKENS.colors[token].value) >= 1.9, `${token} ainda se confunde com o papel.`);
assert(CATALOG_EDITOR_TOKENS.colors["pack.500"].value !== CATALOG_EDITOR_TOKENS.colors["pack.1000"].value, "Os tons cinza da legenda não se distinguem.");
console.log("✓ Tokens pack.500/pack.300 possuem contraste material contra o papel.");
