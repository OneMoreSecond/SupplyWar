# Supply War Prototype

Status: MVP and automated Demo implementation complete; qualitative human validation pending.

Source: user-confirmed MVP decisions and evidence in [the game progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md), [the tutorial progression record](../../agents/progress/2026-08-27-tutorial-level-progression.md), and the approved implementation in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md), updated 2026-08-28. These category documents hold current truth; progress records and histories retain superseded decisions.

## Document map

| Area | Current reference | Covers |
| --- | --- | --- |
| Rules and objective | [Gameplay](gameplay.md) | Transport, capture, support, siege, victory, and deferred rules |
| Player-facing flow | [User experience](user-experience.md) | Tutorial progression, level navigation, briefing, controls, map-editor workflow, feedback, and interaction states |
| Authored scenarios | [Map design](map-design.md) | Four tutorials, revised MVP final exam, large Demo baseline, values, topology, and intended tactics |
| Implementation | [Technology](tech.md) | Stack, engine boundaries, level catalog, simulation order, camera, data model, editor, and extension points |
| Evidence and operating checks | [Validation](validation.md) | Automated checks, balance scenarios, game/editor browser checks, and known risk |

## Scope boundary

The maintained progression teaches four mechanisms, tests them in the MVP final exam, then exposes the 32-node Central Campaign with rooted supply, fog/discovery, deterministic fog-limited AI, road latency, and timed player/AI Interdiction. Version-1 maps remain loadable with legacy direct-support siege. Human 10–15-minute pacing and fun are not yet validated. Source: [Gameplay](gameplay.md), [Technology](tech.md), [Validation](validation.md), and [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md).
