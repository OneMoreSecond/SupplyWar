import "./style.css";
import mapConfig from "../maps/mvp.json";
import { Simulation, validateMap, type MapConfig, type NodeState, type Owner, type Transport } from "./game";
import { playtestMapKey } from "./playtest";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const context = canvas.getContext("2d")!;
const status = document.querySelector<HTMLElement>("#status")!;
const restart = document.querySelector<HTMLButtonElement>("#restart")!;
const editorLink = document.querySelector<HTMLAnchorElement>("#editor-link")!;

function pageConfig(): { config: MapConfig; playtest: boolean; fallback: boolean } {
  if (!new URLSearchParams(window.location.search).has("playtest")) return { config: mapConfig as MapConfig, playtest: false, fallback: false };
  const stored = sessionStorage.getItem(playtestMapKey);
  if (!stored) {
    console.warn("Could not load the playtest draft because browser session storage is empty; using the authored MVP map.");
    return { config: mapConfig as MapConfig, playtest: false, fallback: true };
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    validateMap(parsed);
    return { config: parsed, playtest: true, fallback: false };
  } catch (error) {
    console.warn("Could not load the playtest draft because its stored map is invalid; using the authored MVP map.", error);
    return { config: mapConfig as MapConfig, playtest: false, fallback: true };
  }
}

const page = pageConfig();
const config = page.config;
if (page.playtest) {
  document.querySelector<HTMLElement>("#mode-label")!.textContent = "SUPPLY WAR · MAP PLAYTEST";
  document.querySelector<HTMLElement>("#mission-title")!.textContent = "Playtest your current map.";
  document.querySelector<HTMLElement>("#briefing")!.textContent = "This simulation uses the valid draft stored by the map editor.";
  document.querySelector<HTMLElement>("#hint")!.textContent = "Restart restores the draft. Return to the editor to keep refining it.";
  editorLink.textContent = "Back to editor";
  editorLink.href = "./editor.html?playtest=1";
} else if (page.fallback) {
  document.querySelector<HTMLElement>("#mode-label")!.textContent = "SUPPLY WAR · PLAYTEST FALLBACK";
  document.querySelector<HTMLElement>("#mission-title")!.textContent = "Playtest draft unavailable.";
  document.querySelector<HTMLElement>("#briefing")!.textContent = "The stored editor draft could not be loaded, so the authored MVP map is running instead.";
  document.querySelector<HTMLElement>("#hint")!.textContent = "Return to the editor and start the playtest again.";
  editorLink.textContent = "Open editor";
}
let game = new Simulation(config);
let dragSource: string | null = null;
let dragPoint: { x: number; y: number } | null = null;
let lastFrame = performance.now();
let accumulator = 0;
const colors: Record<Owner, string> = { player: "#42c97a", enemy: "#ed5d62", neutral: "#8d9aa7" };

function nodeAt(x: number, y: number): NodeState | undefined { return [...game.nodes.values()].find((node) => Math.hypot(node.x - x, node.y - y) < 34); }
function toCanvas(event: PointerEvent | MouseEvent): { x: number; y: number } { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }; }
function pointLineDistance(x: number, y: number, a: NodeState, b: NodeState): number { const dx = b.x - a.x; const dy = b.y - a.y; const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - (a.x + dx * t), y - (a.y + dy * t)); }
function canStartPlayerTransport(source: string, target: NodeState | undefined): boolean {
  if (!target || target.id === source) return false;
  const road = game.roadBetween(source, target.id);
  return road !== undefined && !game.activeOnRoad(road.id);
}

function drawDirectionTriangle(a: { x: number; y: number }, b: { x: number; y: number }, t: number, color: string): void {
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
  context.lineWidth = transport ? 9 : 5;
  context.strokeStyle = transport ? colors[transport.owner] : "#536475";
  context.globalAlpha = transport ? 0.82 : 0.8;
  context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke(); context.globalAlpha = 1;
  if (!transport) return;
  const phase = (game.time % 1) / 1;
  for (let i = 0; i < 3; i++) drawDirectionTriangle(a, b, 0.14 + ((phase + i / 3) % 1) * 0.72, "#f7fbff");
}

