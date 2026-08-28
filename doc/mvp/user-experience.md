# Supply War User Experience

Status: six-level navigation, the full-visibility Central Campaign baseline, semantic node shapes, and road hierarchy are implemented. Fog, Interdiction, font, and HUD work remain pending.

Source: current browser implementation, authored metadata in [`src/levels.ts`](../../src/levels.ts), and [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md), updated 2026-08-28.

## Learning and play progression

| Order | Level | Focal experience | Source |
| ---: | --- | --- | --- |
| 1 | Send forces | Transport and capture | [`src/levels.ts`](../../src/levels.ts) |
| 2 | Allied supply | Feed an attack from two resources | [`src/levels.ts`](../../src/levels.ts) |
| 3 | Cut supply | Compare a failing direct attack with source capture | [`src/levels.ts`](../../src/levels.ts) |
| 4 | Siege | Siege an ordinary fortress, then packet-capture its base | [`src/levels.ts`](../../src/levels.ts), [`maps/tutorial-4-siege.json`](../../maps/tutorial-4-siege.json) |
| 5 | Supply War MVP | Combine resource capture, rooted support cutting, siege, and base capture | [`src/levels.ts`](../../src/levels.ts), [`maps/mvp.json`](../../maps/mvp.json) |
| 6 | The Central Campaign | Expand across a large map against deterministic enemy commands | [`src/levels.ts`](../../src/levels.ts), [`maps/demo.json`](../../maps/demo.json) |

Normal entry starts at Tutorial 1; unknown IDs fall back there. The picker can open any level. Victory offers replay and the next level, while the final Demo offers close. Editor playtests stay isolated from authored completion dialogs. Source: [`src/main.ts`](../../src/main.ts), [`src/levels.ts`](../../src/levels.ts), and navigation tests in [`test/levels.test.ts`](../../test/levels.test.ts).

## Game controls

| Action | Input | Result | Source |
| --- | --- | --- | --- |
| Start transport | Drag from a green owned node to an adjacent node | Starts a route when its road is unused | [`src/main.ts`](../../src/main.ts) |
| Preview transport | Hold the drag | Shows direction and valid/invalid target feedback | [`src/main.ts`](../../src/main.ts) |
| Cancel transport | Right-click a green active road | Cancels that route and removes its packets | [`src/main.ts`](../../src/main.ts), [`src/game.ts`](../../src/game.ts) |
| Pick level | Choose from `Level` | Opens one of six authored scenarios | [`src/main.ts`](../../src/main.ts), [`src/levels.ts`](../../src/levels.ts) |
| Pan / zoom | Drag empty map space / wheel | Navigates unbounded world coordinates | [`src/main.ts`](../../src/main.ts), [`src/camera.ts`](../../src/camera.ts) |
| Restart | Select `Restart map` | Restores the current map and AI cadence | [`src/main.ts`](../../src/main.ts) |
| Finish | Capture `enemy-base` | Opens authored completion UI | [`src/main.ts`](../../src/main.ts) |
| Lose | Enemy captures `player-base` | Stops simulation and shows explicit defeat status | [`src/game.ts`](../../src/game.ts), [`src/main.ts`](../../src/main.ts) |

## Current visual language

| State | Presentation | Source |
| --- | --- | --- |
| Ownership | Green player, red enemy, grey neutral | [`src/main.ts`](../../src/main.ts) |
| Node role | Star base, square resource, circular ordinary node; base/resource production appears above | [`src/main.ts`](../../src/main.ts) |
| Active route | Owner-colored line with animated white direction triangles | [`src/main.ts`](../../src/main.ts) |
| Unsupported siege | Pulsing bright-red ring | [`src/main.ts`](../../src/main.ts) |
| Road capacity / latency | Stroke thickness follows capacity; roads with multiplier above `1` use a broken pattern | [`src/game.ts`](../../src/game.ts), [`src/main.ts`](../../src/main.ts) |
| Fog / Interdiction | Not shown because both rules remain disabled | [`src/game.ts`](../../src/game.ts), [`maps/demo.json`](../../maps/demo.json) |

At the Demo's 50.7% fit zoom, shortened labels, semantic shapes, separate special-node label offsets, and width/latency road styling make the full topology readable. Animated route arrows may still cross nearby text briefly, so human Gate C should include a legibility question. Source: inspected production screenshot [`demo-baseline.png`](../../agents/tmp/2026-08-28-demo-plan/output/demo-baseline.png), 2026-08-28.

## Demo briefing

The current Demo tells the player to secure nearby resources before the enemy reaches the center and points out the long slow northern bypass. The hint makes the intended first strategic choice visible while the map is still fully observable. Source: [`src/levels.ts`](../../src/levels.ts) and prototype preference recorded in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md).

## Map editor flow

The separate editor loads/saves version-1 and version-2 JSON; exposes global settings and one selected node/road inspector; adds roads through connector dragging; edits a road's optional initial transport and version-2 travel multiplier; pans, zooms, and fits large maps; validates before save/playtest; and preserves its browser-local playtest round trip. Source: [`editor.html`](../../editor.html), [`src/editor.ts`](../../src/editor.ts), and [`src/playtest.ts`](../../src/playtest.ts).

## Pending player-facing work

- Confirm dense-map labels and animated routes remain understandable during Gate C human play. Source: updated visual inspection and Phase E acceptance in the Demo progress record.
- Add fog visibility/discovery only after the full-visibility loop passes Gate C. Source: approved phase order in the Demo progress record.
- Add Interdiction targeting, cooldown, disruption timer, and invalid-target guidance with the simulation rule. Source: pending Phase D.
- Bundle Barlow and refine the surrounding HUD while preserving the implemented star/square/circle language. Source: user requirements in [`doc/Demo.md`](../Demo.md) and pending Phase E.
