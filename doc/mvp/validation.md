# MVP Validation

Source: local validation evidence recorded in [the game progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), Sections 7.2–7.8 and 7.11, and [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md), summarized on 2026-08-27.

## Automated checks

| Command | Coverage | Recorded result |
| --- | --- | --- |
| `npm run typecheck` | TypeScript correctness | Passed |
| `npm test` | Seven simulation cases and four external-map validation cases | Passed: 11 tests |
| `npm run build` | Production game and editor bundle | Passed |
| `python3 agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py` | Geometry- and width-aware tactical/direct balance scenarios | Intended path succeeds; direct assault fails |

Source: recorded local validation and repository scripts.

## Test cases

The Vitest suite covers road geometry/throughput derivation, configured siege-formula selection, source-change cancellation, target-change refresh to attack, siege surrender, the intended resource-cut win within 240 seconds, direct-frontline failure after 240 seconds, authored-map acceptance, malformed external roots, node-field validation, duplicate road IDs, and unusable initial transports. Source: [`test/game.test.ts`](../../test/game.test.ts).

## Tactical balance evidence

| Scenario | Result |
| --- | --- |
| Intended route | Resource at 33.4s, frontline at 89.8s, enemy base at 143.0s |
| Direct frontline assault | Frontline remains enemy-owned with 140.8 force at 240s |
| Target pacing | Intended route is within the 2–4 minute first-play target |

Source: [`agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py`](../../agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py) and the recorded model run.

## Browser evidence

Headless Chromium completed the full hinted route and reported victory after the distant-rear layout. Separate browser checks verified held-drag feedback and cancellation of a player route. Evidence scripts and screenshots are retained under [`agents/tmp/2026-08-26-game-demo-plan-grill/`](../../agents/tmp/2026-08-26-game-demo-plan-grill/). Source: recorded Chromium validation.

Headless Chromium also opened the editor from the game page, exercised every schema section, added and removed each collection type, updated coordinates by dragging, observed invalid-edit save blocking, preserved the current draft after a malformed import, loaded a valid map, and verified edited values in downloaded JSON. The full-page visual was inspected for layout/readability. Evidence is retained under [`agents/tmp/2026-08-27-browser-map-editor/`](../../agents/tmp/2026-08-27-browser-map-editor/). Source: local browser validation, 2026-08-27.

## Remaining risk

The completed checks validate rules, both production pages, game/editor controls, the map file round trip, and the authored tactical path. Additional human feedback remains useful for qualitative editor clarity and game pacing, but is not an MVP acceptance blocker. Source: progress-record completion audits.
