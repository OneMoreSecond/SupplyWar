import "./style.css";
import { applyAICommand, chooseAICommand, createAIObservation } from "./ai";
import { Camera2D, type Point2D } from "./camera";
import { Simulation, upgradeMap, validateMap, type MapConfig, type NodeState, type Transport } from "./game";
import { GameView } from "./game-view";
import { levelById, levels, nextLevel, type LevelDefinition } from "./levels";
import { playtestMapKey } from "./playtest";
import { VisibilityProjection } from "./visibility";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const status = document.querySelector<HTMLElement>("#status")!;
const restart = document.querySelector<HTMLButtonElement>("#restart")!;
const editorLink = document.querySelector<HTMLAnchorElement>("#editor-link")!;
const levelControl = document.querySelector<HTMLElement>("#level-control")!;
const levelPicker = document.querySelector<HTMLSelectElement>("#level-picker")!;
const completionDialog = document.querySelector<HTMLDialogElement>("#level-complete-dialog")!;
const completionTitle = document.querySelector<HTMLElement>("#level-complete-title")!;
const completionMessage = document.querySelector<HTMLElement>("#level-complete-message")!;
const replayLevelButton = document.querySelector<HTMLButtonElement>("#replay-level")!;
const nextLevelButton = document.querySelector<HTMLButtonElement>("#next-level")!;
const speedControl = document.querySelector<HTMLElement>("#speed-control")!;
const speedInput = document.querySelector<HTMLInputElement>("#playtest-speed")!;
const speedValue = document.querySelector<HTMLOutputElement>("#speed-value")!;
const interdictButton = document.querySelector<HTMLButtonElement>("#interdict")!;
const interdictHelp = document.querySelector<HTMLElement>("#interdict-help")!;
const timerValue = document.querySelector<HTMLTimeElement>("#timer-value")!;

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
const config = upgradeMap(page.config);
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
    : page.level.kind === "final-exam" ? "SUPPLY WAR · FINAL EXAM" : "SUPPLY WAR · DEMO";
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

let game = new Simulation(config);
let visibility = new VisibilityProjection(game, "player");
const initialCanvasBounds = canvas.getBoundingClientRect();
const camera = new Camera2D(initialCanvasBounds.width || canvas.width, initialCanvasBounds.height || canvas.height);
const view = new GameView(canvas, camera);
camera.fit(config.nodes);
let dragSource: string | null = null;
let dragPoint: Point2D | null = null;
let pan: { pointerId: number; last: Point2D } | null = null;
let lastFrame = performance.now();
let accumulator = 0;
let speedMultiplier = 1;
let completionShown = false;
let interdictArmed = false;
let actionMessage: { text: string; until: number } | null = null;
let nextAIDecisionAt = config.settings.rules.computerAI.decisionIntervalSeconds;
interdictButton.hidden = !config.settings.rules.interdiction.enabled;
interdictHelp.hidden = !config.settings.rules.interdiction.enabled;

function resetLevel(): void {
  game = new Simulation(config);
  visibility = new VisibilityProjection(game, "player");
  accumulator = 0;
  completionShown = false;
  interdictArmed = false;
  actionMessage = null;
  nextAIDecisionAt = config.settings.rules.computerAI.decisionIntervalSeconds;
  completionDialog.close();
}

function showLevelCompletion(): void {
  if (completionShown || page.mode !== "level") return;
  completionShown = true;
  completionTitle.textContent = `${page.level.pickerLabel} complete!`;
  if (successor) {
    completionMessage.textContent = `Congratulations. Next: ${successor.pickerLabel}.`;
    nextLevelButton.textContent = "Next level";
  } else {
    completionMessage.textContent = page.level.kind === "demo"
      ? "Congratulations. You won the Central Campaign."
      : "Congratulations. You cleared the Supply War campaign.";
    nextLevelButton.textContent = "Close";
  }
  completionDialog.showModal();
}

replayLevelButton.addEventListener("click", resetLevel);

nextLevelButton.addEventListener("click", () => {
  if (successor) {
    window.location.search = `?level=${encodeURIComponent(successor.id)}`;
    return;
  }
  completionDialog.close();
});

