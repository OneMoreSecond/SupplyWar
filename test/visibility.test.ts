import { describe, expect, it } from "vitest";
import { Simulation, type MapConfigV2 } from "../src/game";
import { VisibilityProjection, currentlyVisibleNodeIds } from "../src/visibility";

function visibilityMap(fogEnabled = true): MapConfigV2 {
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
        computerAI: { enabled: false, decisionIntervalSeconds: 1, reserveForce: 0 },
        fogOfWar: { enabled: fogEnabled },
        interdiction: { enabled: false, durationSeconds: 2, cooldownSeconds: 5 },
      },
    },
    nodes: [
      { id: "player-base", label: "Player Base", owner: "player", force: 10, production: 0, kind: "base", x: 0, y: 0 },
      { id: "frontier", label: "Frontier", owner: "neutral", force: 1, production: 0, kind: "ordinary", x: 100, y: 0 },
      { id: "far", label: "Far", owner: "neutral", force: 1, production: 0, kind: "ordinary", x: 200, y: 0 },
      { id: "enemy-base", label: "Enemy Base", owner: "enemy", force: 10, production: 0, kind: "base", x: 300, y: 0 },
    ],
    roads: [
      { id: "player-frontier", a: "player-base", b: "frontier", width: 1, travelTimeMultiplier: 1 },
      { id: "frontier-far", a: "frontier", b: "far", width: 1, travelTimeMultiplier: 1 },
      { id: "far-enemy", a: "far", b: "enemy-base", width: 1, travelTimeMultiplier: 1 },
    ],
    initialTransports: [],
  };
}

describe("fog of war visibility", () => {
  it("shows owned nodes and their immediate neighbors", () => {
    const game = new Simulation(visibilityMap());
    expect([...currentlyVisibleNodeIds(game, "player")].sort()).toEqual(["frontier", "player-base"]);
  });

  it("remembers discovered geography without exposing live state", () => {
    const game = new Simulation(visibilityMap());
    const projection = new VisibilityProjection(game, "player");
    expect(projection.nodeVisibility("frontier")).toBe("visible");
    expect(projection.nodeVisibility("far")).toBe("unknown");

    game.node("frontier").owner = "player";
    projection.update(game);
    expect(projection.nodeVisibility("far")).toBe("visible");

    game.node("frontier").owner = "neutral";
    projection.update(game);
    expect(projection.nodeVisibility("far")).toBe("discovered");
    expect(projection.isTransportVisible({ source: "far", target: "enemy-base" })).toBe(false);
  });

  it("shows the full map when fog is disabled", () => {
    const game = new Simulation(visibilityMap(false));
    const projection = new VisibilityProjection(game, "player");
    expect([...game.nodes.keys()].every((id) => projection.nodeVisibility(id) === "visible")).toBe(true);
  });
});
