import { describe, expect, it } from "vitest";
import mapConfig from "../maps/mvp.json";
import { Simulation, upgradeMap, validateMap, type MapConfig, type MapConfigV1, type MapConfigV2 } from "../src/game";

const config = mapConfig as MapConfig;
const runFor = (game: Simulation, seconds: number) => { for (let i = 0; i < Math.round(seconds / config.settings.logicTickSeconds); i++) game.step(); };

function rootedConfig(): MapConfigV2 {
  return {
    version: 2,
    settings: {
      logicTickSeconds: 0.1,
      siegeFormula: "exponential-half-life",
      siegeHalfLifeSeconds: 10,
      secondsPerDistanceUnit: 0.01,
      forcePerWidthUnit: 1,
      rules: {
        siegeSupport: "rooted",
        computerAI: { enabled: false, decisionIntervalSeconds: 1, reserveForce: 10 },
        fogOfWar: { enabled: false },
        interdiction: { enabled: false, durationSeconds: 10, cooldownSeconds: 60 },
      },
    },
    nodes: [
      { id: "player-base", label: "Player Base", owner: "player", force: 0, production: 0, kind: "base", x: 0, y: 0 },
      { id: "enemy-base", label: "Enemy Base", owner: "enemy", force: 100, production: 0, kind: "base", x: 500, y: 0 },
      { id: "enemy-resource", label: "Enemy Resource", owner: "enemy", force: 0, production: 0, kind: "resource", x: 400, y: 100 },
      { id: "frontline", label: "Frontline", owner: "enemy", force: 100, production: 0, kind: "ordinary", x: 200, y: 0 },
      { id: "cycle-a", label: "Cycle A", owner: "enemy", force: 0, production: 0, kind: "ordinary", x: 100, y: 200 },
      { id: "cycle-b", label: "Cycle B", owner: "enemy", force: 0, production: 0, kind: "ordinary", x: 200, y: 200 },
      { id: "cycle-c", label: "Cycle C", owner: "enemy", force: 0, production: 0, kind: "ordinary", x: 150, y: 300 },
    ],
    roads: [
      { id: "attack-frontline", a: "player-base", b: "frontline", width: 1, travelTimeMultiplier: 1 },
      { id: "root-frontline", a: "enemy-resource", b: "frontline", width: 1, travelTimeMultiplier: 1 },
      { id: "attack-cycle", a: "player-base", b: "cycle-a", width: 1, travelTimeMultiplier: 1 },
      { id: "cycle-a-b", a: "cycle-a", b: "cycle-b", width: 1, travelTimeMultiplier: 1 },
      { id: "cycle-b-c", a: "cycle-b", b: "cycle-c", width: 1, travelTimeMultiplier: 1 },
      { id: "cycle-c-a", a: "cycle-c", b: "cycle-a", width: 1, travelTimeMultiplier: 1 },
      { id: "root-cycle", a: "enemy-resource", b: "cycle-b", width: 1, travelTimeMultiplier: 1 },
      { id: "attack-base", a: "player-base", b: "enemy-base", width: 1, travelTimeMultiplier: 1 },
      { id: "attack-resource", a: "player-base", b: "enemy-resource", width: 1, travelTimeMultiplier: 1 },
    ],
    initialTransports: [],
  };
}

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
    expect(game.throughput(flankRoad)).toBe(4);
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

  it("upgrades version 1 explicitly while preserving its direct-support siege rule", () => {
    const current = structuredClone(config) as MapConfigV2;
    const { rules: _rules, ...legacySettings } = current.settings;
    const legacy: MapConfigV1 = {
      ...current,
      version: 1,
      settings: legacySettings,
      roads: current.roads.map(({ travelTimeMultiplier: _travelTimeMultiplier, ...road }) => road),
    };
    expect(legacy.version).toBe(1);

    const upgraded = upgradeMap(legacy);

    expect(upgraded.version).toBe(2);
    expect(upgraded.settings.rules.siegeSupport).toBe("direct");
    expect(upgraded.roads.every((road) => road.travelTimeMultiplier === 1)).toBe(true);
    expect(() => validateMap(upgraded)).not.toThrow();

    legacy.nodes.find((node) => node.id === "resource")!.kind = "ordinary";
    legacy.nodes.find((node) => node.id === "resource")!.force = 0;
    legacy.nodes.find((node) => node.id === "resource")!.production = 0;
    const legacyGame = new Simulation(legacy);
    legacyGame.node("frontline").force = 100;
    expect(legacyGame.startTransport("player-base", "frontline", "player")).not.toBeNull();
    legacyGame.step(legacy.settings.siegeHalfLifeSeconds);
    expect(legacyGame.node("frontline").force).toBe(100);
  });

  it("requires explicit version 2 rules and road travel multipliers", () => {
    const missingRules = rootedConfig() as unknown as { settings: Record<string, unknown> };
    delete missingRules.settings.rules;
    expect(() => validateMap(missingRules)).toThrow("Version 2 rules must be a JSON object");

    const missingTravelMultiplier = rootedConfig() as unknown as { roads: Array<Record<string, unknown>> };
    delete missingTravelMultiplier.roads[0]!.travelTimeMultiplier;
    expect(() => validateMap(missingTravelMultiplier)).toThrow('Road "attack-frontline" travelTimeMultiplier must be a number greater than or equal to 1');

    const enabledRules = rootedConfig();
    enabledRules.settings.rules.fogOfWar.enabled = true;
    enabledRules.settings.rules.interdiction.enabled = true;
    expect(() => validateMap(enabledRules)).not.toThrow();
  });

  it("applies a version 2 road travel multiplier without changing throughput", () => {
    const normal = new Simulation(rootedConfig());
    const slowedConfig = rootedConfig();
    slowedConfig.roads.find((road) => road.id === "attack-frontline")!.travelTimeMultiplier = 3;
    const slowed = new Simulation(slowedConfig);

    expect(slowed.travelSeconds(slowed.roadBetween("player-base", "frontline")!))
      .toBeCloseTo(normal.travelSeconds(normal.roadBetween("player-base", "frontline")!) * 3);
    expect(slowed.throughput(slowed.roadBetween("player-base", "frontline")!))
      .toBe(normal.throughput(normal.roadBetween("player-base", "frontline")!));
  });
});

