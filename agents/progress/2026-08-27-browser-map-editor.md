Task ID: 2026-08-27-browser-map-editor

# Original request

Source: user instruction, 2026-08-27.

`make a map editor accessible through browser. requirements: 1. provide an entry button from game page; 2. support map json file load and save; 3. user-friendly UI; 4. everything in json must be editable`

---

# 1. Research

- The game is a Vite browser application whose page, rendering/input, simulation, and authored map live in `index.html`, `src/main.ts`, `src/game.ts`, and `maps/mvp.json`. Source: repository files, inspected 2026-08-27.
- `MapConfig` version 1 contains the top-level `version`, five settings, nodes, roads, and initial transports. Source: `src/game.ts` and `maps/mvp.json`.
- Before the second review, map coordinates were rendered directly in the 900 by 560 canvas coordinate system; the shared camera now treats finite coordinates as unbounded world positions. Source: pre-revision `src/main.ts`; current `src/camera.ts`, `src/main.ts`, and `src/editor.ts`.
- Map validation now checks the complete supported settings/node/road/initial-transport shape, required victory nodes, reference integrity, unique IDs/routes, numeric ranges, and usable initial transport ownership. Source: `src/game.ts`, implemented and tested 2026-08-27.
- The production site uses Vite's relative base for GitHub Pages. A second HTML entry must therefore use relative navigation and be included in the production build. Source: `vite.config.ts` and `agents/progress/2026-08-27-github-pages-release.md`.
- User review requested drag-to-create roads, a selection-only node/road inspector, playtesting the current draft through game navigation, and confirmation before resetting to the MVP map. Source: user review comments, 2026-08-27.
- Before the review revision, the editor used node-body dragging only for coordinate changes, rendered every node and road card, navigated back to the authored game without transferring the draft, and reset immediately. Source: pre-revision `src/editor.ts` and `editor.html`, inspected 2026-08-27; retained as research context.
- A second user review requested road-scoped transport editing, a red unsupported-siege ring, global removal of the planar-graph requirement, an accelerated playtest speed bar, and an unbordered large-map canvas. Source: user review comments, 2026-08-27.
- The engine enforces at most one initial transport per undirected road; the editor now renders the optional transport inside its selected road inspector. Source: `validateMap` in `src/game.ts` and current `src/editor.ts`.
- Node coordinates are finite numbers without viewport-range validation; both browser renderers now transform them through the shared camera. Source: `src/game.ts`, `src/camera.ts`, `src/editor.ts`, and `src/main.ts`, inspected 2026-08-27.

| Term | Meaning | Source |
| --- | --- | --- |
| Map config | The full version-1 JSON object consumed by `Simulation` | `src/game.ts` |
| Node | An owned map point with identity, label, force, production, kind, and coordinates | `src/game.ts` |
| Road | An undirected connection between two node IDs with a width | `src/game.ts` |
| Initial transport | A directed route active when the map starts | `src/game.ts` |
| Preview | A non-simulating drawing of the editor's current nodes and roads | Design judgment |
| Camera | The pan/zoom transform between unbounded map coordinates and a finite canvas viewport | Design judgment for user review comment 5 |
| Speed multiplier | The playtest-only factor applied to elapsed real time before fixed simulation steps | Design judgment for user review comment 4 |

# 2. Constraint and Assumption

- Keep map data separate from the simulation and rendering ticks. Source: project constraints in `AGENTS.md`.
- Keep the change dependency-free and consistent with the existing vanilla TypeScript application. Source: `package.json` and simplicity guidance in `AGENTS.md`.
- “Everything in JSON” means every field in the current version-1 `MapConfig` schema and every item in its three collections must have a form control; collections must support add and remove. Source: user instruction interpreted against `src/game.ts`.
- Imported JSON replaces the current editor draft only after parsing and validation succeed; a failed import leaves the current draft unchanged. Source: recovery design judgment following the error-message skill.
- Save downloads formatted JSON and is unavailable while the draft is invalid. Source: validity-preserving design judgment.
- The editor is a separate browser page entered from the game page, with a route back to the game. Source: user entry-button requirement and design judgment.
- Playtest must use the current valid editor draft without changing the authored `maps/mvp.json`; returning from a playtest must recover the same draft. Source: user review comment 3 and map-data separation constraint in `AGENTS.md`.
- Reset confirmation must clearly state that unsaved changes will be lost; canceling it must preserve the draft. Source: user review comment 4 and recovery design judgment following the error-message skill.
- Road crossings are valid globally; non-crossing topology may be chosen by a map designer but must not be enforced or presented as a game requirement. Source: user review comment 3.
- “Unbordered canvas like OneNote” means map coordinates have no viewport bounds; editor and game cameras support panning, wheel zoom, and fitting all nodes. Source: user review comment 5 interpreted against the existing coordinate schema.
- Simulation geometry continues to use world-coordinate distance; zoom changes presentation and input only. Source: map timing contract in `src/game.ts` and separation-of-rendering constraint in `AGENTS.md`.
- Playtest speed ranges from 1x to 8x and preserves the configured fixed logic step. Source: user review comment 4 and design judgment favoring a bounded acceleration control.

