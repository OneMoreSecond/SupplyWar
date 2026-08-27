import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const baseMap = JSON.parse(await readFile(new URL("../../../../maps/mvp.json", import.meta.url), "utf8"));
const importedMap = structuredClone(baseMap);
importedMap.nodes[0].label = "Imported Player Base";
const largePositions = [[-2000, -1000], [1000, 0], [4000, 3000], [7000, 5000], [8000, -1500]];
for (const [index, node] of importedMap.nodes.entries()) [node.x, node.y] = largePositions[index];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
page.setDefaultTimeout(5000);

async function canvasWorldPoint(canvas, x, y) {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas has no visible bounds");
  const camera = await canvas.evaluate((element) => ({
    centerX: Number(element.dataset.cameraX), centerY: Number(element.dataset.cameraY),
    zoom: Number(element.dataset.cameraZoom), width: element.width, height: element.height,
  }));
  return {
    x: box.x + box.width * ((x - camera.centerX) * camera.zoom + camera.width / 2) / camera.width,
    y: box.y + box.height * ((y - camera.centerY) * camera.zoom + camera.height / 2) / camera.height,
  };
}

async function clickWorld(canvas, x, y) {
  const point = await canvasWorldPoint(canvas, x, y);
  await page.mouse.click(point.x, point.y);
}

async function dragWorld(canvas, fromX, fromY, toX, toY) {
  const from = await canvasWorldPoint(canvas, fromX, fromY);
  const to = await canvasWorldPoint(canvas, toX, toY);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y);
  await page.mouse.up();
}

