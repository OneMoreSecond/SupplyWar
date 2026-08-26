import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
const canvas = page.locator("#game");
const box = await canvas.boundingBox();
if (!box) throw new Error("Game canvas was not rendered");

await page.mouse.move(box.x + 85, box.y + 300);
await page.mouse.down();
await page.mouse.move(box.x + 620, box.y + 470, { steps: 8 });
await page.waitForTimeout(250);

const status = await page.locator("#status").textContent();
await page.screenshot({ path: "agents/tmp/2026-08-26-game-demo-plan-grill/output/browser-drag-preview.png", fullPage: true });
await page.mouse.up();
await browser.close();

if (status !== "Release to send forces to Enemy Resource.") throw new Error(`Expected valid drag feedback, got: ${status}`);
console.log(status);
