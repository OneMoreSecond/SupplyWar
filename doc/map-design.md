# Supply War Map Design Guide

Status: normative guide for every authored-map design or modification.

Source: user instruction, 2026-08-28; lessons from maintained maps under [`maps/`](../maps/) and their scenarios in [`test/levels.test.ts`](../test/levels.test.ts). Current map values and measured results remain in [`doc/mvp/map-design.md`](mvp/map-design.md).

## Goal

Design maps where topology makes the intended supply decision visible, alternative routes change how the player solves the position without skipping its required lesson, and production can move through roads fast enough to remain strategically useful. Source: user reviews, 2026-08-27 through 2026-08-28; design synthesis from the maintained tutorials, MVP, and Demo.

## Terms

| Term | Meaning | Source |
| --- | --- | --- |
| Supply root | An owned base from which operational same-owner support routes can propagate supply | User instruction disabling resource roots, 2026-08-28; rule in [`src/game.ts`](../src/game.ts) |
| Support chain | A directed sequence of operational same-owner transports beginning at a supply root | Rooted-supply implementation in [`src/game.ts`](../src/game.ts) |
| Guard | A node named in another node's `guardedBy` list; while guard and target share an owner, hostile transports cannot start toward the target | User requirement for Tutorial 4, 2026-08-28; map-rule design decision |
| Required lesson | The tactical action a player must perform to complete a teaching map | Tutorial structure in [`src/levels.ts`](../src/levels.ts); design synthesis |
| Shortcut | An alternate road that changes approach or sequence without bypassing a required guard | Tutorial 4 requirement, 2026-08-28; design synthesis |
| Throughput | Force moved per second: `road.width × forcePerWidthUnit` | [`src/game.ts`](../src/game.ts) |
| Production bottleneck | A productive node whose useful outgoing road capacity is too low to move its generated force at the intended tempo | User Demo balance feedback, 2026-08-28 |
| Information horizon | The currently visible owned nodes and their immediate neighbors under fog | [`src/visibility.ts`](../src/visibility.ts) |

## Lessons from current maps

| Map | Reusable lesson | Failure to avoid | Source |
| --- | --- | --- | --- |
| Tutorial 1 | One road and one action isolate basic transport learning. | Extra choices before the player understands drag-to-send. | [`maps/tutorial-1-transport.json`](../maps/tutorial-1-transport.json), [`test/levels.test.ts`](../test/levels.test.ts) |
| Tutorial 2 | Multiple allied inputs make reinforcement visible. | A nominal support route that does not affect the outcome. | [`maps/tutorial-2-support.json`](../maps/tutorial-2-support.json), [`test/levels.test.ts`](../test/levels.test.ts) |
| Tutorial 3 | A tempting direct attack contrasts with capturing the force source behind it. | A direct route that accidentally succeeds under revised balance rules. | [`maps/tutorial-3-cut-supply.json`](../maps/tutorial-3-cut-supply.json), [`test/levels.test.ts`](../test/levels.test.ts) |
| Tutorial 4 | A shortcut reaches the weak middle position, but a guard makes the strong frontline mandatory before the base. | Letting the shortcut become a complete bypass of the siege lesson. | User correction, 2026-08-28; [`maps/tutorial-4-siege.json`](../maps/tutorial-4-siege.json) |
| MVP final exam | The player combines source capture, rooted support cutting, siege, and packet capture. | Treating a resource as a permanent supply root after resources become siegeable. | [`maps/mvp.json`](../maps/mvp.json); user rule change, 2026-08-28 |
| Demo | Sparse production, varied roads, fog, and multiple fronts create allocation choices. | Resource accumulation caused mainly by inadequate road capacity. | [`maps/demo.json`](../maps/demo.json); user balance feedback, 2026-08-28 |

## Design principles

1. Name the required lesson before placing nodes. Every road and numeric value must either teach it, test it, or provide a deliberate alternative. Source: tutorial experience above; design synthesis.
2. Use `guardedBy` when a target must remain unreachable until a specific position falls. Do not rely only on hints or high target force to enforce required order. Source: user Tutorial 4 correction, 2026-08-28.
3. Bases are the only supply roots. Resources produce force but can be besieged when attacked without a base-rooted support chain. Source: user instruction, 2026-08-28.
4. Give each productive resource at least one useful road whose throughput exceeds its production. The Demo baseline uses `1.5 ×` production as its minimum invariant; tune the ratio per scenario after play. Source: user Demo balance feedback and [`test/levels.test.ts`](../test/levels.test.ts).
5. A shortcut should change risk, timing, or attack direction. If it skips the required lesson, add a guard, change its endpoint, or remove it. Source: Tutorial 4 experience; design synthesis.
6. Validate tempting wrong routes as well as the intended route. A tutorial is incomplete if only its successful path is tested. Source: Tutorial 3/MVP regression cases in [`test/levels.test.ts`](../test/levels.test.ts) and [`test/game.test.ts`](../test/game.test.ts).
7. Under fog, ensure every initial owned node reveals at least one meaningful choice and that discovery does not expose live state beyond the information horizon. Source: [`src/visibility.ts`](../src/visibility.ts); Demo experience.
8. Treat zoomed-out space as a priority budget: keep ownership, node kind, force, active direction, siege, and disruption before optional labels. Source: user display-priority principle, 2026-08-28.
9. Keep Canvas text crisp through device-pixel-ratio-aware rendering; do not compensate for fuzzy text by increasing every label or node. Source: user visual feedback, 2026-08-28; rendering design decision.

## Map review checklist

- [ ] State the required lesson and intended route. Source: design principle 1.
- [ ] List shortcuts and prove none bypasses a required guard. Source: design principles 2 and 5.
- [ ] Trace every supported frontline back to a base through directed operational routes. Source: base-only supply-root rule.
- [ ] Test that an unsupported resource can be sieged. Source: user rule change, 2026-08-28.
- [ ] Compare each resource's production with its useful outgoing capacity. Source: user Demo balance feedback.
- [ ] Test the intended route, at least one tempting wrong route, and victory/defeat reachability. Source: current regression practice.
- [ ] Inspect initial, zoomed-out, dense-route, siege, fog-discovery, and disruption states. Source: Demo visual-validation experience.
- [ ] Record human pacing and comprehension separately from automated simulation time. Source: Demo Gate F boundary in [`agents/progress/2026-08-28-demo-plan.md`](../agents/progress/2026-08-28-demo-plan.md).

## Known boundary

This guide records current design rules, not permanent balance constants. Update it when a map review changes a reusable principle; keep map-specific values and measurements in [`doc/mvp/map-design.md`](mvp/map-design.md). Source: user documentation instruction and project documentation lifecycle in [`AGENTS.md`](../AGENTS.md).