describe("rooted supply siege", () => {
  it("protects an ordinary node through a rooted multi-hop support cycle", () => {
    const map = rootedConfig();
    map.initialTransports.push(
      { source: "enemy-resource", target: "cycle-b", owner: "enemy" },
      { source: "cycle-b", target: "cycle-c", owner: "enemy" },
      { source: "cycle-c", target: "cycle-a", owner: "enemy" },
      { source: "cycle-a", target: "cycle-b", owner: "enemy" },
    );
    const game = new Simulation(map);
    expect(game.startTransport("player-base", "cycle-a", "player")).not.toBeNull();

    game.step(map.settings.siegeHalfLifeSeconds);

    expect(game.node("cycle-a").owner).toBe("enemy");
    expect(game.node("cycle-a").force).toBe(0);
  });

  it("does not treat an isolated circular support chain as supplied", () => {
    const map = rootedConfig();
    map.nodes.find((node) => node.id === "cycle-a")!.force = 100;
    map.initialTransports.push(
      { source: "cycle-a", target: "cycle-b", owner: "enemy" },
      { source: "cycle-b", target: "cycle-c", owner: "enemy" },
      { source: "cycle-c", target: "cycle-a", owner: "enemy" },
    );
    const game = new Simulation(map);
    expect(game.startTransport("player-base", "cycle-a", "player")).not.toBeNull();

    game.step(map.settings.siegeHalfLifeSeconds);

    expect(game.node("cycle-a").force).toBeCloseTo(40, 1);
  });

  it("keeps bases and resources free from siege decay without making them invulnerable", () => {
    const map = rootedConfig();
    const game = new Simulation(map);
    expect(game.startTransport("player-base", "enemy-base", "player")).not.toBeNull();
    expect(game.startTransport("player-base", "enemy-resource", "player")).not.toBeNull();

    game.step(map.settings.siegeHalfLifeSeconds);

    expect(game.node("enemy-base").force).toBe(100);
    expect(game.node("enemy-resource").force).toBe(0);
  });

  it("starts siege when capture removes the root of an active support route", () => {
    const map = rootedConfig();
    map.initialTransports.push({ source: "enemy-resource", target: "frontline", owner: "enemy" });
    const game = new Simulation(map);
    expect(game.startTransport("player-base", "frontline", "player")).not.toBeNull();
    game.node("enemy-resource").owner = "player";

    game.step(map.settings.siegeHalfLifeSeconds);

    expect(game.node("frontline").force).toBeCloseTo(50, 1);
    expect(game.transports.find((transport) => transport.source === "enemy-resource")?.active).toBe(false);
  });
});

describe("Interdiction", () => {
  function interdictionGame(): Simulation {
    const map = rootedConfig();
    map.settings.rules.interdiction = { enabled: true, durationSeconds: 2, cooldownSeconds: 5 };
    map.nodes.find((node) => node.id === "enemy-resource")!.force = 20;
    map.initialTransports.push({ source: "enemy-resource", target: "frontline", owner: "enemy" });
    return new Simulation(map);
  }

  it("temporarily pauses dispatch and rooted support", () => {
    const game = interdictionGame();
    const support = game.transports[0]!;
    expect(game.isSupplied("frontline")).toBe(true);

    expect(game.interdictTransport(support.id, "player")).toBe(true);
    expect(game.isTransportOperational(support)).toBe(false);
    expect(game.isSupplied("frontline")).toBe(false);
    const sourceForce = game.node("enemy-resource").force;
    game.step(1);
    expect(game.node("enemy-resource").force).toBe(sourceForce);

    game.step(1);
    expect(game.isTransportOperational(support)).toBe(true);
    expect(game.isSupplied("frontline")).toBe(true);
    expect(game.node("enemy-resource").force).toBeLessThan(sourceForce);
  });

  it("preserves packets already in flight", () => {
    const game = interdictionGame();
    const support = game.transports[0]!;
    game.step();
    expect(support.packets.length).toBeGreaterThan(0);
    const frontlineForce = game.node("frontline").force;

    expect(game.interdictTransport(support.id, "player")).toBe(true);
    game.step(3);

    expect(game.node("frontline").force).toBeGreaterThan(frontlineForce);
  });

  it("enforces ownership, feature, active-target, and cooldown rules", () => {
    const game = interdictionGame();
    const support = game.transports[0]!;
    expect(game.interdictTransport(support.id, "enemy")).toBe(false);
    expect(game.interdictTransport("missing", "player")).toBe(false);
    expect(game.interdictTransport(support.id, "player")).toBe(true);
    expect(game.interdictTransport(support.id, "player")).toBe(false);
    expect(game.interdictionReadyIn("player")).toBe(5);
    game.step(5);
    expect(game.interdictionReadyIn("player")).toBe(0);
    expect(game.interdictTransport(support.id, "player")).toBe(true);

    const disabled = new Simulation(rootedConfig());
    const route = disabled.startTransport("enemy-resource", "frontline", "enemy")!;
    expect(disabled.interdictTransport(route.id, "player")).toBe(false);
  });
});
