import "./editor.css";
import defaultMap from "../maps/mvp.json";
import { validateMap, type MapConfig, type MapNode, type MapTransport, type NodeKind, type Owner, type Road } from "./game";

const preview = document.querySelector<HTMLCanvasElement>("#map-preview")!;
const context = preview.getContext("2d")!;
const fileInput = document.querySelector<HTMLInputElement>("#map-file")!;
const fileName = document.querySelector<HTMLElement>("#file-name")!;
const mapStatus = document.querySelector<HTMLElement>("#map-status")!;
const saveButton = document.querySelector<HTMLButtonElement>("#save-map")!;
const settingsFields = document.querySelector<HTMLElement>("#settings-fields")!;
const nodeFields = document.querySelector<HTMLElement>("#node-fields")!;
const roadFields = document.querySelector<HTMLElement>("#road-fields")!;
const transportFields = document.querySelector<HTMLElement>("#transport-fields")!;
const nodeCount = document.querySelector<HTMLElement>("#node-count")!;
const roadCount = document.querySelector<HTMLElement>("#road-count")!;
const transportCount = document.querySelector<HTMLElement>("#transport-count")!;

let draft = structuredClone(defaultMap) as MapConfig;
let downloadName = "mvp.json";
let draggedNode: MapNode | null = null;

const ownerOptions: Owner[] = ["player", "enemy", "neutral"];
const kindOptions: NodeKind[] = ["base", "resource", "ordinary"];
const ownerColors: Record<Owner, string> = { player: "#42c97a", enemy: "#ed5d62", neutral: "#8d9aa7" };

function field(labelText: string, control: HTMLElement, help?: string): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "field";
  label.append(labelText, control);
  if (help) {
    const hint = document.createElement("small");
    hint.textContent = help;
    label.append(hint);
  }
  return label;
}

function textInput(value: string, onInput: (value: string) => void): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.required = true;
  input.value = value;
  input.addEventListener("input", () => {
    onInput(input.value);
    refresh();
  });
  return input;
}

function numberInput(value: number, onInput: (value: number) => void, minimum?: number, step = "any"): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "number";
  input.required = true;
  input.step = step;
  if (minimum !== undefined) input.min = String(minimum);
  input.value = Number.isFinite(value) ? String(value) : "";
  input.addEventListener("input", () => {
    onInput(input.valueAsNumber);
    refresh();
  });
  return input;
}

function selectInput<T extends string>(value: string, options: readonly T[], onInput: (value: T) => void): HTMLSelectElement {
  const select = document.createElement("select");
  const values = options.includes(value as T) ? options : [value as T, ...options];
  for (const optionValue of values) {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue === value && !options.includes(value as T) ? `${optionValue || "(empty)"} — missing` : optionValue;
    select.append(option);
  }
  select.value = value;
  select.addEventListener("change", () => {
    onInput(select.value as T);
    refresh();
  });
  return select;
}

function card(title: string, remove: () => void): { root: HTMLElement; fields: HTMLElement } {
  const root = document.createElement("article");
  root.className = "editor-card";
  const heading = document.createElement("div");
  heading.className = "card-heading";
  const name = document.createElement("h3");
  name.textContent = title;
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "danger";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", remove);
  heading.append(name, removeButton);
  const fields = document.createElement("div");
  fields.className = "field-grid";
  root.append(heading, fields);
  return { root, fields };
}

