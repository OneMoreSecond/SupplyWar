# Supply War Validation

Status: automated Phases A–E and production browser checks pass; human fun and 10–15-minute pacing remain open.

Source: local commands and browser evidence recorded in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md), 2026-08-28.

## Current checks

| Check | Coverage | Current result | Source |
| --- | --- | --- | --- |
| `npm run typecheck` | TypeScript across game, AI, editor, and tests | Passed | Local output, 2026-08-28 |
| `npm test` | 5 files and 45 deterministic tests | Passed | Local Vitest output, 2026-08-28 |
| `npm run build` | Production game/editor bundles and JSON imports | Passed | Local Vite 8.2.2 output, 2026-08-28 |
| Demo production browser smoke | Six-level picker, fog projection, AI expansion, Interdiction HUD, screenshot, 120-frame sample | Passed | [`demo_browser_check.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/demo_browser_check.mjs), 2026-08-28 |
| Production browser regression | Tutorial navigation, version conversion, enabled-rule authoring, editor round trip, and player Interdiction interaction | Passed | [`browser_regression.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/browser_regression.mjs), 2026-08-28 |
| Human Gate C | Expansion, resource contact, advantage break, finish, and no long stall | Pending | Acceptance criteria in the Demo progress record |

## Automated coverage

| Area | Cases | Source |
| --- | --- | --- |
| Versioning | Version-1 acceptance/upgrade, explicit direct behavior, version-2 rules, required road multiplier, enabled fog/Interdiction | [`test/game.test.ts`](../../test/game.test.ts) |
| Transport | Geometry, latency multiplier, width throughput, source cancellation, target mode refresh | [`test/game.test.ts`](../../test/game.test.ts) |
| Rooted siege | Root immunity, rooted multi-hop chain, isolated cycle, rooted cycle, root capture, surrender | [`test/game.test.ts`](../../test/game.test.ts) |
| Map validation | External roots, node fields, unique road IDs/topology, transport ownership, permitted crossings | [`test/game.test.ts`](../../test/game.test.ts) |
| AI | Resource/defense/weak-node priority, reserve cancellation, wait, visible Interdiction, fog boundary | [`test/ai.test.ts`](../../test/ai.test.ts) |
| Fog | Owned/adjacent visibility, discovery memory, hidden live transport, disabled full-map behavior | [`test/visibility.test.ts`](../../test/visibility.test.ts) |
| Interdiction | Dispatch pause, rooted-support break/recovery, in-flight packets, ownership/target/cooldown rules | [`test/game.test.ts`](../../test/game.test.ts) |
| Camera | Round trips, anchored zoom, wide-map fit, and pan | [`test/camera.test.ts`](../../test/camera.test.ts) |
| Authored progression | Six-map order/navigation, revised Tutorial 4 shortcut, MVP route, Demo capacity invariant, AI expansion, symmetric no-stall completion | [`test/levels.test.ts`](../../test/levels.test.ts) |

## Revised authored balance

| Scenario | Result | Source |
| --- | --- | --- |
| Tutorial 3 intended route | Victory at 11.1s | Local scripted measurement, 2026-08-28 |
| Tutorial 4 | Weak-middle cut, frontline siege, and victory complete between 10s and 25s | [`test/levels.test.ts`](../../test/levels.test.ts) |
| MVP intended route | Resource 10.7s; frontline 36.9s; victory 71.7s | Local scripted measurement, 2026-08-28 |
| MVP direct frontline assault | Frontline remains enemy-owned through 240s | [`test/game.test.ts`](../../test/game.test.ts) |

The revised values preserve the previous roughly 72-second MVP target while changing the final base from siege capture to packet capture. Source: authored JSON, local measurements, and regression bounds in [`test/levels.test.ts`](../../test/levels.test.ts).

## Production Demo evidence

Headless Chromium opened `?level=demo`, found all six ordered options, observed the enemy grow from 9 to 13 nodes by simulation second 18, and confirmed fog exposed 8 of 32 nodes. The camera fit zoom was `0.5067`; a 120-frame sample averaged `16.58ms` with a `16.8ms` maximum interval. Source: [`demo_browser_check.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/demo_browser_check.mjs) and local output, 2026-08-28.

The initial screenshot exposed dense label overlap. After shortening authored labels and adding semantic shapes, capacity-aware strokes, poor-road patterns, and separate special-node label offsets, the refreshed full-page screenshot is readable at the same fit zoom; active arrows remain a human-play observation. Source: inspected [`demo-baseline.png`](../../agents/tmp/2026-08-28-demo-plan/output/demo-baseline.png), 2026-08-28.

## Historical regression evidence

The existing production workflows previously covered full tutorial/final-exam navigation and the complete editor load/save/reset/camera/playtest surface. Those scripts remain under [`agents/tmp/2026-08-27-tutorial-level-progression/`](../../agents/tmp/2026-08-27-tutorial-level-progression/) and [`agents/tmp/2026-08-27-browser-map-editor/`](../../agents/tmp/2026-08-27-browser-map-editor/). Source: prior progress records and retained evidence.

The current focused regression verified six-level navigation, Tutorial 1 completion, final-exam/Demo labels, all 14 version-2 settings, both road inspectors, two-way schema conversion, valid fog/Interdiction authoring, editor round-trip restoration, and a real player Interdiction click/cooldown. Source: [`browser_regression.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/browser_regression.mjs), [`interdiction-active.png`](../../agents/tmp/2026-08-28-demo-plan/output/interdiction-active.png), and local output, 2026-08-28.

## Remaining acceptance risk

- The 10–15-minute target, four human-observed match stages, reversal frequency, and “really fun” goal have not been measured. Source: user requirement in [`doc/Demo.md`](../Demo.md) and Gate F criteria.
- Automated symmetric play proves eventual movement/winner but is not evidence of human pacing or strategy quality. Source: [`test/levels.test.ts`](../../test/levels.test.ts) and validation judgment.
- Human play must confirm that fogged discovery, animated routes, labels, and disruption feedback are understandable under pressure. Source: inspected screenshots and design judgment.
