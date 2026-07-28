#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

function runGit(args, options = {}) {
  const execution = spawnSync(options.gitBinary || process.env.CATALOG_GIT_BINARY || "git", args, {
    cwd: options.cwd || process.cwd(),
    encoding: "utf8",
    timeout: options.timeout || 20000
  });
  if (execution.status !== 0) {
    throw new Error((execution.stderr || execution.stdout || `git ${args.join(" ")} failed`).trim());
  }
  return (execution.stdout || "").trim();
}

function buildCanonicalManifest(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const ref = options.ref || "HEAD";
  const head = runGit(["rev-parse", ref], { ...options, cwd });
  const tree = runGit(["rev-parse", `${ref}^{tree}`], { ...options, cwd });
  const raw = runGit(["ls-tree", "-r", "-z", "--full-tree", ref], { ...options, cwd });
  const entries = raw
    .split("\0")
    .filter(Boolean)
    .map(record => {
      const match = record.match(/^(\d{6})\s+(blob)\s+([0-9a-f]{40})\t([\s\S]+)$/);
      if (!match) throw new Error(`Unsupported Git tree entry: ${record}`);
      return { mode: match[1], type: match[2], sha: match[3], path: match[4] };
    })
    .sort((left, right) => left.path.localeCompare(right.path, "en"));

  return { version: 1, head, tree, entryCount: entries.length, entries };
}

function collectShaCandidates(value, output = []) {
  if (typeof value === "string" && /^[0-9a-f]{40}$/i.test(value)) output.push(value.toLowerCase());
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) collectShaCandidates(item, output);
    return output;
  }
  for (const key of ["sha", "oid", "blob_sha", "tree_sha"]) {
    if (Object.hasOwn(value, key)) collectShaCandidates(value[key], output);
  }
  for (const key of ["result", "data", "structuredContent", "content", "commit", "object"]) {
    if (Object.hasOwn(value, key)) collectShaCandidates(value[key], output);
  }
  return output;
}

function normalizeConnectorSha(response, expectedSha = null) {
  const candidates = [...new Set(collectShaCandidates(response))];
  const expected = expectedSha?.toLowerCase() || null;
  if (expected && candidates.includes(expected)) return expected;
  if (candidates.length === 1) return candidates[0];
  if (candidates.length === 0) throw new Error("Connector response does not contain a Git SHA.");
  throw new Error(`Connector response contains ambiguous Git SHAs: ${candidates.join(", ")}`);
}

function collectBranchCandidates(value, output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) collectBranchCandidates(item, output);
    return output;
  }
  for (const key of ["branch", "branch_name", "name", "ref"]) {
    if (typeof value[key] !== "string") continue;
    const candidate = value[key].replace(/^refs\/heads\//, "");
    if (candidate) output.push(candidate);
  }
  for (const key of ["result", "data", "structuredContent", "content"]) {
    if (Object.hasOwn(value, key)) collectBranchCandidates(value[key], output);
  }
  return output;
}

