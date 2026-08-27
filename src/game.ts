export type Owner = "player" | "enemy" | "neutral";
export type NodeKind = "base" | "resource" | "ordinary";

export interface MapNode { id: string; label: string; owner: Owner; force: number; production: number; kind: NodeKind; x: number; y: number; }
export interface Road { id: string; a: string; b: string; width: number; }
export interface MapTransport { source: string; target: string; owner: Owner; }
export interface SiegeFormula { id: string; apply(force: number, dt: number, halfLifeSeconds: number): number; }
export const exponentialHalfLifeSiege: SiegeFormula = { id: "exponential-half-life", apply: (force, dt, halfLifeSeconds) => force * 0.5 ** (dt / halfLifeSeconds) };
const siegeFormulas: Record<string, SiegeFormula> = { [exponentialHalfLifeSiege.id]: exponentialHalfLifeSiege };
export interface MapConfig { version: number; settings: { logicTickSeconds: number; siegeFormula: string; siegeHalfLifeSeconds: number; secondsPerDistanceUnit: number; forcePerWidthUnit: number }; nodes: MapNode[]; roads: Road[]; initialTransports: MapTransport[]; }
export interface NodeState extends MapNode { force: number; }
export interface Packet { force: number; arrivalAt: number; }
export interface Transport extends MapTransport { id: string; roadId: string; active: boolean; packets: Packet[]; }

const roadKey = (a: string, b: string) => [a, b].sort().join(":");

export class Simulation {
  readonly config: MapConfig;
  readonly nodes = new Map<string, NodeState>();
  readonly roads = new Map<string, Road>();
  readonly transports: Transport[] = [];
  time = 0;
  winner: Owner | null = null;
  private nextTransport = 1;
  private readonly siegeFormula: SiegeFormula;

  constructor(config: MapConfig) {
    validateMap(config);
    this.config = structuredClone(config);
    this.siegeFormula = siegeFormulas[this.config.settings.siegeFormula]!;
    for (const node of config.nodes) this.nodes.set(node.id, { ...node });
    for (const road of config.roads) this.roads.set(road.id, { ...road });
    for (const transport of config.initialTransports) this.startTransport(transport.source, transport.target, transport.owner);
  }

  node(id: string): NodeState { const node = this.nodes.get(id); if (!node) throw new Error(`Unknown node: ${id}`); return node; }
  roadBetween(a: string, b: string): Road | undefined { return [...this.roads.values()].find((road) => roadKey(road.a, road.b) === roadKey(a, b)); }
  activeOnRoad(roadId: string): Transport | undefined { return this.transports.find((transport) => transport.active && transport.roadId === roadId); }
  mode(transport: Transport): "support" | "attack" { return this.node(transport.target).owner === transport.owner ? "support" : "attack"; }
  roadLength(road: Road): number { const a = this.node(road.a); const b = this.node(road.b); return Math.hypot(a.x - b.x, a.y - b.y); }
  travelSeconds(road: Road): number { return this.roadLength(road) * this.config.settings.secondsPerDistanceUnit; }
  throughput(road: Road): number { return road.width * this.config.settings.forcePerWidthUnit; }

  startTransport(source: string, target: string, owner = this.node(source).owner): Transport | null {
    if (this.winner || owner === "neutral" || this.node(source).owner !== owner) return null;
    const road = this.roadBetween(source, target);
    if (!road || this.activeOnRoad(road.id)) return null;
    const transport: Transport = { id: `transport-${this.nextTransport++}`, source, target, owner, roadId: road.id, active: true, packets: [] };
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
    for (const node of this.nodes.values()) {
      const targeting = this.transports.filter((transport) => transport.active && transport.target === node.id);
      const attackers = targeting.filter((transport) => this.mode(transport) === "attack");
      const supporters = targeting.filter((transport) => this.mode(transport) === "support");
      if (attackers.length === 0 || supporters.length > 0) continue;
      node.force = this.siegeFormula.apply(node.force, dt, this.config.settings.siegeHalfLifeSeconds);
      if (node.force <= 0.01) { node.owner = attackers[0]!.owner; node.force = 0; }
    }
  }

  private dispatchPackets(dt: number): void {
    for (const transport of this.transports) {
      if (!transport.active) continue;
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

export function validateMap(value: unknown): asserts value is MapConfig {
  if (!isRecord(value)) throw new Error("The map root must be a JSON object");
  if (value.version !== 1) throw new Error("Version must be 1");
  if (!isRecord(value.settings)) throw new Error("Settings must be a JSON object");

  const settings = value.settings;
  if (typeof settings.siegeFormula !== "string" || !siegeFormulas[settings.siegeFormula]) throw new Error("Siege formula must be exponential-half-life");
  for (const key of ["logicTickSeconds", "siegeHalfLifeSeconds", "secondsPerDistanceUnit", "forcePerWidthUnit"] as const) {
    if (!isFiniteNumber(settings[key]) || settings[key] <= 0) throw new Error(`${key} must be a number greater than 0`);
  }

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
