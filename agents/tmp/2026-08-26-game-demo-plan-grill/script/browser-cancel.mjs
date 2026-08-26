import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
const box = await page.locator("#game").boundingBox();
if (!box) throw new Error("Game canvas was not rendered");
const point = ([x, y]) => ({ x: box.x + x, y: box.y + y });
await page.mouse.move(...Object.values(point([85, 300])));
await page.mouse.down();
await page.mouse.move(...Object.values(point([620, 470])), { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(500);
await page.mouse.click(box.x + 352, box.y + 385, { button: "right" });
await page.waitForTimeout(250);
await page.screenshot({ path: "agents/tmp/2026-08-26-game-demo-plan-grill/output/browser-cancel.png", fullPage: true });
await browser.close();
console.log("Started and cancelled player base -> resource through canvas input");
