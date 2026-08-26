import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
const canvas = page.locator("#game");
const box = await canvas.boundingBox();
if (!box) throw new Error("Game canvas was not rendered");

const drag = async (from, to) => {
  await page.mouse.move(box.x + from[0], box.y + from[1]);
  await page.mouse.down();
  await page.mouse.move(box.x + to[0], box.y + to[1], { steps: 10 });
  await page.mouse.up();
};

await drag([85, 300], [620, 470]);
console.log("Started player base -> resource");
await page.waitForTimeout(36_000);
await drag([620, 470], [285, 300]);
console.log("Started resource -> frontline");
await page.waitForTimeout(60_000);
await drag([285, 300], [820, 150]);
console.log("Started frontline -> enemy base");
await page.waitForTimeout(60_000);

const status = await page.locator("#status").textContent();
await page.screenshot({ path: "agents/tmp/2026-08-26-game-demo-plan-grill/output/browser-victory.png", fullPage: true });
await browser.close();
if (!status?.includes("Victory")) throw new Error(`Expected victory, got: ${status}`);
console.log(status);
