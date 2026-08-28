export type Owner = "player" | "enemy" | "neutral";
export type NodeKind = "base" | "resource" | "ordinary";

export interface MapNode { id: string; label: string; owner: Owner; force: number; production: number; kind: NodeKind; x: number; y: number; }
interface RoadFields { id: string; a: string; b: string; width: number; }
export interface RoadV1 extends RoadFields { travelTimeMultiplier?: never; }
export interface RoadV2 extends RoadFields { travelTimeMultiplier: number; }
export type Road = RoadV1 | RoadV2;
export interface MapTransport { source: string; target: string; owner: Owner; }
export interface SiegeFormula { id: string; apply(force: number, dt: number, halfLifeSeconds: number): number; }
export const exponentialHalfLifeSiege: SiegeFormula = { id: "exponential-half-life", apply: (force, dt, halfLifeSeconds) => force * 0.5 ** (dt / halfLifeSeconds) };
const siegeFormulas: Record<string, SiegeFormula> = { [exponentialHalfLifeSiege.id]: exponentialHalfLifeSiege };

export interface MapSettingsV1 {
  logicTickSeconds: number;
  siegeFormula: string;
  siegeHalfLifeSeconds: number;
  secondsPerDistanceUnit: number;
  forcePerWidthUnit: number;
}

export interface RuleSettings {
  siegeSupport: "direct" | "rooted";
  computerAI: { enabled: boolean; decisionIntervalSeconds: number; reserveForce: number };
  fogOfWar: { enabled: boolean };
  interdiction: { enabled: boolean; durationSeconds: number; cooldownSeconds: number };
}

export interface MapSettingsV2 extends MapSettingsV1 { rules: RuleSettings; }
export interface MapConfigV1 { version: 1; settings: MapSettingsV1; nodes: MapNode[]; roads: RoadV1[]; initialTransports: MapTransport[]; }
export interface MapConfigV2 { version: 2; settings: MapSettingsV2; nodes: MapNode[]; roads: RoadV2[]; initialTransports: MapTransport[]; }
export type MapConfig = MapConfigV1 | MapConfigV2;
export interface NodeState extends MapNode { force: number; }
export interface Packet { force: number; arrivalAt: number; }
export interface Transport extends MapTransport { id: string; roadId: string; active: boolean; interdictedUntil: number; packets: Packet[]; }

const roadKey = (a: string, b: string) => [a, b].sort().join(":");

export class Simulation {
  readonly config: MapConfigV2;
  readonly nodes = new Map<string, NodeState>();
  readonly roads = new Map<string, RoadV2>();
  readonly transports: Transport[] = [];
  time = 0;
  winner: Owner | null = null;
  private nextTransport = 1;
  private readonly siegeFormula: SiegeFormula;
  private readonly nextInterdictionAt: Record<"player" | "enemy", number> = { player: 0, enemy: 0 };

  constructor(config: MapConfig) {
    this.config = upgradeMap(config);
    this.siegeFormula = siegeFormulas[this.config.settings.siegeFormula]!;
    for (const node of this.config.nodes) this.nodes.set(node.id, { ...node });
    for (const road of this.config.roads) this.roads.set(road.id, { ...road });
    for (const transport of this.config.initialTransports) this.startTransport(transport.source, transport.target, transport.owner);
  }

  node(id: string): NodeState { const node = this.nodes.get(id); if (!node) throw new Error(`Unknown node: ${id}`); return node; }
  roadBetween(a: string, b: string): RoadV2 | undefined { return [...this.roads.values()].find((road) => roadKey(road.a, road.b) === roadKey(a, b)); }
  activeOnRoad(roadId: string): Transport | undefined { return this.transports.find((transport) => transport.active && transport.roadId === roadId); }
  isTransportOperational(transport: Transport): boolean { return transport.active && transport.interdictedUntil <= this.time; }
  mode(transport: Transport): "support" | "attack" { return this.node(transport.target).owner === transport.owner ? "support" : "attack"; }
  isSupplied(nodeId: string): boolean {
    const node = this.node(nodeId);
    if (this.config.settings.rules.siegeSupport === "rooted") return this.suppliedNodes(node.owner).has(node.id);
    return this.transports.some((transport) => this.isTransportOperational(transport) && transport.target === node.id && this.mode(transport) === "support");
  }
  roadLength(road: RoadV2): number { const a = this.node(road.a); const b = this.node(road.b); return Math.hypot(a.x - b.x, a.y - b.y); }
  travelSeconds(road: RoadV2): number { return this.roadLength(road) * this.config.settings.secondsPerDistanceUnit * road.travelTimeMultiplier; }
  throughput(road: RoadV2): number { return road.width * this.config.settings.forcePerWidthUnit; }