# 3. Challenges

- References from roads and transports must remain understandable while node IDs are edited, including temporary invalid states. Source: `MapConfig` relationships in `src/game.ts`.
- The UI must expose all scalar and collection fields without becoming a raw-JSON-only text editor. Source: user requirements 3 and 4.
- The preview must remain safe when a partially edited draft contains missing endpoints or non-finite coordinates. Source: design judgment based on interactive form behavior.
- Browser file APIs are event-driven and difficult to cover through the existing simulation-only unit suite; browser interaction coverage is required for the load/save workflow. Source: current `test/game.test.ts` and user requirement 2.
- Road creation and node movement both naturally use dragging, so the canvas needs separate, visible drag targets to avoid ambiguous results. Source: user review comment 1 and interaction design judgment.
- Selection state must remain stable while editing IDs and coordinates but reset safely when a selected object is removed or a different map is loaded. Source: `MapConfig` object relationships and user review comment 2.
- Both editor and game input use dragging already; camera panning must start only from empty space so node movement, road creation, and player transports keep their current gestures. Source: current pointer handlers in `src/editor.ts` and `src/main.ts`.
- Attaching transport controls to a road must keep references valid when road endpoints change and remove the attached transport when its road is removed. Source: one-transport-per-road invariant in `validateMap` and user review comment 1.

# 4. Decisions

- Add `editor.html` as a Vite multi-page entry, reached by a `Map editor` link on the game page. Source: user requirement 1 and current Vite architecture.
- Use structured forms for all version-1 fields, with explicit creation/removal interactions for nodes, roads, and initial transports. Source: user requirements 3 and 4, refined by user review comment 1.
- Add a live 900 by 560 canvas preview; nodes can be dragged to update `x` and `y`, while the forms retain exact numeric entry. Source: usability design judgment.
- Reuse one strict map validator for both simulation startup and editor import/save feedback. Source: single-schema-boundary design judgment and `src/game.ts`.
- Use native browser upload and Blob download APIs, preserving the imported base filename where possible. Source: user requirement 2 and dependency-free constraint.
- Keep node-body dragging for movement and add a visible connector handle on each node for road creation. Source: user review comment 1 and interaction design judgment.
- Replace the node and road card lists with one inspector that renders only the canvas-selected node or road. Keep global settings separate, and attach an initial transport to its selectable road. Source: both rounds of user review and schema structure in `src/game.ts`.
- Store a validated draft and filename in `sessionStorage` before navigating to `?playtest=1`; the game uses that config for the simulation and exposes `Back to editor` navigation that restores the draft. Source: user review comment 3 and browser-local transfer design judgment.
- Use a native confirmation dialog before reset; cancellation leaves the draft untouched and reports that outcome. Source: user review comment 4 and error-message skill guidance.
- Render an optional initial-transport subsection inside the selected road card and remove the global transport list. Source: user review comment 1 and the existing one-transport-per-road validation invariant.
- Change the unsupported-siege ring from gold to bright red while retaining gold for resource-node rings. Source: user review comment 2.
- Remove planarity from `AGENTS.md` and current formal docs; retain prior progress records as historical decisions. Source: user review comment 3 and project documentation lifecycle rules.
- Add a playtest-only 1x–8x range control that scales accumulated simulation time rather than changing `logicTickSeconds`. Source: user review comment 4 and fixed-step simulation architecture in `src/main.ts`.
- Share one camera implementation between editor and game for world/screen conversion, pan, cursor-anchored zoom, and fit-to-map. Source: user review comment 5 and duplication-avoidance design judgment for a narrow, deep transform interface.

# 5. Design

