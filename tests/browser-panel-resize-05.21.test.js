/* Interface real 05.21 — resize dos painéis e preservação do canvas. */
"use strict";

const { chromium } = require("playwright");
const assert = require("assert");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto("http://127.0.0.1:8080", { waitUntil: "networkidle" });

  const left = page.locator(".side-panel--left");
  const handle = page.locator('[data-resize-panel="left"]');
  const before = await left.boundingBox();
  const handleRect = await handle.boundingBox();
  assert(before && handleRect, "Painel ou alça não renderizou.");

  await page.mouse.move(handleRect.x + handleRect.width / 2, handleRect.y + 80);
  await page.mouse.down();
  await page.mouse.move(handleRect.x + handleRect.width / 2 + 80, handleRect.y + 80);
  await page.mouse.up();

  const after = await left.boundingBox();
  const workspace = await page.locator("#workspaceViewport").boundingBox();
  assert(after.width >= before.width + 70, "O painel esquerdo não acompanhou o arraste.");
  assert(workspace.width >= 420, "O resize reduziu o canvas abaixo do orçamento mínimo.");

  await handle.dblclick();
  const reset = await left.boundingBox();
  assert(Math.abs(reset.width - before.width) <= 1, "Duplo clique não restaurou a largura padrão.");

  await handle.press("ArrowRight");
  const keyboard = await left.boundingBox();
  assert(keyboard.width > reset.width, "O teclado não ampliou o painel.");

  await browser.close();
  console.log("✓ Painéis 05.21 redimensionam, restauram e preservam o canvas em 1366×768.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
