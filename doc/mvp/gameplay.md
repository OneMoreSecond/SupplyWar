# Supply War Gameplay

Status: rooted-supply rules and deterministic Demo AI are implemented; fog and Interdiction remain disabled.

Source: user-confirmed MVP decisions in [the game progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), tutorial sequencing in [the tutorial progress record](../../agents/progress/2026-08-27-tutorial-level-progression.md), the approved requirements in [`doc/Demo.md`](../Demo.md), and current implementation recorded in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md), updated 2026-08-28.

## Goal and core loop

Capture the enemy base before the enemy captures the player base. Tutorials introduce individual rules, the MVP final exam tests supply cutting, and the Central Campaign baseline adds territorial expansion against an active enemy. Source: [`src/game.ts`](../../src/game.ts), [`src/levels.ts`](../../src/levels.ts), and [`maps/demo.json`](../../maps/demo.json).

1. Start transports from owned nodes across unused adjacent roads.
2. Capture neutral nodes and sparse resource nodes to expand production.
3. Reinforce threatened holdings and cut hostile support roots.
4. Attack unsupported ordinary nodes with siege; capture bases and resources through arriving force.
5. Capture `enemy-base` to win while protecting `player-base`. Source: current rules in [`src/game.ts`](../../src/game.ts) and Demo goal in [`doc/Demo.md`](../Demo.md).

## Terms

| Term | Meaning | Source |
| --- | --- | --- |
| Node | A base, resource, or ordinary location with owner, force, production, and position | [`src/game.ts`](../../src/game.ts) |
| Road | An undirected connection with capacity width and, in version 2, a travel-time multiplier | [`src/game.ts`](../../src/game.ts) |
| Transport | A continuous source-to-target force flow; one active transport may occupy a road | [`src/game.ts`](../../src/game.ts) |
| Support | An active transport whose current target has the same owner | [`src/game.ts`](../../src/game.ts) |
| Supply root | A player- or enemy-owned base or resource | Approved rule in [`doc/Demo.md`](../Demo.md); implementation in [`src/game.ts`](../../src/game.ts) |
| Rooted support | A directed chain of active same-owner support transports starting at a supply root | Approved rule in [`doc/Demo.md`](../Demo.md); implementation in [`src/game.ts`](../../src/game.ts) |
| Siege | Exponential attrition applied to an attacked ordinary node without valid supply | [`src/game.ts`](../../src/game.ts) |

## Transport and economy rules

| Rule | Current behavior | Source |
| --- | --- | --- |
| Production | Every non-neutral node adds its configured production; nodes have no force cap | [`src/game.ts`](../../src/game.ts) |
| Start | Source ownership must match the initiator, target must be adjacent, and the road must be unused | [`src/game.ts`](../../src/game.ts) |
| Throughput | `road.width × forcePerWidthUnit` | [`src/game.ts`](../../src/game.ts) |
| Latency | Geometry distance × `secondsPerDistanceUnit` × version-2 `travelTimeMultiplier` | [`src/game.ts`](../../src/game.ts) |
| Continuous flow | Each logic tick sends up to available throughput; an empty source pauses and later resumes | [`src/game.ts`](../../src/game.ts) |
| Arrival | Allied arrivals add force; hostile arrivals subtract force; surplus captures the node | [`src/game.ts`](../../src/game.ts) |
| Cancel | The owning side may cancel an active transport; all in-flight force on it is removed | [`src/game.ts`](../../src/game.ts) |
| Source capture | Cancels that source's transports and removes their packets | [`src/game.ts`](../../src/game.ts) |
| Target capture | Keeps the transport and re-evaluates support/attack mode on the next tick | [`src/game.ts`](../../src/game.ts) |

## Rooted siege

Maintained version-2 maps use `siegeSupport: "rooted"`. A player- or enemy-owned base/resource is its own supply root. An ordinary node is supplied only when a directed path of active same-owner support transports reaches it from such a root. An isolated circular support chain is not supplied; connecting the cycle to a root supplies every reachable node. Source: approved rule in [`doc/Demo.md`](../Demo.md), implementation and cycle/root tests in [`src/game.ts`](../../src/game.ts) and [`test/game.test.ts`](../../test/game.test.ts).

An attacked unsupplied node follows:

`force = force × 0.5^(elapsedSeconds / halfLifeSeconds)`

At force `<= 0.01`, it surrenders to the active attacker with a zero-force garrison. Bases and resources do not receive siege decay but remain capturable through hostile packets. Version-1 maps explicitly upgrade with `siegeSupport: "direct"` so their old direct-support behavior is preserved. Source: [`src/game.ts`](../../src/game.ts) and [`test/game.test.ts`](../../test/game.test.ts).

## Computer AI

The Demo enables one deterministic enemy policy. Every configured decision interval it issues at most one normal game command. It first cancels a route that would drain its source below reserve, then defends a threatened holding, targets an affordable resource, attacks an affordable weak unsupported hostile node, expands into an affordable neutral node, or attacks another affordable hostile node. IDs resolve ties deterministically. Source: [`src/ai.ts`](../../src/ai.ts), [`src/main.ts`](../../src/main.ts), and [`test/ai.test.ts`](../../test/ai.test.ts).

The four tutorials and MVP final exam keep AI disabled. Fog of war and Interdiction are represented in the version-2 schema but validation rejects enabling them until their implementation phases are complete. Source: authored JSON under [`maps/`](../../maps/), validator in [`src/game.ts`](../../src/game.ts), and pending work in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md).
