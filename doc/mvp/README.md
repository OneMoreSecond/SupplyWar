# Supply War MVP

Status: implemented browser prototype.

Source: user-confirmed MVP decisions and implementation evidence in [the game progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md) and [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md), summarized here on 2026-08-27. These documents are the current maintained MVP reference; the progress records and their histories retain the decision trail.

## Document map

| Area | Current reference | Covers |
| --- | --- | --- |
| Rules and objective | [Gameplay](gameplay.md) | Transport, capture, support, siege, victory, and deferred rules |
| Player-facing flow | [User experience](user-experience.md) | Briefing, game controls, map-editor workflow, feedback, colors, and interaction states |
| Authored scenario | [Map design](map-design.md) | Topology, node placement, values, initial enemy routes, and intended tactic |
| Implementation | [Technology](tech.md) | Stack, engine boundaries, simulation order, data model, editor, and extension points |
| Evidence and operating checks | [Validation](validation.md) | Automated checks, balance scenarios, game/editor browser checks, and known risk |

## Scope boundary

The MVP tests one intended insight: a weaker player can defeat a stronger enemy by first breaking its supply route. The browser editor supports the complete version-1 map schema, but not arbitrary future schemas, reactive enemy AI, a breakthrough system, a capacity model, a detailed HUD, or an external runtime plugin platform. Source: [Gameplay](gameplay.md), [Technology](tech.md), and user-confirmed map-editor scope.
