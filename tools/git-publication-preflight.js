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
  return {
    ok: execution.status === 0,
    status: execution.status,
    stdout: (execution.stdout || "").trim(),
    stderr: (execution.stderr || "").trim()
  };
}

function classifyPushFailure(message) {
  const text = String(message || "").toLowerCase();
  if (/could not read username|authentication failed|permission denied|publickey/.test(text)) return "missing-local-credentials";
  if (/could not resolve host|unable to access|timed out|network is unreachable/.test(text)) return "network";
  if (/non-fast-forward|fetch first|rejected/.test(text)) return "remote-diverged";
  return "unknown";
}

function inspect(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const git = args => runGit(args, { ...options, cwd });
  const root = git(["rev-parse", "--show-toplevel"]);
  if (!root.ok) return { ok: false, cwd, transport: "blocked", blockers: ["not-a-git-repository"], checks: { repository: root } };

  const branch = git(["branch", "--show-current"]);
  const status = git(["status", "--porcelain"]);
  const remote = git(["remote", "get-url", "origin"]);
  const head = git(["rev-parse", "HEAD"]);
  const base = git(["rev-parse", "origin/development"]);
  const remoteRead = options.remote === false ? { ok: null, skipped: true } : git(["ls-remote", "origin", "refs/heads/development"]);
  const remoteBase = remoteRead.ok ? remoteRead.stdout.split(/\s+/)[0] || null : null;
  const effectiveBase = remoteBase || (options.remote === false ? base.stdout : null);
  const ancestry = effectiveBase && head.ok ? git(["merge-base", "--is-ancestor", effectiveBase, head.stdout]) : { ok: false };
  const remoteBaseFresh = options.remote === false ? null : Boolean(base.ok && remoteBase && base.stdout === remoteBase);
  let pushProbe = { ok: null, skipped: true };
  if (options.remote !== false && branch.ok && branch.stdout.startsWith("agent/")) {
    pushProbe = git(["push", "--dry-run", "origin", `HEAD:refs/heads/${branch.stdout}`]);
  }

  const blockers = [];
  if (!branch.stdout.startsWith("agent/")) blockers.push("branch-must-use-agent-prefix");
  if (status.stdout) blockers.push("worktree-not-clean");
  if (!base.ok) blockers.push("origin-development-unavailable");
  if (remoteBaseFresh === false) blockers.push("origin-development-stale");
  if (!ancestry.ok) blockers.push("branch-not-based-on-origin-development");
  if (remoteRead.ok === false) blockers.push("remote-read-unavailable");

  let transport = "direct-git";
  let pushFailure = null;
  if (pushProbe.ok === false) {
    pushFailure = classifyPushFailure(`${pushProbe.stderr}\n${pushProbe.stdout}`);
    transport = pushFailure === "missing-local-credentials" ? "github-connector" : "blocked";
    if (transport === "blocked") blockers.push(`push-probe-${pushFailure}`);
  }

  return {
    ok: blockers.length === 0,
    cwd,
    root: root.stdout,
    branch: branch.stdout,
    head: head.stdout,
    base: base.stdout,
    remoteBase,
    remote: remote.stdout,
    transport,
    pushFailure,
    blockers,
    checks: { clean: !status.stdout, ancestry: ancestry.ok, remoteRead: remoteRead.ok, remoteBaseFresh, pushProbe: pushProbe.ok }
  };
}

function format(report) {
  const mark = report.ok ? "OK" : "BLOCKED";
  const lines = [
    `${mark} git-publication-preflight`,
    `root=${report.root || report.cwd}`,
    `branch=${report.branch || "-"}`,
    `head=${report.head || "-"}`,
    `base=${report.base || "-"}`,
    `transport=${report.transport}`
  ];
  if (report.pushFailure) lines.push(`pushFailure=${report.pushFailure}`);
  if (report.blockers?.length) lines.push(`blockers=${report.blockers.join(",")}`);
  return lines.join("\n");
}

if (require.main === module) {
  const args = new Set(process.argv.slice(2));
  const report = inspect({ remote: !args.has("--local-only") });
  process.stdout.write(`${args.has("--json") ? JSON.stringify(report, null, 2) : format(report)}\n`);
  process.exitCode = report.ok ? 0 : 1;
}

module.exports = { classifyPushFailure, format, inspect, runGit };
