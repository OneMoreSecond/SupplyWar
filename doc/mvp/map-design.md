# Supply War Map Design

Status: five teaching/final-exam maps are regression-tested; the 32-node Demo baseline is implemented but awaits qualitative Gate C play.

Source: authored data under [`maps/`](../../maps/), scripted routes in [`test/levels.test.ts`](../../test/levels.test.ts), and implementation evidence in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md), updated 2026-08-28.

## Authored progression

All maintained maps use schema version 2 and rooted supply. Earlier mechanics remain available when a tutorial depends on them. Source: authored JSON and [`src/levels.ts`](../../src/levels.ts).

| Order | Map | Focus | Intended interaction | Source |
| ---: | --- | --- | --- | --- |
| 1 | [`tutorial-1-transport.json`](../../maps/tutorial-1-transport.json) | Transport | Send Your Base directly to Small Enemy Base | Map JSON and [`test/levels.test.ts`](../../test/levels.test.ts) |
| 2 | [`tutorial-2-support.json`](../../maps/tutorial-2-support.json) | Allied supply | Feed Your Base from both resources while attacking Supported Base | Map JSON and [`test/levels.test.ts`](../../test/levels.test.ts) |
| 3 | [`tutorial-3-cut-supply.json`](../../maps/tutorial-3-cut-supply.json) | Source capture | Reject the supported direct route; capture Enemy Resource, then attack back | Map JSON and [`test/levels.test.ts`](../../test/levels.test.ts) |
| 4 | [`tutorial-4-siege.json`](../../maps/tutorial-4-siege.json) | Rooted siege | Siege the ordinary Unsupported Fortress from three positions, then capture the non-siegeable Enemy Base by packets | Map JSON and [`test/levels.test.ts`](../../test/levels.test.ts) |
| 5 | [`mvp.json`](../../maps/mvp.json) | Final exam | Capture the resource root, siege the frontline, then packet-capture the base | Map JSON and [`test/levels.test.ts`](../../test/levels.test.ts) |
| 6 | [`demo.json`](../../maps/demo.json) | Large-map baseline | Expand through rural resources, contest the central network, and defeat active AI | User-approved Demo plan and map JSON |

## Maintained route timings

| Level milestone | Simulation time | Source |
| --- | ---: | --- |
| Tutorial 1 victory | 2.4s | [`test/levels.test.ts`](../../test/levels.test.ts) |
| Tutorial 2 victory | 7.2s | [`test/levels.test.ts`](../../test/levels.test.ts) |
| Tutorial 3 victory | 11.1s | Local scripted measurement in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md), 2026-08-28 |
| Tutorial 4 fortress / victory | 7.1s / 12.0s | Local scripted measurement in the Demo progress record, 2026-08-28 |
| MVP resource / frontline / victory | 10.7s / 36.9s / 71.7s | Local scripted measurement in the Demo progress record, 2026-08-28 |

The fixed `0.1s` logic tick remains unchanged. Tutorial 4 gained a separate base and the MVP numbers were rebalanced because rooted bases/resources no longer receive siege decay. Source: [`src/game.ts`](../../src/game.ts), revised map JSON, and [`test/levels.test.ts`](../../test/levels.test.ts).

## MVP final exam

```text
Player Base ── Enemy Frontline ───────── Enemy Base
     ╲                 ╲                     │
      ╲                 Enemy Resource ─ Enemy Backup
       └─────────────────────╯
```

| Node | Initial force / production | Purpose | Source |
| --- | --- | --- | --- |
| Player Base | 45 / 1 | Starting force and flank source | [`maps/mvp.json`](../../maps/mvp.json) |
| Enemy Frontline | 70 / 0 | Strong ordinary node protected by rooted resource support | [`maps/mvp.json`](../../maps/mvp.json) |
| Enemy Resource | 25 / 2 | First packet-capture target and frontline supply root | [`maps/mvp.json`](../../maps/mvp.json) |
| Enemy Backup | 80 / 0 | Strong rear node deliberately bypassed | [`maps/mvp.json`](../../maps/mvp.json) |
| Enemy Base | 61 / 0.5 | Final root captured by packets, not siege | [`maps/mvp.json`](../../maps/mvp.json) |

Player Base–Resource has width `2`; Resource–Frontline has width `1`; Enemy Base–Backup has width `0.25`; the other three roads have width `1`. Every road has `travelTimeMultiplier: 1`. The narrower rear support lets its root retain force while keeping the intended direct frontline attack unsuccessful. Source: [`maps/mvp.json`](../../maps/mvp.json) and regression cases in [`test/game.test.ts`](../../test/game.test.ts).

## Central Campaign baseline

| Property | Current value | Source |
| --- | --- | --- |
| Nodes / roads | 32 / 60 | [`maps/demo.json`](../../maps/demo.json) |
| Resource nodes | 7 | [`maps/demo.json`](../../maps/demo.json) and [`test/levels.test.ts`](../../test/levels.test.ts) |
| Regions | Player rear, sparse western rural approaches, dense central city, eastern approaches, enemy rear | Authored topology in [`maps/demo.json`](../../maps/demo.json) |
| Road variety | Widths `0.6`–`2`; travel multipliers `1`–`1.8` | [`maps/demo.json`](../../maps/demo.json) |
| Long route | North Hamlet–Uptown East bypass: width `0.6`, multiplier `1.8` | [`maps/demo.json`](../../maps/demo.json) |
| Economy | Production is concentrated in seven resources and two bases; ordinary nodes produce zero | [`maps/demo.json`](../../maps/demo.json) |
| Opponent | Deterministic AI, one decision per simulation second, reserve force `10` | [`maps/demo.json`](../../maps/demo.json) and [`src/ai.ts`](../../src/ai.ts) |
| Current information rules | Full visibility; fog and Interdiction disabled | [`maps/demo.json`](../../maps/demo.json) |

The production browser baseline loaded all six levels and showed enemy expansion from 9 to 13 nodes with 5 active enemy routes at simulation second 18. Source: [`agents/tmp/2026-08-28-demo-plan/script/demo_browser_check.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/demo_browser_check.mjs) and recorded output, 2026-08-28.

## Remaining map risk

- Gate C human play has not yet proved the four intended stages or 10–15-minute pacing. Source: acceptance criteria in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md).
- Full-map fit uses about 50.7% zoom. Short labels and semantic shapes are readable in the current screenshot, but human play must confirm animated routes do not obscure tactical information. Source: inspected production screenshot [`demo-baseline.png`](../../agents/tmp/2026-08-28-demo-plan/output/demo-baseline.png), 2026-08-28.
- Fog and Interdiction must not be enabled until the full-visibility topology/economy loop passes Gate C. Source: approved staged plan in the Demo progress record.
