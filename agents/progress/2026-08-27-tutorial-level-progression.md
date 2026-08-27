Task ID: 2026-08-27-tutorial-level-progression

# Original request

Source: user goal, 2026-08-27.

`create multiple tutorial maps, each showing one mechanism for new players, with MVP map as final exam. Support level pick and "next level" after finish current level, in main game page.`

---

# 1. Research

- A map is a version-1 `MapConfig` containing settings, nodes, roads, and initial transports; every valid map must contain `player-base` and `enemy-base`. Source: `src/game.ts`.
- The learnable implemented mechanisms are force transport and capture, allied support, source-capture transport cancellation, and unsupported siege. Source: `Simulation` in `src/game.ts` and current MVP rules in `doc/mvp/gameplay.md`.
- The existing MVP combines supply cutting and siege in one scenario and already has automated evidence for the intended solution. Source: `maps/mvp.json`, `test/game.test.ts`, and `doc/mvp/map-design.md`.
- The main page currently loads either the single authored MVP map or an editor draft selected by `?playtest=1`; it has no level catalog, picker, or post-victory navigation. Source: pre-task `src/main.ts` and `index.html`, inspected 2026-08-27.
- Map guidance currently lives in fixed page text, so multiple levels need metadata outside `MapConfig` without changing the version-1 editor schema. Source: `index.html`, `src/main.ts`, and the map-data separation constraint in `AGENTS.md`.
- User review requested a second Tutorial 3 choice—a direct base road whose attack fails while the resource-cut route succeeds—and half the expected game time of every level through numeric adjustment. Source: user review comments, 2026-08-27.
- Before the review adjustment, scripted intended paths completed in 4.8 / 14.3 / 21.2 / 14.5 / 143.2 simulation seconds for Tutorials 1–4 and the MVP final exam. Source: local `Simulation` measurement, 2026-08-27.

| Term | Meaning | Source |
| --- | --- | --- |
| Tutorial | A small authored map focused on one new mechanism | User goal and design judgment |
| Level catalog | Ordered metadata plus map configs used by the main game page | Design judgment |
| Final exam | The existing MVP map played after all tutorials | User goal |
| Level picker | Main-page control that can open any authored level | User goal |
| Next level | Victory-only action that opens the next catalog entry | User goal |
| Direct assault | Tutorial 3's narrow Player Base–Supported Base road, which cannot overcome active enemy support | User review and authored balance |
| Time scale | Map-number changes that preserve relative behavior while making intended paths complete in half the simulation time | User review and design judgment |

# 2. Constraint and Assumption

- Keep every tutorial in the existing version-1 map format so it remains loadable and editable by the browser editor. Source: user goal interpreted against `src/game.ts` and project map-data constraint.
- Keep editor playtest isolated from authored-level progression: it continues to run the stored draft, hides authored-level navigation, and returns to the editor. Source: existing `src/playtest.ts` contract and design judgment.
- Normal game entry starts at Tutorial 1 so a new player sees the teaching sequence; the picker still permits direct access to any tutorial or the final exam. Source: new-player goal and design judgment.
- “Each showing one mechanism” means each tutorial introduces one new focal mechanism while retaining mechanics taught earlier when required to finish. Source: user goal and progressive-teaching design judgment.
- The tutorial sequence is: send forces, sustain an attack with allied supply, break an enemy supply source, then exploit unsupported siege. Source: implemented engine mechanics and design judgment.
- The MVP topology, initial forces, and role as the last catalog entry remain unchanged; its timing, throughput, and production numbers participate in the global half-time adjustment. Source: both user requests and numeric-adjustment scope.
- Selecting a level or `Next level` may reload the main page with a stable `?level=<id>` query; browser-local campaign persistence and level locking are outside this request. Source: smallest explicit navigation design judgment.

# 3. Challenges

- Siege begins for every unsupported attack, so early tutorials must use a very long half-life when the intended lesson is packet transfer rather than siege. Source: `Simulation.applySiege` in `src/game.ts`.
- Tutorial balance must make the intended action visibly decisive without adding tutorial-only engine rules. Source: user goal and version-1 map constraint.
- Main-page level navigation must coexist with editor playtest fallback behavior and not accidentally replace or discard the stored editor draft. Source: `src/main.ts` and `src/playtest.ts`.
- Victory UI is rendered every frame, so `Next level` must appear exactly after player victory, remain unavailable during play, and have no invalid successor after the final exam. Source: user goal and current render loop in `src/main.ts`.
- Tutorial 3's direct road must be visually distinct from the resource route and remain a genuine selectable attack without becoming viable over time. Source: user review comment 1 and game topology/flow rules.
- Halving only travel or siege would change the tactical balance; a uniform time scale must also adjust throughput and production. Source: map formulas in `src/game.ts`.