  startTransport(source: string, target: string, owner = this.node(source).owner): Transport | null {
    if (this.winner || owner === "neutral" || this.node(source).owner !== owner) return null;
    const road = this.roadBetween(source, target);
    if (!road || this.activeOnRoad(road.id)) return null;
    const transport: Transport = { id: `transport-${this.nextTransport++}`, source, target, owner, roadId: road.id, active: true, interdictedUntil: 0, packets: [] };
    this.transports.push(transport);
    return transport;
  }

  cancelTransport(id: string, owner = "player"): boolean {
    const transport = this.transports.find((candidate) => candidate.id === id && candidate.active);
    if (!transport || transport.owner !== owner) return false;
    transport.active = false;
    transport.packets = [];
    return true;
  }

  interdictTransport(id: string, owner: "player" | "enemy"): boolean {
    if (this.winner || !this.config.settings.rules.interdiction.enabled || this.interdictionReadyIn(owner) > 0) return false;
    const transport = this.transports.find((candidate) => candidate.id === id);
    if (!transport || transport.owner === owner || !this.isTransportOperational(transport)) return false;
    transport.interdictedUntil = this.time + this.config.settings.rules.interdiction.durationSeconds;
    this.nextInterdictionAt[owner] = this.time + this.config.settings.rules.interdiction.cooldownSeconds;
    return true;
  }

  interdictionReadyIn(owner: "player" | "enemy"): number {
    return Math.max(0, this.nextInterdictionAt[owner] - this.time);
  }

  step(dt = this.config.settings.logicTickSeconds): void {
    if (this.winner) return;
    this.time += dt;
    for (const node of this.nodes.values()) if (node.owner !== "neutral") node.force += node.production * dt;
    this.deliverPackets();
    this.cancelLostSources();
    this.applySiege(dt);
    this.cancelLostSources();
    this.dispatchPackets(dt);
    if (this.node("enemy-base").owner === "player") this.winner = "player";
    if (this.node("player-base").owner === "enemy") this.winner = "enemy";
  }

  private deliverPackets(): void {
    for (const transport of this.transports) {
      if (!transport.active) continue;
      const due = transport.packets.filter((packet) => packet.arrivalAt <= this.time);
      transport.packets = transport.packets.filter((packet) => packet.arrivalAt > this.time);
      for (const packet of due) this.applyArrival(transport, packet.force);
    }
  }

  private applyArrival(transport: Transport, force: number): void {
    const target = this.node(transport.target);
    if (target.owner === transport.owner) { target.force += force; return; }
    target.force -= force;
    if (target.force <= 0) { target.owner = transport.owner; target.force = -target.force; }
  }

  private cancelLostSources(): void {
    for (const transport of this.transports) {
      if (transport.active && this.node(transport.source).owner !== transport.owner) { transport.active = false; transport.packets = []; }
    }
  }

  private applySiege(dt: number): void {
    const rootedSupply = this.config.settings.rules.siegeSupport === "rooted"
      ? new Map<Owner, Set<string>>([
        ["player", this.suppliedNodes("player")],
        ["enemy", this.suppliedNodes("enemy")],
        ["neutral", new Set()],
      ])
      : undefined;
    for (const node of this.nodes.values()) {
      const targeting = this.transports.filter((transport) => this.isTransportOperational(transport) && transport.target === node.id);
      const attackers = targeting.filter((transport) => this.mode(transport) === "attack");
      const supporters = targeting.filter((transport) => this.mode(transport) === "support");
      const supplied = rootedSupply ? rootedSupply.get(node.owner)!.has(node.id) : supporters.length > 0;
      if (attackers.length === 0 || supplied) continue;
      node.force = this.siegeFormula.apply(node.force, dt, this.config.settings.siegeHalfLifeSeconds);
      if (node.force <= 0.01) { node.owner = attackers[0]!.owner; node.force = 0; }
    }
  }

