import "./editor.css";
import defaultMap from "../maps/mvp.json";
import { Camera2D, type Point2D } from "./camera";
import { validateMap, type MapConfig, type MapNode, type MapTransport, type NodeKind, type Owner, type Road } from "./game";
import { playtestFileNameKey, playtestMapKey } from "./playtest";

type Selection = { kind: "node"; node: MapNode } | { kind: "road"; road: Road } | null;

const preview = document.querySelector<HTMLCanvasElement>("#map-preview")!;
const context = preview.getContext("2d")!;
const fileInput = document.querySelector<HTMLInputElement>("#map-file")!;
const fileName = document.querySelector<HTMLElement>("#file-name")!;
const mapStatus = document.querySelector<HTMLElement>("#map-status")!;
const saveButton = document.querySelector<HTMLButtonElement>("#save-map")!;
const playtestLink = document.querySelector<HTMLAnchorElement>("#playtest-link")!;
const settingsFields = document.querySelector<HTMLElement>("#settings-fields")!;
const selectionFields = document.querySelector<HTMLElement>("#selection-fields")!;
const nodeCount = document.querySelector<HTMLElement>("#node-count")!;
const roadCount = document.querySelector<HTMLElement>("#road-count")!;
const zoomLevel = document.querySelector<HTMLElement>("#zoom-level")!;
const fitMapButton = document.querySelector<HTMLButtonElement>("#fit-map")!;
const camera = new Camera2D(preview.width, preview.height);

const ownerOptions: Owner[] = ["player", "enemy", "neutral"];
const kindOptions: NodeKind[] = ["base", "resource", "ordinary"];
const ownerColors: Record<Owner, string> = { player: "#42c97a", enemy: "#ed5d62", neutral: "#8d9aa7" };

function initialState(): { draft: MapConfig; fileName: string; restored: boolean; restoreProblem: boolean } {
  if (new URLSearchParams(window.location.search).has("playtest")) {
    const stored = sessionStorage.getItem(playtestMapKey);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        validateMap(parsed);
        return { draft: structuredClone(parsed), fileName: sessionStorage.getItem(playtestFileNameKey) ?? "playtest-map.json", restored: true, restoreProblem: false };
      } catch (error) {
        console.warn("Could not restore the playtest draft because its stored map is invalid; opening the authored MVP map.", error);
      }
    } else {
      console.warn("Could not restore the playtest draft because browser session storage is empty; opening the authored MVP map.");
    }
    return { draft: structuredClone(defaultMap) as MapConfig, fileName: "mvp.json", restored: false, restoreProblem: true };
  }
  return { draft: structuredClone(defaultMap) as MapConfig, fileName: "mvp.json", restored: false, restoreProblem: false };
}

const initial = initialState();
let draft = initial.draft;
let downloadName = initial.fileName;
let selection: Selection = null;
let movingNode: MapNode | null = null;
let roadSource: MapNode | null = null;
let roadDragPoint: Point2D | null = null;
let pan: { pointerId: number; last: Point2D } | null = null;
camera.fit(draft.nodes);

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

function transportForRoad(road: Road): MapTransport | undefined {
  const key = endpointKey(road.a, road.b);
  return draft.initialTransports.find((transport) => endpointKey(transport.source, transport.target) === key);
}

function updateRoadEndpoint(road: Road, endpoint: "a" | "b", value: string): void {
  const previous = road[endpoint];
  const transport = transportForRoad(road);
  road[endpoint] = value;
  if (!transport) return;
  if (transport.source === previous) transport.source = value;
  if (transport.target === previous) transport.target = value;
}

function defaultTransport(road: Road): MapTransport {
  const aOwner = draft.nodes.find((node) => node.id === road.a)?.owner;
  const bOwner = draft.nodes.find((node) => node.id === road.b)?.owner;
  if (aOwner === "player" || aOwner === "enemy") return { source: road.a, target: road.b, owner: aOwner };
  if (bOwner === "player" || bOwner === "enemy") return { source: road.b, target: road.a, owner: bOwner };
  return { source: road.a, target: road.b, owner: "player" };
}

