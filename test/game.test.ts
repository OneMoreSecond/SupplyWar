import { describe, expect, it } from "vitest";
import mapConfig from "../maps/mvp.json";
import { Simulation, validateMap, type MapConfig } from "../src/game";

const config = mapConfig as MapConfig;
const runFor = (game: Simulation, seconds: number) => { for (let i = 0; i < Math.round(seconds / config.settings.logicTickSeconds); i++) game.step(); };

describe("Supply War simulation", () => {
  it("derives each road timing and throughput from its geometry and width", () => {
    const game = new Simulation(config);
    const frontlineRoad = game.roadBetween("player-base", "frontline")!;
    const flankRoad = game.roadBetween("player-base", "resource")!;
    expect(game.roadLength(frontlineRoad)).toBeCloseTo(200, 2);
    expect(game.travelSeconds(frontlineRoad)).toBeCloseTo(1.5, 2);
    expect(game.roadLength(flankRoad)).toBeGreaterThan(game.roadLength(frontlineRoad) * 2);
    expect(game.travelSeconds(flankRoad)).toBeGreaterThan(game.travelSeconds(frontlineRoad) * 2);
    expect(game.throughput(frontlineRoad)).toBe(2);
    expect(game.throughput(flankRoad)).toBe(2);
  });

  it("selects the configured internal siege formula", () => {
    const game = new Simulation(config);
    game.node("resource").owner = "player";
    game.step();
    game.node("frontline").force = 70;
    game.startTransport("player-base", "frontline", "player");
    game.step(config.settings.siegeHalfLifeSeconds);
    expect(game.node("frontline").force).toBeCloseTo(35, 1);
  });

  it("cancels a transport and removes its packets when its source changes owner", () => {
    const game = new Simulation(config);
    const support = game.transports.find((transport) => transport.source === "resource")!;
    runFor(game, 1);
    expect(support.packets.length).toBeGreaterThan(0);
    game.node("resource").owner = "player";
    game.step();
    expect(support.active).toBe(false);
    expect(support.packets).toEqual([]);
  });

  it("keeps a transport when its target changes owner and refreshes it to attack", () => {
    const game = new Simulation(config);
    const support = game.transports.find((transport) => transport.source === "resource")!;
    game.node("frontline").owner = "player";
    game.step();
    expect(support.active).toBe(true);
    expect(game.mode(support)).toBe("attack");
  });

  it("transfers an unsupported besieged node when siege reaches zero", () => {
    const game = new Simulation(config);
    game.node("resource").owner = "player";
    game.step();
    game.node("frontline").force = 0.005;
    expect(game.startTransport("player-base", "frontline", "player")).not.toBeNull();
    game.step();
    expect(game.node("frontline").owner).toBe("player");
    expect(game.node("frontline").force).toBe(0);
  });

  it("wins through the intended resource cut within the configured time", () => {
    const game = new Simulation(config);
    expect(game.startTransport("player-base", "resource", "player")).not.toBeNull();
    let startedFrontline = false;
    let startedBase = false;
    for (let i = 0; i < 1800 && !game.winner; i++) {
      game.step();
      if (game.node("resource").owner === "player" && !startedFrontline) { game.startTransport("resource", "frontline", "player"); startedFrontline = true; }
      if (game.node("frontline").owner === "player" && !startedBase) { game.startTransport("frontline", "enemy-base", "player"); startedBase = true; }
    }
    expect(startedFrontline).toBe(true);
    expect(startedBase).toBe(true);
    expect(game.winner).toBe("player");
    expect(game.time).toBeLessThanOrEqual(240);
  });

  it("does not let a direct frontline assault capture while enemy support remains", () => {
    const game = new Simulation(config);
    expect(game.startTransport("player-base", "frontline", "player")).not.toBeNull();
    runFor(game, 240);
    expect(game.node("frontline").owner).toBe("enemy");
  });
});

describe("Map validation", () => {
  it("accepts the authored map", () => {
    expect(() => validateMap(structuredClone(config))).not.toThrow();
  });

  it("allows roads to cross", () => {
    const crossing = structuredClone(config);
    Object.assign(crossing.nodes.find((node) => node.id === "player-base")!, { x: 0, y: 0 });
    Object.assign(crossing.nodes.find((node) => node.id === "frontline")!, { x: 100, y: 0 });
    Object.assign(crossing.nodes.find((node) => node.id === "resource")!, { x: 50, y: -50 });
    Object.assign(crossing.nodes.find((node) => node.id === "backup")!, { x: 50, y: 50 });

    expect(() => validateMap(crossing)).not.toThrow();
  });

  it("reports malformed external map data without property-access errors", () => {
    expect(() => validateMap(null)).toThrow("The map root must be a JSON object");
    expect(() => validateMap({ version: 1 })).toThrow("Settings must be a JSON object");
  });

  it("validates every node field", () => {
    const invalid = structuredClone(config) as unknown as { nodes: Array<Record<string, unknown>> };
    invalid.nodes[0]!.production = -1;
    expect(() => validateMap(invalid)).toThrow('Node "player-base" production must be 0 or greater');
  });

  it("rejects duplicate road IDs and unusable initial transports", () => {
    const duplicateRoad = structuredClone(config);
    duplicateRoad.roads[1]!.id = duplicateRoad.roads[0]!.id;
    expect(() => validateMap(duplicateRoad)).toThrow('Road ID "player-frontline" is duplicated');

    const wrongOwner = structuredClone(config);
    wrongOwner.initialTransports[0]!.owner = "player";
    expect(() => validateMap(wrongOwner)).toThrow("owner must match its source node");
  });
});
