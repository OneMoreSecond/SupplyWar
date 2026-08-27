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
  const picker = page.getByLabel("Level", { exact: true });
  if (!await picker.isVisible()) throw new Error("The authored-level picker is not visible on the main page");
  if (await picker.locator("option").count() !== 5) throw new Error("The picker does not contain four tutorials and the final exam");
  if (await picker.inputValue() !== "transport") throw new Error("Normal entry did not start at Tutorial 1");
  if (!await page.getByText(/TUTORIAL 1\/4 · TRANSPORT & CAPTURE/).isVisible()) throw new Error("Tutorial 1 mechanism label is missing");
  if (!await page.getByRole("heading", { name: "Send forces down a road." }).isVisible()) throw new Error("Tutorial 1 guidance is missing");
  const next = page.getByRole("button", { name: "Next level" });
  if (await next.isVisible()) throw new Error("Next level is visible before victory");
  const completionDialog = page.locator("#level-complete-dialog");
  if (await completionDialog.isVisible()) throw new Error("The completion popup is visible before victory");

  const canvas = page.locator("#game");
  if (await canvas.getAttribute("data-level-id") !== "transport") throw new Error("Tutorial 1 map was not loaded");
  await dragWorld(canvas, { x: 180, y: 280 }, { x: 720, y: 280 });
  await next.waitFor({ state: "visible", timeout: 10000 });
  if (!await completionDialog.isVisible()) throw new Error("Victory did not open the completion popup");
  if (!await page.getByRole("heading", { name: "Tutorial 1 — Send forces complete!" }).isVisible()) throw new Error("The completion popup does not identify the completed level");
  if (!await completionDialog.getByText(/Congratulations.*Tutorial 2/).isVisible()) throw new Error("The completion popup does not congratulate the player or identify the next level");
  if (!await page.getByRole("button", { name: "Replay level" }).isVisible()) throw new Error("The completion popup has no replay action");
  if (!/Tutorial 1 — Send forces complete/.test(await page.locator("#status").textContent() ?? "")) throw new Error("Victory status does not identify the completed tutorial");
  await page.screenshot({ path: "agents/tmp/2026-08-27-tutorial-level-progression/output/tutorial-1-complete.png", fullPage: true });

  await next.click();
  await page.waitForURL(/\?level=support$/);
  if (await picker.inputValue() !== "support") throw new Error("Next level did not open Tutorial 2");
  if (!await page.getByRole("heading", { name: "Out-supply the defended base." }).isVisible()) throw new Error("Tutorial 2 guidance is missing");
  if (!await page.getByText(/Enemy support blocks siege damage/).isVisible()) throw new Error("Tutorial 2 does not explain why the enemy base is protected");
  if (await next.isVisible()) throw new Error("Next level remained visible after entering a fresh level");
  await dragWorld(canvas, { x: 120, y: 120 }, { x: 380, y: 280 });
  await dragWorld(canvas, { x: 120, y: 440 }, { x: 380, y: 280 });
  await dragWorld(canvas, { x: 380, y: 280 }, { x: 620, y: 280 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "agents/tmp/2026-08-27-tutorial-level-progression/output/tutorial-2-two-supplies.png", fullPage: true });

  await picker.selectOption("cut-supply");
  await page.waitForURL(/\?level=cut-supply$/);
  if (!await page.getByText(/TUTORIAL 3\/4 · SOURCE CAPTURE/).isVisible()) throw new Error("Level picker did not open Tutorial 3");
  if (!await page.getByText(/direct road is tempting.*attack fail/i).isVisible()) throw new Error("Tutorial 3 does not explain the direct-attack choice");
  if (!await page.getByText(/behind it/).isVisible()) throw new Error("Tutorial 3 does not explain the resource behind the base");
  await dragWorld(canvas, { x: 130, y: 280 }, { x: 530, y: 280 });
  await page.waitForTimeout(300);
  if (await next.isVisible()) throw new Error("Tutorial 3 direct attack completed the level");
  await page.screenshot({ path: "agents/tmp/2026-08-27-tutorial-level-progression/output/tutorial-3-direct-fails.png", fullPage: true });

  await picker.selectOption("siege");
  await page.waitForURL(/\?level=siege$/);
  if (!await page.getByText(/red ring/).isVisible()) throw new Error("Siege tutorial does not explain its visual mechanism");
  await dragWorld(canvas, { x: 160, y: 280 }, { x: 680, y: 280 });
  await dragWorld(canvas, { x: 450, y: 100 }, { x: 680, y: 280 });
  await dragWorld(canvas, { x: 450, y: 460 }, { x: 680, y: 280 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "agents/tmp/2026-08-27-tutorial-level-progression/output/tutorial-4-siege.png", fullPage: true });

  await picker.selectOption("mvp");
  await page.waitForURL(/\?level=mvp$/);
  if (!await page.getByText("SUPPLY WAR · FINAL EXAM", { exact: true }).isVisible()) throw new Error("MVP is not labeled as the final exam");
  if (!await page.getByRole("heading", { name: "Cut the enemy supply line." }).isVisible()) throw new Error("The final exam did not retain MVP guidance");
  if (await canvas.getAttribute("data-level-id") !== "mvp") throw new Error("The final exam did not load the MVP map");
  await page.screenshot({ path: "agents/tmp/2026-08-27-tutorial-level-progression/output/final-exam.png", fullPage: true });
  await page.locator("#playtest-speed").evaluate((input) => {
    input.value = "8";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await dragWorld(canvas, { x: 85, y: 300 }, { x: 620, y: 470 });
  await page.waitForFunction(() => Number(document.querySelector("#game")?.dataset.simulationTime) >= 18);
  await dragWorld(canvas, { x: 620, y: 470 }, { x: 285, y: 300 });
  await page.waitForFunction(() => Number(document.querySelector("#game")?.dataset.simulationTime) >= 50);
  await dragWorld(canvas, { x: 285, y: 300 }, { x: 820, y: 150 });
  const close = page.getByRole("button", { name: "Close" });
  try {
    await close.waitFor({ state: "visible", timeout: 15000 });
  } catch (error) {
    const simulationTime = await canvas.getAttribute("data-simulation-time");
    const victoryStatus = await page.locator("#status").textContent();
    throw new Error(`Final exam did not complete by simulation ${simulationTime}s; status: ${victoryStatus}`, { cause: error });
  }
  if (!await page.getByRole("heading", { name: "Final Exam — Supply War MVP complete!" }).isVisible()) throw new Error("The final-exam completion popup has the wrong title");
  if (!await completionDialog.getByText(/cleared the Supply War campaign/).isVisible()) throw new Error("The final-exam completion popup does not congratulate the player");
  await page.screenshot({ path: "agents/tmp/2026-08-27-tutorial-level-progression/output/final-exam-complete.png", fullPage: true });
  await close.click();
  if (await completionDialog.isVisible()) throw new Error("The final-exam completion popup did not close");

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
    finalExam: "mvp-completion-passed",
    playtestIsolation: "passed",
    completionPopup: "passed",
    screenshots: ["tutorial-1-complete.png", "tutorial-2-two-supplies.png", "tutorial-3-direct-fails.png", "tutorial-4-siege.png", "final-exam.png", "final-exam-complete.png"],
  }, null, 2));
} finally {
  await browser.close();
}
