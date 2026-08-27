import "./style.css";
import { Camera2D, type Point2D } from "./camera";
import { Simulation, validateMap, type MapConfig, type NodeState, type Owner, type Transport } from "./game";
import { levelById, levels, nextLevel, type LevelDefinition } from "./levels";
import { playtestMapKey } from "./playtest";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const context = canvas.getContext("2d")!;
const status = document.querySelector<HTMLElement>("#status")!;
const restart = document.querySelector<HTMLButtonElement>("#restart")!;
const editorLink = document.querySelector<HTMLAnchorElement>("#editor-link")!;
const levelControl = document.querySelector<HTMLElement>("#level-control")!;
const levelPicker = document.querySelector<HTMLSelectElement>("#level-picker")!;
const nextLevelButton = document.querySelector<HTMLButtonElement>("#next-level")!;
const speedControl = document.querySelector<HTMLElement>("#speed-control")!;
const speedInput = document.querySelector<HTMLInputElement>("#playtest-speed")!;
const speedValue = document.querySelector<HTMLOutputElement>("#speed-value")!;

type Page = { config: MapConfig; mode: "level"; level: LevelDefinition } | { config: MapConfig; mode: "playtest" | "fallback"; level?: undefined };

function pageConfig(): Page {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("playtest")) {
    const level = levelById(params.get("level"));
    return { config: level.config, mode: "level", level };
  }
  const stored = sessionStorage.getItem(playtestMapKey);
  if (!stored) {
    console.warn("Could not load the playtest draft because browser session storage is empty; using the authored MVP map.");
    return { config: levelById("mvp").config, mode: "fallback" };
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    validateMap(parsed);
    return { config: parsed, mode: "playtest" };
  } catch (error) {
    console.warn("Could not load the playtest draft because its stored map is invalid; using the authored MVP map.", error);
    return { config: levelById("mvp").config, mode: "fallback" };
  }
}

const page = pageConfig();
const config = page.config;
const successor = page.level ? nextLevel(page.level.id) : undefined;
const tutorialLevels = levels.filter((level) => level.kind === "tutorial");

if (page.mode === "level") {
  for (const level of levels) {
    const option = document.createElement("option");
    option.value = level.id;
    option.textContent = level.pickerLabel;
    levelPicker.append(option);
  }
  levelPicker.value = page.level.id;
  levelControl.hidden = false;
  const tutorialNumber = tutorialLevels.findIndex((level) => level.id === page.level.id) + 1;
  document.querySelector<HTMLElement>("#mode-label")!.textContent = page.level.kind === "tutorial"
    ? `SUPPLY WAR · TUTORIAL ${tutorialNumber}/${tutorialLevels.length} · ${page.level.mechanism}`
    : "SUPPLY WAR · FINAL EXAM";
  document.querySelector<HTMLElement>("#mission-title")!.textContent = page.level.title;
  document.querySelector<HTMLElement>("#briefing")!.textContent = page.level.briefing;
  document.querySelector<HTMLElement>("#hint")!.textContent = page.level.hint;
} else if (page.mode === "playtest") {
  document.querySelector<HTMLElement>("#mode-label")!.textContent = "SUPPLY WAR · MAP PLAYTEST";
  document.querySelector<HTMLElement>("#mission-title")!.textContent = "Playtest your current map.";
  document.querySelector<HTMLElement>("#briefing")!.textContent = "This simulation uses the valid draft stored by the map editor.";
  document.querySelector<HTMLElement>("#hint")!.textContent = "Use the speed bar to accelerate simulation. Drag empty map space to pan and use the wheel to zoom.";
  editorLink.textContent = "Back to editor";
  editorLink.href = "./editor.html?playtest=1";
  speedControl.hidden = false;
} else {
  document.querySelector<HTMLElement>("#mode-label")!.textContent = "SUPPLY WAR · PLAYTEST FALLBACK";
  document.querySelector<HTMLElement>("#mission-title")!.textContent = "Playtest draft unavailable.";
  document.querySelector<HTMLElement>("#briefing")!.textContent = "The stored editor draft could not be loaded, so the authored MVP map is running instead.";
  document.querySelector<HTMLElement>("#hint")!.textContent = "Return to the editor and start the playtest again.";
  editorLink.textContent = "Open editor";
}

levelPicker.addEventListener("change", () => {
  window.location.search = `?level=${encodeURIComponent(levelPicker.value)}`;
});

nextLevelButton.addEventListener("click", () => {
  if (successor) window.location.search = `?level=${encodeURIComponent(successor.id)}`;
});

