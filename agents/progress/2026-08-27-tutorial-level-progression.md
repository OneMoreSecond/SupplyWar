Task ID: 2026-08-27-tutorial-level-progression

# Original request

Source: user goal, 2026-08-27.

`create multiple tutorial maps, each showing one mechanism for new players, with MVP map as final exam. Support level pick and "next level" after finish current level, in main game page.`

---

# 1. Research

- A map is a version-1 `MapConfig` containing settings, nodes, roads, and initial transports; every valid map must contain `player-base` and `enemy-base`. Source: `src/game.ts`.
- The learnable implemented mechanisms are force transport and capture, allied support, source-capture transport cancellation, and unsupported siege. Source: `Simulation` in `src/game.ts` and current MVP rules in `doc/mvp/gameplay.md`.
- The existing MVP combines supply cutting and siege in one scenario and already has automated evidence for the intended solution. Source: `maps/mvp.json`, `test/game.test.ts`, and `doc/mvp/map-design.md`.
- Before this task, the main page loaded either the single authored MVP map or an editor draft selected by `?playtest=1`; it had no level catalog, picker, or post-victory navigation. Source: pre-task `src/main.ts` and `index.html`, inspected 2026-08-27.
- Before this task, map guidance lived in fixed page text, so multiple levels needed metadata outside `MapConfig` without changing the version-1 editor schema. Source: pre-task `index.html`, pre-task `src/main.ts`, and the map-data separation constraint in `AGENTS.md`.
- User review requested a second Tutorial 3 choice—a direct base road whose attack fails while the resource-cut route succeeds—and half the expected game time of every level through numeric adjustment. Source: user review comments, 2026-08-27.
- Before the review adjustment, scripted intended paths completed in 4.8 / 14.3 / 21.2 / 14.5 / 143.2 simulation seconds for Tutorials 1–4 and the MVP final exam. Source: local `Simulation` measurement, 2026-08-27.
- A transport targeting an attacked node counts as support as soon as it is active, so it suppresses siege before its first packet arrives. Tutorial 2 therefore needs an explicit enemy support transport to prevent siege from replacing the intended player-supply lesson. Source: `Simulation.applySiege` in `src/game.ts` and user review comment 1, 2026-08-27.
- User review moved Tutorial 3's resource beyond the enemy base, requested side nodes around Tutorial 4's fortress, and requested a congratulation popup after every authored-level victory. Source: user review comments 2–4, 2026-08-27.

| Term | Meaning | Source |
| --- | --- | --- |
| Tutorial | A small authored map focused on one new mechanism | User goal and design judgment |
| Level catalog | Ordered metadata plus map configs used by the main game page | Design judgment |
| Final exam | The existing MVP map played after all tutorials | User goal |
| Level picker | Main-page control that can open any authored level | User goal |
| Next level | Victory-only action that opens the next catalog entry | User goal |
| Direct assault | Tutorial 3's narrow Player Base–Supported Base road, which cannot overcome active enemy support | User review and authored balance |
| Time scale | Map-number changes that preserve relative behavior while making intended paths complete in half the simulation time | User review and design judgment |
| Protected siege target | An attacked node with an active allied incoming transport, so unsupported siege decay does not apply | `src/game.ts` |
| Completion dialog | Modal authored-level victory feedback with replay and next-or-close actions | User review and UI design judgment |

# 2. Constraint and Assumption

- Keep every tutorial in the existing version-1 map format so it remains loadable and editable by the browser editor. Source: user goal interpreted against `src/game.ts` and project map-data constraint.
- Keep editor playtest isolated from authored-level progression: it continues to run the stored draft, hides authored-level navigation, and returns to the editor. Source: existing `src/playtest.ts` contract and design judgment.
- Normal game entry starts at Tutorial 1 so a new player sees the teaching sequence; the picker still permits direct access to any tutorial or the final exam. Source: new-player goal and design judgment.
- “Each showing one mechanism” means each tutorial introduces one new focal mechanism while retaining mechanics taught earlier when required to finish. Source: user goal and progressive-teaching design judgment.
- The tutorial sequence is: send forces, sustain an attack with allied supply, break an enemy supply source, then exploit unsupported siege. Source: implemented engine mechanics and design judgment.
- The MVP topology, initial forces, and role as the last catalog entry remain unchanged; its timing, throughput, and production numbers participate in the global half-time adjustment. Source: both user requests and numeric-adjustment scope.
- Selecting a level or `Next level` may reload the main page with a stable `?level=<id>` query; browser-local campaign persistence and level locking are outside this request. Source: smallest explicit navigation design judgment.
- Keep the reviewed map layouts near the already accepted short pacing targets rather than changing engine rules. Source: previous user timing review and design judgment.
- Show completion dialogs for authored levels only; editor playtests remain isolated and retain their existing status feedback. Source: existing playtest boundary in `src/main.ts` and design judgment.

