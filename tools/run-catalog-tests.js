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
const runAll = args.has("--all");
const runBrowser = runAll || args.has("--browser");
const runBuild = runAll || args.has("--build");
const runNode = runAll || args.has("--node") || (!runBrowser && !runBuild && !listOnly);
const baseURL = process.env.CATALOG_BASE_URL || "http://127.0.0.1:8080";
const timeoutMs = Math.max(10000, Number(process.env.CATALOG_TEST_TIMEOUT_MS) || 10 * 60 * 1000);

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

function runFiles(label, files) {
  const failures = [];
  console.log(`\n=== ${label}: ${files.length} teste(s) ===`);
  files.forEach((file, index) => {
    console.log(`\n[${index + 1}/${files.length}] ${file}`);
    const execution = spawnSync(process.execPath, [path.join(testsRoot, file)], {
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
    if (execution.stdout) process.stdout.write(execution.stdout);
    if (execution.stderr) process.stderr.write(execution.stderr);
    if (execution.status !== 0) {
      failures.push({
        file,
        status: execution.status,
        signal: execution.signal || null,
        timedOut: execution.error?.code === "ETIMEDOUT"
      });
    }
  });
  return failures;
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
    failures.push(...runFiles("Chromium", suites.browser));
  }

  if (failures.length) {
    console.error(`\n✗ Suíte concluída com ${failures.length} falha(s):`);
    failures.forEach(failure => console.error(`  - ${failure.file}: ${failure.timedOut ? "timeout" : `status ${failure.status}`}${failure.signal ? `, sinal ${failure.signal}` : ""}`));
    process.exitCode = 1;
    return;
  }

  console.log("\n✓ Suíte integral do catálogo concluída sem falhas.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
