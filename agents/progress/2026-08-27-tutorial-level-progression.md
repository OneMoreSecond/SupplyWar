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

| Term | Meaning | Source |
| --- | --- | --- |
| Tutorial | A small authored map focused on one new mechanism | User goal and design judgment |
| Level catalog | Ordered metadata plus map configs used by the main game page | Design judgment |
| Final exam | The existing MVP map played after all tutorials | User goal |
| Level picker | Main-page control that can open any authored level | User goal |
| Next level | Victory-only action that opens the next catalog entry | User goal |

# 2. Constraint and Assumption

- Keep every tutorial in the existing version-1 map format so it remains loadable and editable by the browser editor. Source: user goal interpreted against `src/game.ts` and project map-data constraint.
- Keep editor playtest isolated from authored-level progression: it continues to run the stored draft, hides authored-level navigation, and returns to the editor. Source: existing `src/playtest.ts` contract and design judgment.
- Normal game entry starts at Tutorial 1 so a new player sees the teaching sequence; the picker still permits direct access to any tutorial or the final exam. Source: new-player goal and design judgment.
- “Each showing one mechanism” means each tutorial introduces one new focal mechanism while retaining mechanics taught earlier when required to finish. Source: user goal and progressive-teaching design judgment.
- The tutorial sequence is: send forces, sustain an attack with allied supply, break an enemy supply source, then exploit unsupported siege. Source: implemented engine mechanics and design judgment.
- The existing `maps/mvp.json` remains unchanged and is the last catalog entry. Source: user final-exam requirement and current authored-map source of truth.
- Selecting a level or `Next level` may reload the main page with a stable `?level=<id>` query; browser-local campaign persistence and level locking are outside this request. Source: smallest explicit navigation design judgment.

# 3. Challenges

- Siege begins for every unsupported attack, so early tutorials must use a very long half-life when the intended lesson is packet transfer rather than siege. Source: `Simulation.applySiege` in `src/game.ts`.
- Tutorial balance must make the intended action visibly decisive without adding tutorial-only engine rules. Source: user goal and version-1 map constraint.
- Main-page level navigation must coexist with editor playtest fallback behavior and not accidentally replace or discard the stored editor draft. Source: `src/main.ts` and `src/playtest.ts`.
- Victory UI is rendered every frame, so `Next level` must appear exactly after player victory, remain unavailable during play, and have no invalid successor after the final exam. Source: user goal and current render loop in `src/main.ts`.

# 4. Decisions

- Add four JSON tutorial maps under `maps/`, each using only existing mechanics and schema fields. Source: user goal and version-1 compatibility constraint.
- Add `src/levels.ts` as the narrow authored-level catalog containing IDs, labels, briefing text, hints, mechanism names, and imported configs. Source: fixed page-copy research and map-schema separation.
- Keep `maps/mvp.json` as the fifth and final catalog entry labeled `Final Exam`. Source: user goal.
- Use URL level IDs for stable picker/next-level navigation and preserve `?playtest=1` as the higher-priority editor-draft route. Source: existing routing and simplicity judgment.
- Show the picker for authored levels; show `Next level` only after player victory when a successor exists. Source: user goal.
- Validate every catalog map and scripted intended solution in Vitest, then cover picker and next-level visibility/navigation in production Chromium. Source: completion-evidence requirement in `AGENTS.md`.

# 5. Design

1. Author Tutorial 1 with a favorable direct route so packet transport and capture dominate.
2. Author Tutorial 2 with a player resource feeding the player base, which then attacks the enemy base.
3. Author Tutorial 3 with an enemy resource supporting its base; capturing the source cancels the occupied support road.
4. Author Tutorial 4 with a weak player attacking a much stronger unsupported base whose red siege ring signals attrition.
5. Build an ordered level catalog ending in the unchanged MVP map.
6. Resolve normal-page config and guidance from `?level=`, while preserving editor playtest behavior.
7. Add a main-page level picker and victory-only `Next level` control.
8. Verify each intended tutorial route, catalog ordering, UI states, navigation, final-exam boundary, and existing behavior.

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

# 7. Results