function normalizeConnectorBranch(response, expectedBranch = null) {
  const candidates = [...new Set(collectBranchCandidates(response))];
  const expected = expectedBranch ? String(expectedBranch).replace(/^refs\/heads\//, "") : null;
  if (expected && candidates.includes(expected)) return expected;
  if (candidates.length === 1) return candidates[0];
  if (candidates.length === 0) throw new Error("Connector response does not contain a Git branch name.");
  throw new Error(`Connector response contains ambiguous Git branch names: ${candidates.join(", ")}`);
}

function validatePublishedEntries(manifest, publishedEntries) {
  const normalize = entry => ({
    path: String(entry.path || ""),
    mode: String(entry.mode || ""),
    sha: normalizeConnectorSha(entry, entry.expectedSha || null)
  });
  const expected = manifest.entries.map(normalize);
  const actual = (publishedEntries || []).map(normalize);
  const actualByPath = new Map(actual.map(entry => [entry.path, entry]));
  const expectedPaths = new Set(expected.map(entry => entry.path));
  const missing = expected.filter(entry => !actualByPath.has(entry.path)).map(entry => entry.path);
  const extra = actual.filter(entry => !expectedPaths.has(entry.path)).map(entry => entry.path);
  const mismatched = expected
    .filter(entry => {
      const found = actualByPath.get(entry.path);
      return found && (found.mode !== entry.mode || found.sha !== entry.sha);
    })
    .map(entry => ({
      path: entry.path,
      expected: { mode: entry.mode, sha: entry.sha },
      actual: { mode: actualByPath.get(entry.path).mode, sha: actualByPath.get(entry.path).sha }
    }));

  return {
    ok: missing.length === 0 && extra.length === 0 && mismatched.length === 0 && actual.length === expected.length,
    expectedCount: expected.length,
    actualCount: actual.length,
    missing,
    extra,
    mismatched
  };
}

function decideTreeAttempt(validation, previousAttempts = 0) {
  if (validation.ok) return { action: "continue", reason: "canonical-entries-match" };
  if (previousAttempts === 0) return { action: "rebuild-once", reason: "canonical-entries-diverged" };
  return { action: "block", reason: "canonical-entries-diverged-after-rebuild" };
}

function decideWriteConfirmation({
  acknowledgement,
  readback,
  expectedSha,
  acknowledgementIdentity = "sha",
  expectedBranch = null
}) {
  const expected = String(expectedSha || "").toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(expected)) {
    throw new Error("Expected Git SHA must contain exactly 40 hexadecimal characters.");
  }
  if (!["sha", "branch-name"].includes(acknowledgementIdentity)) {
    throw new Error(`Unsupported acknowledgement identity: ${acknowledgementIdentity}`);
  }
  if (acknowledgementIdentity === "branch-name" && !expectedBranch) {
    throw new Error("Expected branch is required for branch-name acknowledgements.");
  }

  let confirmed;
  try {
    confirmed = normalizeConnectorSha(readback, expected);
  } catch (error) {
    return {
      action: "block",
      reason: "readback-unverifiable",
      incident: "conteudo-remoto-nao-verificavel",
      expectedSha: expected,
      confirmedSha: null,
      acknowledgementSha: null,
      detail: error.message
    };
  }
  if (confirmed !== expected) {
    return {
      action: "block",
      reason: "readback-diverged",
      incident: "conteudo-remoto-incorreto",
      expectedSha: expected,
      confirmedSha: confirmed,
      acknowledgementSha: null
    };
  }

  let acknowledged;
  try {
    acknowledged = acknowledgementIdentity === "branch-name"
      ? normalizeConnectorBranch(acknowledgement, expectedBranch)
      : normalizeConnectorSha(acknowledgement, expected);
  } catch (error) {
    return {
      action: "continue",
      reason: "readback-confirmed",
      incident: "acknowledgement-incompleto",
      expectedSha: expected,
      confirmedSha: confirmed,
      acknowledgementSha: null,
      acknowledgementBranch: null,
      detail: error.message
    };
  }
  const expectedAcknowledgement = acknowledgementIdentity === "branch-name"
    ? String(expectedBranch).replace(/^refs\/heads\//, "")
    : expected;
  if (acknowledged !== expectedAcknowledgement) {
    return {
      action: "continue",
      reason: "readback-confirmed",
      incident: "acknowledgement-inconsistente",
      expectedSha: expected,
      confirmedSha: confirmed,
      acknowledgementSha: acknowledgementIdentity === "sha" ? acknowledged : null,
      acknowledgementBranch: acknowledgementIdentity === "branch-name" ? acknowledged : null
    };
  }
  return {
    action: "continue",
    reason: "acknowledgement-and-readback-confirmed",
    incident: null,
    expectedSha: expected,
    confirmedSha: confirmed,
    acknowledgementSha: acknowledgementIdentity === "sha" ? acknowledged : null,
    acknowledgementBranch: acknowledgementIdentity === "branch-name" ? acknowledged : null
  };
}

function formatManifest(manifest) {
  return JSON.stringify(manifest, null, 2);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const refIndex = args.indexOf("--ref");
  const ref = refIndex >= 0 ? args[refIndex + 1] : "HEAD";
  process.stdout.write(`${formatManifest(buildCanonicalManifest({ ref }))}\n`);
}

module.exports = {
  buildCanonicalManifest,
  collectBranchCandidates,
  collectShaCandidates,
  decideWriteConfirmation,
  decideTreeAttempt,
  formatManifest,
  normalizeConnectorBranch,
  normalizeConnectorSha,
  runGit,
  validatePublishedEntries
};