  private suppliedNodes(owner: Owner): Set<string> {
    if (owner === "neutral") return new Set();
    const supplied = new Set(
      [...this.nodes.values()]
        .filter((node) => node.owner === owner && (node.kind === "base" || node.kind === "resource"))
        .map((node) => node.id),
    );
    let changed = true;
    while (changed) {
      changed = false;
      for (const transport of this.transports) {
        if (!this.isTransportOperational(transport) || transport.owner !== owner || this.mode(transport) !== "support" || !supplied.has(transport.source) || supplied.has(transport.target)) continue;
        supplied.add(transport.target);
        changed = true;
      }
    }
    return supplied;
  }

  private dispatchPackets(dt: number): void {
    for (const transport of this.transports) {
      if (!this.isTransportOperational(transport)) continue;
      const source = this.node(transport.source);
      const road = this.roads.get(transport.roadId)!;
      const force = Math.min(source.force, this.throughput(road) * dt);
      source.force -= force;
      if (force > 0) transport.packets.push({ force, arrivalAt: this.time + this.travelSeconds(road) });
    }
  }
}

const owners: Owner[] = ["player", "enemy", "neutral"];
const nodeKinds: NodeKind[] = ["base", "resource", "ordinary"];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const legacyRules: RuleSettings = {
  siegeSupport: "direct",
  computerAI: { enabled: false, decisionIntervalSeconds: 1, reserveForce: 10 },
  fogOfWar: { enabled: false },
  interdiction: { enabled: false, durationSeconds: 10, cooldownSeconds: 60 },
};

export function upgradeMap(config: MapConfig): MapConfigV2 {
  validateMap(config);
  if (config.version === 2) return structuredClone(config);
  return {
    ...structuredClone(config),
    version: 2,
    settings: { ...structuredClone(config.settings), rules: structuredClone(legacyRules) },
    roads: config.roads.map((road) => ({ ...road, travelTimeMultiplier: 1 })),
  };
}

function validateVersion2Rules(value: unknown): void {
  if (!isRecord(value)) throw new Error("Version 2 rules must be a JSON object");
  if (value.siegeSupport !== "direct" && value.siegeSupport !== "rooted") throw new Error("siegeSupport must be direct or rooted");
  if (!isRecord(value.computerAI)) throw new Error("computerAI rules must be a JSON object");
  if (typeof value.computerAI.enabled !== "boolean") throw new Error("computerAI enabled must be true or false");
  if (!isFiniteNumber(value.computerAI.decisionIntervalSeconds) || value.computerAI.decisionIntervalSeconds <= 0) throw new Error("computerAI decisionIntervalSeconds must be a number greater than 0");
  if (!isFiniteNumber(value.computerAI.reserveForce) || value.computerAI.reserveForce < 0) throw new Error("computerAI reserveForce must be a number greater than or equal to 0");
  if (!isRecord(value.fogOfWar)) throw new Error("fogOfWar rules must be a JSON object");
  if (typeof value.fogOfWar.enabled !== "boolean") throw new Error("fogOfWar enabled must be true or false");
  if (!isRecord(value.interdiction)) throw new Error("interdiction rules must be a JSON object");
  if (typeof value.interdiction.enabled !== "boolean") throw new Error("interdiction enabled must be true or false");
  for (const key of ["durationSeconds", "cooldownSeconds"] as const) {
    if (!isFiniteNumber(value.interdiction[key]) || value.interdiction[key] <= 0) throw new Error(`interdiction ${key} must be a number greater than 0`);
  }
}