function transportEditor(road: Road): HTMLElement {
  const root = document.createElement("section");
  root.className = "transport-editor";
  const heading = document.createElement("div");
  heading.className = "card-heading";
  const title = document.createElement("h4");
  title.textContent = "Initial transport";
  const transport = transportForRoad(road);
  const action = document.createElement("button");
  action.type = "button";
  action.textContent = transport ? "Remove transport" : "Add transport";
  action.className = transport ? "danger" : "";
  action.addEventListener("click", () => {
    if (transport) draft.initialTransports.splice(draft.initialTransports.indexOf(transport), 1);
    else draft.initialTransports.push(defaultTransport(road));
    renderAll(transport ? "Removed the road's initial transport." : "Added an initial transport to the selected road.");
  });
  heading.append(title, action);
  root.append(heading);
  if (!transport) {
    root.append(emptyState("This road has no initial transport."));
    return root;
  }

  const fields = document.createElement("div");
  fields.className = "field-grid";
  const endpoints = [road.a, road.b];
  fields.append(
    field("Source", selectInput(transport.source, endpoints, (value) => { transport.source = value; })),
    field("Target", selectInput(transport.target, endpoints, (value) => { transport.target = value; })),
    field("Owner", selectInput(transport.owner, ownerOptions, (value) => { transport.owner = value; })),
  );
  root.append(fields);
  return root;
}