function toCanvas(event: MouseEvent): Point2D {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function nodeAt(point: Point2D): NodeState | undefined {
  return view.nodeAt(game, visibility, point);
}

function canStartPlayerTransport(source: string, target: NodeState | undefined): boolean {
  if (!target || target.id === source) return false;
  const road = game.roadBetween(source, target.id);
  return road !== undefined && !game.activeOnRoad(road.id) && !game.isGuarded(target.id, "player");
}

function formatTimer(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.floor(seconds + 1e-6));
  const minutes = Math.floor(wholeSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function render(): void {
  view.draw(game, visibility, dragSource, dragPoint);
  timerValue.textContent = formatTimer(game.time);
  timerValue.dateTime = `PT${Math.max(0, Math.floor(game.time + 1e-6))}S`;
  canvas.dataset.simulationTime = game.time.toFixed(2);
  canvas.dataset.levelId = page.level?.id ?? page.mode;
  canvas.dataset.cameraX = camera.centerX.toFixed(2);
  canvas.dataset.cameraY = camera.centerY.toFixed(2);
  canvas.dataset.cameraZoom = camera.zoom.toFixed(4);
  canvas.dataset.playerNodes = String([...game.nodes.values()].filter((node) => node.owner === "player").length);
  canvas.dataset.enemyNodes = String([...game.nodes.values()].filter((node) => node.owner === "enemy").length);
  canvas.dataset.activeEnemyTransports = String(game.transports.filter((transport) => transport.active && transport.owner === "enemy").length);
  canvas.dataset.visibleNodes = String([...game.nodes.keys()].filter((id) => visibility.nodeVisibility(id) === "visible").length);
  canvas.dataset.discoveredNodes = String([...game.nodes.keys()].filter((id) => visibility.nodeVisibility(id) !== "unknown").length);
  canvas.dataset.interdictionReadyIn = game.interdictionReadyIn("player").toFixed(1);
  canvas.dataset.activeInterdictions = String(game.transports.filter((transport) => transport.active && !game.isTransportOperational(transport)).length);
  const readyIn = game.interdictionReadyIn("player");
  interdictButton.disabled = readyIn > 0 || game.winner !== null;
  interdictButton.textContent = readyIn > 0 ? `Interdict · ${Math.ceil(readyIn)}s` : interdictArmed ? "Click an enemy route" : "Interdict route · ready";
  interdictButton.setAttribute("aria-pressed", String(interdictArmed));
  const target = dragPoint ? nodeAt(dragPoint) : undefined;
  if (game.winner === "player" && successor && page.level) {
    status.textContent = `Victory — ${page.level.pickerLabel} complete. Continue to ${successor.pickerLabel}.`;
  } else if (game.winner === "player" && page.level?.kind === "demo") {
    status.textContent = "Demo complete — the Central Campaign is won.";
  } else if (game.winner === "player" && page.level?.kind === "final-exam") {
    status.textContent = "Final exam complete — campaign cleared.";
  } else if (game.winner === "enemy") {
    status.textContent = "Defeat — Eastern Command captured your base.";
  } else if (game.winner === "player") {
    status.textContent = "Victory — the enemy base surrendered.";
  } else if (actionMessage && game.time < actionMessage.until) {
    status.textContent = actionMessage.text;
  } else if (dragSource && canStartPlayerTransport(dragSource, target)) {
    status.textContent = `Release to send forces to ${target!.label}.`;
  } else if (dragSource && target && game.isGuarded(target.id, "player")) {
    const guards = game.guardingNodes(target.id, "player").map((guard) => guard.label).join(", ");
    status.textContent = `${target.label} is guarded by ${guards}. Capture the Guard first.`;
  } else if (dragSource) {
    status.textContent = "Drag to an unused adjacent road, then release.";
  } else {
    status.textContent = "Capture the enemy base to win.";
  }
  if (game.winner === "player") showLevelCompletion();
}

function frame(now: number): void {
  accumulator += Math.min((now - lastFrame) / 1000, 0.25) * speedMultiplier;
  lastFrame = now;
  while (accumulator >= config.settings.logicTickSeconds) {
    game.step();
    visibility.update(game);
    if (config.settings.rules.computerAI.enabled && !game.winner && game.time >= nextAIDecisionAt) {
      applyAICommand(game, chooseAICommand(createAIObservation(game, "enemy")), "enemy");
      nextAIDecisionAt += config.settings.rules.computerAI.decisionIntervalSeconds;
    }
    accumulator -= config.settings.logicTickSeconds;
  }
  render();
  requestAnimationFrame(frame);
}

speedInput.addEventListener("input", () => {
  speedMultiplier = speedInput.valueAsNumber;
  speedValue.value = `${speedMultiplier}×`;
});

function visibleEnemyTransportAt(point: Point2D): Transport | undefined {
  return view.transportAt(game, visibility, point, (transport) => transport.owner === "enemy" && game.isTransportOperational(transport));
}

interdictButton.addEventListener("click", () => {
  if (game.interdictionReadyIn("player") > 0 || game.winner) return;
  interdictArmed = !interdictArmed;
  actionMessage = { text: interdictArmed ? "Click a visible red route to suspend it." : "Interdiction targeting canceled.", until: game.time + 3 };
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  const point = toCanvas(event);
  if (interdictArmed) {
    const transport = visibleEnemyTransportAt(point);
    if (transport && game.interdictTransport(transport.id, "player")) {
      interdictArmed = false;
      actionMessage = { text: `Interdicted ${game.node(transport.source).label} → ${game.node(transport.target).label}. Its support and dispatch are suspended.`, until: game.time + 5 };
    } else {
      actionMessage = { text: "Choose a visible, active red route. Allied, hidden, and already disrupted routes are invalid.", until: game.time + 4 };
    }
    return;
  }
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
  const transport = view.transportAt(game, visibility, point, (candidate) => candidate.owner === "player");
  if (transport) game.cancelTransport(transport.id);
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  camera.zoomAt(toCanvas(event), Math.exp(-event.deltaY * 0.0015));
}, { passive: false });

restart.addEventListener("click", () => {
  resetLevel();
});

requestAnimationFrame(frame);