function drawDragPreview(): void {
  if (!dragSource || !dragPoint) return;
  const source = game.node(dragSource);
  const target = nodeAt(dragPoint.x, dragPoint.y);
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
  if (valid && target) { context.strokeStyle = color; context.lineWidth = 4; context.beginPath(); context.arc(target.x, target.y, 38, 0, Math.PI * 2); context.stroke(); }
}

function isBesieged(node: NodeState): boolean { const targeting = game.transports.filter((transport) => transport.active && transport.target === node.id); return targeting.some((transport) => game.mode(transport) === "attack") && !targeting.some((transport) => game.mode(transport) === "support"); }
function drawNode(node: NodeState): void {
  if (isBesieged(node)) { context.strokeStyle = "#f0bd4f"; context.lineWidth = 5; context.beginPath(); context.arc(node.x, node.y, 40 + Math.sin(game.time * 5) * 2, 0, Math.PI * 2); context.stroke(); }
  context.fillStyle = colors[node.owner]; context.beginPath(); context.arc(node.x, node.y, 31, 0, Math.PI * 2); context.fill();
  context.strokeStyle = node.kind === "base" ? "#fff" : node.kind === "resource" ? "#f0bd4f" : "#1a2530"; context.lineWidth = node.kind === "ordinary" ? 2 : 5; context.stroke();
  context.fillStyle = "#10151c"; context.font = "700 18px system-ui"; context.textAlign = "center"; context.fillText(String(Math.round(node.force)), node.x, node.y + 6);
  context.fillStyle = "#dbe7ef"; context.font = "600 12px system-ui"; context.fillText(node.label, node.x, node.y + 53);
  if (node.kind !== "ordinary") { context.fillStyle = "#f0bd4f"; context.font = "700 11px system-ui"; context.fillText(node.kind.toUpperCase(), node.x, node.y - 43); }
}

function render(): void {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#17212b"; context.fillRect(0, 0, canvas.width, canvas.height);
  for (const road of game.roads.values()) {
    const active = game.activeOnRoad(road.id);
    drawRoad(active, active ? game.node(active.source) : game.node(road.a), active ? game.node(active.target) : game.node(road.b));
  }
  drawDragPreview();
  for (const node of game.nodes.values()) drawNode(node);
  context.fillStyle = "#b9c5d0"; context.font = "13px system-ui"; context.textAlign = "left"; context.fillText(`Simulation ${game.time.toFixed(1)}s · 10 Hz`, 18, 28);
  const target = dragPoint ? nodeAt(dragPoint.x, dragPoint.y) : undefined;
  status.textContent = game.winner === "player"
    ? "Victory — the enemy base surrendered."
    : dragSource && canStartPlayerTransport(dragSource, target)
      ? `Release to send forces to ${target!.label}.`
      : dragSource
        ? "Drag to an unused adjacent road, then release."
        : "Capture the enemy base to win.";
}

function frame(now: number): void { accumulator += Math.min((now - lastFrame) / 1000, 0.25); lastFrame = now; while (accumulator >= config.settings.logicTickSeconds) { game.step(); accumulator -= config.settings.logicTickSeconds; } render(); requestAnimationFrame(frame); }

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  const point = toCanvas(event);
  const node = nodeAt(point.x, point.y);
  dragSource = node?.owner === "player" ? node.id : null;
  dragPoint = dragSource ? point : null;
  if (dragSource) canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => { if (dragSource) dragPoint = toCanvas(event); });
canvas.addEventListener("pointerup", (event) => {
  if (!dragSource) return;
  const source = dragSource;
  const point = toCanvas(event);
  const target = nodeAt(point.x, point.y);
  if (canStartPlayerTransport(source, target) && target) game.startTransport(source, target.id, "player");
  dragSource = null;
  dragPoint = null;
  canvas.releasePointerCapture(event.pointerId);
});
canvas.addEventListener("pointercancel", (event) => {
  dragSource = null;
  dragPoint = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});
canvas.addEventListener("contextmenu", (event) => { event.preventDefault(); const point = toCanvas(event); for (const transport of game.transports.filter((candidate) => candidate.active && candidate.owner === "player")) { const a = game.node(transport.source); const b = game.node(transport.target); if (pointLineDistance(point.x, point.y, a, b) < 16) { game.cancelTransport(transport.id); break; } } });
restart.addEventListener("click", () => { game = new Simulation(config); });
requestAnimationFrame(frame);
