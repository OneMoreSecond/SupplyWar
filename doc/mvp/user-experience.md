# Supply War User Experience

Status: six-level navigation, fog/discovery, Interdiction HUD, semantic node/road presentation, and local Barlow typography are implemented.

Source: current browser implementation, authored metadata in [`src/levels.ts`](../../src/levels.ts), and [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md), updated 2026-08-28.

## Learning and play progression

| Order | Level | Focal experience | Source |
| ---: | --- | --- | --- |
| 1 | Send forces | Transport and capture | [`src/levels.ts`](../../src/levels.ts) |
| 2 | Allied supply | Feed an attack from two resources | [`src/levels.ts`](../../src/levels.ts) |
| 3 | Cut supply | Compare a failing direct attack with source capture | [`src/levels.ts`](../../src/levels.ts) |
| 4 | Siege | Use a shortcut to cut Weak Supply, then siege Strong Front | User instruction, [`src/levels.ts`](../../src/levels.ts), [`maps/tutorial-4-siege.json`](../../maps/tutorial-4-siege.json) |
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
| Arm Interdiction | Select `Interdict route` | Enters route targeting when the ability is ready | [`index.html`](../../index.html), [`src/main.ts`](../../src/main.ts) |
| Cast Interdiction | Click a visible active red route while armed | Suspends route dispatch/support and starts the visible cooldown | [`src/main.ts`](../../src/main.ts), [`src/game.ts`](../../src/game.ts) |
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
| Fog | Visible live nodes render normally; discovered nodes become muted silhouettes without force/owner; unknown topology is hidden | [`src/visibility.ts`](../../src/visibility.ts), [`src/game-view.ts`](../../src/game-view.ts) |
| Interdiction | Purple suspended route, remaining-effect timer, ready/cooldown button, and explicit invalid-target/status copy | [`src/game-view.ts`](../../src/game-view.ts), [`src/main.ts`](../../src/main.ts) |
| Typography | Locally bundled Barlow Regular/SemiBold with system fallbacks | [`src/fonts.css`](../../src/fonts.css), [`src/assets/barlow/OFL.txt`](../../src/assets/barlow/OFL.txt) |

At the Demo's 50.7% fit zoom, the initial eight-node visible cluster is readable with shortened labels, semantic shapes, separate special-node offsets, and width/latency styling. Human play must still check the view after most geography is discovered and several routes animate concurrently. Source: inspected production screenshot [`demo-baseline.png`](../../agents/tmp/2026-08-28-demo-plan/output/demo-baseline.png), 2026-08-28; design judgment.

## Demo briefing

The Demo tells the player to explore through fog, secure sparse resources, and use Interdiction on a visible red route when the rooted frontline stalls. Source: [`src/levels.ts`](../../src/levels.ts) and mechanism-presentation requirement in [`doc/Demo.md`](../Demo.md).

## Map editor flow

The separate editor loads/saves version-1 and version-2 JSON; exposes global settings and one selected node/road inspector; adds roads through connector dragging; edits a road's optional initial transport and version-2 travel multiplier; pans, zooms, and fits large maps; validates before save/playtest; and preserves its browser-local playtest round trip. Source: [`editor.html`](../../editor.html), [`src/editor.ts`](../../src/editor.ts), and [`src/playtest.ts`](../../src/playtest.ts).

## Pending player-facing work

- Confirm fog discovery, animated routes, labels, and the Interdiction timer remain understandable during real play. Source: visual inspection and Gate E/F criteria in the Demo progress record.
- Measure whether the higher throughput produces meaningful allocation choices rather than excessive route churn. Source: user follow-up and human-play boundary.
