import { type NodeKind, type Owner, type Simulation } from "./game";
import { currentlyVisibleNodeIds } from "./visibility";

interface AINodeObservation {
  readonly id: string;
  readonly owner: Owner;
  readonly force: number;
  readonly kind: NodeKind;
  readonly supplied: boolean;
  readonly guarded: boolean;
  readonly threatened: boolean;
}

interface AIRoadObservation {
  readonly id: string;
  readonly a: string;
  readonly b: string;
  readonly occupied: boolean;
}

interface AITransportObservation {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly owner: Owner;
  readonly active: boolean;
  readonly interdicted: boolean;
  readonly visible: boolean;
}

export interface AIObservation {
  readonly owner: Owner;
  readonly reserveForce: number;
  readonly interdictionEnabled: boolean;
  readonly interdictionReady: boolean;
  readonly nodes: readonly AINodeObservation[];
  readonly roads: readonly AIRoadObservation[];
  readonly transports: readonly AITransportObservation[];
}

export type AICommand =
  | { readonly type: "start-transport"; readonly source: string; readonly target: string }
  | { readonly type: "cancel-transport"; readonly transportId: string }
  | { readonly type: "interdict-transport"; readonly transportId: string }
  | { readonly type: "wait" };

interface StartCandidate {
  source: AINodeObservation;
  target: AINodeObservation;
  roadId: string;
}

export function createAIObservation(game: Simulation, owner: Owner): AIObservation {
  const visible = currentlyVisibleNodeIds(game, owner);
  const active = game.transports.filter((transport) => transport.active && visible.has(transport.source) && visible.has(transport.target));
  const threatened = new Set(
    active
      .filter((transport) => transport.owner !== owner && game.mode(transport) === "attack")
      .map((transport) => transport.target),
  );
  return {
    owner,
    reserveForce: game.config.settings.rules.computerAI.reserveForce,
    interdictionEnabled: game.config.settings.rules.interdiction.enabled,
    interdictionReady: owner !== "neutral" && game.interdictionReadyIn(owner) === 0,
    nodes: [...game.nodes.values()].filter((node) => visible.has(node.id)).map((node) => ({
      id: node.id,
      owner: node.owner,
      force: node.force,
      kind: node.kind,
      supplied: game.isSupplied(node.id),
      guarded: game.isGuarded(node.id, owner),
      threatened: threatened.has(node.id),
    })),
    roads: [...game.roads.values()]
      .filter((road) => visible.has(road.a) && visible.has(road.b))
      .map((road) => ({ id: road.id, a: road.a, b: road.b, occupied: game.activeOnRoad(road.id) !== undefined })),
    transports: active.map((transport) => ({
      id: transport.id,
      source: transport.source,
      target: transport.target,
      owner: transport.owner,
      active: transport.active,
      interdicted: !game.isTransportOperational(transport),
      visible: visible.has(transport.source) && visible.has(transport.target),
    })),
  };
}

function startCandidates(observation: AIObservation): StartCandidate[] {
  const nodes = new Map(observation.nodes.map((node) => [node.id, node]));
  const candidates: StartCandidate[] = [];
  for (const road of observation.roads) {
    if (road.occupied) continue;
    const a = nodes.get(road.a)!;
    const b = nodes.get(road.b)!;
    for (const [source, target] of [[a, b], [b, a]] as const) {
      if (source.owner === observation.owner && source.force > observation.reserveForce && (target.owner === observation.owner || !target.guarded)) candidates.push({ source, target, roadId: road.id });
    }
  }
  return candidates.sort((left, right) => left.source.id.localeCompare(right.source.id) || left.target.id.localeCompare(right.target.id) || left.roadId.localeCompare(right.roadId));
}

function affordable(candidate: StartCandidate, reserveForce: number): boolean {
  return candidate.target.force < candidate.source.force - reserveForce;
}

function start(candidate: StartCandidate): AICommand {
  return { type: "start-transport", source: candidate.source.id, target: candidate.target.id };
}

export function chooseAICommand(observation: AIObservation): AICommand {
  const nodes = new Map(observation.nodes.map((node) => [node.id, node]));
  const cancel = observation.transports
    .filter((transport) => transport.owner === observation.owner && transport.active && nodes.get(transport.source)!.force <= observation.reserveForce)
    .sort((left, right) => left.id.localeCompare(right.id))[0];
  if (cancel) return { type: "cancel-transport", transportId: cancel.id };

  const interdict = observation.interdictionEnabled && observation.interdictionReady
    ? observation.transports
      .filter((transport) => transport.owner !== observation.owner && transport.visible && !transport.interdicted && nodes.get(transport.target)!.owner === observation.owner)
      .sort((left, right) => left.id.localeCompare(right.id))[0]
    : undefined;
  if (interdict) return { type: "interdict-transport", transportId: interdict.id };

  const candidates = startCandidates(observation);
  const defense = candidates.find((candidate) => candidate.target.owner === observation.owner && candidate.target.threatened);
  if (defense) return start(defense);

  const resource = candidates.find((candidate) => candidate.target.owner !== observation.owner && candidate.target.kind === "resource" && affordable(candidate, observation.reserveForce));
  if (resource) return start(resource);

  const weakUnsupported = candidates.find((candidate) => candidate.target.owner !== observation.owner && candidate.target.owner !== "neutral" && !candidate.target.supplied && affordable(candidate, observation.reserveForce));
  if (weakUnsupported) return start(weakUnsupported);

  const neutral = candidates.find((candidate) => candidate.target.owner === "neutral" && affordable(candidate, observation.reserveForce));
  if (neutral) return start(neutral);

  const weakSupplied = candidates.find((candidate) => candidate.target.owner !== observation.owner && affordable(candidate, observation.reserveForce));
  return weakSupplied ? start(weakSupplied) : { type: "wait" };
}

export function applyAICommand(game: Simulation, command: AICommand, owner: Owner): boolean {
  if (command.type === "start-transport") return game.startTransport(command.source, command.target, owner) !== null;
  if (command.type === "cancel-transport") return game.cancelTransport(command.transportId, owner);
  if (command.type === "interdict-transport" && owner !== "neutral") return game.interdictTransport(command.transportId, owner);
  return false;
}