try {
  await page.goto("http://127.0.0.1:4173/");
  const editorEntry = page.getByRole("link", { name: "Map editor" });
  if (!await editorEntry.isVisible()) throw new Error("The game page does not show the map editor entry");
  await editorEntry.click();
  await page.getByRole("heading", { name: "Map editor" }).waitFor();

  if (await page.locator("#settings-fields input, #settings-fields select").count() !== 6) throw new Error("Not every top-level/settings field is editable");
  if (await page.locator("#transport-fields").count() !== 0) throw new Error("The legacy global transport editor is still present");
  if (await page.locator("#selection-fields .editor-card").count() !== 0) throw new Error("The inspector rendered object fields before selection");
  if (await page.locator("#node-fields, #road-fields").count() !== 0) throw new Error("Legacy all-object property lists are still present");

  const canvas = page.locator("#map-preview");
  await clickWorld(canvas, 85, 300);
  let inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.count() !== 1 || await inspector.locator("input, select").count() !== 8) throw new Error("Selecting a node did not show only its eight fields");
  await inspector.getByLabel("Label").fill("Edited Player Base");
  await inspector.getByLabel("Force").fill("47");
  await inspector.getByLabel("Production / second").fill("0.6");
  await inspector.getByLabel("Kind").selectOption("resource");

  await clickWorld(canvas, 185, 300);
  inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.locator(":scope > .field-grid input, :scope > .field-grid select").count() !== 4) throw new Error("Selecting a road did not show its four road fields");
  if (!await inspector.getByText("This road has no initial transport.").isVisible()) throw new Error("An empty road did not show its road-scoped transport state");
  await inspector.getByRole("button", { name: "Add transport" }).click();
  inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.locator(".transport-editor input, .transport-editor select").count() !== 3) throw new Error("Adding a road transport did not expose its three fields");
  await inspector.getByRole("button", { name: "Remove transport" }).click();
  await inspector.getByLabel("ID", { exact: true }).fill("edited-player-frontline");
  await inspector.getByLabel("Width").fill("0");
  if (!await page.getByText(/width must be greater than 0/).isVisible()) throw new Error("Invalid road feedback was not shown");
  if (!await page.getByRole("button", { name: "Save JSON" }).isDisabled()) throw new Error("Save remained enabled for an invalid map");
  await page.getByRole("link", { name: /Playtest current map/ }).dispatchEvent("click");
  if (!page.url().includes("editor.html")) throw new Error("Invalid map navigated into playtest");
  if (!await page.getByText(/cannot be playtested yet/).isVisible()) throw new Error("Invalid playtest did not explain how to recover");
  await inspector.getByLabel("Width").fill("2");

  await clickWorld(canvas, 452.5, 385);
  inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.locator(".transport-editor input, .transport-editor select").count() !== 3) throw new Error("The existing initial transport was not attached to its road inspector");

  const playerConnector = await canvasWorldPoint(canvas, 85, 300);
  playerConnector.x += 25;
  playerConnector.y -= 25;
  const backup = await canvasWorldPoint(canvas, 820, 470);
  await page.mouse.move(playerConnector.x, playerConnector.y);
  await page.mouse.down();
  await page.mouse.move(backup.x, backup.y);
  await page.mouse.up();
  if (await page.locator("#road-count").textContent() !== "7") throw new Error("Connector drag did not add a road");
  inspector = page.locator("#selection-fields .editor-card");
  if (!await inspector.getByRole("heading", { name: /Road:/ }).isVisible()) throw new Error("The new road was not selected in the inspector");
  await inspector.getByRole("button", { name: "Remove", exact: true }).click();
  if (await page.locator("#road-count").textContent() !== "6") throw new Error("Removing the selected road did not update the map");

  await clickWorld(canvas, 85, 300);
  inspector = page.locator("#selection-fields .editor-card");
  const xBefore = await inspector.getByLabel("X").inputValue();
  await dragWorld(canvas, 85, 300, 160, 240);
  inspector = page.locator("#selection-fields .editor-card");
  const xAfter = await inspector.getByLabel("X").inputValue();
  if (xBefore === xAfter) throw new Error("Dragging a node body did not edit coordinates");

  await page.getByRole("button", { name: "Add node" }).click();
  if (await page.locator("#node-count").textContent() !== "6") throw new Error("Add node did not append a node");
  inspector = page.locator("#selection-fields .editor-card");
  if (!await inspector.getByRole("heading", { name: /Node: New Node/ }).isVisible()) throw new Error("A newly added node was not selected");
  await inspector.getByRole("button", { name: "Remove" }).click();
  if (await page.locator("#node-count").textContent() !== "5") throw new Error("Removing the selected node did not update the map");

  let dialogMessage = "";
  page.once("dialog", async (dialog) => { dialogMessage = dialog.message(); await dialog.dismiss(); });
  await page.getByRole("button", { name: "Reset to MVP" }).click();
  if (!dialogMessage.includes("Unsaved editor changes will be lost")) throw new Error("Reset confirmation did not explain the data-loss impact");
  await page.getByText(/Reset canceled.*current map was not changed/).waitFor();
  await clickWorld(canvas, 160, 240);
  inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.getByLabel("Label").inputValue() !== "Edited Player Base") throw new Error("Canceling reset changed the current map");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save JSON" }).click();
  const download = await downloadPromise;
  if (download.suggestedFilename() !== "mvp.json") throw new Error(`Unexpected download name: ${download.suggestedFilename()}`);
  const stream = await download.createReadStream();
  let downloaded = "";
  for await (const chunk of stream) downloaded += chunk.toString();
  const savedMap = JSON.parse(downloaded);
  if (savedMap.nodes[0].label !== "Edited Player Base" || savedMap.nodes[0].x !== 160 || savedMap.roads[0].width !== 2) throw new Error("Downloaded JSON did not contain the selected-object edits");

  await page.locator("#map-file").setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from("{broken") });
  await page.getByText(/current map was not changed/).waitFor();
  await clickWorld(canvas, 160, 240);
  if (await page.locator("#selection-fields .editor-card").getByLabel("Label").inputValue() !== "Edited Player Base") throw new Error("Failed import replaced the current draft");

  await page.locator("#map-file").setInputFiles({ name: "large-map.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(importedMap)) });
  await page.getByText(/Loaded large-map.json/).waitFor();
  const editorZoom = Number(await canvas.getAttribute("data-camera-zoom"));
  if (!(editorZoom < 0.1)) throw new Error(`Large map was not fit into the editor viewport: zoom ${editorZoom}`);
  const editorCameraBefore = Number(await canvas.getAttribute("data-camera-x"));
  const editorBox = await canvas.boundingBox();
  if (!editorBox) throw new Error("Editor canvas has no bounds");
  await page.mouse.move(editorBox.x + editorBox.width / 2, editorBox.y + editorBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(editorBox.x + editorBox.width / 2 + 80, editorBox.y + editorBox.height / 2 + 30);
  await page.mouse.up();
  const editorCameraAfter = Number(await canvas.getAttribute("data-camera-x"));
  if (editorCameraAfter === editorCameraBefore) throw new Error("Dragging empty editor space did not pan the camera");
  const zoomBeforeWheel = Number(await canvas.getAttribute("data-camera-zoom"));
  await page.mouse.wheel(0, -300);
  const zoomAfterWheel = Number(await canvas.getAttribute("data-camera-zoom"));
  if (zoomAfterWheel === zoomBeforeWheel) throw new Error("The editor wheel did not zoom the camera");
  await page.getByRole("button", { name: "Fit map" }).click();
  await clickWorld(canvas, -2000, -1000);
  inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.getByLabel("Label").inputValue() !== "Imported Player Base") throw new Error("Large-coordinate import did not remain selectable after fitting");
  await inspector.getByLabel("Force").fill("123");

  await page.getByRole("link", { name: /Playtest current map/ }).click();
  await page.getByRole("heading", { name: "Playtest your current map." }).waitFor();
  if (!page.url().endsWith("/?playtest=1")) throw new Error(`Unexpected playtest URL: ${page.url()}`);
  if (!await page.getByRole("link", { name: "Back to editor" }).isVisible()) throw new Error("Playtest did not expose return navigation");
  if (!await page.locator("#speed-control").isVisible()) throw new Error("The playtest speed bar is not visible");
  const gameCanvas = page.locator("#game");
  const gameZoom = Number(await gameCanvas.getAttribute("data-camera-zoom"));
  if (!(gameZoom < 0.1)) throw new Error(`Large map was not fit into the game viewport: zoom ${gameZoom}`);
  const storedForce = await page.evaluate(() => JSON.parse(sessionStorage.getItem("supply-war.playtest-map")).nodes[0].force);
  if (storedForce !== 123) throw new Error("Playtest storage did not contain the current editor draft");

  await page.getByRole("button", { name: "Restart map" }).click();
  await page.locator("#playtest-speed").fill("1");
  const slowStart = Number(await gameCanvas.getAttribute("data-simulation-time"));
  await page.waitForTimeout(400);
  const slowDelta = Number(await gameCanvas.getAttribute("data-simulation-time")) - slowStart;
  await page.getByRole("button", { name: "Restart map" }).click();
  await page.locator("#playtest-speed").fill("8");
  const fastStart = Number(await gameCanvas.getAttribute("data-simulation-time"));
  await page.waitForTimeout(400);
  const fastDelta = Number(await gameCanvas.getAttribute("data-simulation-time")) - fastStart;
  if (!(fastDelta > slowDelta * 4)) throw new Error(`Speed bar did not accelerate simulation enough: ${slowDelta} vs ${fastDelta}`);
  if (await page.locator("#speed-value").textContent() !== "8×") throw new Error("Speed output did not show 8×");

  await page.getByRole("button", { name: "Restart map" }).click();
  await page.locator("#playtest-speed").fill("1");
  await dragWorld(gameCanvas, -2000, -1000, 4000, 3000);
  await page.screenshot({ path: "agents/tmp/2026-08-27-browser-map-editor/output/playtest.png", fullPage: true });

  await page.getByRole("link", { name: "Back to editor" }).click();
  await page.getByText(/Restored your playtest draft/).waitFor();
  if (await page.locator("#file-name").textContent() !== "large-map.json") throw new Error("Returning from playtest lost the imported filename");
  const returnedCanvas = page.locator("#map-preview");
  await clickWorld(returnedCanvas, -2000, -1000);
  inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.getByLabel("Force").inputValue() !== "123") throw new Error("Returning from playtest did not restore the current draft");

  page.once("dialog", async (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset to MVP" }).click();
  await page.getByText(/Reset to the built-in MVP map/).waitFor();
  await clickWorld(returnedCanvas, 85, 300);
  if (await page.locator("#selection-fields .editor-card").getByLabel("Label").inputValue() !== "Player Base") throw new Error("Confirmed reset did not restore the MVP map");
  await clickWorld(returnedCanvas, 452.5, 385);
  await page.screenshot({ path: "agents/tmp/2026-08-27-browser-map-editor/output/editor.png", fullPage: true });

  await page.evaluate(() => sessionStorage.clear());
  await page.goto("http://127.0.0.1:4173/?playtest=1");
  await page.getByRole("heading", { name: "Playtest draft unavailable." }).waitFor();
  if (await page.locator("#speed-control").isVisible()) throw new Error("The speed bar appeared outside a valid editor playtest");
  await page.goto("http://127.0.0.1:4173/editor.html?playtest=1");
  await page.getByText(/playtest draft could not be restored.*built-in MVP map is open/i).waitFor();

  console.log(JSON.stringify({
    selectionInspector: "passed", roadTransportInspector: "passed", connectorRoadDrag: "passed",
    dragCoordinates: [xBefore, xAfter], largeMapCamera: { editorZoom, gameZoom, pan: "passed", wheelZoom: "passed" },
    playtestSpeed: { slowDelta, fastDelta }, resetConfirmation: ["cancel-preserved", "accept-reset"],
    playtestRoundTrip: "passed", playtestFallback: "passed", jsonRoundTrip: "passed",
  }, null, 2));
} finally {
  await browser.close();
}
