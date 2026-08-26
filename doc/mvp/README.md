# Supply War MVP

Status: implemented browser prototype.

Source: user-confirmed MVP decisions and implementation evidence in [the progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), summarized here on 2026-08-26. These documents are the current maintained MVP reference; the progress record and its history retain the decision trail.

## Document map

| Area | Current reference | Covers |
| --- | --- | --- |
| Rules and objective | [Gameplay](gameplay.md) | Transport, capture, support, siege, victory, and deferred rules |
| Player-facing flow | [User experience](user-experience.md) | Briefing, controls, feedback, colors, and interaction states |
| Authored scenario | [Map design](map-design.md) | Topology, node placement, values, initial enemy routes, and intended tactic |
| Implementation | [Technology](tech.md) | Stack, engine boundaries, simulation order, data model, and extension points |
| Evidence and operating checks | [Validation](validation.md) | Automated checks, balance scenarios, browser checks, and known risk |

## Scope boundary

The MVP tests one intended insight: a weaker player can defeat a stronger enemy by first breaking its supply route. It is not a general map editor, reactive enemy AI, breakthrough system, capacity model, detailed HUD, or external runtime plugin platform. Source: [Gameplay](gameplay.md) and [Technology](tech.md).
