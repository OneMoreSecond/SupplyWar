# Supply War Validation

Status: Phase A/B automated checks and the production large-map smoke test pass; qualitative Gate C remains open.

Source: local commands and browser evidence recorded in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md), 2026-08-28.

## Current checks

| Check | Coverage | Current result | Source |
| --- | --- | --- | --- |
| `npm run typecheck` | TypeScript across game, AI, editor, and tests | Passed | Local output, 2026-08-28 |
| `npm test` | 4 files and 36 deterministic tests | Passed | Local Vitest output, 2026-08-28 |
| `npm run build` | Production game/editor bundles and JSON imports | Passed | Local Vite 8.2.2 output, 2026-08-28 |
| Demo production browser smoke | Six-level picker, Demo route/mode, AI expansion, active routes, screenshot | Passed | [`demo_browser_check.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/demo_browser_check.mjs), 2026-08-28 |
| Production browser regression | Tutorial completion/successor, final-exam/Demo routing, version conversion, unsupported-rule feedback, editor playtest round trip | Passed | [`browser_regression.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/browser_regression.mjs), 2026-08-28 |
| Human Gate C | Expansion, resource contact, advantage break, finish, and no long stall | Pending | Acceptance criteria in the Demo progress record |

## Automated coverage

| Area | Cases | Source |
| --- | --- | --- |
| Versioning | Version-1 acceptance/upgrade, explicit direct behavior, version-2 rule object, required road multiplier, invalid unsupported feature flags | [`test/game.test.ts`](../../test/game.test.ts) |
| Transport | Geometry, latency multiplier, width throughput, source cancellation, target mode refresh | [`test/game.test.ts`](../../test/game.test.ts) |
| Rooted siege | Root immunity, rooted multi-hop chain, isolated cycle, rooted cycle, root capture, surrender | [`test/game.test.ts`](../../test/game.test.ts) |
| Map validation | External roots, node fields, unique road IDs/topology, transport ownership, permitted crossings | [`test/game.test.ts`](../../test/game.test.ts) |
| AI | Deterministic resource choice, defense priority, weak-node attack, reserve cancellation, wait | [`test/ai.test.ts`](../../test/ai.test.ts) |
| Camera | Round trips, anchored zoom, wide-map fit, and pan | [`test/camera.test.ts`](../../test/camera.test.ts) |
| Authored progression | Six-map order/navigation, tutorial tactics/timing, revised fortress/base flow, MVP route, Demo composition and AI expansion | [`test/levels.test.ts`](../../test/levels.test.ts) |

## Revised authored balance

| Scenario | Result | Source |
| --- | --- | --- |
| Tutorial 3 intended route | Victory at 11.1s | Local scripted measurement, 2026-08-28 |
| Tutorial 4 | Fortress at 7.1s; base victory at 12.0s | Local scripted measurement, 2026-08-28 |
| MVP intended route | Resource 10.7s; frontline 36.9s; victory 71.7s | Local scripted measurement, 2026-08-28 |
| MVP direct frontline assault | Frontline remains enemy-owned through 240s | [`test/game.test.ts`](../../test/game.test.ts) |

The revised values preserve the previous roughly 72-second MVP target while changing the final base from siege capture to packet capture. Source: authored JSON, local measurements, and regression bounds in [`test/levels.test.ts`](../../test/levels.test.ts).

## Production Demo evidence

Headless Chromium opened `?level=demo`, found all six ordered options, confirmed the Demo label and canvas route, then observed the enemy grow from 9 to 13 nodes with 5 active enemy transports at simulation second 18. The camera fit zoom was `0.5067`. Source: [`demo_browser_check.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/demo_browser_check.mjs) and local output, 2026-08-28.

The initial screenshot exposed dense label overlap. After shortening authored labels and adding semantic shapes, capacity-aware strokes, poor-road patterns, and separate special-node label offsets, the refreshed full-page screenshot is readable at the same fit zoom; active arrows remain a human-play observation. Source: inspected [`demo-baseline.png`](../../agents/tmp/2026-08-28-demo-plan/output/demo-baseline.png), 2026-08-28.

## Historical regression evidence

The existing production workflows previously covered full tutorial/final-exam navigation and the complete editor load/save/reset/camera/playtest surface. Those scripts remain under [`agents/tmp/2026-08-27-tutorial-level-progression/`](../../agents/tmp/2026-08-27-tutorial-level-progression/) and [`agents/tmp/2026-08-27-browser-map-editor/`](../../agents/tmp/2026-08-27-browser-map-editor/). Source: prior progress records and retained evidence.

The current focused regression verified the changed surfaces: six-level navigation, Tutorial 1 completion and successor, final-exam/Demo labels, all 14 version-2 settings, five-field version-2 and four-field version-1 road inspectors, valid two-way schema conversion, explicit unsupported-fog feedback, and editor→playtest→editor restoration. Source: [`browser_regression.mjs`](../../agents/tmp/2026-08-28-demo-plan/script/browser_regression.mjs) and local output, 2026-08-28.

## Remaining acceptance risk

- Gate C needs human play before fog or Interdiction is enabled. Source: approved phase order in the Demo progress record.
- The 10–15-minute target, four match stages, reversal frequency, and no-stall condition have not been measured. Source: user requirement in [`doc/Demo.md`](../Demo.md) and Gate F criteria.
- Human play must confirm label/route readability before information is hidden. Source: refreshed production screenshot and design judgment.