1. Strengthen `validateMap` so malformed external JSON produces precise validation messages instead of unchecked property errors.
2. Add a game-page link and a standalone editor page with load, reset, save, status, preview, and collection forms.
3. Keep one mutable editor draft. Every form input updates it, rerenders reference choices and the preview as needed, and runs validation.
4. Load parses a selected `.json` file into a temporary value, validates it, and only then replaces the draft.
5. Save serializes the valid current draft as indented JSON through a temporary object URL.
6. Configure Vite to emit both browser pages, then cover validation with unit tests and the full workflow with a browser check.
7. Draw a connector handle for every node; dragging a handle onto another node creates and selects a road, while dragging the node body continues to update coordinates.
8. Track a selected node or road and render only that object's fields in a shared inspector.
9. Transfer valid playtest drafts through session storage, load them only on explicit playtest routes, and preserve the return path to the editor.
10. Confirm destructive reset and preserve the current draft when confirmation is canceled.
11. Move initial-transport editing into the selected road inspector and keep road/transport mutations synchronized.
12. Add a shared unbounded camera; pan on empty-space drag, zoom at the pointer with the wheel, and expose fit-to-map in the editor.
13. Apply the camera to gameplay input/rendering, change unsupported siege to red, and add a playtest-only speed multiplier.
14. Remove current planarity requirements and update automated/browser evidence for all five review comments.

# 6. Todo

- [x] Inspect the map schema, game page, build configuration, tests, and maintained documentation.
- [x] Strengthen external map validation and add unit coverage.
- [x] Add the map-editor page and game-page entry.
- [x] Implement complete settings, node, road, and initial-transport editing.
- [x] Implement JSON load, reset, validation feedback, and save.
- [x] Add live preview and coordinate dragging.
- [x] Update maintained MVP documentation.
- [x] Run typecheck, tests, build, and browser interaction validation.
- [x] Audit all four user requirements against current-state evidence.
- [x] Add connector-drag road creation and browser coverage.
- [x] Replace node/road card lists with a selection-only inspector.
- [x] Add current-draft playtest and return-to-editor behavior.
- [x] Add reset confirmation and cancel-preservation coverage.
- [x] Update maintained documentation and rerun the completion audit for the four review comments.
- [x] Attach optional initial-transport editing to the selected road inspector.
- [x] Change unsupported-siege feedback from gold to red.
- [x] Remove the global planarity constraint from `AGENTS.md`.
- [x] Add a playtest-only 1x–8x speed bar.
- [x] Add shared unbounded pan/zoom/fit cameras to the editor and game.
- [x] Update maintained documentation and complete the second review audit.

# 7. Results

The second review revision is complete. Initial transports are edited through their road inspectors; siege uses a red ring; planarity is no longer a global constraint; editor playtests expose 1×–8× speed; and both editor and game support unbounded world coordinates through shared pan, zoom, and fit behavior. Source: user review comments; `AGENTS.md`, `src/camera.ts`, `src/editor.ts`, and `src/main.ts`.

The review revision is complete. The editor now uses direct canvas selection and gestures, transfers the current valid draft into the game for playtesting, restores it on return, and protects reset with explicit confirmation. Source: user review comments; `editor.html`, `src/editor.ts`, `src/main.ts`, and `src/playtest.ts`.

The browser map editor is implemented and included in the production build. It uses the same version-1 map contract as the simulation, provides a structured UI for every field, and validates before replacing an imported draft or enabling download. Source: `editor.html`, `src/editor.ts`, `src/game.ts`, and `vite.config.ts`.

## Requirement audit

| Requirement | Result | Evidence |
| --- | --- | --- |
| Entry button from game page | Complete | `Map editor` link in `index.html`; production Chromium navigated through it to `editor.html` |
| Map JSON load and save | Complete | Native file input and Blob download in `src/editor.ts`; Chromium preserved the draft after malformed JSON, loaded valid JSON, and parsed edited values from the download |
| User-friendly UI | Complete | Selection-only inspector, direct node/road canvas gestures, live preview, exact coordinates, responsive layout, persistent filename, specific validation/recovery feedback, playtest/return navigation, and confirmed reset in `editor.html`, `src/editor.ts`, and `src/editor.css`; full-page Chromium screenshots inspected |
| Everything in JSON editable | Complete for the current version-1 schema | Six top-level/settings controls, eight controls for the selected node, four for the selected road, and three for its optional initial transport, plus node/transport add/remove and connector-drag road creation/removal; production Chromium asserted the control counts and exercised every collection type |

