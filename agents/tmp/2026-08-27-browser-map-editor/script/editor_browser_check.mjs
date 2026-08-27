import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const baseMap = JSON.parse(await readFile(new URL("../../../../maps/mvp.json", import.meta.url), "utf8"));
const importedMap = structuredClone(baseMap);
importedMap.nodes[0].label = "Imported Player Base";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
page.setDefaultTimeout(5000);

function canvasPoint(box, x, y) {
  return { x: box.x + box.width * x / 900, y: box.y + box.height * y / 560 };
}

async function clickCanvas(box, x, y) {
  const point = canvasPoint(box, x, y);
  await page.mouse.click(point.x, point.y);
}

try {
  await page.goto("http://127.0.0.1:4173/");
  const editorEntry = page.getByRole("link", { name: "Map editor" });
  if (!await editorEntry.isVisible()) throw new Error("The game page does not show the map editor entry");
  await editorEntry.click();
  await page.getByRole("heading", { name: "Map editor" }).waitFor();

  if (await page.locator("#settings-fields input, #settings-fields select").count() !== 6) throw new Error("Not every top-level/settings field is editable");
  if (await page.locator("#transport-fields .editor-card").count() !== 2) throw new Error("The editor did not render all initial transports");
  if (await page.locator("#transport-fields .editor-card").first().locator("input, select").count() !== 3) throw new Error("Not every initial transport field is editable");
  if (await page.locator("#selection-fields .editor-card").count() !== 0) throw new Error("The inspector rendered object fields before selection");
  if (await page.locator("#node-fields, #road-fields").count() !== 0) throw new Error("Legacy all-object property lists are still present");

  const canvas = page.locator("#map-preview");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Preview canvas has no visible bounds");

  await clickCanvas(box, 85, 300);
  let inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.count() !== 1 || await inspector.locator("input, select").count() !== 8) throw new Error("Selecting a node did not show only its eight fields");
  await inspector.getByLabel("Label").fill("Edited Player Base");
  await inspector.getByLabel("Force").fill("47");
  await inspector.getByLabel("Production / second").fill("0.6");
  await inspector.getByLabel("Kind").selectOption("resource");

  await clickCanvas(box, 185, 300);
  inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.count() !== 1 || await inspector.locator("input, select").count() !== 4) throw new Error("Selecting a road did not show only its four fields");
  await inspector.getByLabel("ID", { exact: true }).fill("edited-player-frontline");
  await inspector.getByLabel("Width").fill("0");
  if (!await page.getByText(/width must be greater than 0/).isVisible()) throw new Error("Invalid road feedback was not shown");
  if (!await page.getByRole("button", { name: "Save JSON" }).isDisabled()) throw new Error("Save remained enabled for an invalid map");
  await page.getByRole("link", { name: /Playtest current map/ }).dispatchEvent("click");
  if (!page.url().includes("editor.html")) throw new Error("Invalid map navigated into playtest");
  if (!await page.getByText(/cannot be playtested yet/).isVisible()) throw new Error("Invalid playtest did not explain how to recover");
  await inspector.getByLabel("Width").fill("2");

  const connector = canvasPoint(box, 110, 275);
  const backup = canvasPoint(box, 820, 470);
  await page.mouse.move(connector.x, connector.y);
  await page.mouse.down();
  await page.mouse.move(backup.x, backup.y);
  await page.mouse.up();
  if (await page.locator("#road-count").textContent() !== "7") throw new Error("Connector drag did not add a road");
  inspector = page.locator("#selection-fields .editor-card");
  if (!await inspector.getByRole("heading", { name: /Road:/ }).isVisible()) throw new Error("The new road was not selected in the inspector");
  await inspector.getByRole("button", { name: "Remove" }).click();
  if (await page.locator("#road-count").textContent() !== "6") throw new Error("Removing the selected road did not update the map");

  await clickCanvas(box, 85, 300);
  inspector = page.locator("#selection-fields .editor-card");
  const xBefore = await inspector.getByLabel("X").inputValue();
  const start = canvasPoint(box, 85, 300);
  const end = canvasPoint(box, 160, 240);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y);
  await page.mouse.up();
  inspector = page.locator("#selection-fields .editor-card");
  const xAfter = await inspector.getByLabel("X").inputValue();
  if (xBefore === xAfter) throw new Error("Dragging a node body did not edit coordinates");

  await page.getByRole("button", { name: "Add node" }).click();
  if (await page.locator("#node-count").textContent() !== "6") throw new Error("Add node did not append a node");
  inspector = page.locator("#selection-fields .editor-card");
  if (!await inspector.getByRole("heading", { name: /Node: New Node/ }).isVisible()) throw new Error("A newly added node was not selected");
  await inspector.getByRole("button", { name: "Remove" }).click();
  if (await page.locator("#node-count").textContent() !== "5") throw new Error("Removing the selected node did not update the map");

  await page.getByRole("button", { name: "Add transport" }).click();
  if (await page.locator("#transport-fields .editor-card").count() !== 3) throw new Error("Add transport did not append a transport");
  await page.locator("#transport-fields .editor-card").last().getByRole("button", { name: "Remove" }).click();

  let dialogMessage = "";
  page.once("dialog", async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Reset to MVP" }).click();
  if (!dialogMessage.includes("Unsaved editor changes will be lost")) throw new Error("Reset confirmation did not explain the data-loss impact");
  await page.getByText(/Reset canceled.*current map was not changed/).waitFor();
  await clickCanvas(box, 160, 240);
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
  await clickCanvas(box, 160, 240);
  if (await page.locator("#selection-fields .editor-card").getByLabel("Label").inputValue() !== "Edited Player Base") throw new Error("Failed import replaced the current draft");

  await page.locator("#map-file").setInputFiles({ name: "custom-map.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(importedMap)) });
  await page.getByText(/Loaded custom-map.json/).waitFor();
  if (await page.locator("#selection-fields .editor-card").count() !== 0) throw new Error("Loading a map did not clear object selection");
  await clickCanvas(box, 85, 300);
  inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.getByLabel("Label").inputValue() !== "Imported Player Base") throw new Error("Valid import did not replace the draft");
  await inspector.getByLabel("Force").fill("123");

  await page.getByRole("link", { name: /Playtest current map/ }).click();
  await page.getByRole("heading", { name: "Playtest your current map." }).waitFor();
  if (!page.url().endsWith("/?playtest=1")) throw new Error(`Unexpected playtest URL: ${page.url()}`);
  if (!await page.getByRole("link", { name: "Back to editor" }).isVisible()) throw new Error("Playtest did not expose return navigation");
  const storedForce = await page.evaluate(() => JSON.parse(sessionStorage.getItem("supply-war.playtest-map")).nodes[0].force);
  if (storedForce !== 123) throw new Error("Playtest storage did not contain the current editor draft");
  await page.screenshot({ path: "agents/tmp/2026-08-27-browser-map-editor/output/playtest.png", fullPage: true });

  await page.getByRole("link", { name: "Back to editor" }).click();
  await page.getByText(/Restored your playtest draft/).waitFor();
  if (await page.locator("#file-name").textContent() !== "custom-map.json") throw new Error("Returning from playtest lost the imported filename");
  const returnedCanvas = page.locator("#map-preview");
  const returnedBox = await returnedCanvas.boundingBox();
  if (!returnedBox) throw new Error("Returned editor preview has no visible bounds");
  await clickCanvas(returnedBox, 85, 300);
  inspector = page.locator("#selection-fields .editor-card");
  if (await inspector.getByLabel("Force").inputValue() !== "123") throw new Error("Returning from playtest did not restore the current draft");

  page.once("dialog", async (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset to MVP" }).click();
  await page.getByText(/Reset to the built-in MVP map/).waitFor();
  await clickCanvas(returnedBox, 85, 300);
  if (await page.locator("#selection-fields .editor-card").getByLabel("Label").inputValue() !== "Player Base") throw new Error("Confirmed reset did not restore the MVP map");

  await page.screenshot({ path: "agents/tmp/2026-08-27-browser-map-editor/output/editor.png", fullPage: true });
  await page.evaluate(() => sessionStorage.clear());
  await page.goto("http://127.0.0.1:4173/?playtest=1");
  await page.getByRole("heading", { name: "Playtest draft unavailable." }).waitFor();
  await page.goto("http://127.0.0.1:4173/editor.html?playtest=1");
  await page.getByText(/playtest draft could not be restored.*built-in MVP map is open/i).waitFor();

  console.log(JSON.stringify({ selectionInspector: "passed", connectorRoadDrag: "passed", dragCoordinates: [xBefore, xAfter], resetConfirmation: ["cancel-preserved", "accept-reset"], playtestRoundTrip: "passed", playtestFallback: "passed", jsonRoundTrip: "passed" }, null, 2));
} finally {
  await browser.close();
}
