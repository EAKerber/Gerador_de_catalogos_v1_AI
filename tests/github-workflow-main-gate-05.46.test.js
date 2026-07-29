"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const workflow = fs.readFileSync(
  path.join(root, ".github/workflows/catalog-integration.yml"),
  "utf8"
);

const pullRequestBlock = workflow.match(
  /pull_request:\s*\n([\s\S]*?)(?=\n\s{2}[a-zA-Z_][a-zA-Z0-9_-]*:)/
);

if (!pullRequestBlock) {
  throw new Error("O workflow não declara o gatilho pull_request.");
}

for (const branch of ["development", "main"]) {
  if (!new RegExp(`^\\s*-\\s+${branch}\\s*$`, "m").test(pullRequestBlock[1])) {
    throw new Error(`O gate de integração não observa PRs para ${branch}.`);
  }
}

console.log("✓ CI bloqueante observa PRs para development e main.");
