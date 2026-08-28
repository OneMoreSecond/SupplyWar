import { type MapTransport, type Owner, type Simulation } from "./game";

export type NodeVisibility = "visible" | "discovered" | "unknown";

export function currentlyVisibleNodeIds(game: Simulation, owner: Owner): Set<string> {
  if (!game.config.settings.rules.fogOfWar.enabled) return new Set(game.nodes.keys());
  const owned = new Set(
    [...game.nodes.values()]
      .filter((node) => node.owner === owner)
      .map((node) => node.id),
  );
  const visible = new Set(owned);
  for (const road of game.roads.values()) {
    if (owned.has(road.a)) visible.add(road.b);
    if (owned.has(road.b)) visible.add(road.a);
  }
  return visible;
}

export class VisibilityProjection {
  private visible = new Set<string>();
  private readonly discovered = new Set<string>();

  constructor(game: Simulation, private readonly owner: Owner) {
    this.update(game);
  }

  update(game: Simulation): void {
    this.visible = currentlyVisibleNodeIds(game, this.owner);
    for (const id of this.visible) this.discovered.add(id);
  }

  nodeVisibility(id: string): NodeVisibility {
    if (this.visible.has(id)) return "visible";
    return this.discovered.has(id) ? "discovered" : "unknown";
  }

  isRoadDiscovered(road: { a: string; b: string }): boolean {
    return this.nodeVisibility(road.a) !== "unknown" && this.nodeVisibility(road.b) !== "unknown";
  }

  isTransportVisible(transport: Pick<MapTransport, "source" | "target">): boolean {
    return this.nodeVisibility(transport.source) === "visible" && this.nodeVisibility(transport.target) === "visible";
  }
}
