# Supply War MVP

Status: implemented browser prototype.

Source: user-confirmed MVP decisions and implementation evidence in [the game progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md), and [the tutorial progression record](../../agents/progress/2026-08-27-tutorial-level-progression.md), summarized here on 2026-08-27. These documents are the current maintained MVP reference; the progress records and their histories retain the decision trail.

## Document map

| Area | Current reference | Covers |
| --- | --- | --- |
| Rules and objective | [Gameplay](gameplay.md) | Transport, capture, support, siege, victory, and deferred rules |
| Player-facing flow | [User experience](user-experience.md) | Tutorial progression, level navigation, briefing, controls, map-editor workflow, feedback, and interaction states |
| Authored scenarios | [Map design](map-design.md) | Four focused tutorials, MVP final-exam topology, values, crossing policy, and intended tactics |
| Implementation | [Technology](tech.md) | Stack, engine boundaries, level catalog, simulation order, camera, data model, editor, and extension points |
| Evidence and operating checks | [Validation](validation.md) | Automated checks, balance scenarios, game/editor browser checks, and known risk |

## Scope boundary

The MVP teaches four implemented mechanisms, then tests the combined insight that a weaker player can defeat a stronger enemy by first breaking its supply route. The browser editor supports the complete version-1 map schema, but not arbitrary future schemas, reactive enemy AI, a breakthrough system, a capacity model, campaign persistence/locking, a detailed HUD, or an external runtime plugin platform. Source: [Gameplay](gameplay.md), [Technology](tech.md), and user-confirmed tutorial/map-editor scope.