# 4. Decisions

- Add four JSON tutorial maps under `maps/`, each using only existing mechanics and schema fields. Source: user goal and version-1 compatibility constraint.
- Add `src/levels.ts` as the narrow authored-level catalog containing IDs, labels, briefing text, hints, mechanism names, and imported configs. Source: fixed page-copy research and map-schema separation.
- Keep `maps/mvp.json` as the fifth and final catalog entry labeled `Final Exam`, while changing its numeric time scale with the other levels. Source: user goal and review comment 2.
- Use URL level IDs for stable picker/next-level navigation and preserve `?playtest=1` as the higher-priority editor-draft route. Source: existing routing and simplicity judgment.
- Show the picker for authored levels; show `Next level` only after player victory when a successor exists. Source: user goal.
- Validate every catalog map and scripted intended solution in Vitest, then cover picker and next-level visibility/navigation in production Chromium. Source: completion-evidence requirement in `AGENTS.md`.
- Give Tutorial 3 a triangular layout and a width-`0.5` direct road. Active enemy support offsets the sustained direct flow; capturing Enemy Resource cancels that support and makes the resource road usable by the player. Source: user review comment 1 and simulation measurement.
- Halve `siegeHalfLifeSeconds` and `secondsPerDistanceUnit`, double `forcePerWidthUnit` and non-zero production, and tune Tutorial 3 travel to its revised geometry. Keep the fixed logic tick unchanged. Source: user review comment 2 and uniform time-scale derivation from `src/game.ts`.

# 5. Design

1. Author Tutorial 1 with a favorable direct route so packet transport and capture dominate.
2. Author Tutorial 2 with a player resource feeding the player base, which then attacks the enemy base.
3. Author Tutorial 3 with an enemy resource supporting its base, a failing direct base road, and a successful source-capture route.
4. Author Tutorial 4 with a weak player attacking a much stronger unsupported base whose red siege ring signals attrition.
5. Build an ordered level catalog ending in the MVP final exam.
6. Resolve normal-page config and guidance from `?level=`, while preserving editor playtest behavior.
7. Add a main-page level picker and victory-only `Next level` control.
8. Verify each intended tutorial route, catalog ordering, UI states, navigation, final-exam boundary, and existing behavior.
9. Measure all intended routes, apply the uniform 2× numeric time scale, and assert the resulting half-time bounds.
10. Render Tutorial 3's two choices in Chromium and prove direct failure versus supply-cut success in the simulation suite.

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

# 7. Results

The tutorial progression and review revision are implemented. Normal entry opens Tutorial 1; the main-page picker exposes all four tutorials plus the MVP final exam; each level supplies mechanism-specific framing and action guidance; and player victory reveals `Next level` only when a successor exists. Tutorial 3 visibly offers a failing direct assault and a successful supply cut. All intended paths now complete at approximately half their preceding simulation time. Editor playtest and its fallback remain separate from authored campaign controls. Source: `src/levels.ts`, `src/main.ts`, authored maps, simulation tests, and production browser evidence, 2026-08-27.

## Level sequence

| Order | ID | Mechanism | Intended interaction | Authored map |
| --- | --- | --- | --- | --- |
| 1 | `transport` | Transport and capture | Your Base → Small Enemy Base | `maps/tutorial-1-transport.json` |
| 2 | `support` | Allied support | Your Resource → Your Base → Enemy Base | `maps/tutorial-2-support.json` |
| 3 | `cut-supply` | Source capture | Reject the direct base assault; capture Enemy Resource to cancel support, then attack Supported Base | `maps/tutorial-3-cut-supply.json` |
| 4 | `siege` | Unsupported siege | Hold the attack from a force of 12 against an unsupported force of 90 | `maps/tutorial-4-siege.json` |
| 5 | `mvp` | Final exam | Execute the existing resource-cut, frontline-siege, base-capture route at the adjusted time scale | `maps/mvp.json` |

