# MVP Map Design

Source: authored map data in [`maps/mvp.json`](../../maps/mvp.json), user-confirmed map decisions, and the geometry-aware balance model in [the progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), summarized on 2026-08-26.

## Tactical purpose

The map makes the enemy frontline immediately threatening but puts the resource, backup, and base in a distant rear area. The player must use the long flank to remove frontline support before attacking the frontline. Source: user-confirmed map-layout correction.

## Topology

```text
Player Base ── Enemy Frontline ───────── Enemy Base
     ╲                 ╲                     │
      ╲                 Enemy Resource ─ Enemy Backup
       └─────────────────────╯
```

The roads are Player Base–Frontline, Frontline–Resource, Resource–Backup, Backup–Enemy Base, Player Base–Resource, and Frontline–Enemy Base. This authored layout avoids crossings for readability, but road crossings are valid game data and may be used by other maps. Source: [`maps/mvp.json`](../../maps/mvp.json) for the layout; user review, 2026-08-27, for the crossing policy.

## Nodes

| Node | Initial owner | Force / production | Position | Map purpose |
| --- | --- | --- | --- | --- |
| Player Base | Player | 45 / 0.5 per second | (85, 300) | Starting force and reinforcement source |
| Enemy Frontline | Enemy | 70 / 0 | (285, 300) | Nearby strong threat that needs a supply cut |
| Enemy Resource | Enemy | 38 / 1 per second | (620, 470) | Weak rear source and first tactical capture |
| Enemy Backup | Enemy | 80 / 0 | (820, 470) | Supplied strong force, deliberately bypassed |
| Enemy Base | Enemy | 85 / 1 per second | (820, 150) | Final victory target and backup source |

Source: [`maps/mvp.json`](../../maps/mvp.json); purposes: user-confirmed scenario design.

## Roads and initial flows

All roads have width `1`; their latency follows their displayed geometry at `0.015` seconds per distance unit. Source: [`maps/mvp.json`](../../maps/mvp.json).

| Route | Distance / latency | Initial transport | Tactical implication |
| --- | --- | --- | --- |
| Player Base → Frontline | 200.0 / 3.0s | None | Direct attack is tempting but fails while support remains |
| Player Base → Resource | 561.4 / 8.4s | None | Long flank that starts the intended solution |
| Resource → Frontline | 375.7 / 5.6s | Enemy support | Capturing the resource cancels this support at its source |
| Frontline → Enemy Base | 555.6 / 8.3s | None | Final siege route after the frontline falls |
| Resource → Backup | 200.0 / 3.0s | None | Part of the visible enemy rear network |
| Enemy Base → Backup | 320.0 / 4.8s | Enemy support | Demonstrates a second static enemy supply flow |

Source: geometry from [`maps/mvp.json`](../../maps/mvp.json); transport purpose: user-confirmed map design.

## Intended solution and balance target

1. Attack and capture Enemy Resource from Player Base.
2. The resource-to-frontline support transport cancels because its source changed owner.
3. Attack and siege Enemy Frontline from the captured resource.
4. Attack and siege Enemy Base from the captured frontline, bypassing Enemy Backup.

The geometry-aware model predicts resource/frontline/base capture at 33.4 / 89.8 / 143.0 simulation seconds; a direct Player Base → Frontline assault leaves the frontline enemy-owned at 240 seconds. Source: [`agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py`](../../agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py) and its recorded results.
