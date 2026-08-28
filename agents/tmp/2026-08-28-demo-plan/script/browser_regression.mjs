import { chromium } from "playwright";

const baseURL = process.argv[2] ?? "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(12000);
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

async function worldPoint(canvas, x, y) {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas has no visible bounds");
  const camera = await canvas.evaluate((element) => ({
    centerX: Number(element.dataset.cameraX),
    centerY: Number(element.dataset.cameraY),
    zoom: Number(element.dataset.cameraZoom),
    width: Number(element.dataset.viewportWidth) || element.clientWidth,
    height: Number(element.dataset.viewportHeight) || element.clientHeight,
  }));
  return {
    x: box.x + box.width * ((x - camera.centerX) * camera.zoom + camera.width / 2) / camera.width,
    y: box.y + box.height * ((y - camera.centerY) * camera.zoom + camera.height / 2) / camera.height,
  };
}

async function clickWorld(canvas, x, y) {
  const point = await worldPoint(canvas, x, y);
  await page.mouse.click(point.x, point.y);
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
  await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
  const picker = page.getByLabel("Level", { exact: true });
  if (await picker.locator("option").count() !== 6) throw new Error("The authored picker must contain six levels");
  if (await picker.inputValue() !== "transport") throw new Error("Normal entry must start at Tutorial 1");
  const gameCanvas = page.locator("#game");
  await dragWorld(gameCanvas, { x: 180, y: 280 }, { x: 720, y: 280 });
  const next = page.getByRole("button", { name: "Next level" });
  await next.waitFor({ state: "visible" });
  await next.click();
  await page.waitForURL(/\?level=support$/);
  if (await picker.inputValue() !== "support") throw new Error("Tutorial successor navigation failed");

  await picker.selectOption("mvp");
  await page.waitForURL(/\?level=mvp$/);
  if (!await page.getByText("SUPPLY WAR · FINAL EXAM", { exact: true }).isVisible()) throw new Error("Final-exam label is missing");
  await picker.selectOption("demo");
  await page.waitForURL(/\?level=demo$/);
  if (!await page.getByText("SUPPLY WAR · DEMO", { exact: true }).isVisible()) throw new Error("Demo label is missing");
  if (!/^\d{2}:\d{2}$/.test(await page.locator("#timer-value").textContent())) throw new Error("Formal match timer is missing");

  await page.getByRole("link", { name: "Map editor" }).click();
  await page.getByRole("heading", { name: "Map editor" }).waitFor();
  const settings = page.locator("#settings-fields input, #settings-fields select");
  if (await settings.count() !== 14) throw new Error(`Version 2 settings count is ${await settings.count()}, expected 14`);
  if (!/version-1 or version-2/.test(await page.locator("body").textContent())) throw new Error("Editor schema guidance is stale");

  const editorCanvas = page.locator("#map-preview");
  await clickWorld(editorCanvas, 185, 300);
  let inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.locator("input, select").count() !== 5) throw new Error("Version 2 road inspector must expose five fields");
  if (!await inspector.getByLabel("Travel time multiplier").isVisible()) throw new Error("Road travel multiplier is missing");
  await clickWorld(editorCanvas, 820, 150);
  if (!await page.getByLabel("Guarded by node IDs").isVisible()) throw new Error("Guard is not editable on nodes");

  await clickWorld(editorCanvas, 185, 300);
  await page.getByLabel("Version").selectOption("1");
  if (await settings.count() !== 6) throw new Error("Version 1 must hide version 2 rule controls");
  inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.locator("input, select").count() !== 4) throw new Error("Version 1 road inspector must expose four fields");
  if (!/Map is valid/.test(await page.locator("#map-status").textContent())) throw new Error("Explicit version 2 to version 1 conversion is invalid");

  await page.getByLabel("Version").selectOption("2");
  if (await settings.count() !== 14) throw new Error("Version 1 to version 2 conversion did not restore explicit rules");
  await page.getByLabel("Fog of war").check();
  await page.getByLabel("Interdiction", { exact: true }).check();
  if (!/Map is valid/.test(await page.locator("#map-status").textContent())) throw new Error("Implemented fog and Interdiction settings are not authorable");
  await page.getByLabel("Fog of war").uncheck();
  await page.getByLabel("Interdiction", { exact: true }).uncheck();

  const playtest = page.getByRole("link", { name: "Playtest current map" });
  await playtest.click();
  await page.waitForURL(/\?playtest=1$/);
  if (!await page.getByText("SUPPLY WAR · MAP PLAYTEST", { exact: true }).isVisible()) throw new Error("Editor playtest mode is not isolated");
  await page.getByRole("link", { name: "Back to editor" }).click();
  await page.waitForURL(/editor\.html\?playtest=1$/);
  if (!/Restored your playtest draft/.test(await page.locator("#map-status").textContent())) throw new Error("Editor draft did not restore after playtest");

  const abilityMap = {
    version: 2,
    settings: {
      logicTickSeconds: 0.1,
      siegeFormula: "exponential-half-life",
      siegeHalfLifeSeconds: 10,
      secondsPerDistanceUnit: 0.01,
      forcePerWidthUnit: 1,
      rules: {
        siegeSupport: "rooted",
        computerAI: { enabled: false, decisionIntervalSeconds: 1, reserveForce: 0 },
        fogOfWar: { enabled: true },
        interdiction: { enabled: true, durationSeconds: 10, cooldownSeconds: 60 },
      },
    },
    nodes: [
      { id: "player-base", label: "Player Base", owner: "player", force: 20, production: 0, kind: "base", x: 200, y: 280 },
      { id: "enemy-base", label: "Enemy Base", owner: "enemy", force: 20, production: 0, kind: "base", x: 700, y: 280 },
    ],
    roads: [{ id: "front", a: "player-base", b: "enemy-base", width: 1, travelTimeMultiplier: 1 }],
    initialTransports: [{ source: "enemy-base", target: "player-base", owner: "enemy" }],
  };
  await page.evaluate((map) => sessionStorage.setItem("supply-war.playtest-map", JSON.stringify(map)), abilityMap);
  await page.goto(`${baseURL}/?playtest=1`, { waitUntil: "networkidle" });
  const abilityCanvas = page.locator("#game");
  const interdict = page.getByRole("button", { name: /Interdict/ });
  await interdict.click();
  await clickWorld(abilityCanvas, 450, 280);
  await page.waitForFunction(() => Number(document.querySelector("#game")?.dataset.activeInterdictions) === 1);
  if (Number(await abilityCanvas.getAttribute("data-interdiction-ready-in")) <= 0) throw new Error("Player Interdiction cooldown did not start");
  await page.screenshot({ path: "agents/tmp/2026-08-28-demo-plan/output/interdiction-active.png", fullPage: true });

  if (pageErrors.length > 0) throw new Error(`Page errors: ${pageErrors.join(" | ")}`);
  process.stdout.write(`${JSON.stringify({ levels: 6, version2Settings: 14, playtestRoundTrip: true, interdictionInteraction: true })}\n`);
} finally {
  await browser.close();
}
