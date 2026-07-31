#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const testsRoot = path.join(root, "tests");
const args = new Set(process.argv.slice(2));
const listOnly = args.has("--list");
const listShards = args.has("--list-shards");
const runAll = args.has("--all");
const runBrowser = runAll || args.has("--browser");
const runBuild = runAll || args.has("--build");
const runNode = runAll || args.has("--node") || (!runBrowser && !runBuild && !listOnly);
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const timeoutMs = Math.max(10000, Number(process.env.CATALOG_TEST_TIMEOUT_MS) || 10 * 60 * 1000);
const shardCount = Number(process.env.CATALOG_TEST_SHARD_COUNT ?? 1);
const shardIndex = Number(process.env.CATALOG_TEST_SHARD_INDEX ?? 0);
const configuredRetryLimit = process.env.CATALOG_INFRA_RETRY_LIMIT === undefined
  ? 1
  : Number(process.env.CATALOG_INFRA_RETRY_LIMIT);
const infrastructureRetryLimit = Number.isInteger(configuredRetryLimit) && configuredRetryLimit >= 0
  ? configuredRetryLimit
  : 1;
const browserTestWeights = new Map([
  ["browser-promotional-generalization-v2-05.20.14.test.js", 8],
  ["browser-reference-manual-audit-05.17.test.js", 8],
  ["browser-reference-manual-audit.test.js", 8],
  ["browser-promotional-generalization-05.20.test.js", 5],
  ["browser-reusable-components.test.js", 5],
  ["browser-hierarchy.test.js", 3]
]);

if (!Number.isInteger(shardCount) || shardCount < 1 || !Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount) {
  console.error(`Shard inválido: índice ${shardIndex}, total ${shardCount}.`);
  process.exit(2);
}

function discover() {
  const files = fs.readdirSync(testsRoot)
    .filter(file => file.endsWith(".test.js"))
    .sort((left, right) => left.localeCompare(right));
  return {
    node: files.filter(file => !file.startsWith("browser-")),
    browser: files.filter(file => file.startsWith("browser-"))
  };
}

function printList(suites) {
  console.log(`Node (${suites.node.length})`);
  suites.node.forEach(file => console.log(`  tests/${file}`));
  console.log(`\nChromium (${suites.browser.length})`);
  suites.browser.forEach(file => console.log(`  tests/${file}`));
}

function selectShard(files) {
  return planShards(files, shardCount)[shardIndex].files;
}

function planShards(files, count) {
  if (count === 1) return [{ weight: files.reduce((total, file) => total + (browserTestWeights.get(file) || 1), 0), files: [...files] }];
  const shards = Array.from({ length: count }, () => ({ weight: 0, files: [] }));
  [...files]
    .sort((left, right) => {
      const weightDifference = (browserTestWeights.get(right) || 1) - (browserTestWeights.get(left) || 1);
      return weightDifference || left.localeCompare(right);
    })
    .forEach(file => {
      const target = shards.reduce((best, shard) => shard.weight < best.weight ? shard : best, shards[0]);
      target.files.push(file);
      target.weight += browserTestWeights.get(file) || 1;
    });
  return shards.map(shard => ({ ...shard, files: shard.files.sort((left, right) => left.localeCompare(right)) }));
}

function classifyFailure(execution) {
  if (execution.error?.code === "ETIMEDOUT") return "infrastructure-timeout";
  if (execution.signal) return "infrastructure-signal";
  const output = `${execution.stdout || ""}\n${execution.stderr || ""}`;
  if (/fatal library error|browser.*(?:closed|crashed)|Target page, context or browser has been closed/i.test(output)) {
    return "infrastructure-browser";
  }
  return "functional";
}

function executeTest(file) {
  return spawnSync(process.execPath, [path.join(testsRoot, file)], {
    cwd: root,
    env: {
      ...process.env,
      CATALOG_PROMOTIONAL_REMEDIATION_ENFORCE: process.env.CATALOG_PROMOTIONAL_REMEDIATION_ENFORCE || "1"
    },
    encoding: "utf8",
    maxBuffer: 24 * 1024 * 1024,
    timeout: timeoutMs,
    killSignal: "SIGTERM"
  });
}

