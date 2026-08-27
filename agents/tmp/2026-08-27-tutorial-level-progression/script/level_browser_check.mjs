import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const mvp = JSON.parse(await readFile(new URL("../../../../maps/mvp.json", import.meta.url), "utf8"));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
page.setDefaultTimeout(12000);
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

async function worldPoint(canvas, x, y) {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Game canvas has no visible bounds");
  const camera = await canvas.evaluate((element) => ({
    centerX: Number(element.dataset.cameraX),
    centerY: Number(element.dataset.cameraY),
    zoom: Number(element.dataset.cameraZoom),
    width: element.width,
    height: element.height,
  }));
  return {
    x: box.x + box.width * ((x - camera.centerX) * camera.zoom + camera.width / 2) / camera.width,
    y: box.y + box.height * ((y - camera.centerY) * camera.zoom + camera.height / 2) / camera.height,
  };
}

async function dragWorld(canvas, from, to) {
  const start = await worldPoint(canvas, from.x, from.y);
  const end = await worldPoint(canvas, to.x, to.y);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y);
  await page.mouse.up();
}

try {
  await page.goto("http://127.0.0.1:4173/");
  const picker = page.getByLabel("Level");
  if (!await picker.isVisible()) throw new Error("The authored-level picker is not visible on the main page");
  if (await picker.locator("option").count() !== 5) throw new Error("The picker does not contain four tutorials and the final exam");
  if (await picker.inputValue() !== "transport") throw new Error("Normal entry did not start at Tutorial 1");
  if (!await page.getByText(/TUTORIAL 1\/4 · TRANSPORT & CAPTURE/).isVisible()) throw new Error("Tutorial 1 mechanism label is missing");
  if (!await page.getByRole("heading", { name: "Send forces down a road." }).isVisible()) throw new Error("Tutorial 1 guidance is missing");
  const next = page.getByRole("button", { name: "Next level" });
  if (await next.isVisible()) throw new Error("Next level is visible before victory");

  const canvas = page.locator("#game");
  if (await canvas.getAttribute("data-level-id") !== "transport") throw new Error("Tutorial 1 map was not loaded");
  await dragWorld(canvas, { x: 180, y: 280 }, { x: 720, y: 280 });
  await next.waitFor({ state: "visible", timeout: 10000 });
  if (!await page.getByText(/Tutorial 1 — Send forces complete/).isVisible()) throw new Error("Victory does not identify the completed tutorial");
  await page.screenshot({ path: "agents/tmp/2026-08-27-tutorial-level-progression/output/tutorial-1-complete.png", fullPage: true });

  await next.click();
  await page.waitForURL(/\?level=support$/);
  if (await picker.inputValue() !== "support") throw new Error("Next level did not open Tutorial 2");
  if (!await page.getByRole("heading", { name: "Feed the attack from behind." }).isVisible()) throw new Error("Tutorial 2 guidance is missing");
  if (await next.isVisible()) throw new Error("Next level remained visible after entering a fresh level");

  await picker.selectOption("cut-supply");
  await page.waitForURL(/\?level=cut-supply$/);
  if (!await page.getByText(/TUTORIAL 3\/4 · SOURCE CAPTURE/).isVisible()) throw new Error("Level picker did not open Tutorial 3");
  if (!await page.getByText(/direct road is tempting.*attack fail/i).isVisible()) throw new Error("Tutorial 3 does not explain the direct-attack choice");
  await dragWorld(canvas, { x: 150, y: 260 }, { x: 750, y: 260 });
  await page.waitForTimeout(300);
  if (await next.isVisible()) throw new Error("Tutorial 3 direct attack completed the level");
  await page.screenshot({ path: "agents/tmp/2026-08-27-tutorial-level-progression/output/tutorial-3-direct-fails.png", fullPage: true });

  await picker.selectOption("siege");
  await page.waitForURL(/\?level=siege$/);
  if (!await page.getByText(/red ring/).isVisible()) throw new Error("Siege tutorial does not explain its visual mechanism");
  await dragWorld(canvas, { x: 180, y: 280 }, { x: 720, y: 280 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "agents/tmp/2026-08-27-tutorial-level-progression/output/tutorial-4-siege.png", fullPage: true });

  await picker.selectOption("mvp");
  await page.waitForURL(/\?level=mvp$/);
  if (!await page.getByText("SUPPLY WAR · FINAL EXAM", { exact: true }).isVisible()) throw new Error("MVP is not labeled as the final exam");
  if (!await page.getByRole("heading", { name: "Cut the enemy supply line." }).isVisible()) throw new Error("The final exam did not retain MVP guidance");
  if (await canvas.getAttribute("data-level-id") !== "mvp") throw new Error("The final exam did not load the MVP map");
  await page.screenshot({ path: "agents/tmp/2026-08-27-tutorial-level-progression/output/final-exam.png", fullPage: true });

  await page.goto("http://127.0.0.1:4173/?level=unknown");
  if (await picker.inputValue() !== "transport") throw new Error("An unknown level did not safely fall back to Tutorial 1");

  await page.evaluate((draft) => sessionStorage.setItem("supply-war.playtest-map", JSON.stringify(draft)), mvp);
  await page.goto("http://127.0.0.1:4173/?playtest=1");
  await page.getByRole("heading", { name: "Playtest your current map." }).waitFor();
  if (await page.locator("#level-control").isVisible()) throw new Error("Authored-level selection appeared inside editor playtest");
  if (!await page.locator("#speed-control").isVisible()) throw new Error("Editor playtest lost its speed control");
  if (await next.isVisible()) throw new Error("Next level appeared inside editor playtest");
  if (await canvas.getAttribute("data-level-id") !== "playtest") throw new Error("Editor playtest did not retain its separate mode");

  await page.evaluate(() => sessionStorage.clear());
  await page.goto("http://127.0.0.1:4173/?playtest=1");
  await page.getByRole("heading", { name: "Playtest draft unavailable." }).waitFor();
  if (await page.locator("#level-control").isVisible()) throw new Error("Authored-level selection appeared in playtest fallback");

  if (pageErrors.length > 0) throw new Error(`Page errors: ${pageErrors.join("; ")}`);
  console.log(JSON.stringify({
    catalog: ["transport", "support", "cut-supply", "siege", "mvp"],
    defaultLevel: "transport",
    victoryNextLevel: "support",
    pickerNavigation: "passed",
    finalExam: "mvp",
    playtestIsolation: "passed",
    screenshots: ["tutorial-1-complete.png", "tutorial-3-direct-fails.png", "tutorial-4-siege.png", "final-exam.png"],
  }, null, 2));
} finally {
  await browser.close();
}
