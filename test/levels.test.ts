import { describe, expect, it } from "vitest";
import { Simulation, validateMap } from "../src/game";
import { levels, levelById, nextLevel } from "../src/levels";

function runUntil(game: Simulation, predicate: () => boolean, seconds: number): void {
  const steps = Math.ceil(seconds / game.config.settings.logicTickSeconds);
  for (let index = 0; index < steps && !predicate(); index++) game.step();
}

describe("authored level catalog", () => {
  it("orders four focused tutorials before the MVP final exam", () => {
    expect(levels.map((level) => level.id)).toEqual([
      "transport",
      "support",
      "cut-supply",
      "siege",
      "mvp",
    ]);
    expect(levels.slice(0, -1).every((level) => level.kind === "tutorial")).toBe(true);
    expect(levels.at(-1)?.kind).toBe("final-exam");
  });

  it("validates every authored level and resolves navigation safely", () => {
    for (const level of levels) expect(() => validateMap(level.config)).not.toThrow();
    expect(levelById("support").id).toBe("support");
    expect(levelById("missing").id).toBe("transport");
    expect(nextLevel("transport")?.id).toBe("support");
    expect(nextLevel("mvp")).toBeUndefined();
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
    expect(directAttack.node("enemy-base").force).toBeGreaterThanOrEqual(35);

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
    expect(game.time).toBeGreaterThan(10.8);
    expect(game.time).toBeLessThan(11.2);
  });

  it("teaches siege by letting a weak force defeat a stronger unsupported base", () => {
    const level = levelById("siege");
    const game = new Simulation(level.config);
    const sideNodes = [game.node("north-flank"), game.node("south-flank")];
    expect(sideNodes.every((node) => node.owner === "player")).toBe(true);
    expect(sideNodes.every((node) => game.roadBetween(node.id, "enemy-base"))).toBe(true);
    const playerForce = [game.node("player-base"), ...sideNodes]
      .reduce((total, node) => total + node.force, 0);
    expect(playerForce).toBeLessThan(game.node("enemy-base").force / 5);
    expect(game.startTransport("player-base", "enemy-base", "player")).not.toBeNull();
    expect(game.startTransport("north-flank", "enemy-base", "player")).not.toBeNull();
    expect(game.startTransport("south-flank", "enemy-base", "player")).not.toBeNull();
    runUntil(game, () => game.winner === "player", 60);

    expect(game.winner).toBe("player");
    expect(game.time).toBeGreaterThan(6.9);
    expect(game.time).toBeLessThan(7.3);
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
    expect(game.time).toBeGreaterThan(70);
    expect(game.time).toBeLessThan(72.5);
  });
});
