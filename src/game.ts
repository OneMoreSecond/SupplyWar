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

export function validateMap(config: MapConfig): void {
  if (config.version !== 1 || !siegeFormulas[config.settings.siegeFormula] || config.settings.logicTickSeconds <= 0 || config.settings.siegeHalfLifeSeconds <= 0 || config.settings.secondsPerDistanceUnit <= 0 || config.settings.forcePerWidthUnit <= 0) throw new Error("Invalid map settings");
  const ids = new Set(config.nodes.map((node) => node.id));
  if (ids.size !== config.nodes.length) throw new Error("Duplicate node id");
  for (const road of config.roads) if (!ids.has(road.a) || !ids.has(road.b) || road.a === road.b || road.width <= 0) throw new Error(`Invalid road: ${road.id}`);
  const keys = new Set<string>();
  for (const road of config.roads) { const key = roadKey(road.a, road.b); if (keys.has(key)) throw new Error("Duplicate road"); keys.add(key); }
  for (const transport of config.initialTransports) if (!ids.has(transport.source) || !ids.has(transport.target) || !keys.has(roadKey(transport.source, transport.target))) throw new Error("Invalid initial transport");
}