let game = new Simulation(config);
const camera = new Camera2D(canvas.width, canvas.height);
camera.fit(config.nodes);
let dragSource: string | null = null;
let dragPoint: Point2D | null = null;
let pan: { pointerId: number; last: Point2D } | null = null;
let lastFrame = performance.now();
let accumulator = 0;
let speedMultiplier = 1;
const colors: Record<Owner, string> = { player: "#42c97a", enemy: "#ed5d62", neutral: "#8d9aa7" };

function toCanvas(event: MouseEvent): Point2D {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
}

function nodeAt(point: Point2D): NodeState | undefined {
  return [...game.nodes.values()].find((node) => {
    const screen = camera.worldToScreen(node);
    return Math.hypot(screen.x - point.x, screen.y - point.y) < 34;
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

function canStartPlayerTransport(source: string, target: NodeState | undefined): boolean {
  if (!target || target.id === source) return false;
  const road = game.roadBetween(source, target.id);
  return road !== undefined && !game.activeOnRoad(road.id);
}

function drawDirectionTriangle(a: Point2D, b: Point2D, t: number, color: string): void {
  const x = a.x + (b.x - a.x) * t;
  const y = a.y + (b.y - a.y) * t;
  context.save();
  context.translate(x, y);
  context.rotate(Math.atan2(b.y - a.y, b.x - a.x));
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(9, 0);
  context.lineTo(-6, -6);
  context.lineTo(-6, 6);
  context.closePath();
  context.fill();
  context.restore();
}

function drawRoad(transport: Transport | undefined, a: NodeState, b: NodeState): void {
  const screenA = camera.worldToScreen(a);
  const screenB = camera.worldToScreen(b);
  context.lineWidth = transport ? 9 : 5;
  context.strokeStyle = transport ? colors[transport.owner] : "#536475";
  context.globalAlpha = transport ? 0.82 : 0.8;
  context.beginPath(); context.moveTo(screenA.x, screenA.y); context.lineTo(screenB.x, screenB.y); context.stroke(); context.globalAlpha = 1;
  if (!transport) return;
  const phase = game.time % 1;
  for (let i = 0; i < 3; i++) drawDirectionTriangle(screenA, screenB, 0.14 + ((phase + i / 3) % 1) * 0.72, "#f7fbff");
}

function drawDragPreview(): void {
  if (!dragSource || !dragPoint) return;
  const source = camera.worldToScreen(game.node(dragSource));
  const target = nodeAt(dragPoint);
  const valid = canStartPlayerTransport(dragSource, target);
  const color = valid ? colors.player : "#b9c5d0";
  context.save();
  context.setLineDash([9, 7]);
  context.lineWidth = 4;
  context.strokeStyle = color;
  context.globalAlpha = 0.9;
  context.beginPath();
  context.moveTo(source.x, source.y);
  context.lineTo(dragPoint.x, dragPoint.y);
  context.stroke();
  context.restore();
  drawDirectionTriangle(source, dragPoint, 0.82, color);
  if (valid && target) {
    const targetScreen = camera.worldToScreen(target);
    context.strokeStyle = color;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(targetScreen.x, targetScreen.y, 38, 0, Math.PI * 2);
    context.stroke();
  }
}

function isBesieged(node: NodeState): boolean {
  const targeting = game.transports.filter((transport) => transport.active && transport.target === node.id);
  return targeting.some((transport) => game.mode(transport) === "attack") && !targeting.some((transport) => game.mode(transport) === "support");
}

function drawNode(node: NodeState): void {
  const screen = camera.worldToScreen(node);
  if (isBesieged(node)) {
    context.strokeStyle = "#ff334d";
    context.lineWidth = 5;
    context.beginPath();
    context.arc(screen.x, screen.y, 40 + Math.sin(game.time * 5) * 2, 0, Math.PI * 2);
    context.stroke();
  }
  context.fillStyle = colors[node.owner];
  context.beginPath();
  context.arc(screen.x, screen.y, 31, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = node.kind === "base" ? "#fff" : node.kind === "resource" ? "#f0bd4f" : "#1a2530";
  context.lineWidth = node.kind === "ordinary" ? 2 : 5;
  context.stroke();
  context.fillStyle = "#10151c";
  context.font = "700 18px system-ui";
  context.textAlign = "center";
  context.fillText(String(Math.round(node.force)), screen.x, screen.y + 6);
  context.fillStyle = "#dbe7ef";
  context.font = "600 12px system-ui";
  context.fillText(node.label, screen.x, screen.y + 53);
  if (node.kind !== "ordinary") {
    context.fillStyle = "#f0bd4f";
    context.font = "700 11px system-ui";
    context.fillText(node.kind.toUpperCase(), screen.x, screen.y - 43);
  }
}

function render(): void {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#17212b";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (const road of game.roads.values()) {
    const active = game.activeOnRoad(road.id);
    drawRoad(active, active ? game.node(active.source) : game.node(road.a), active ? game.node(active.target) : game.node(road.b));
  }
  drawDragPreview();
  for (const node of game.nodes.values()) drawNode(node);
  context.fillStyle = "#b9c5d0";
  context.font = "13px system-ui";
  context.textAlign = "left";
  const tickRate = 1 / config.settings.logicTickSeconds;
  context.fillText(`Simulation ${game.time.toFixed(1)}s · ${tickRate.toFixed(0)} Hz${page.mode === "playtest" ? ` · ${speedMultiplier}×` : ""}`, 18, 28);
  canvas.dataset.simulationTime = game.time.toFixed(2);
  canvas.dataset.levelId = page.level?.id ?? page.mode;
  canvas.dataset.cameraX = camera.centerX.toFixed(2);
  canvas.dataset.cameraY = camera.centerY.toFixed(2);
  canvas.dataset.cameraZoom = camera.zoom.toFixed(4);
  const target = dragPoint ? nodeAt(dragPoint) : undefined;
  nextLevelButton.hidden = game.winner !== "player" || !successor;
  if (game.winner === "player" && successor && page.level) {
    status.textContent = `Victory — ${page.level.pickerLabel} complete. Continue to ${successor.pickerLabel}.`;
  } else if (game.winner === "player" && page.level?.kind === "final-exam") {
    status.textContent = "Final exam complete — campaign cleared.";
  } else if (game.winner === "player") {
    status.textContent = "Victory — the enemy base surrendered.";
  } else if (dragSource && canStartPlayerTransport(dragSource, target)) {
    status.textContent = `Release to send forces to ${target!.label}.`;
  } else if (dragSource) {
    status.textContent = "Drag to an unused adjacent road, then release.";
  } else {
    status.textContent = "Capture the enemy base to win.";
  }
}

function frame(now: number): void {
  accumulator += Math.min((now - lastFrame) / 1000, 0.25) * speedMultiplier;
  lastFrame = now;
  while (accumulator >= config.settings.logicTickSeconds) {
    game.step();
    accumulator -= config.settings.logicTickSeconds;
  }
  render();
  requestAnimationFrame(frame);
}

speedInput.addEventListener("input", () => {
  speedMultiplier = speedInput.valueAsNumber;
  speedValue.value = `${speedMultiplier}×`;
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  const point = toCanvas(event);
  const node = nodeAt(point);
  if (node?.owner === "player") {
    dragSource = node.id;
    dragPoint = point;
  } else {
    pan = { pointerId: event.pointerId, last: point };
  }
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  const point = toCanvas(event);
  if (dragSource) {
    dragPoint = point;
    return;
  }
  if (pan?.pointerId === event.pointerId) {
    camera.panByPixels(point.x - pan.last.x, point.y - pan.last.y);
    pan.last = point;
    canvas.style.cursor = "grabbing";
  }
});

canvas.addEventListener("pointerup", (event) => {
  if (dragSource) {
    const source = dragSource;
    const target = nodeAt(toCanvas(event));
    if (canStartPlayerTransport(source, target) && target) game.startTransport(source, target.id, "player");
    dragSource = null;
    dragPoint = null;
  }
  if (pan?.pointerId === event.pointerId) {
    pan = null;
    canvas.style.cursor = "grab";
  }
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("pointercancel", (event) => {
  dragSource = null;
  dragPoint = null;
  pan = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  const point = toCanvas(event);
  for (const transport of game.transports.filter((candidate) => candidate.active && candidate.owner === "player")) {
    const a = camera.worldToScreen(game.node(transport.source));
    const b = camera.worldToScreen(game.node(transport.target));
    if (pointLineDistance(point, a, b) < 16) {
      game.cancelTransport(transport.id);
      break;
    }
  }
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  camera.zoomAt(toCanvas(event), Math.exp(-event.deltaY * 0.0015));
}, { passive: false });

restart.addEventListener("click", () => {
  game = new Simulation(config);
  accumulator = 0;
});

requestAnimationFrame(frame);
