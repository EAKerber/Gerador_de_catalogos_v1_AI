"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  buildCanonicalManifest,
  collectBranchCandidates,
  decideWriteConfirmation,
  decideTreeAttempt,
  normalizeConnectorBranch,
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
assert(normalizeConnectorSha({ structuredContent: { commit: { sha } } }) === sha, "Commit readback response was not normalized.");
assert(normalizeConnectorSha({ result: { object: { sha } } }) === sha, "Ref object readback response was not normalized.");
const branch = "agent/confirmacao-ref-05.40";
assert(normalizeConnectorBranch({ result: { name: branch } }) === branch, "Branch name acknowledgement was not normalized.");
assert(normalizeConnectorBranch({ structuredContent: { result: { ref: `refs/heads/${branch}` } } }) === branch, "Full branch ref was not normalized.");
assert(collectBranchCandidates({ result: { branch_name: branch } })[0] === branch, "Branch candidates were not collected.");

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

const confirmed = decideWriteConfirmation({
  acknowledgement: { result: { sha } },
  readback: { result: { sha } },
  expectedSha: sha
});
assert(confirmed.action === "continue" && confirmed.incident === null, "Acknowledgement e readback válidos não continuaram.");

const incompleteAcknowledgement = decideWriteConfirmation({
  acknowledgement: { result: {} },
  readback: { result: { sha } },
  expectedSha: sha
});
assert(incompleteAcknowledgement.action === "continue", "Readback válido deveria suprir acknowledgement incompleto.");
assert(incompleteAcknowledgement.incident === "acknowledgement-incompleto", "Acknowledgement incompleto não foi classificado.");

const branchAcknowledgement = decideWriteConfirmation({
  acknowledgement: { structuredContent: { branch } },
  readback: { structuredContent: { commit: { sha } } },
  expectedSha: sha,
  acknowledgementIdentity: "branch-name",
  expectedBranch: branch
});
assert(branchAcknowledgement.action === "continue", "Branch confirmada pelo nome e readback deveria continuar.");
assert(branchAcknowledgement.incident === null, "Nome de branch válido não deve ser classificado como acknowledgement incompleto.");
assert(branchAcknowledgement.acknowledgementBranch === branch, "A branch confirmada não foi preservada na decisão.");
assert(branchAcknowledgement.acknowledgementSha === null, "A confirmação de branch não deve inventar SHA no acknowledgement.");

const wrongBranchAcknowledgement = decideWriteConfirmation({
  acknowledgement: { result: { name: "agent/outra-branch" } },
  readback: { result: { sha } },
  expectedSha: sha,
  acknowledgementIdentity: "branch-name",
  expectedBranch: branch
});
assert(wrongBranchAcknowledgement.action === "continue", "Readback válido deveria impedir repetição cega após nome divergente.");
assert(wrongBranchAcknowledgement.incident === "acknowledgement-inconsistente", "Nome de branch divergente não foi classificado.");
assert(wrongBranchAcknowledgement.acknowledgementBranch === "agent/outra-branch", "A divergência de branch não foi preservada.");

const missingBranchAcknowledgement = decideWriteConfirmation({
  acknowledgement: { result: {} },
  readback: { result: { sha } },
  expectedSha: sha,
  acknowledgementIdentity: "branch-name",
  expectedBranch: branch
});
assert(missingBranchAcknowledgement.incident === "acknowledgement-incompleto", "Ausência do nome da branch não foi classificada.");

const inconsistentAcknowledgement = decideWriteConfirmation({
  acknowledgement: { result: { sha: "0".repeat(40) } },
  readback: { result: { sha } },
  expectedSha: sha
});
assert(inconsistentAcknowledgement.action === "continue", "Readback válido deveria impedir repetição cega da escrita.");
assert(inconsistentAcknowledgement.incident === "acknowledgement-inconsistente", "Acknowledgement divergente não foi separado do conteúdo remoto.");

const divergentReadback = decideWriteConfirmation({
  acknowledgement: { result: { sha } },
  readback: { result: { sha: "0".repeat(40) } },
  expectedSha: sha
});
assert(divergentReadback.action === "block", "Readback divergente não bloqueou a publicação.");
assert(divergentReadback.incident === "conteudo-remoto-incorreto", "Conteúdo remoto divergente não foi classificado.");

const missingReadback = decideWriteConfirmation({
  acknowledgement: { result: { sha } },
  readback: { result: {} },
  expectedSha: sha
});
assert(missingReadback.action === "block", "Ausência de identidade no readback não bloqueou a publicação.");
assert(missingReadback.incident === "conteudo-remoto-nao-verificavel", "Readback não verificável não foi classificado.");

console.log("✓ Publicação usa manifesto canônico, confirma escritas por readback e bloqueia identidade remota divergente.");
