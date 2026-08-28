import { describe, expect, it } from "vitest";
import { applyAICommand, chooseAICommand, createAIObservation } from "../src/ai";
import { Simulation, validateMap } from "../src/game";
import { levels, levelById, nextLevel } from "../src/levels";

function runUntil(game: Simulation, predicate: () => boolean, seconds: number): void {
  const steps = Math.ceil(seconds / game.config.settings.logicTickSeconds);
  for (let index = 0; index < steps && !predicate(); index++) game.step();
}

describe("authored level catalog", () => {
  it("orders four focused tutorials, the MVP final exam, and the large-map demo", () => {
    expect(levels.map((level) => level.id)).toEqual([
      "transport",
      "support",
      "cut-supply",
      "siege",
      "mvp",
      "demo",
    ]);
    expect(levels.slice(0, 4).every((level) => level.kind === "tutorial")).toBe(true);
    expect(levelById("mvp").kind).toBe("final-exam");
    expect(levels.at(-1)?.kind).toBe("demo");
  });

  it("validates every authored level and resolves navigation safely", () => {
    for (const level of levels) expect(() => validateMap(level.config)).not.toThrow();
    expect(levelById("support").id).toBe("support");
    expect(levelById("missing").id).toBe("transport");
    expect(nextLevel("transport")?.id).toBe("support");
    expect(nextLevel("mvp")?.id).toBe("demo");
    expect(nextLevel("demo")).toBeUndefined();
  });

  it("teaches direct force transport before siege matters", () => {
    const level = levelById("transport");
    const game = new Simulation(level.config);
    const initialEnemyForce = game.node("enemy-base").force;
    expect(game.startTransport("player-base", "enemy-base", "player")).not.toBeNull();
    runUntil(game, () => game.winner === "player", 30);

    expect(game.winner).toBe("player");
    expect(game.time).toBeGreaterThan(2.2);
    expect(game.time).toBeLessThan(2.7);
    expect(level.config.settings.siegeHalfLifeSeconds).toBeGreaterThan(1000);
    expect(initialEnemyForce).toBe(4);
  });

  it("teaches allied supply feeding an attack", () => {
    const level = levelById("support");
    const protectedEnemy = new Simulation(level.config);
    const initialEnemyForce = protectedEnemy.node("enemy-base").force;
    expect(protectedEnemy.mode(protectedEnemy.transports[0]!)).toBe("support");
    expect(protectedEnemy.startTransport("player-base", "enemy-base", "player")).not.toBeNull();
    protectedEnemy.step(0.5);
    expect(protectedEnemy.node("enemy-base").force).toBe(initialEnemyForce);

    const withoutSupply = new Simulation(level.config);
    expect(withoutSupply.startTransport("player-base", "enemy-base", "player")).not.toBeNull();
    runUntil(withoutSupply, () => withoutSupply.winner === "player", 15);
    expect(withoutSupply.winner).toBeNull();

    const game = new Simulation(level.config);
    const upperSupport = game.startTransport("upper-resource", "player-base", "player");
    const lowerSupport = game.startTransport("lower-resource", "player-base", "player");
    const attack = game.startTransport("player-base", "enemy-base", "player");
    expect(upperSupport && game.mode(upperSupport)).toBe("support");
    expect(lowerSupport && game.mode(lowerSupport)).toBe("support");
    expect(attack && game.mode(attack)).toBe("attack");
    runUntil(game, () => game.winner === "player", 45);

    expect(game.winner).toBe("player");
    expect(game.time).toBeGreaterThan(7);
    expect(game.time).toBeLessThan(7.4);
  });

  it("teaches that capturing a source cuts its enemy support", () => {
    const level = levelById("cut-supply");
    expect(level.config.nodes.find((node) => node.id === "enemy-resource")!.x)
      .toBeGreaterThan(level.config.nodes.find((node) => node.id === "enemy-base")!.x);
    const directAttack = new Simulation(level.config);
    expect(directAttack.startTransport("player-base", "enemy-base", "player")).not.toBeNull();
    runUntil(directAttack, () => directAttack.winner === "player", 30);
    expect(directAttack.winner).toBeNull();
    expect(directAttack.node("enemy-base").force).toBeGreaterThanOrEqual(6);

    const game = new Simulation(level.config);
    const enemySupport = game.transports[0]!;
    expect(game.mode(enemySupport)).toBe("support");
    expect(game.startTransport("player-base", "enemy-resource", "player")).not.toBeNull();
    runUntil(game, () => game.node("enemy-resource").owner === "player", 45);

    expect(enemySupport.active).toBe(false);
    expect(enemySupport.packets).toEqual([]);
    expect(game.startTransport("enemy-resource", "enemy-base", "player")).not.toBeNull();
    runUntil(game, () => game.winner === "player", 90);
    expect(game.winner).toBe("player");
    expect(game.time).toBeGreaterThan(8.8);
    expect(game.time).toBeLessThan(9.3);
  });

  it("teaches rooted siege by cutting a weak middle node through a shortcut", () => {
    const level = levelById("siege");
    const game = new Simulation(level.config);
    expect(level.config.nodes.map((node) => node.id)).toEqual([
      "player-base",
      "frontline",
      "mid",
      "enemy-base",
    ]);
    expect(game.roadBetween("player-base", "frontline")).toBeDefined();
    expect(game.roadBetween("frontline", "mid")).toBeDefined();
    expect(game.roadBetween("mid", "enemy-base")).toBeDefined();
    expect(game.roadBetween("player-base", "mid")).toBeDefined();
    expect(game.node("enemy-base").guardedBy).toEqual(["frontline"]);
    expect(game.isGuarded("enemy-base", "player")).toBe(true);
    expect(game.node("frontline").force).toBeGreaterThan(game.node("mid").force * 5);
    expect(game.isSupplied("frontline")).toBe(true);

    expect(game.startTransport("player-base", "mid", "player")).not.toBeNull();
    runUntil(game, () => game.node("mid").owner === "player", 30);
    expect(game.node("mid").owner).toBe("player");
    expect(game.isSupplied("frontline")).toBe(false);
    expect(game.startTransport("mid", "enemy-base", "player")).toBeNull();

    expect(game.startTransport("player-base", "frontline", "player")).not.toBeNull();
    runUntil(game, () => game.node("frontline").owner === "player", 60);
    expect(game.node("frontline").owner).toBe("player");
    expect(game.isGuarded("enemy-base", "player")).toBe(false);
    expect(game.startTransport("mid", "frontline", "player")).not.toBeNull();
    expect(game.startTransport("frontline", "enemy-base", "player")).not.toBeNull();
    runUntil(game, () => game.winner === "player", 60);

    expect(game.winner).toBe("player");
    expect(game.time).toBeGreaterThan(10);
    expect(game.time).toBeLessThan(25);
  });

  it("halves the MVP final-exam completion time through map numbers", () => {
    const game = new Simulation(levelById("mvp").config);
    expect(game.startTransport("player-base", "resource", "player")).not.toBeNull();
    let startedFrontline = false;
    let startedBase = false;
    runUntil(game, () => {
      if (game.node("resource").owner === "player" && !startedFrontline) {
        game.startTransport("resource", "frontline", "player");
        startedFrontline = true;
      }
      if (game.node("frontline").owner === "player" && !startedBase) {
        game.startTransport("frontline", "enemy-base", "player");
        startedBase = true;
      }
      return game.winner === "player";
    }, 90);

    expect(game.winner).toBe("player");
    expect(game.time).toBeGreaterThan(72);
    expect(game.time).toBeLessThan(74);
  });

  it("provides a varied large-map baseline that the AI expands into", () => {
    const level = levelById("demo");
    const config = level.config;
    if (config.version !== 2) throw new Error("The Demo must use map schema version 2");
    expect(config.nodes.length).toBeGreaterThanOrEqual(30);
    expect(config.nodes.length).toBeLessThanOrEqual(40);
    expect(config.roads.length).toBeGreaterThanOrEqual(45);
    expect(config.roads.length).toBeLessThanOrEqual(60);
    expect(config.nodes.filter((node) => node.kind === "resource")).toHaveLength(7);
    expect(new Set(config.roads.map((road) => road.width)).size).toBeGreaterThanOrEqual(4);
    expect(config.roads.some((road) => road.travelTimeMultiplier > 1)).toBe(true);
    expect(config.nodes.filter((node) => node.kind === "ordinary").every((node) => node.production === 0)).toBe(true);
    for (const resource of config.nodes.filter((node) => node.kind === "resource")) {
      const bestCapacity = Math.max(...config.roads
        .filter((road) => road.a === resource.id || road.b === resource.id)
        .map((road) => road.width * config.settings.forcePerWidthUnit));
      expect(bestCapacity).toBeGreaterThanOrEqual(resource.production * 1.5);
    }
    expect(config.settings.rules.computerAI.enabled).toBe(true);
    expect(config.settings.rules.fogOfWar.enabled).toBe(true);
    expect(config.settings.rules.interdiction.enabled).toBe(true);

    const game = new Simulation(config);
    const initialEnemyNodes = [...game.nodes.values()].filter((node) => node.owner === "enemy").length;
    let nextDecisionAt = config.settings.rules.computerAI.decisionIntervalSeconds;
    for (let index = 0; index < 1200 && !game.winner; index++) {
      game.step();
      if (game.time >= nextDecisionAt) {
        applyAICommand(game, chooseAICommand(createAIObservation(game, "enemy")), "enemy");
        nextDecisionAt += config.settings.rules.computerAI.decisionIntervalSeconds;
      }
    }

    expect([...game.nodes.values()].filter((node) => node.owner === "enemy").length).toBeGreaterThan(initialEnemyNodes);
  });

  it("does not leave a symmetric automated Demo match permanently stalled", () => {
    const config = levelById("demo").config;
    if (config.version !== 2) throw new Error("The Demo must use map schema version 2");
    const game = new Simulation(config);
    let nextDecisionAt = config.settings.rules.computerAI.decisionIntervalSeconds;
    let ownershipChanges = 0;
    let previousOwners = new Map([...game.nodes].map(([id, node]) => [id, node.owner]));
    for (let index = 0; index < 9000 && !game.winner; index++) {
      game.step();
      for (const owner of ["player", "enemy"] as const) {
        if (game.time >= nextDecisionAt) applyAICommand(game, chooseAICommand(createAIObservation(game, owner)), owner);
      }
      if (game.time >= nextDecisionAt) nextDecisionAt += config.settings.rules.computerAI.decisionIntervalSeconds;
      const currentOwners = new Map([...game.nodes].map(([id, node]) => [id, node.owner]));
      for (const [id, owner] of currentOwners) if (owner !== previousOwners.get(id)) ownershipChanges++;
      previousOwners = currentOwners;
    }

    expect(ownershipChanges).toBeGreaterThanOrEqual(10);
    expect(game.winner).not.toBeNull();
    expect(game.time).toBeLessThan(900);
  });
});