Source: `src/levels.ts`, authored map JSON, and scripted paths in `test/levels.test.ts`.

## Requirement audit

| Requirement | Result | Evidence |
| --- | --- | --- |
| Multiple tutorial maps | Complete | Four distinct version-1 JSON maps are present under `maps/` and all pass shared validation. Source: authored JSON and `test/levels.test.ts`. |
| Each tutorial shows one mechanism | Complete | Catalog guidance and map balance focus sequentially on transport, allied supply, source capture, and siege; scripted tests assert the relevant transport mode/cancellation/strength relationship and win each intended route. Source: `src/levels.ts`, tutorial JSON, and `test/levels.test.ts`. |
| MVP map is the final exam | Complete | `mvp` remains the fifth and final catalog entry with no successor; its topology and initial forces remain the final-exam scenario while its time-scale numbers are adjusted. Source: `src/levels.ts`, `maps/mvp.json`, and unit assertions. |
| Main-page level picker | Complete | The normal page renders five ordered options, defaults to Tutorial 1, changes `?level=`, and safely falls back from an unknown ID. Source: `index.html`, `src/main.ts`, and production Chromium assertions. |
| Next level after finishing | Complete | `Next level` is hidden before victory, appeared after the adjusted Tutorial 1 completed at about 2.5 browser simulation seconds, and navigated to Tutorial 2; the final exam has no successor. Source: `src/main.ts`, `test/levels.test.ts`, and production Chromium assertions/screenshot. |

Source: user goal, current implementation, automated checks, and production-browser run, 2026-08-27.

## Review-comment audit

| Review comment | Result | Evidence |
| --- | --- | --- |
| Give Tutorial 3 direct and supply-cut choices | Complete | A triangular layout exposes a width-`0.5` direct road and the resource route. The direct transport starts successfully but leaves Supported Base enemy-owned at or above its initial `35` force after 30 seconds; the resource-first route cancels enemy support and wins in 10.7 seconds. Source: `maps/tutorial-3-cut-supply.json`, `src/levels.ts`, `test/levels.test.ts`, and inspected Chromium screenshot. |
| Halve expected game time for all levels numerically | Complete | Intended paths changed from 4.8 / 14.3 / 21.2 / 14.5 / 143.2 seconds to 2.4 / 7.2 / 10.7 / 7.3 / 71.8 seconds. Ratios are 50.0%–50.5%. Engine timing and logic tick are unchanged. Source: authored JSON, scripted `Simulation` measurements, and time-bound unit assertions. |

Source: user review comments, authored balance values, current implementation, and local validation, 2026-08-27.

## Validation results

- `npm run typecheck` passed. Source: local TypeScript output, 2026-08-27.
- `npm test` passed: 3 files and 23 tests, including seven catalog/tutorial cases. Source: local Vitest output, 2026-08-27.
- `npm run build` passed and emitted both production pages plus the five-map catalog bundle. Source: local Vite 8.2.2 output, 2026-08-27.
- `git diff --check` passed. Source: local Git output, 2026-08-27.
- The tutorial Chromium workflow passed default selection, five-option ordering, per-level guidance, adjusted Tutorial 1 victory, next navigation, Tutorial 3 two-choice rendering/direct attack, picker navigation, final-exam labeling, unknown-level fallback, and playtest isolation. Source: `agents/tmp/2026-08-27-tutorial-level-progression/script/level_browser_check.mjs`, 2026-08-27.
- The existing full editor/playtest Chromium workflow passed after level-flow integration. Source: `agents/tmp/2026-08-27-browser-map-editor/script/editor_browser_check.mjs`, 2026-08-27.
- Full-page Tutorial 1 completion, Tutorial 3 direct failure, active Tutorial 4 siege, and MVP final-exam screenshots were visually inspected. Source: `agents/tmp/2026-08-27-tutorial-level-progression/output/`, 2026-08-27.
- The geometry-aware balance model now reads current node numbers and reports MVP resource/frontline/base capture at 16.7 / 44.9 / 71.6 seconds while the direct frontline assault still fails. Source: `agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py` and local output, 2026-08-27.
- Maintained root and MVP documentation now describe the current progression, authored maps, routing, controls, and evidence. Source: `AGENTS.md`, `README.md`, and `doc/mvp/`.