The tutorial progression is implemented. Normal entry opens Tutorial 1; the main-page picker exposes all four tutorials plus the MVP final exam; each level supplies mechanism-specific framing and action guidance; and player victory reveals `Next level` only when a successor exists. Editor playtest and its fallback remain separate from authored campaign controls. Source: `src/levels.ts`, `src/main.ts`, `index.html`, and production browser evidence, 2026-08-27.

## Level sequence

| Order | ID | Mechanism | Intended interaction | Authored map |
| --- | --- | --- | --- | --- |
| 1 | `transport` | Transport and capture | Your Base → Small Enemy Base | `maps/tutorial-1-transport.json` |
| 2 | `support` | Allied support | Your Resource → Your Base → Enemy Base | `maps/tutorial-2-support.json` |
| 3 | `cut-supply` | Source capture | Capture Enemy Resource to cancel support, then attack Supported Base | `maps/tutorial-3-cut-supply.json` |
| 4 | `siege` | Unsupported siege | Hold the attack from a force of 12 against an unsupported force of 90 | `maps/tutorial-4-siege.json` |
| 5 | `mvp` | Final exam | Execute the existing resource-cut, frontline-siege, base-capture route | unchanged `maps/mvp.json` |

Source: `src/levels.ts`, authored map JSON, and scripted paths in `test/levels.test.ts`.

## Requirement audit

| Requirement | Result | Evidence |
| --- | --- | --- |
| Multiple tutorial maps | Complete | Four distinct version-1 JSON maps are present under `maps/` and all pass shared validation. Source: authored JSON and `test/levels.test.ts`. |
| Each tutorial shows one mechanism | Complete | Catalog guidance and map balance focus sequentially on transport, allied supply, source capture, and siege; scripted tests assert the relevant transport mode/cancellation/strength relationship and win each intended route. Source: `src/levels.ts`, tutorial JSON, and `test/levels.test.ts`. |
| MVP map is the final exam | Complete | `mvp` is the fifth and final catalog entry with no successor, and `maps/mvp.json` has no task diff. Source: `src/levels.ts`, unit assertions, and `git diff -- maps/mvp.json`. |
| Main-page level picker | Complete | The normal page renders five ordered options, defaults to Tutorial 1, changes `?level=`, and safely falls back from an unknown ID. Source: `index.html`, `src/main.ts`, and production Chromium assertions. |
| Next level after finishing | Complete | `Next level` is hidden before victory, appeared after Tutorial 1 completed at 4.9 simulation seconds in Chromium, and navigated to Tutorial 2; the final exam has no successor. Source: `src/main.ts`, `test/levels.test.ts`, and production Chromium assertions/screenshot. |

Source: user goal, current implementation, automated checks, and production-browser run, 2026-08-27.

## Validation results

- `npm run typecheck` passed. Source: local TypeScript output, 2026-08-27.
- `npm test` passed: 3 files and 22 tests, including six catalog/tutorial cases. Source: local Vitest output, 2026-08-27.
- `npm run build` passed and emitted both production pages plus the five-map catalog bundle. Source: local Vite 8.2.2 output, 2026-08-27.
- `git diff --check` passed. Source: local Git output, 2026-08-27.
- The tutorial Chromium workflow passed default selection, five-option ordering, per-level guidance, victory gating, next navigation, picker navigation, final-exam labeling, unknown-level fallback, and playtest isolation. Source: `agents/tmp/2026-08-27-tutorial-level-progression/script/level_browser_check.mjs`, 2026-08-27.
- The existing full editor/playtest Chromium workflow passed after level-flow integration. Source: `agents/tmp/2026-08-27-browser-map-editor/script/editor_browser_check.mjs`, 2026-08-27.
- Full-page Tutorial 1 completion, active Tutorial 4 siege, and MVP final-exam screenshots were visually inspected. Source: `agents/tmp/2026-08-27-tutorial-level-progression/output/`, 2026-08-27.
- Maintained root and MVP documentation now describe the current progression, authored maps, routing, controls, and evidence. Source: `AGENTS.md`, `README.md`, and `doc/mvp/`.
