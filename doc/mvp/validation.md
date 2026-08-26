# MVP Validation

Source: local validation evidence recorded in [the progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), Sections 7.2–7.8 and 7.11, summarized on 2026-08-26.

## Automated checks

| Command | Coverage | Recorded result |
| --- | --- | --- |
| `npm run typecheck` | TypeScript correctness | Passed |
| `npm test` | Seven simulation cases | Passed |
| `npm run build` | Production bundle | Passed |
| `python3 agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py` | Geometry- and width-aware tactical/direct balance scenarios | Intended path succeeds; direct assault fails |

Source: recorded local validation and repository scripts.

## Test cases

The Vitest suite covers road geometry/throughput derivation, configured siege-formula selection, source-change cancellation, target-change refresh to attack, siege surrender, the intended resource-cut win within 240 seconds, and direct-frontline failure after 240 seconds. Source: [`test/game.test.ts`](../../test/game.test.ts).

## Tactical balance evidence

| Scenario | Result |
| --- | --- |
| Intended route | Resource at 33.4s, frontline at 89.8s, enemy base at 143.0s |
| Direct frontline assault | Frontline remains enemy-owned with 140.8 force at 240s |
| Target pacing | Intended route is within the 2–4 minute first-play target |

Source: [`agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py`](../../agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py) and the recorded model run.

## Browser evidence

Headless Chromium completed the full hinted route and reported victory after the distant-rear layout. Separate browser checks verified held-drag feedback and cancellation of a player route. Evidence scripts and screenshots are retained under [`agents/tmp/2026-08-26-game-demo-plan-grill/`](../../agents/tmp/2026-08-26-game-demo-plan-grill/). Source: recorded Chromium validation.

## Remaining risk

The completed checks validate rules, build, controls, and the authored tactical path. Additional human-player feedback remains useful for qualitative clarity and pacing, but is not an MVP acceptance blocker. Source: progress-record completion audit.