Source: user requirements; current implementation; `agents/tmp/2026-08-27-browser-map-editor/script/editor_browser_check.mjs` production-browser run on 2026-08-27.

## Review-comment audit

| Review comment | Result | Evidence |
| --- | --- | --- |
| Add roads by dragging | Complete | Every node draws a square connector; production Chromium dragged Player Base's connector to Enemy Backup, observed road count 6 → 7, inspected the selected new road, and removed it. Source: `src/editor.ts` and browser check. |
| Show only the selected node/road properties | Complete | Legacy node/road lists were removed; the inspector starts empty and renders one eight-field node or one four-field road after canvas selection. Source: `editor.html`, `src/editor.ts`, and browser assertions. |
| Playtest in the editor flow | Complete | `Playtest current map` stores the valid draft and filename, the game renders that config under `?playtest=1`, and `Back to editor` restores it. The inspected playtest showed the edited `Imported Player Base` label and force `123`. Missing/corrupt session state reports an MVP fallback and recovery action. Source: `src/editor.ts`, `src/main.ts`, `src/playtest.ts`, and browser screenshots/checks. |
| Confirm reset to avoid data loss | Complete | `Reset to MVP` opens a confirmation that names the unsaved-change impact. Chromium verified cancel preserved the edited map and accept restored the authored map. Source: `src/editor.ts` and browser check. |

Source: user review comments, current implementation, and production Chromium evidence from 2026-08-27.

## Second review-comment audit

| Review comment | Result | Evidence |
| --- | --- | --- |
| Attach transport editing to the road inspector | Complete | The global transport section was removed. A selected road renders its optional transport, limits source/target choices to the road endpoints, synchronizes endpoint edits, and removes the transport with its road. Chromium exercised add/remove and inspected an authored transport. Source: `editor.html`, `src/editor.ts`, and browser check. |
| Use red for unsupported siege | Complete | Unsupported siege renders with `#ff334d`; resource nodes retain `#f0bd4f`. The inspected playtest screenshot shows the red siege ring outside the yellow resource ring. Source: `src/main.ts` and browser screenshot. |
| Remove planarity as a global requirement | Complete | `AGENTS.md` and maintained map documentation now allow road crossings and describe non-crossing layout only as a design preference; a regression test verifies that runtime validation accepts crossing roads. Source: user review, `AGENTS.md`, `src/game.ts`, `test/game.test.ts`, and `doc/mvp/map-design.md`. |
| Add accelerated playtest speed | Complete | Valid editor playtests show a 1×–8× range control that scales the fixed-step accumulator. Over equal waits in the final browser run, 1× advanced 0.3 seconds and 8× advanced 3.2 seconds. Source: `index.html`, `src/main.ts`, and browser check. |
| Support larger unbordered maps | Complete | The shared camera provides pan, cursor-anchored wheel zoom, and fit-to-map in editor and game while leaving simulation geometry in world units. A map spanning 10,000 by 6,500 world units fit at 6.46% zoom on both pages. Source: `src/camera.ts`, `src/editor.ts`, `src/main.ts`, camera tests, and browser check. |

Source: second user review comments, current implementation, and production Chromium evidence from 2026-08-27.

## Validation results

- `npm run typecheck` passed. Source: local command output, 2026-08-27.
- `npm test` passed: 2 files and 16 tests. Source: local Vitest output, 2026-08-27.
- `npm run build` passed and emitted `dist/index.html` plus `dist/editor.html` with relative assets. Source: local Vite 8.2.2 output and generated files, 2026-08-27.
- `git diff --check` passed. Source: local Git output, 2026-08-27.
- The Chromium workflow passed against `vite preview`: selection-only inspection, road-scoped transports, connector road creation, node movement, invalid-state blocking, malformed-load recovery, both reset outcomes, load/download, large-map pan/zoom/fit, accelerated playtest, playtest/return transfer, and missing-session fallback. Source: `agents/tmp/2026-08-27-browser-map-editor/script/editor_browser_check.mjs`, 2026-08-27.
- Maintained MVP and root documentation now describe the road transport editor, red siege state, crossing policy, playtest speed, unbounded camera, and current 16-test validation baseline. Source: `AGENTS.md`, `README.md`, `doc/mvp/README.md`, `doc/mvp/map-design.md`, `doc/mvp/tech.md`, `doc/mvp/user-experience.md`, and `doc/mvp/validation.md`.