# 3. Challenges

- Siege begins for every unsupported attack, so early tutorials must use a very long half-life when the intended lesson is packet transfer rather than siege. Source: `Simulation.applySiege` in `src/game.ts`.
- Tutorial balance must make the intended action visibly decisive without adding tutorial-only engine rules. Source: user goal and version-1 map constraint.
- Main-page level navigation must coexist with editor playtest fallback behavior and not accidentally replace or discard the stored editor draft. Source: `src/main.ts` and `src/playtest.ts`.
- Victory UI is rendered every frame, so the modal must open once per completed run, reset cleanly on replay/restart, and substitute a close action when the final exam has no successor. Source: user review and render loop in `src/main.ts`.
- Tutorial 3's direct road must be visually distinct from the resource route and remain a genuine selectable attack without becoming viable over time. Source: user review comment 1 and game topology/flow rules.
- Halving only travel or siege would change the tactical balance; a uniform time scale must also adjust throughput and production. Source: map formulas in `src/game.ts`.
- Tutorial 2 must visibly teach player support without allowing unsupported siege to win, and Tutorial 4 must look encircled without adding any new multi-attacker engine rule. Source: user review comments 1 and 3, and existing mechanics in `src/game.ts`.

# 4. Decisions

- Add four JSON tutorial maps under `maps/`, each using only existing mechanics and schema fields. Source: user goal and version-1 compatibility constraint.
- Add `src/levels.ts` as the narrow authored-level catalog containing IDs, labels, briefing text, hints, mechanism names, and imported configs. Source: fixed page-copy research and map-schema separation.
- Keep `maps/mvp.json` as the fifth and final catalog entry labeled `Final Exam`, while changing its numeric time scale with the other levels. Source: user goal and review comment 2.
- Use URL level IDs for stable picker/next-level navigation and preserve `?playtest=1` as the higher-priority editor-draft route. Source: existing routing and simplicity judgment.
- Show the picker for authored levels; after victory, open one native dialog with `Replay level` and either `Next level` or final-exam `Close`. Source: user goal, popup review, and smallest reusable UI judgment.
- Validate every catalog map and scripted intended solution in Vitest, then cover picker, completion dialog, and next-level navigation in production Chromium. Source: completion-evidence requirement in `AGENTS.md`.
- Give Tutorial 2 two player resource feeds and an initially active Enemy Supply → Supported Base route. The enemy support disables siege, so the player must sustain the higher-throughput attack with both feeds. Source: user review comment 1, `src/game.ts`, and simulation measurement.
- Put Tutorial 3's resource to the right and below Supported Base while retaining the width-`0.5` direct road. Active enemy support offsets the direct flow; capturing Enemy Resource cancels that support and makes the resource road usable by the player. Source: user review comment 2 and simulation measurement.
- Give Tutorial 4 north and south player flanks plus the main player base, each connected directly to the central fortress. No special multi-attacker rule is added. Source: user review comment 3 and simplicity constraint.
- Halve `siegeHalfLifeSeconds` and `secondsPerDistanceUnit`, double `forcePerWidthUnit` and non-zero production, and tune Tutorial 3 travel to its revised geometry. Keep the fixed logic tick unchanged. Source: user review comment 2 and uniform time-scale derivation from `src/game.ts`.

# 5. Design

1. Author Tutorial 1 with a favorable direct route so packet transport and capture dominate.
2. Author Tutorial 2 with two player resources feeding the player base while an enemy resource actively protects the target from siege.
3. Author Tutorial 3 with its enemy resource beyond the supported base, a failing direct base road, and a successful indirect source-capture route.
4. Author Tutorial 4 with weak player positions on three sides of a much stronger unsupported base whose red siege ring signals attrition.
5. Build an ordered level catalog ending in the MVP final exam.
6. Resolve normal-page config and guidance from `?level=`, while preserving editor playtest behavior.
7. Add a main-page level picker and victory-only completion dialog with replay and progression actions.
8. Verify each intended tutorial route, catalog ordering, UI states, navigation, final-exam boundary, and existing behavior.
9. Measure all intended routes, apply the uniform 2× numeric time scale, and assert the resulting half-time bounds.
10. Render Tutorial 3's two choices in Chromium and prove direct failure versus supply-cut success in the simulation suite.
11. Prove Tutorial 2 support suppresses siege, inspect the reviewed Tutorials 2–4 layouts, and verify the completion dialog in production Chromium.