function renderInspector(): void {
  selectionFields.replaceChildren();
  if (!selection) {
    selectionFields.append(emptyState("No object selected. Click a node or road in the preview."));
    return;
  }

  if (selection.kind === "node") {
    const node = selection.node;
    const item = card(`Node: ${node.label || node.id || "Untitled"}`, () => {
      draft.nodes.splice(draft.nodes.indexOf(node), 1);
      selection = null;
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
    selectionFields.append(item.root);
    return;
  }

  const road = selection.road;
  const item = card(`Road: ${road.id || "Untitled"}`, () => {
    const transport = transportForRoad(road);
    if (transport) draft.initialTransports.splice(draft.initialTransports.indexOf(transport), 1);
    draft.roads.splice(draft.roads.indexOf(road), 1);
    selection = null;
    renderAll();
  });
  item.fields.append(
    field("ID", textInput(road.id, (value) => { road.id = value; })),
    field("Width", numberInput(road.width, (value) => { road.width = value; }, Number.MIN_VALUE)),
    field("Endpoint A", selectInput(road.a, nodeReferences(road.a), (value) => { updateRoadEndpoint(road, "a", value); })),
    field("Endpoint B", selectInput(road.b, nodeReferences(road.b), (value) => { updateRoadEndpoint(road, "b", value); })),
  );
  item.root.append(transportEditor(road));
  selectionFields.append(item.root);
}

function endpointKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

function roadBetween(a: string, b: string): Road | undefined {
  const key = endpointKey(a, b);
  return draft.roads.find((road) => endpointKey(road.a, road.b) === key);
}

function connectorPoint(node: MapNode): { x: number; y: number } {
  const screen = camera.worldToScreen(node);
  return {
    x: screen.x > preview.width - 40 ? screen.x - 25 : screen.x + 25,
    y: screen.y < 40 ? screen.y + 25 : screen.y - 25,
  };
}

function drawGrid(): void {
  const topLeft = camera.screenToWorld({ x: 0, y: 0 });
  const bottomRight = camera.screenToWorld({ x: preview.width, y: preview.height });
  let spacing = 100;
  while (spacing * camera.zoom < 45) spacing *= 2;
  while (spacing * camera.zoom > 130) spacing /= 2;
  const startX = Math.floor(topLeft.x / spacing) * spacing;
  const startY = Math.floor(topLeft.y / spacing) * spacing;
  context.strokeStyle = "#223241";
  context.lineWidth = 1;
  for (let x = startX; x <= bottomRight.x; x += spacing) {
    const screenX = camera.worldToScreen({ x, y: 0 }).x;
    context.beginPath();
    context.moveTo(screenX, 0);
    context.lineTo(screenX, preview.height);
    context.stroke();
  }
  for (let y = startY; y <= bottomRight.y; y += spacing) {
    const screenY = camera.worldToScreen({ x: 0, y }).y;
    context.beginPath();
    context.moveTo(0, screenY);
    context.lineTo(preview.width, screenY);
    context.stroke();
  }
}

function drawPreview(): void {
  context.clearRect(0, 0, preview.width, preview.height);
  context.fillStyle = "#17212b";
  context.fillRect(0, 0, preview.width, preview.height);
  drawGrid();
  zoomLevel.textContent = `${Math.round(camera.zoom * 100)}%`;
  preview.dataset.cameraX = camera.centerX.toFixed(2);
  preview.dataset.cameraY = camera.centerY.toFixed(2);
  preview.dataset.cameraZoom = camera.zoom.toFixed(4);

  const nodeById = new Map(draft.nodes.map((node) => [node.id, node]));
  for (const road of draft.roads) {
    const a = nodeById.get(road.a);
    const b = nodeById.get(road.b);
    if (!a || !b || !Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(b.x) || !Number.isFinite(b.y)) continue;
    const screenA = camera.worldToScreen(a);
    const screenB = camera.worldToScreen(b);
    const selected = selection?.kind === "road" && selection.road === road;
    context.strokeStyle = selected ? "#f0bd4f" : "#61778b";
    context.lineWidth = (Number.isFinite(road.width) ? Math.max(2, Math.min(12, road.width * 4)) : 2) + (selected ? 3 : 0);
    context.beginPath();
    context.moveTo(screenA.x, screenA.y);
    context.lineTo(screenB.x, screenB.y);
    context.stroke();
  }

  if (roadSource && roadDragPoint) {
    const target = nodeAt(roadDragPoint);
    const canAdd = target && target !== roadSource && !roadBetween(roadSource.id, target.id);
    context.save();
    context.setLineDash([10, 7]);
    context.strokeStyle = canAdd ? "#42c97a" : "#b9c5d0";
    context.lineWidth = 4;
    context.beginPath();
    const source = camera.worldToScreen(roadSource);
    context.moveTo(source.x, source.y);
    context.lineTo(roadDragPoint.x, roadDragPoint.y);
    context.stroke();
    context.restore();
  }

  for (const node of draft.nodes) {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
    const screen = camera.worldToScreen(node);
    if (selection?.kind === "node" && selection.node === node) {
      context.strokeStyle = "#f0bd4f";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(screen.x, screen.y, 30, 0, Math.PI * 2);
      context.stroke();
    }
    context.fillStyle = ownerColors[node.owner] ?? "#8d9aa7";
    context.beginPath();
    context.arc(screen.x, screen.y, node === movingNode ? 25 : 23, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = node.kind === "base" ? "#ffffff" : node.kind === "resource" ? "#f0bd4f" : "#17212b";
    context.lineWidth = node.kind === "ordinary" ? 2 : 4;
    context.stroke();
    context.fillStyle = "#e6edf3";
    context.font = "600 13px system-ui";
    context.textAlign = "center";
    context.fillText(node.label || node.id || "Untitled", screen.x, screen.y + 42);

    const connector = connectorPoint(node);
    context.fillStyle = node === roadSource ? "#42c97a" : "#dbe7ef";
    context.strokeStyle = "#17212b";
    context.lineWidth = 2;
    context.fillRect(connector.x - 6, connector.y - 6, 12, 12);
    context.strokeRect(connector.x - 6, connector.y - 6, 12, 12);
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
    playtestLink.classList.remove("disabled");
    playtestLink.setAttribute("aria-disabled", "false");
    setStatus(successMessage ?? "Map is valid and ready to save or playtest.", false);
    return true;
  } catch (error) {
    saveButton.disabled = true;
    playtestLink.classList.add("disabled");
    playtestLink.setAttribute("aria-disabled", "true");
    const reason = error instanceof Error ? error.message : "The map data is invalid";
    setStatus(`Map cannot be saved or playtested yet. ${reason}. Update the form and try again.`, true);
    return false;
  }
}

function refresh(): void {
  drawPreview();
  updateValidity();
}

function renderAll(successMessage?: string): void {
  renderSettings();
  renderInspector();
  nodeCount.textContent = String(draft.nodes.length);
  roadCount.textContent = String(draft.roads.length);
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

document.querySelector<HTMLButtonElement>("#add-node")!.addEventListener("click", () => {
  const center = camera.screenToWorld({ x: preview.width / 2, y: preview.height / 2 });
  const node: MapNode = { id: nextId("node", draft.nodes.map((candidate) => candidate.id)), label: "New Node", owner: "neutral", force: 0, production: 0, kind: "ordinary", x: Math.round(center.x), y: Math.round(center.y) };
  draft.nodes.push(node);
  selection = { kind: "node", node };
  renderAll("Added and selected a new node. Drag it in the preview to place it.");
});

document.querySelector<HTMLButtonElement>("#reset-map")!.addEventListener("click", () => {
  const confirmed = window.confirm("Reset to the built-in MVP map? Unsaved editor changes will be lost. Save JSON first if you want to keep them.");
  if (!confirmed) {
    setStatus("Reset canceled. Your current map was not changed.", false);
    return;
  }
  draft = structuredClone(defaultMap) as MapConfig;
  downloadName = "mvp.json";
  selection = null;
  camera.fit(draft.nodes);
  renderAll("Reset to the built-in MVP map. The map is valid and ready to save or playtest.");
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    const parsed: unknown = JSON.parse(await file.text());
    validateMap(parsed);
    draft = structuredClone(parsed);
    downloadName = file.name.toLowerCase().endsWith(".json") ? file.name : `${file.name}.json`;
    selection = null;
    camera.fit(draft.nodes);
    renderAll(`Loaded ${file.name}. The map is valid and ready to edit, save, or playtest.`);
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

playtestLink.addEventListener("click", (event) => {
  event.preventDefault();
  if (!updateValidity()) {
    setStatus("This map cannot be playtested yet. Fix the validation issue shown in the editor, then try again.", true);
    return;
  }
  sessionStorage.setItem(playtestMapKey, JSON.stringify(draft));
  sessionStorage.setItem(playtestFileNameKey, downloadName);
  window.location.href = playtestLink.href;
});

function previewPoint(event: MouseEvent): Point2D {
  const bounds = preview.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * preview.width / bounds.width,
    y: (event.clientY - bounds.top) * preview.height / bounds.height,
  };
}

function nodeAt(point: { x: number; y: number }): MapNode | undefined {
  return [...draft.nodes].reverse().find((node) => {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return false;
    const screen = camera.worldToScreen(node);
    return Math.hypot(screen.x - point.x, screen.y - point.y) <= 27;
  });
}

function connectorAt(point: { x: number; y: number }): MapNode | undefined {
  return [...draft.nodes].reverse().find((node) => {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return false;
    const connector = connectorPoint(node);
    return Math.abs(connector.x - point.x) <= 10 && Math.abs(connector.y - point.y) <= 10;
  });
}

function pointLineDistance(point: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

function roadAt(point: { x: number; y: number }): Road | undefined {
  for (const road of [...draft.roads].reverse()) {
    const a = draft.nodes.find((node) => node.id === road.a);
    const b = draft.nodes.find((node) => node.id === road.b);
    if (a && b && pointLineDistance(point, camera.worldToScreen(a), camera.worldToScreen(b)) <= Math.max(8, road.width * 2 + 3)) return road;
  }
  return undefined;
}

preview.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  const point = previewPoint(event);
  const connector = connectorAt(point);
  if (connector) {
    roadSource = connector;
    roadDragPoint = point;
    selection = { kind: "node", node: connector };
    preview.setPointerCapture(event.pointerId);
    renderInspector();
    drawPreview();
    return;
  }

  const node = nodeAt(point);
  if (node) {
    movingNode = node;
    selection = { kind: "node", node };
    preview.setPointerCapture(event.pointerId);
    renderInspector();
    drawPreview();
    return;
  }

  const road = roadAt(point);
  if (road) {
    selection = { kind: "road", road };
    renderInspector();
    drawPreview();
    return;
  }

  selection = null;
  pan = { pointerId: event.pointerId, last: point };
  preview.setPointerCapture(event.pointerId);
  renderInspector();
  drawPreview();
});

preview.addEventListener("pointermove", (event) => {
  const point = previewPoint(event);
  if (roadSource) {
    roadDragPoint = point;
    drawPreview();
    return;
  }
  if (movingNode) {
    const world = camera.screenToWorld(point);
    movingNode.x = Math.round(world.x);
    movingNode.y = Math.round(world.y);
    refresh();
    return;
  }
  if (pan?.pointerId === event.pointerId) {
    camera.panByPixels(point.x - pan.last.x, point.y - pan.last.y);
    pan.last = point;
    preview.style.cursor = "grabbing";
    drawPreview();
    return;
  }
  preview.style.cursor = connectorAt(point) ? "crosshair" : nodeAt(point) ? "move" : roadAt(point) ? "pointer" : "default";
});

function releasePointer(event: PointerEvent): void {
  if (preview.hasPointerCapture(event.pointerId)) preview.releasePointerCapture(event.pointerId);
}

preview.addEventListener("pointerup", (event) => {
  if (roadSource) {
    const source = roadSource;
    const target = nodeAt(previewPoint(event));
    roadSource = null;
    roadDragPoint = null;
    releasePointer(event);
    if (!target || target === source) {
      renderAll("Road was not added. Drag the square connector onto a different node.");
      return;
    }
    const existing = roadBetween(source.id, target.id);
    if (existing) {
      selection = { kind: "road", road: existing };
      renderAll("Those nodes are already connected. The existing road is selected.");
      return;
    }
    const road: Road = { id: nextId("road", draft.roads.map((candidate) => candidate.id)), a: source.id, b: target.id, width: 1 };
    draft.roads.push(road);
    selection = { kind: "road", road };
    renderAll(`Added and selected road ${road.id}.`);
    return;
  }

  if (movingNode) {
    movingNode = null;
    releasePointer(event);
    renderAll();
    return;
  }

  if (pan?.pointerId === event.pointerId) {
    pan = null;
    releasePointer(event);
    preview.style.cursor = "grab";
    drawPreview();
  }
});

preview.addEventListener("pointercancel", (event) => {
  roadSource = null;
  roadDragPoint = null;
  movingNode = null;
  pan = null;
  releasePointer(event);
  renderAll();
});

preview.addEventListener("wheel", (event) => {
  event.preventDefault();
  camera.zoomAt(previewPoint(event), Math.exp(-event.deltaY * 0.0015));
  drawPreview();
}, { passive: false });

fitMapButton.addEventListener("click", () => {
  camera.fit(draft.nodes);
  drawPreview();
  setStatus("Fit all nodes in the editor viewport. Map coordinates were not changed.", false);
});

renderAll(
  initial.restored
    ? "Restored your playtest draft. Continue editing, save it, or playtest again."
    : initial.restoreProblem
      ? "The playtest draft could not be restored. The built-in MVP map is open instead; load saved JSON or continue from here."
      : undefined,
);