function emptyState(message: string): HTMLElement {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

function nodeReferences(current: string): string[] {
  const ids = [...new Set(draft.nodes.map((node) => node.id).filter(Boolean))];
  return current && !ids.includes(current) ? [current, ...ids] : ids;
}

function renderSettings(): void {
  settingsFields.replaceChildren(
    field("Version", numberInput(draft.version, (value) => { draft.version = value; }, 1, "1"), "Supported schema: version 1"),
    field("Siege formula", selectInput(draft.settings.siegeFormula, ["exponential-half-life"], (value) => { draft.settings.siegeFormula = value; })),
    field("Logic tick (seconds)", numberInput(draft.settings.logicTickSeconds, (value) => { draft.settings.logicTickSeconds = value; }, Number.MIN_VALUE)),
    field("Siege half-life (seconds)", numberInput(draft.settings.siegeHalfLifeSeconds, (value) => { draft.settings.siegeHalfLifeSeconds = value; }, Number.MIN_VALUE)),
    field("Seconds per distance unit", numberInput(draft.settings.secondsPerDistanceUnit, (value) => { draft.settings.secondsPerDistanceUnit = value; }, Number.MIN_VALUE)),
    field("Force per width unit", numberInput(draft.settings.forcePerWidthUnit, (value) => { draft.settings.forcePerWidthUnit = value; }, Number.MIN_VALUE)),
  );
}

function renderNodes(): void {
  nodeCount.textContent = String(draft.nodes.length);
  nodeFields.replaceChildren();
  if (draft.nodes.length === 0) {
    nodeFields.append(emptyState("No nodes yet. Add a node to begin the map."));
    return;
  }
  for (const [index, node] of draft.nodes.entries()) {
    const item = card(`Node ${index + 1}: ${node.label || "Untitled"}`, () => {
      draft.nodes.splice(index, 1);
      renderAll();
    });
    let previousId = node.id;
    const id = textInput(node.id, (value) => {
      node.id = value;
      for (const road of draft.roads) {
        if (road.a === previousId) road.a = value;
        if (road.b === previousId) road.b = value;
      }
      for (const transport of draft.initialTransports) {
        if (transport.source === previousId) transport.source = value;
        if (transport.target === previousId) transport.target = value;
      }
      previousId = value;
    });
    id.addEventListener("change", () => renderAll());
    item.fields.append(
      field("ID", id),
      field("Label", textInput(node.label, (value) => { node.label = value; })),
      field("Owner", selectInput(node.owner, ownerOptions, (value) => { node.owner = value; })),
      field("Kind", selectInput(node.kind, kindOptions, (value) => { node.kind = value; })),
      field("Force", numberInput(node.force, (value) => { node.force = value; }, 0)),
      field("Production / second", numberInput(node.production, (value) => { node.production = value; }, 0)),
      field("X", numberInput(node.x, (value) => { node.x = value; })),
      field("Y", numberInput(node.y, (value) => { node.y = value; })),
    );
    nodeFields.append(item.root);
  }
}

function renderRoads(): void {
  roadCount.textContent = String(draft.roads.length);
  roadFields.replaceChildren();
  if (draft.roads.length === 0) {
    roadFields.append(emptyState("No roads yet. Add a road to connect two nodes."));
    return;
  }
  for (const [index, road] of draft.roads.entries()) {
    const item = card(`Road ${index + 1}: ${road.id || "Untitled"}`, () => {
      draft.roads.splice(index, 1);
      renderAll();
    });
    item.fields.append(
      field("ID", textInput(road.id, (value) => { road.id = value; })),
      field("Width", numberInput(road.width, (value) => { road.width = value; }, Number.MIN_VALUE)),
      field("Endpoint A", selectInput(road.a, nodeReferences(road.a), (value) => { road.a = value; })),
      field("Endpoint B", selectInput(road.b, nodeReferences(road.b), (value) => { road.b = value; })),
    );
    roadFields.append(item.root);
  }
}

function renderTransports(): void {
  transportCount.textContent = String(draft.initialTransports.length);
  transportFields.replaceChildren();
  if (draft.initialTransports.length === 0) {
    transportFields.append(emptyState("No initial transports. The map will start without active routes."));
    return;
  }
  for (const [index, transport] of draft.initialTransports.entries()) {
    const item = card(`Initial transport ${index + 1}`, () => {
      draft.initialTransports.splice(index, 1);
      renderAll();
    });
    item.fields.append(
      field("Source", selectInput(transport.source, nodeReferences(transport.source), (value) => { transport.source = value; })),
      field("Target", selectInput(transport.target, nodeReferences(transport.target), (value) => { transport.target = value; })),
      field("Owner", selectInput(transport.owner, ownerOptions, (value) => { transport.owner = value; })),
    );
    transportFields.append(item.root);
  }
}

function drawPreview(): void {
  context.clearRect(0, 0, preview.width, preview.height);
  context.fillStyle = "#17212b";
  context.fillRect(0, 0, preview.width, preview.height);
  context.strokeStyle = "#223241";
  context.lineWidth = 1;
  for (let x = 50; x < preview.width; x += 50) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, preview.height);
    context.stroke();
  }
  for (let y = 50; y < preview.height; y += 50) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(preview.width, y);
    context.stroke();
  }

  const nodeById = new Map(draft.nodes.map((node) => [node.id, node]));
  for (const road of draft.roads) {
    const a = nodeById.get(road.a);
    const b = nodeById.get(road.b);
    if (!a || !b || !Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(b.x) || !Number.isFinite(b.y)) continue;
    context.strokeStyle = "#61778b";
    context.lineWidth = Number.isFinite(road.width) ? Math.max(2, Math.min(12, road.width * 4)) : 2;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  }

  for (const node of draft.nodes) {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
    context.fillStyle = ownerColors[node.owner] ?? "#8d9aa7";
    context.beginPath();
    context.arc(node.x, node.y, node === draggedNode ? 27 : 23, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = node.kind === "base" ? "#ffffff" : node.kind === "resource" ? "#f0bd4f" : "#17212b";
    context.lineWidth = node.kind === "ordinary" ? 2 : 4;
    context.stroke();
    context.fillStyle = "#e6edf3";
    context.font = "600 13px system-ui";
    context.textAlign = "center";
    context.fillText(node.label || node.id || "Untitled", node.x, node.y + 42);
  }
}