# 6. Todo

- [x] Research current mechanics, routing, schema, UI, tests, and maintained docs.
- [x] Author and balance four focused tutorial maps.
- [x] Add the ordered level catalog with MVP last.
- [x] Add main-page level selection and per-level guidance.
- [x] Add victory-only `Next level` navigation.
- [x] Preserve and regress editor playtest behavior.
- [x] Add unit and production-browser coverage.
- [x] Update maintained MVP documentation.
- [x] Run the completion audit and full validation suite.
- [x] Measure the preceding completion time of all five levels.
- [x] Add Tutorial 3's direct base road and two-choice guidance.
- [x] Prove direct failure and supply-cut success.
- [x] Apply the numeric half-time adjustment to every level.
- [x] Re-measure all intended routes and add time-bound regressions.
- [x] Update browser evidence, balance tooling, and maintained documentation for the review.
- [x] Add active enemy support and two player resource feeds to Tutorial 2.
- [x] Move Tutorial 3's resource behind its enemy base and retain both tactical choices.
- [x] Add north and south siege positions to Tutorial 4.
- [x] Add the authored-level congratulation dialog with replay and next-or-close actions.
- [x] Rebalance and re-measure Tutorials 2–4 after the layout changes.
- [x] Complete the final regression, documentation audit, and recorded evidence for this review.

# 7. Results

The tutorial progression and all three review rounds are implemented. Normal entry opens Tutorial 1; the main-page picker exposes all four tutorials plus the MVP final exam; each level supplies mechanism-specific framing and action guidance; and an authored victory opens a congratulation dialog with replay and next-or-close actions. Tutorial 2 now teaches supply against an enemy base that is genuinely protected from siege, Tutorial 3 places the resource behind its base, and Tutorial 4 forms a three-direction encirclement. Intended paths remain approximately half their original simulation times. Editor playtest and its fallback remain separate from authored campaign controls. Source: `src/levels.ts`, `src/main.ts`, authored maps, simulation tests, and production browser evidence, 2026-08-27.

## Level sequence

| Order | ID | Mechanism | Intended interaction | Authored map |
| --- | --- | --- | --- | --- |
| 1 | `transport` | Transport and capture | Your Base → Small Enemy Base | `maps/tutorial-1-transport.json` |
| 2 | `support` | Allied support | Upper Supply + Lower Supply → Your Base → Supported Base while Enemy Supply protects it | `maps/tutorial-2-support.json` |
| 3 | `cut-supply` | Source capture | Reject the direct assault; go beyond Supported Base to capture Enemy Resource, then attack back | `maps/tutorial-3-cut-supply.json` |
| 4 | `siege` | Unsupported siege | Attack the force-90 fortress from Main Force, North Flank, and South Flank | `maps/tutorial-4-siege.json` |
| 5 | `mvp` | Final exam | Execute the existing resource-cut, frontline-siege, base-capture route at the adjusted time scale | `maps/mvp.json` |

Source: `src/levels.ts`, authored map JSON, and scripted paths in `test/levels.test.ts`.

## Requirement audit

| Requirement | Result | Evidence |
| --- | --- | --- |
| Multiple tutorial maps | Complete | Four distinct version-1 JSON maps are present under `maps/` and all pass shared validation. Source: authored JSON and `test/levels.test.ts`. |
| Each tutorial shows one mechanism | Complete | Catalog guidance and map balance focus sequentially on transport, allied supply, source capture, and siege; scripted tests assert the relevant transport mode/cancellation/strength relationship and win each intended route. Source: `src/levels.ts`, tutorial JSON, and `test/levels.test.ts`. |
| MVP map is the final exam | Complete | `mvp` remains the fifth and final catalog entry with no successor; its topology and initial forces remain the final-exam scenario while its time-scale numbers are adjusted. Source: `src/levels.ts`, `maps/mvp.json`, and unit assertions. |
| Main-page level picker | Complete | The normal page renders five ordered options, defaults to Tutorial 1, changes `?level=`, and safely falls back from an unknown ID. Source: `index.html`, `src/main.ts`, and production Chromium assertions. |
| Next level after finishing | Complete | The completion dialog is hidden before victory, opened after Tutorial 1 completed at about 2.5 browser simulation seconds, and its `Next level` action navigated to Tutorial 2; the final exam substitutes `Close` because it has no successor. Source: `src/main.ts` and production Chromium assertions/screenshot. |

