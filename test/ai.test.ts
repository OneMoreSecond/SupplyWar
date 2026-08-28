import { describe, expect, it } from "vitest";
import { applyAICommand, createAIObservation, chooseAICommand } from "../src/ai";
import { Simulation, type MapConfigV2 } from "../src/game";

function aiMap(): MapConfigV2 {
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
        computerAI: { enabled: true, decisionIntervalSeconds: 1, reserveForce: 10 },
        fogOfWar: { enabled: false },
        interdiction: { enabled: false, durationSeconds: 10, cooldownSeconds: 60 },
      },
    },
    nodes: [
      { id: "player-base", label: "Player Base", owner: "player", force: 8, production: 0, kind: "base", x: 0, y: 0 },
      { id: "player-outpost", label: "Player Outpost", owner: "player", force: 5, production: 0, kind: "ordinary", x: 100, y: 100 },
      { id: "enemy-base", label: "Enemy Base", owner: "enemy", force: 40, production: 1, kind: "base", x: 300, y: 0 },
      { id: "enemy-outpost", label: "Enemy Outpost", owner: "enemy", force: 20, production: 0, kind: "ordinary", x: 200, y: 100 },
      { id: "neutral-resource", label: "Neutral Resource", owner: "neutral", force: 4, production: 2, kind: "resource", x: 300, y: 100 },
      { id: "neutral-node", label: "Neutral Node", owner: "neutral", force: 1, production: 0, kind: "ordinary", x: 400, y: 100 },
    ],
    roads: [
      { id: "enemy-resource", a: "enemy-base", b: "neutral-resource", width: 1, travelTimeMultiplier: 1 },
      { id: "enemy-neutral", a: "enemy-base", b: "neutral-node", width: 1, travelTimeMultiplier: 1 },
      { id: "outpost-player", a: "enemy-outpost", b: "player-outpost", width: 1, travelTimeMultiplier: 1 },
      { id: "base-outpost", a: "enemy-base", b: "enemy-outpost", width: 1, travelTimeMultiplier: 1 },
    ],
    initialTransports: [],
  };
}

describe("computer AI", () => {
  it("chooses the same resource expansion for identical observations", () => {
    const game = new Simulation(aiMap());
    const first = chooseAICommand(createAIObservation(game, "enemy"));
    const second = chooseAICommand(createAIObservation(game, "enemy"));

    expect(first).toEqual({ type: "start-transport", source: "enemy-base", target: "neutral-resource" });
    expect(second).toEqual(first);
  });

  it("defends a threatened holding before expanding", () => {
    const game = new Simulation(aiMap());
    expect(game.startTransport("player-outpost", "enemy-outpost", "player")).not.toBeNull();

    expect(chooseAICommand(createAIObservation(game, "enemy")))
      .toEqual({ type: "start-transport", source: "enemy-base", target: "enemy-outpost" });
  });

  it("attacks an adjacent weak unsupported node when no resource is available", () => {
    const map = aiMap();
    map.nodes.find((node) => node.id === "neutral-resource")!.owner = "enemy";
    map.nodes.find((node) => node.id === "neutral-node")!.owner = "enemy";
    const game = new Simulation(map);

    expect(chooseAICommand(createAIObservation(game, "enemy")))
      .toEqual({ type: "start-transport", source: "enemy-outpost", target: "player-outpost" });
  });

  it("cancels a route before draining its source below the configured reserve", () => {
    const game = new Simulation(aiMap());
    const route = game.startTransport("enemy-outpost", "player-outpost", "enemy")!;
    game.node("enemy-outpost").force = 9;

    const command = chooseAICommand(createAIObservation(game, "enemy"));
    expect(command).toEqual({ type: "cancel-transport", transportId: route.id });
    expect(applyAICommand(game, command, "enemy")).toBe(true);
    expect(route.active).toBe(false);
  });

  it("waits when no legal command exists", () => {
    const game = new Simulation(aiMap());
    for (const node of game.nodes.values()) if (node.owner === "enemy") node.force = 10;

    expect(chooseAICommand(createAIObservation(game, "enemy"))).toEqual({ type: "wait" });
  });

  it("interdicts a visible hostile attack before issuing a transport command", () => {
    const map = aiMap();
    map.settings.rules.interdiction.enabled = true;
    const game = new Simulation(map);
    const attack = game.startTransport("player-outpost", "enemy-outpost", "player")!;

    const command = chooseAICommand(createAIObservation(game, "enemy"));
    expect(command).toEqual({ type: "interdict-transport", transportId: attack.id });
    expect(applyAICommand(game, command, "enemy")).toBe(true);
    expect(game.isTransportOperational(attack)).toBe(false);
  });

  it("does not expose nodes beyond the AI's fog boundary", () => {
    const map = aiMap();
    map.settings.rules.fogOfWar.enabled = true;
    map.nodes.push({ id: "hidden", label: "Hidden", owner: "neutral", force: 1, production: 0, kind: "ordinary", x: 500, y: 100 });
    map.roads.push({ id: "neutral-hidden", a: "neutral-node", b: "hidden", width: 1, travelTimeMultiplier: 1 });
    const observation = createAIObservation(new Simulation(map), "enemy");

    expect(observation.nodes.some((node) => node.id === "hidden")).toBe(false);
    expect(observation.roads.some((road) => road.id === "neutral-hidden")).toBe(false);
  });
});
