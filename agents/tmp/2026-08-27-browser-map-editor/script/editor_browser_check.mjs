import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const baseMap = JSON.parse(await readFile(new URL("../../../../maps/mvp.json", import.meta.url), "utf8"));
const importedMap = structuredClone(baseMap);
importedMap.nodes[0].label = "Imported Player Base";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });

try {
  await page.goto("http://127.0.0.1:4173/");
  const editorEntry = page.getByRole("link", { name: "Map editor" });
  if (!await editorEntry.isVisible()) throw new Error("The game page does not show the map editor entry");
  await editorEntry.click();
  await page.getByRole("heading", { name: "Map editor" }).waitFor();

  if (await page.locator("#node-fields .editor-card").count() !== 5) throw new Error("The editor did not render all nodes");
  if (await page.locator("#road-fields .editor-card").count() !== 6) throw new Error("The editor did not render all roads");
  if (await page.locator("#transport-fields .editor-card").count() !== 2) throw new Error("The editor did not render all initial transports");
  if (await page.locator("#settings-fields input, #settings-fields select").count() !== 6) throw new Error("Not every top-level/settings field is editable");
  if (await page.locator("#node-fields .editor-card").first().locator("input, select").count() !== 8) throw new Error("Not every node field is editable");
  if (await page.locator("#road-fields .editor-card").first().locator("input, select").count() !== 4) throw new Error("Not every road field is editable");
  if (await page.locator("#transport-fields .editor-card").first().locator("input, select").count() !== 3) throw new Error("Not every initial transport field is editable");

  await page.getByLabel("Logic tick (seconds)").fill("0.2");
  const firstNode = page.locator("#node-fields .editor-card").first();
  await firstNode.getByLabel("Label").fill("Edited Player Base");
  await firstNode.getByLabel("Force").fill("47");
  await firstNode.getByLabel("Production / second").fill("0.6");
  await firstNode.getByLabel("Kind").selectOption("resource");
  const firstRoad = page.locator("#road-fields .editor-card").first();
  await firstRoad.getByLabel("ID", { exact: true }).fill("edited-player-frontline");
  await firstRoad.getByLabel("Width").fill("2");
  await page.locator("#transport-fields .editor-card").first().getByLabel("Owner").selectOption("enemy");

  if (!await page.getByText("Map is valid and ready to save.").isVisible()) throw new Error("Valid edits did not leave the map saveable");
  await firstRoad.getByLabel("Width").fill("0");
  if (!await page.getByText(/width must be greater than 0/).isVisible()) throw new Error("Invalid road feedback was not shown");
  if (!await page.getByRole("button", { name: "Save JSON" }).isDisabled()) throw new Error("Save remained enabled for an invalid map");
  await firstRoad.getByLabel("Width").fill("2");

  await page.getByRole("button", { name: "Add node" }).click();
  if (await page.locator("#node-fields .editor-card").count() !== 6) throw new Error("Add node did not append a node");
  await page.locator("#node-fields .editor-card").last().getByRole("button", { name: "Remove" }).click();
  await page.getByRole("button", { name: "Add road" }).click();
  if (await page.locator("#road-fields .editor-card").count() !== 7) throw new Error("Add road did not append a road");
  if (!await page.getByText("Map is valid and ready to save.").isVisible()) throw new Error("Add road did not choose an available node pair");
  await page.locator("#road-fields .editor-card").last().getByRole("button", { name: "Remove" }).click();
  await page.getByRole("button", { name: "Add transport" }).click();
  if (await page.locator("#transport-fields .editor-card").count() !== 3) throw new Error("Add transport did not append a transport");
  if (!await page.getByText("Map is valid and ready to save.").isVisible()) throw new Error("Add transport did not choose an available road/source owner");
  await page.locator("#transport-fields .editor-card").last().getByRole("button", { name: "Remove" }).click();

  const canvas = page.locator("#map-preview");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Preview canvas has no visible bounds");
  const xBefore = await firstNode.getByLabel("X").inputValue();
  await page.mouse.move(box.x + box.width * 85 / 900, box.y + box.height * 300 / 560);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 160 / 900, box.y + box.height * 240 / 560);
  await page.mouse.up();
  const xAfter = await page.locator("#node-fields .editor-card").first().getByLabel("X").inputValue();
  if (xBefore === xAfter) throw new Error("Dragging a preview node did not edit coordinates");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save JSON" }).click();
  const download = await downloadPromise;
  if (download.suggestedFilename() !== "mvp.json") throw new Error(`Unexpected download name: ${download.suggestedFilename()}`);
  const stream = await download.createReadStream();
  let downloaded = "";
  for await (const chunk of stream) downloaded += chunk.toString();
  const savedMap = JSON.parse(downloaded);
  if (savedMap.settings.logicTickSeconds !== 0.2 || savedMap.nodes[0].label !== "Edited Player Base" || savedMap.roads[0].width !== 2) throw new Error("Downloaded JSON did not contain the form edits");

  await page.locator("#map-file").setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from("{broken") });
  await page.getByText(/current map was not changed/).waitFor();
  if (await page.locator("#node-fields .editor-card").first().getByLabel("Label").inputValue() !== "Edited Player Base") throw new Error("Failed import replaced the current draft");

  await page.locator("#map-file").setInputFiles({ name: "custom-map.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(importedMap)) });
  await page.getByText(/Loaded custom-map.json/).waitFor();
  if (await page.locator("#node-fields .editor-card").first().getByLabel("Label").inputValue() !== "Imported Player Base") throw new Error("Valid import did not replace the form draft");
  if (await page.locator("#file-name").textContent() !== "custom-map.json") throw new Error("The imported filename was not preserved");

  await page.screenshot({ path: "agents/tmp/2026-08-27-browser-map-editor/output/editor.png", fullPage: true });
  console.log(JSON.stringify({ entry: "visible", schemaSections: ["settings", "nodes", "roads", "initialTransports"], addRemove: "passed", dragCoordinates: [xBefore, xAfter], invalidImportPreservedDraft: true, validImportLoaded: true, saveDownload: "mvp.json" }, null, 2));
} finally {
  await browser.close();
}