Source: user goal, current implementation, automated checks, and production-browser run, 2026-08-27.

## Review-comment audit

| Review comment | Result | Evidence |
| --- | --- | --- |
| Give Tutorial 3 direct and supply-cut choices | Complete | A width-`0.5` direct road offers the tempting attack while a longer road reaches the resource beyond Supported Base. The direct transport starts successfully but leaves the base enemy-owned at or above its initial `35` force after 30 seconds; the resource-first route cancels enemy support and wins in 11.0 seconds. Source: `maps/tutorial-3-cut-supply.json`, `src/levels.ts`, `test/levels.test.ts`, and inspected Chromium screenshot. |
| Halve expected game time for all levels numerically | Complete | Intended paths changed from 4.8 / 14.3 / 21.2 / 14.5 / 143.2 seconds to 2.4 / 7.2 / 11.0 / 7.1 / 71.8 seconds after the reviewed layout retuning. Ratios are 49.0%–51.9%. Engine timing and logic tick are unchanged. Source: authored JSON, scripted `Simulation` measurements, and time-bound unit assertions. |
| Prevent siege from replacing Tutorial 2's support lesson | Complete | Enemy Supply starts an active support route to Supported Base; a simulation assertion proves its force does not decay under attack before packet arrival. The unsupported direct attack fails, while both player feeds plus the attack win in 7.2 seconds. Source: user review, `maps/tutorial-2-support.json`, and `test/levels.test.ts`. |
| Put Tutorial 3's resource behind the enemy base | Complete | Enemy Resource has a greater x-coordinate than Supported Base and remains reachable by the indirect player road; the direct route fails and the resource-first route wins in 11.0 seconds. Source: user review, authored JSON, simulation assertions, and inspected Chromium screenshot. |
| Make Tutorial 4 read as a siege | Complete | North Flank and South Flank surround the force-90 fortress with Main Force; all three routes can attack concurrently and win in 7.1 seconds while the red siege ring is active. Source: user review, authored JSON, simulation assertions, and inspected Chromium screenshot. |
| Congratulate the player after each level | Complete | One authored-level dialog identifies the completed level, says `Congratulations`, offers replay, and offers either the next catalog level or final close. It is absent from editor playtests. Source: user review, `index.html`, `src/main.ts`, and production Chromium assertions. |

Source: user review comments, authored balance values, current implementation, and local validation, 2026-08-27.

## Validation results

- `npm run typecheck` passed. Source: local TypeScript output, 2026-08-27.
- `npm test` passed: 3 files and 23 tests, including seven catalog/tutorial cases. Source: local Vitest output, 2026-08-27.
- `npm run build` passed and emitted both production pages plus the five-map catalog bundle. Source: local Vite 8.2.2 output, 2026-08-27.
- `git diff --check` passed. Source: local Git output, 2026-08-27.
- The tutorial Chromium workflow passed default selection, five-option ordering, per-level guidance, Tutorial 1 completion-dialog content and next navigation, Tutorial 2's two-feed layout, Tutorial 3's behind-base layout and direct choice, Tutorial 4's three-direction siege, final-exam completion and close action, unknown-level fallback, and playtest isolation. Source: `agents/tmp/2026-08-27-tutorial-level-progression/script/level_browser_check.mjs`, 2026-08-27.
- The existing full editor/playtest Chromium workflow passed after level-flow integration. Source: `agents/tmp/2026-08-27-browser-map-editor/script/editor_browser_check.mjs`, 2026-08-27.
- Full-page Tutorial 1 completion, active Tutorial 2, Tutorial 3 direct failure, active Tutorial 4 siege, MVP final exam, and final-exam completion screenshots were visually inspected. Source: `agents/tmp/2026-08-27-tutorial-level-progression/output/`, 2026-08-27.
- The geometry-aware balance model now reads current node numbers and reports MVP resource/frontline/base capture at 16.7 / 44.9 / 71.6 seconds while the direct frontline assault still fails. Source: `agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py` and local output, 2026-08-27.
- Maintained root and MVP documentation now describe the current progression, authored maps, routing, controls, and evidence. Source: `AGENTS.md`, `README.md`, and `doc/mvp/`.