function setStatus(message: string, error: boolean): void {
  mapStatus.textContent = message;
  mapStatus.classList.toggle("error", error);
}

function updateValidity(successMessage?: string): boolean {
  try {
    validateMap(draft);
    saveButton.disabled = false;
    setStatus(successMessage ?? "Map is valid and ready to save.", false);
    return true;
  } catch (error) {
    saveButton.disabled = true;
    const reason = error instanceof Error ? error.message : "The map data is invalid";
    setStatus(`Map cannot be saved yet. ${reason}. Update the form and try again.`, true);
    return false;
  }
}

function refresh(): void {
  drawPreview();
  updateValidity();
}

function renderAll(successMessage?: string): void {
  renderSettings();
  renderNodes();
  renderRoads();
  renderTransports();
  fileName.textContent = downloadName;
  drawPreview();
  updateValidity(successMessage);
}

function nextId(prefix: string, existing: string[]): string {
  const ids = new Set(existing);
  for (let suffix = 1; ; suffix++) {
    const candidate = `${prefix}-${suffix}`;
    if (!ids.has(candidate)) return candidate;
  }
}

function endpointKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

function unusedNodePair(): [string, string] {
  const occupied = new Set(draft.roads.map((road) => endpointKey(road.a, road.b)));
  for (const [index, a] of draft.nodes.entries()) {
    for (const b of draft.nodes.slice(index + 1)) {
      if (!occupied.has(endpointKey(a.id, b.id))) return [a.id, b.id];
    }
  }
  const first = draft.nodes[0]?.id ?? "";
  return [first, draft.nodes.find((node) => node.id !== first)?.id ?? first];
}

document.querySelector<HTMLButtonElement>("#add-node")!.addEventListener("click", () => {
  draft.nodes.push({ id: nextId("node", draft.nodes.map((node) => node.id)), label: "New Node", owner: "neutral", force: 0, production: 0, kind: "ordinary", x: 450, y: 280 });
  renderAll();
});

