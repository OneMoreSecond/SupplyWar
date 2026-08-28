# Supply War Validation

Status: automated Phases A–E and production browser checks pass; human fun and 10–15-minute pacing remain open.

Source: local commands and browser evidence recorded in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md), 2026-08-28.

## Current checks

| Check | Coverage | Current result | Source |
| --- | --- | --- | --- |
| `npm run typecheck` | TypeScript across game, AI, editor, and tests | Passed | Local output, 2026-08-28 |
| `npm test` | 5 files and 49 deterministic tests | Passed | Local Vitest output, 2026-08-28 |
| `npm run build` | Production game/editor bundles and JSON imports | Passed | Local Vite 8.2.2 output, 2026-08-28 |
| Demo production browser smoke | Six-level picker, formal timer, 2× Canvas backing store, zoom-scaled nodes, label threshold, fog, AI, Interdiction, screenshot, 120-frame sample | Passed | [`demo_browser_check.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/demo_browser_check.mjs), 2026-08-28 |
| Production browser regression | Tutorial navigation, version conversion, Guard authoring, editor round trip, and player Interdiction interaction | Passed | [`browser_regression.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/browser_regression.mjs), 2026-08-28 |
| Human Gate C | Expansion, resource contact, advantage break, finish, and no long stall | Pending | Acceptance criteria in the Demo progress record |

## Automated coverage

| Area | Cases | Source |
| --- | --- | --- |
| Versioning | Version-1 acceptance/upgrade, explicit direct behavior, version-2 rules, required road multiplier, enabled fog/Interdiction | [`test/game.test.ts`](../../test/game.test.ts) |
| Transport | Geometry, latency multiplier, width throughput, source cancellation, target mode refresh | [`test/game.test.ts`](../../test/game.test.ts) |
| Rooted siege | Base-only roots, resource siege, rooted multi-hop chain, isolated cycle, rooted cycle, source capture, surrender | [`test/game.test.ts`](../../test/game.test.ts) |
| Guard and map validation | Hostile-start blocking/release, existing/unique/non-self Guard references, external roots, node fields, road topology, transport ownership, permitted crossings | [`test/game.test.ts`](../../test/game.test.ts) |
| AI | Resource/defense/weak-node priority, guarded-target exclusion, reserve cancellation, wait, visible Interdiction, fog boundary | [`test/ai.test.ts`](../../test/ai.test.ts) |
| Fog | Owned/adjacent visibility, discovery memory, hidden live transport, disabled full-map behavior | [`test/visibility.test.ts`](../../test/visibility.test.ts) |
| Interdiction | Dispatch pause, rooted-support break/recovery, in-flight packets, ownership/target/cooldown rules | [`test/game.test.ts`](../../test/game.test.ts) |
| Camera | Round trips, anchored zoom, wide-map fit, pan, and viewport resize | [`test/camera.test.ts`](../../test/camera.test.ts) |
| Authored progression | Six-map order/navigation, guarded Tutorial 4 route, base-rooted MVP route, Demo capacity invariant, AI expansion, symmetric no-stall completion | [`test/levels.test.ts`](../../test/levels.test.ts) |

## Revised authored balance

| Scenario | Result | Source |
| --- | --- | --- |
| Tutorial 3 intended route | Victory between 8.8s and 9.3s after resources became siegeable | [`test/levels.test.ts`](../../test/levels.test.ts), 2026-08-28 |
| Tutorial 4 | Weak-middle cut, guarded frontline siege, and victory complete between 10s and 25s; direct middle-to-base start is rejected | [`test/levels.test.ts`](../../test/levels.test.ts) |
| MVP intended route | Victory between 72s and 74s under base-only rooted support | [`test/levels.test.ts`](../../test/levels.test.ts) |
| MVP direct frontline assault | Frontline remains enemy-owned through 240s | [`test/game.test.ts`](../../test/game.test.ts) |

The revised values preserve the roughly 73-second MVP target while changing the support chain to Enemy Base → Enemy Backup → Enemy Resource → Enemy Frontline and making the resource siegeable when that base-rooted chain is broken. Source: authored JSON and regression bounds in [`test/levels.test.ts`](../../test/levels.test.ts).

## Production Demo evidence

Headless Chromium at device-pixel ratio `2` opened `?level=demo`, found all six ordered options, observed the enemy grow from 9 to 13 nodes by simulation second 18, and confirmed fog exposed 8 of 32 nodes. The formal timer showed `00:18`; at fit zoom `0.528`, node radius stayed at its `27px` lower bound and optional labels were hidden. After zooming in, radius reached `30.79px` and labels were visible. A 120-frame sample averaged `16.61ms` with a `16.8ms` maximum interval. Source: [`demo_browser_check.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/demo_browser_check.mjs) and local output, 2026-08-28.

The initial screenshot exposed dense label overlap. The refreshed full-page view now uses high-DPI rendering and hides optional labels at overview distance while keeping force, ownership, semantic shapes, capacity-aware strokes, poor-road patterns, and special-node tags. Active arrows remain a human-play observation. Source: inspected [`demo-baseline.png`](../../agents/tmp/2026-08-28-demo-plan/output/demo-baseline.png), 2026-08-28.

## Historical regression evidence

The existing production workflows previously covered full tutorial/final-exam navigation and the complete editor load/save/reset/camera/playtest surface. Those scripts remain under [`agents/tmp/2026-08-27-tutorial-level-progression/`](../../agents/tmp/2026-08-27-tutorial-level-progression/) and [`agents/tmp/2026-08-27-browser-map-editor/`](../../agents/tmp/2026-08-27-browser-map-editor/). Source: prior progress records and retained evidence.

The current focused regression verified six-level navigation, Tutorial 1 completion, final-exam/Demo labels, the formal timer, all 14 version-2 settings, Guard node editing, both road inspectors, two-way schema conversion, valid fog/Interdiction authoring, editor round-trip restoration, and a real player Interdiction click/cooldown. Source: [`browser_regression.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/browser_regression.mjs), [`interdiction-active.png`](../../agents/tmp/2026-08-28-demo-plan/output/interdiction-active.png), and local output, 2026-08-28.

## Remaining acceptance risk

- The 10–15-minute target, four human-observed match stages, reversal frequency, and “really fun” goal have not been measured. Source: user requirement in [`doc/Demo.md`](../Demo.md) and Gate F criteria.
- Automated symmetric play proves eventual movement/winner but is not evidence of human pacing or strategy quality. Source: [`test/levels.test.ts`](../../test/levels.test.ts) and validation judgment.
- Human play must confirm that fogged discovery, animated routes, labels, and disruption feedback are understandable under pressure. Source: inspected screenshots and design judgment.
