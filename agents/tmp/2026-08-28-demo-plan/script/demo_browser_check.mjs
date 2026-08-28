import { chromium } from "playwright";

const baseURL = process.argv[2] ?? "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

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
  }));
  if (state.enemyNodes <= 9) throw new Error(`Enemy did not expand: ${JSON.stringify(state)}`);
  if (state.activeEnemyTransports === 0) throw new Error(`Enemy has no active routes: ${JSON.stringify(state)}`);

  await page.screenshot({ path: "agents/tmp/2026-08-28-demo-plan/output/demo-baseline.png", fullPage: true });
  process.stdout.write(`${JSON.stringify({ options, state })}\n`);
} finally {
  await browser.close();
}