document.querySelector<HTMLButtonElement>("#add-road")!.addEventListener("click", () => {
  const [a, b] = unusedNodePair();
  draft.roads.push({ id: nextId("road", draft.roads.map((road) => road.id)), a, b, width: 1 });
  renderAll();
});

document.querySelector<HTMLButtonElement>("#add-transport")!.addEventListener("click", () => {
  const occupied = new Set(draft.initialTransports.map((transport) => endpointKey(transport.source, transport.target)));
  const road = draft.roads.find((candidate) => !occupied.has(endpointKey(candidate.a, candidate.b))) ?? draft.roads[0];
  let source = road?.a ?? draft.nodes[0]?.id ?? "";
  let target = road?.b ?? draft.nodes[1]?.id ?? source;
  let sourceOwner = draft.nodes.find((node) => node.id === source)?.owner;
  const targetOwner = draft.nodes.find((node) => node.id === target)?.owner;
  if (sourceOwner === "neutral" && targetOwner !== "neutral") {
    [source, target] = [target, source];
    sourceOwner = targetOwner;
  }
  const owner: Owner = sourceOwner === "player" || sourceOwner === "enemy" ? sourceOwner : "player";
  draft.initialTransports.push({ source, target, owner });
  renderAll();
});

document.querySelector<HTMLButtonElement>("#reset-map")!.addEventListener("click", () => {
  draft = structuredClone(defaultMap) as MapConfig;
  downloadName = "mvp.json";
  renderAll("Reset to the built-in MVP map. The map is valid and ready to save.");
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    const parsed: unknown = JSON.parse(await file.text());
    validateMap(parsed);
    draft = structuredClone(parsed);
    downloadName = file.name.toLowerCase().endsWith(".json") ? file.name : `${file.name}.json`;
    renderAll(`Loaded ${file.name}. The map is valid and ready to edit or save.`);
  } catch (error) {
    const reason = error instanceof SyntaxError
      ? "The selected file is not valid JSON."
      : error instanceof Error
        ? `${error.message}.`
        : "The selected file is invalid.";
    setStatus(`Could not load ${file.name}. Your current map was not changed. ${reason} Fix the file and try again.`, true);
  } finally {
    fileInput.value = "";
  }
});

saveButton.addEventListener("click", () => {
  if (!updateValidity()) return;
  const blob = new Blob([`${JSON.stringify(draft, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadName;
  link.click();
  URL.revokeObjectURL(url);
  setStatus(`Saved ${downloadName}. Your map remains open for further editing.`, false);
});

function previewPoint(event: PointerEvent): { x: number; y: number } {
  const bounds = preview.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * preview.width / bounds.width,
    y: (event.clientY - bounds.top) * preview.height / bounds.height,
  };
}

preview.addEventListener("pointerdown", (event) => {
  const point = previewPoint(event);
  draggedNode = [...draft.nodes].reverse().find((node) => Number.isFinite(node.x) && Number.isFinite(node.y) && Math.hypot(node.x - point.x, node.y - point.y) <= 30) ?? null;
  if (!draggedNode) return;
  preview.setPointerCapture(event.pointerId);
  drawPreview();
});

preview.addEventListener("pointermove", (event) => {
  if (!draggedNode) return;
  const point = previewPoint(event);
  draggedNode.x = Math.round(Math.max(0, Math.min(preview.width, point.x)));
  draggedNode.y = Math.round(Math.max(0, Math.min(preview.height, point.y)));
  refresh();
});

function finishDrag(event: PointerEvent): void {
  if (!draggedNode) return;
  draggedNode = null;
  if (preview.hasPointerCapture(event.pointerId)) preview.releasePointerCapture(event.pointerId);
  renderAll();
}

preview.addEventListener("pointerup", finishDrag);
preview.addEventListener("pointercancel", finishDrag);

renderAll();