function runFiles(label, files, options = {}) {
  const failures = [];
  console.log(`\n=== ${label}: ${files.length} teste(s) ===`);
  files.forEach((file, index) => {
    console.log(`\n[${index + 1}/${files.length}] ${file}`);
    let execution = executeTest(file);
    if (execution.stdout) process.stdout.write(execution.stdout);
    if (execution.stderr) process.stderr.write(execution.stderr);
    let classification = execution.status === 0 ? null : classifyFailure(execution);
    if (options.retryInfrastructure && classification?.startsWith("infrastructure-")) {
      for (let attempt = 1; attempt <= infrastructureRetryLimit && execution.status !== 0; attempt += 1) {
        console.error(`↻ ${file}: ${classification}; repetição infraestrutural ${attempt}/${infrastructureRetryLimit}.`);
        execution = executeTest(file);
        if (execution.stdout) process.stdout.write(execution.stdout);
        if (execution.stderr) process.stderr.write(execution.stderr);
        classification = execution.status === 0 ? null : classifyFailure(execution);
      }
    }
    if (execution.status !== 0) {
      failures.push({
        file,
        status: execution.status,
        signal: execution.signal || null,
        classification
      });
    }
  });
  return failures;
}

function printBrowserDiagnostics() {
  let executablePath = process.env.CATALOG_CHROMIUM_EXECUTABLE || "";
  if (!executablePath) {
    try {
      const playwrightRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
      const { chromium } = require(playwrightRoot ? path.join(playwrightRoot, "playwright") : "playwright");
      executablePath = chromium.executablePath();
    } catch (error) {
      console.error(`Chromium não resolvido: ${error.message}`);
      return;
    }
  }
  const version = spawnSync(executablePath, ["--version"], { encoding: "utf8", timeout: 10000 });
  console.log(`Chromium executável: ${executablePath}`);
  console.log(`Chromium versão: ${(version.stdout || version.stderr || "indisponível").trim()}`);
}

function probe(url) {
  return new Promise(resolve => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      resolve(false);
      return;
    }
    const client = parsed.protocol === "https:" ? https : http;
    const request = client.get(parsed, response => {
      response.resume();
      resolve(Boolean(response.statusCode && response.statusCode < 500));
    });
    request.setTimeout(2500, () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

function runBuildStep() {
  console.log("\n=== Build canônico do Authoring Kit ===\n");
  const execution = spawnSync(process.execPath, [path.join(root, "tools", "build-authoring-kit.js")], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 24 * 1024 * 1024,
    timeout: timeoutMs,
    killSignal: "SIGTERM"
  });
  if (execution.stdout) process.stdout.write(execution.stdout);
  if (execution.stderr) process.stderr.write(execution.stderr);
  return execution.status === 0
    ? []
    : [{ file: "tools/build-authoring-kit.js", status: execution.status, signal: execution.signal || null, timedOut: execution.error?.code === "ETIMEDOUT" }];
}

async function main() {
  const suites = discover();
  if (listShards) {
    const plan = planShards(suites.browser, shardCount);
    console.log(JSON.stringify(plan, null, 2));
    return;
  }
  if (listOnly) {
    printList(suites);
    return;
  }

  const failures = [];
  if (runNode) failures.push(...runFiles("Contratos Node", suites.node));
  if (runBuild) failures.push(...runBuildStep());
  if (runBrowser) {
    if (!(await probe(baseURL))) {
      console.error(`\nServidor não acessível em ${baseURL}. Inicie na raiz do projeto com: python3 -m http.server 8080`);
      process.exitCode = 2;
      return;
    }
    console.log(`\nServidor confirmado em ${baseURL}.`);
    printBrowserDiagnostics();
    const browserFiles = selectShard(suites.browser);
    const shardLabel = shardCount > 1 ? ` — shard ${shardIndex + 1}/${shardCount}` : "";
    console.log(`Cobertura Chromium selecionada: ${browserFiles.length}/${suites.browser.length} teste(s)${shardLabel}.`);
    failures.push(...runFiles(`Chromium${shardLabel}`, browserFiles, { retryInfrastructure: true }));
  }

  if (failures.length) {
    console.error(`\n✗ Suíte concluída com ${failures.length} falha(s):`);
    failures.forEach(failure => console.error(`  - ${failure.file}: ${failure.classification || "functional"}, status ${failure.status}${failure.signal ? `, sinal ${failure.signal}` : ""}`));
    process.exitCode = 1;
    return;
  }

  console.log("\n✓ Suíte integral do catálogo concluída sem falhas.");
}

module.exports = { classifyFailure, planShards };

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
