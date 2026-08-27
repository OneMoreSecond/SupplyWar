# MVP Validation

Source: local validation evidence recorded in [the game progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), Sections 7.2–7.8 and 7.11, [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md), and [the tutorial progress record](../../agents/progress/2026-08-27-tutorial-level-progression.md), summarized on 2026-08-27.

## Automated checks

| Command | Coverage | Recorded result |
| --- | --- | --- |
| `npm run typecheck` | TypeScript correctness | Passed |
| `npm test` | Simulation/map validation, shared camera, five-level catalog, tutorial choices, and time targets | Passed: 23 tests |
| `npm run build` | Production game and editor bundle | Passed |
| `python3 agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py` | Geometry- and width-aware tactical/direct balance scenarios | Intended path succeeds; direct assault fails |

Source: recorded local validation and repository scripts.

## Test cases

The Vitest suite covers road geometry/throughput derivation, configured siege-formula selection, source-change cancellation, target-change refresh to attack, siege surrender, the intended resource-cut win, direct-frontline failure, authored-map acceptance, permitted road crossings, malformed external roots, node-field validation, duplicate road IDs, unusable initial transports, world/screen round trips, anchored zoom, wide-map fitting, panning, catalog order/default/successor boundaries, all five map validations, Tutorial 3 direct failure versus supply-cut success, and intended completion-time bounds for every level. Source: [`test/game.test.ts`](../../test/game.test.ts), [`test/camera.test.ts`](../../test/camera.test.ts), and [`test/levels.test.ts`](../../test/levels.test.ts).

## Tactical balance evidence

| Scenario | Result |
| --- | --- |
| Intended route | Resource at 16.7s, frontline at 44.9s, enemy base at 71.6s |
| Direct frontline assault | Frontline remains enemy-owned with 260.7 force at 240s |
| Target pacing | Intended route is approximately half the preceding 143.2s simulation result |

Source: [`agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py`](../../agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py) and the recorded model run.

## Browser evidence

Headless Chromium completed the full hinted route and reported victory after the distant-rear layout. Separate browser checks verified held-drag feedback and cancellation of a player route. Evidence scripts and screenshots are retained under [`agents/tmp/2026-08-26-game-demo-plan-grill/`](../../agents/tmp/2026-08-26-game-demo-plan-grill/). Source: recorded Chromium validation.

Headless Chromium also opened the editor from the game page; verified the selection-only inspector and road-scoped transport editor; created and selected a road by connector dragging; moved a node; observed invalid-edit save/playtest blocking; preserved the draft after malformed import and canceled reset; confirmed reset; verified downloaded JSON; and completed an editor → playtest → editor draft/filename round trip. A large map spanning `(-2000, -1500)` to `(8000, 5000)` fit at 6.46% zoom in both pages; editor pan and wheel zoom passed; and 8× consistently advanced more than four times as much simulation time as 1× over equal waits (representative run: 3.2s versus 0.4s). Full-page editor and playtest visuals were inspected, including the separate red siege and gold resource rings. Evidence is retained under [`agents/tmp/2026-08-27-browser-map-editor/`](../../agents/tmp/2026-08-27-browser-map-editor/). Source: local browser validation, 2026-08-27.

The tutorial production-browser check verified five ordered picker entries; Tutorial 1 default and mechanism guidance; hidden `Next level` before victory; a roughly 2.5-second browser victory revealing the action; navigation to Tutorial 2; Tutorial 3's visible direct and supply-cut choices; direct picker navigation through Tutorial 4 and the MVP final exam; safe unknown-level fallback; and isolation of editor playtest/fallback from authored-level controls. Tutorial completion, Tutorial 3 direct attack, active siege, and final-exam screenshots were inspected. Evidence is retained under [`agents/tmp/2026-08-27-tutorial-level-progression/`](../../agents/tmp/2026-08-27-tutorial-level-progression/). Source: local browser validation, 2026-08-27.

## Remaining risk

The completed checks validate rules, all five authored maps, tutorial and final-exam navigation, both production pages, game/editor controls, the map-file round trip, and scripted intended paths. Additional human feedback remains useful for qualitative tutorial wording and pacing, but is not an MVP acceptance blocker. Campaign persistence and locking remain explicitly outside current scope. Source: progress-record completion audits.
