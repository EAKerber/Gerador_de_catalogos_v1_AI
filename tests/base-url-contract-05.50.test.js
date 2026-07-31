"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const testsRoot = path.join(root, "tests");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browserFiles = fs.readdirSync(testsRoot).filter(file => file.startsWith("browser-") && file.endsWith(".test.js"));
const violations = [];

for (const file of browserFiles) {
  const source = fs.readFileSync(path.join(testsRoot, file), "utf8");
  if (/page\.goto\(\s*["'`]https?:\/\/(?:127\.0\.0\.1|localhost):8080/.test(source)) {
    violations.push(file);
  }
}

assert(violations.length === 0, `Testes Chromium com URL fixa: ${violations.join(", ")}.`);
console.log(`✓ ${browserFiles.length} testes Chromium respeitam CATALOG_BASE_URL.`);
