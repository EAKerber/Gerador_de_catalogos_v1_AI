"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  buildCanonicalManifest,
  decideTreeAttempt,
  normalizeConnectorSha,
  validatePublishedEntries
} = require("../tools/git-connector-publication.js");

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const root = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-connector-publication-"));

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert(result.status === 0, result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout.trim();
}

git(["init", "--initial-branch=development"]);
git(["config", "user.email", "catalog-tests@example.invalid"]);
git(["config", "user.name", "Catalog Tests"]);
fs.mkdirSync(path.join(root, "nested"));
fs.writeFileSync(path.join(root, "alpha.txt"), "alpha\n");
fs.writeFileSync(path.join(root, "nested", "beta.txt"), "beta\n");
git(["add", "."]);
git(["commit", "-m", "fixture"]);

const manifest = buildCanonicalManifest({ cwd: root });
assert(manifest.head === git(["rev-parse", "HEAD"]), "Manifest did not use the requested commit.");
assert(manifest.tree === git(["rev-parse", "HEAD^{tree}"]), "Manifest did not expose the canonical tree SHA.");
assert(manifest.entryCount === 2, "Manifest did not include every tracked blob.");
assert(manifest.entries.map(entry => entry.path).join(",") === "alpha.txt,nested/beta.txt", "Manifest paths are not canonical.");

const sha = manifest.entries[0].sha;
assert(normalizeConnectorSha({ result: { sha } }) === sha, "Flat connector response was not normalized.");
assert(normalizeConnectorSha({ structuredContent: { result: { oid: sha } } }) === sha, "Nested connector response was not normalized.");
assert(normalizeConnectorSha([{ data: { blob_sha: sha } }]) === sha, "Array connector response was not normalized.");

const complete = manifest.entries.map(entry => ({
  path: entry.path,
  mode: entry.mode,
  result: { sha: entry.sha }
}));
const valid = validatePublishedEntries(manifest, complete);
assert(valid.ok, `Complete connector entries should match: ${JSON.stringify(valid)}`);
assert(decideTreeAttempt(valid, 0).action === "continue", "A valid publication should continue.");

const partial = validatePublishedEntries(manifest, complete.slice(0, 1));
assert(!partial.ok && partial.expectedCount === 2 && partial.actualCount === 1, "Partial packaging was not detected.");
assert(partial.missing[0] === "nested/beta.txt", "The missing canonical path was not reported.");
assert(decideTreeAttempt(partial, 0).action === "rebuild-once", "First divergence should trigger one canonical rebuild.");
assert(decideTreeAttempt(partial, 1).action === "block", "Repeated divergence must block publication.");

const wrongSha = complete.map(entry => ({ ...entry }));
wrongSha[0] = { ...wrongSha[0], result: { sha: "0".repeat(40) } };
const mismatch = validatePublishedEntries(manifest, wrongSha);
assert(!mismatch.ok && mismatch.mismatched.length === 1, "A connector SHA mismatch was not blocked.");

console.log("✓ Publicação pelo conector usa manifesto canônico, normaliza retornos, refaz uma vez e bloqueia divergências.");
