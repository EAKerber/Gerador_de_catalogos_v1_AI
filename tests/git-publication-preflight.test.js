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
git(["restore", "fixture.txt"]);

const bare = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-git-preflight-remote-"));
git(["init", "--bare", "--initial-branch=development"], bare);
git(["remote", "add", "origin", bare]);
git(["push", "origin", "HEAD:development"]);
git(["fetch", "origin", "development"]);

const fresh = inspect({ cwd: root, remote: true });
assert(fresh.ok && fresh.checks.remoteBaseFresh === true, `A referência remota atualizada deveria passar: ${JSON.stringify(fresh)}`);

const peer = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-git-preflight-peer-"));
git(["clone", bare, "."], peer);
git(["config", "user.email", "catalog-tests@example.invalid"], peer);
git(["config", "user.name", "Catalog Tests"], peer);
fs.writeFileSync(path.join(peer, "remote.txt"), "remote advance\n");
git(["add", "remote.txt"], peer);
git(["commit", "-m", "remote advance"], peer);
git(["push", "origin", "development"], peer);

const stale = inspect({ cwd: root, remote: true });
assert(!stale.ok && stale.blockers.includes("origin-development-stale"), `A referência local obsoleta não foi bloqueada: ${JSON.stringify(stale)}`);
assert(stale.remoteBase && stale.remoteBase !== stale.base, "O pré-voo não expôs as duas bases divergentes.");

assert(classifyPushFailure("fatal: could not read Username for 'https://github.com'") === "missing-local-credentials", "Credencial HTTPS ausente não foi classificada.");
assert(classifyPushFailure("Permission denied (publickey)") === "missing-local-credentials", "Credencial SSH ausente não foi classificada.");
assert(classifyPushFailure("Could not resolve host: github.com") === "network", "Falha de rede não foi classificada.");
assert(classifyPushFailure("[rejected] non-fast-forward") === "remote-diverged", "Divergência remota não foi classificada.");

console.log("✓ Pré-voo Git distingue base, frescor remoto, sujeira, rede, divergência e credencial local ausente.");