export function validateMap(value: unknown): asserts value is MapConfig {
  if (!isRecord(value)) throw new Error("The map root must be a JSON object");
  if (value.version !== 1 && value.version !== 2) throw new Error("Version must be 1 or 2");
  if (!isRecord(value.settings)) throw new Error("Settings must be a JSON object");

  const settings = value.settings;
  if (typeof settings.siegeFormula !== "string" || !siegeFormulas[settings.siegeFormula]) throw new Error("Siege formula must be exponential-half-life");
  for (const key of ["logicTickSeconds", "siegeHalfLifeSeconds", "secondsPerDistanceUnit", "forcePerWidthUnit"] as const) {
    if (!isFiniteNumber(settings[key]) || settings[key] <= 0) throw new Error(`${key} must be a number greater than 0`);
  }
  if (value.version === 2) validateVersion2Rules(settings.rules);

  if (!Array.isArray(value.nodes) || value.nodes.length === 0) throw new Error("Add at least one node");
  const ids = new Set<string>();
  const nodeOwners = new Map<string, Owner>();
  for (const [index, candidate] of value.nodes.entries()) {
    if (!isRecord(candidate)) throw new Error(`Node ${index + 1} must be a JSON object`);
    if (typeof candidate.id !== "string" || candidate.id.trim() === "") throw new Error(`Node ${index + 1} needs an ID`);
    if (ids.has(candidate.id)) throw new Error(`Node ID "${candidate.id}" is duplicated`);
    if (typeof candidate.label !== "string" || candidate.label.trim() === "") throw new Error(`Node "${candidate.id}" needs a label`);
    if (!owners.includes(candidate.owner as Owner)) throw new Error(`Node "${candidate.id}" has an invalid owner`);
    if (!nodeKinds.includes(candidate.kind as NodeKind)) throw new Error(`Node "${candidate.id}" has an invalid kind`);
    if (!isFiniteNumber(candidate.force) || candidate.force < 0) throw new Error(`Node "${candidate.id}" force must be 0 or greater`);
    if (!isFiniteNumber(candidate.production) || candidate.production < 0) throw new Error(`Node "${candidate.id}" production must be 0 or greater`);
    if (!isFiniteNumber(candidate.x) || !isFiniteNumber(candidate.y)) throw new Error(`Node "${candidate.id}" coordinates must be numbers`);
    ids.add(candidate.id);
    nodeOwners.set(candidate.id, candidate.owner as Owner);
  }
  if (!ids.has("player-base") || !ids.has("enemy-base")) throw new Error("Maps need player-base and enemy-base nodes for victory checks");

  if (!Array.isArray(value.roads)) throw new Error("Roads must be a JSON array");
  const roadIds = new Set<string>();
  const roadKeys = new Set<string>();
  for (const [index, candidate] of value.roads.entries()) {
    if (!isRecord(candidate)) throw new Error(`Road ${index + 1} must be a JSON object`);
    if (typeof candidate.id !== "string" || candidate.id.trim() === "") throw new Error(`Road ${index + 1} needs an ID`);
    if (roadIds.has(candidate.id)) throw new Error(`Road ID "${candidate.id}" is duplicated`);
    if (typeof candidate.a !== "string" || typeof candidate.b !== "string" || !ids.has(candidate.a) || !ids.has(candidate.b)) throw new Error(`Road "${candidate.id}" must connect existing nodes`);
    if (candidate.a === candidate.b) throw new Error(`Road "${candidate.id}" must connect two different nodes`);
    if (!isFiniteNumber(candidate.width) || candidate.width <= 0) throw new Error(`Road "${candidate.id}" width must be greater than 0`);
    if (value.version === 2 && (!isFiniteNumber(candidate.travelTimeMultiplier) || candidate.travelTimeMultiplier < 1)) throw new Error(`Road "${candidate.id}" travelTimeMultiplier must be a number greater than or equal to 1`);
    const key = roadKey(candidate.a, candidate.b);
    if (roadKeys.has(key)) throw new Error(`A road between "${candidate.a}" and "${candidate.b}" already exists`);
    roadIds.add(candidate.id);
    roadKeys.add(key);
  }

  if (!Array.isArray(value.initialTransports)) throw new Error("Initial transports must be a JSON array");
  const occupiedRoads = new Set<string>();
  for (const [index, candidate] of value.initialTransports.entries()) {
    if (!isRecord(candidate)) throw new Error(`Initial transport ${index + 1} must be a JSON object`);
    if (typeof candidate.source !== "string" || typeof candidate.target !== "string" || !ids.has(candidate.source) || !ids.has(candidate.target)) throw new Error(`Initial transport ${index + 1} must use existing nodes`);
    const key = roadKey(candidate.source, candidate.target);
    if (!roadKeys.has(key)) throw new Error(`Initial transport ${index + 1} needs a road between its source and target`);
    if (!owners.includes(candidate.owner as Owner) || candidate.owner === "neutral") throw new Error(`Initial transport ${index + 1} owner must be player or enemy`);
    if (nodeOwners.get(candidate.source) !== candidate.owner) throw new Error(`Initial transport ${index + 1} owner must match its source node`);
    if (occupiedRoads.has(key)) throw new Error(`Only one initial transport can use the road between "${candidate.source}" and "${candidate.target}"`);
    occupiedRoads.add(key);
  }
}
