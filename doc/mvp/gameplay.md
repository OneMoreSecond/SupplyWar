# MVP Gameplay

Source: user-confirmed MVP decisions in [the progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), Sections 4–5, summarized on 2026-08-26.

## Goal

Capture the enemy base. The MVP demonstrates that cutting support lets a weaker player defeat a stronger, badly positioned enemy. Source: user-confirmed MVP objective in the progress record.

## Terms

| Term | Meaning |
| --- | --- |
| Node | A base, resource, or ordinary location that has an owner and force count |
| Road | An undirected map connection; only one active transport may use it |
| Transport | A continuous flow owned by the source owner and sent along one road |
| Support | A transport whose target is allied to its owner; arrivals reinforce it |
| Attack | A transport whose target is hostile; arrivals reduce its force |
| Siege | Attrition applied to an attacked node with no active allied support transport |

## Core loop

1. Choose a player-owned node and start a transport to an adjacent unused road.
2. Use the flow to capture a neutral or enemy target, or reinforce an allied target.
3. Cut enemy support by capturing its source, then keep attacking the unsupported strong node until siege and arriving force capture it.
4. Repeat until the enemy base is player-owned. Source: user-confirmed MVP tactical sequence in the progress record.

## Rules

| Rule | MVP behavior |
| --- | --- |
| Production | Every non-neutral node adds its configured production. This map gives production to bases and the resource; ordinary nodes have zero. Nodes have no storage cap. |
| Start transport | The source must be owned by the initiator, the target must be adjacent, and the road must be unused. |
| Throughput and latency | Throughput is road width × configured force-per-width-unit. Latency is road geometry × configured seconds-per-distance-unit. |
| Continuous flow | Each logic tick sends up to the available throughput. An empty source pauses and later resumes its active route. |
| Arrival | Allied arrivals add force. Enemy arrivals subtract force; any surplus becomes the captured node's garrison. |
| Cancel | The player may cancel a player-owned active transport; all force currently on that road disappears. |
| Source ownership change | Cancel that transport and remove its in-flight packets. |
| Target ownership change | Keep the transport and re-evaluate whether it is support or attack on the next logic tick. |

Source: user-confirmed transport decisions in the progress record; implementation: [`src/game.ts`](../../src/game.ts).

## Siege

An attacked node is supported only when an active allied support transport targets it. Without such support, its force follows the configured exponential half-life formula:

`force = force × 0.5^(elapsedSeconds / halfLifeSeconds)`

At force `<= 0.01`, the node surrenders to the active attacker with a zero-force garrison. The selected formula is an internal `SiegeFormula` implementation chosen by map configuration, not a runtime mod system. Source: user-confirmed formula/plugin decisions; implementation: [`src/game.ts`](../../src/game.ts).

## Enemy behavior and deferred scope

The enemy begins with authored transports and starts no new transports during the game. Breakthrough, a reactive AI, capacity limits, a formal map editor, and external runtime formula plugins are outside this MVP. Source: user-confirmed MVP scope in the progress record.
