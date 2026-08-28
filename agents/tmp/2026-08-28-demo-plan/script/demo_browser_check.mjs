import { chromium } from "playwright";

const baseURL = process.argv[2] ?? "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });

try {
  await page.goto(`${baseURL}/?level=demo`, { waitUntil: "networkidle" });
  const options = await page.locator("#level-picker option").allTextContents();
  if (options.length !== 6) throw new Error(`Expected 6 authored levels, found ${options.length}`);
  if (await page.locator("#mode-label").textContent() !== "SUPPLY WAR · DEMO") throw new Error("Demo mode label is missing");
  if (await page.locator("#game").getAttribute("data-level-id") !== "demo") throw new Error("Demo map did not load");

  await page.waitForFunction(() => Number(document.querySelector("#game")?.getAttribute("data-simulation-time")) >= 18, undefined, { timeout: 30000 });
  const state = await page.locator("#game").evaluate((canvas) => ({
    simulationTime: Number(canvas.dataset.simulationTime),
    playerNodes: Number(canvas.dataset.playerNodes),
    enemyNodes: Number(canvas.dataset.enemyNodes),
    activeEnemyTransports: Number(canvas.dataset.activeEnemyTransports),
    cameraZoom: Number(canvas.dataset.cameraZoom),
    nodeRadius: Number(canvas.dataset.nodeRadius),
    labelsVisible: canvas.dataset.nodeLabelsVisible === "true",
    devicePixelRatio: Number(canvas.dataset.devicePixelRatio),
    visibleNodes: Number(canvas.dataset.visibleNodes),
    discoveredNodes: Number(canvas.dataset.discoveredNodes),
  }));
  if (state.enemyNodes <= 9) throw new Error(`Enemy did not expand: ${JSON.stringify(state)}`);
  if (state.activeEnemyTransports === 0) throw new Error(`Enemy has no active routes: ${JSON.stringify(state)}`);
  if (state.visibleNodes >= 32) throw new Error(`Fog did not hide live map state: ${JSON.stringify(state)}`);
  if (state.discoveredNodes < state.visibleNodes) throw new Error(`Discovery state is inconsistent: ${JSON.stringify(state)}`);
  if (!await page.getByRole("button", { name: /Interdict/ }).isVisible()) throw new Error("Interdiction HUD is missing");
  if (state.devicePixelRatio !== 2) throw new Error(`Canvas did not use the browser pixel ratio: ${JSON.stringify(state)}`);
  if (state.labelsVisible) throw new Error(`Zoomed-out node labels should be hidden: ${JSON.stringify(state)}`);
  if (await page.locator("#timer-value").textContent() !== "00:18") throw new Error("Formal timer did not track simulation time");
  const renderTiming = await page.evaluate(() => new Promise((resolve) => {
    const samples = [];
    let previous = performance.now();
    function sample(now) {
      samples.push(now - previous);
      previous = now;
      if (samples.length < 120) requestAnimationFrame(sample);
      else resolve({ averageMs: samples.reduce((sum, value) => sum + value, 0) / samples.length, maxMs: Math.max(...samples) });
    }
    requestAnimationFrame(sample);
  }));
  if (renderTiming.averageMs > 30) throw new Error(`Average frame interval is too high: ${JSON.stringify(renderTiming)}`);

  await page.screenshot({ path: "agents/tmp/2026-08-28-demo-plan/output/demo-baseline.png", fullPage: true });
  const canvasBox = await page.locator("#game").boundingBox();
  if (!canvasBox) throw new Error("Canvas has no bounds");
  await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
  await page.mouse.wheel(0, -800);
  await page.waitForFunction((initialRadius) => Number(document.querySelector("#game")?.dataset.nodeRadius) > initialRadius, state.nodeRadius);
  const zoomed = await page.locator("#game").evaluate((canvas) => ({ cameraZoom: Number(canvas.dataset.cameraZoom), nodeRadius: Number(canvas.dataset.nodeRadius), labelsVisible: canvas.dataset.nodeLabelsVisible === "true" }));
  if (!zoomed.labelsVisible) throw new Error(`Node labels did not appear at close zoom: ${JSON.stringify(zoomed)}`);
  if (Math.abs(zoomed.nodeRadius - 32 * zoomed.cameraZoom) > 0.05) throw new Error(`Node shape did not scale with camera zoom: ${JSON.stringify(zoomed)}`);
  process.stdout.write(`${JSON.stringify({ options, state, zoomed, renderTiming })}\n`);
} finally {
  await browser.close();
}
