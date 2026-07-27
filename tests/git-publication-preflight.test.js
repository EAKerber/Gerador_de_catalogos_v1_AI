"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { classifyPushFailure, inspect } = require("../tools/git-publication-preflight.js");

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const root = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-git-preflight-"));

function git(args, cwd = root) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert(result.status === 0, result.stderr || `git ${args.join(" ")} falhou`);
}

git(["init", "--initial-branch=development"]);
git(["config", "user.email", "catalog-tests@example.invalid"]);
git(["config", "user.name", "Catalog Tests"]);
fs.writeFileSync(path.join(root, "fixture.txt"), "base\n");
git(["add", "fixture.txt"]);
git(["commit", "-m", "base"]);
git(["update-ref", "refs/remotes/origin/development", "HEAD"]);
git(["switch", "-c", "agent/preflight-test"]);

const clean = inspect({ cwd: root, remote: false });
assert(clean.ok, `Uma branch limpa derivada de development deveria passar: ${JSON.stringify(clean)}`);
assert(clean.transport === "direct-git", "O diagnóstico local deveria preferir Git direto.");

fs.writeFileSync(path.join(root, "fixture.txt"), "dirty\n");
const dirty = inspect({ cwd: root, remote: false });
assert(!dirty.ok && dirty.blockers.includes("worktree-not-clean"), "Worktree suja não foi bloqueada.");

assert(classifyPushFailure("fatal: could not read Username for 'https://github.com'") === "missing-local-credentials", "Credencial HTTPS ausente não foi classificada.");
assert(classifyPushFailure("Permission denied (publickey)") === "missing-local-credentials", "Credencial SSH ausente não foi classificada.");
assert(classifyPushFailure("Could not resolve host: github.com") === "network", "Falha de rede não foi classificada.");
assert(classifyPushFailure("[rejected] non-fast-forward") === "remote-diverged", "Divergência remota não foi classificada.");

console.log("✓ Pré-voo Git distingue base, sujeira, rede, divergência e credencial local ausente.");
