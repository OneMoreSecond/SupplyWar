Task ID: 2026-08-27-browser-map-editor

# Original request

Source: user instruction, 2026-08-27.

`make a map editor accessible through browser. requirements: 1. provide an entry button from game page; 2. support map json file load and save; 3. user-friendly UI; 4. everything in json must be editable`

---

# 1. Research

- The game is a Vite browser application whose page, rendering/input, simulation, and authored map live in `index.html`, `src/main.ts`, `src/game.ts`, and `maps/mvp.json`. Source: repository files, inspected 2026-08-27.
- `MapConfig` version 1 contains the top-level `version`, five settings, nodes, roads, and initial transports. Source: `src/game.ts` and `maps/mvp.json`.
- Map coordinates use the game canvas's 900 by 560 coordinate system. Source: `index.html`, `src/main.ts`, and `maps/mvp.json`.
- Map validation now checks the complete supported settings/node/road/initial-transport shape, required victory nodes, reference integrity, unique IDs/routes, numeric ranges, and usable initial transport ownership. Source: `src/game.ts`, implemented and tested 2026-08-27.
- The production site uses Vite's relative base for GitHub Pages. A second HTML entry must therefore use relative navigation and be included in the production build. Source: `vite.config.ts` and `agents/progress/2026-08-27-github-pages-release.md`.

| Term | Meaning | Source |
| --- | --- | --- |
| Map config | The full version-1 JSON object consumed by `Simulation` | `src/game.ts` |
| Node | An owned map point with identity, label, force, production, kind, and coordinates | `src/game.ts` |
| Road | An undirected connection between two node IDs with a width | `src/game.ts` |
| Initial transport | A directed route active when the map starts | `src/game.ts` |
| Preview | A non-simulating drawing of the editor's current nodes and roads | Design judgment |

# 2. Constraint and Assumption

- Keep map data separate from the simulation and rendering ticks. Source: project constraints in `AGENTS.md`.
- Keep the change dependency-free and consistent with the existing vanilla TypeScript application. Source: `package.json` and simplicity guidance in `AGENTS.md`.
- “Everything in JSON” means every field in the current version-1 `MapConfig` schema and every item in its three collections must have a form control; collections must support add and remove. Source: user instruction interpreted against `src/game.ts`.
- Imported JSON replaces the current editor draft only after parsing and validation succeed; a failed import leaves the current draft unchanged. Source: recovery design judgment following the error-message skill.
- Save downloads formatted JSON and is unavailable while the draft is invalid. Source: validity-preserving design judgment.
- The editor is a separate browser page entered from the game page, with a route back to the game. Source: user entry-button requirement and design judgment.

# 3. Challenges

- References from roads and transports must remain understandable while node IDs are edited, including temporary invalid states. Source: `MapConfig` relationships in `src/game.ts`.
- The UI must expose all scalar and collection fields without becoming a raw-JSON-only text editor. Source: user requirements 3 and 4.
- The preview must remain safe when a partially edited draft contains missing endpoints or non-finite coordinates. Source: design judgment based on interactive form behavior.
- Browser file APIs are event-driven and difficult to cover through the existing simulation-only unit suite; browser interaction coverage is required for the load/save workflow. Source: current `test/game.test.ts` and user requirement 2.

# 4. Decisions

- Add `editor.html` as a Vite multi-page entry, reached by a `Map editor` link on the game page. Source: user requirement 1 and current Vite architecture.
- Use structured forms for all version-1 fields, with add/remove controls for nodes, roads, and initial transports. Source: user requirements 3 and 4.
- Add a live 900 by 560 canvas preview; nodes can be dragged to update `x` and `y`, while the forms retain exact numeric entry. Source: usability design judgment.
- Reuse one strict map validator for both simulation startup and editor import/save feedback. Source: single-schema-boundary design judgment and `src/game.ts`.
- Use native browser upload and Blob download APIs, preserving the imported base filename where possible. Source: user requirement 2 and dependency-free constraint.

# 5. Design

1. Strengthen `validateMap` so malformed external JSON produces precise validation messages instead of unchecked property errors.
2. Add a game-page link and a standalone editor page with load, reset, save, status, preview, and collection forms.
3. Keep one mutable editor draft. Every form input updates it, rerenders reference choices and the preview as needed, and runs validation.
4. Load parses a selected `.json` file into a temporary value, validates it, and only then replaces the draft.
5. Save serializes the valid current draft as indented JSON through a temporary object URL.
6. Configure Vite to emit both browser pages, then cover validation with unit tests and the full workflow with a browser check.

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

# 7. Results

The browser map editor is implemented and included in the production build. It uses the same version-1 map contract as the simulation, provides a structured UI for every field, and validates before replacing an imported draft or enabling download. Source: `editor.html`, `src/editor.ts`, `src/game.ts`, and `vite.config.ts`.

## Requirement audit

| Requirement | Result | Evidence |
| --- | --- | --- |
| Entry button from game page | Complete | `Map editor` link in `index.html`; production Chromium navigated through it to `editor.html` |
| Map JSON load and save | Complete | Native file input and Blob download in `src/editor.ts`; Chromium preserved the draft after malformed JSON, loaded valid JSON, and parsed edited values from the download |
| User-friendly UI | Complete | Labeled structured cards, add/remove actions, live preview, node dragging, exact coordinates, responsive layout, persistent filename, specific validity/load feedback, reset, and back navigation in `editor.html`, `src/editor.ts`, and `src/editor.css`; full-page Chromium screenshot inspected |
| Everything in JSON editable | Complete for the current version-1 schema | Six top-level/settings controls, eight controls per node, four per road, and three per initial transport, plus collection add/remove; production Chromium asserted those control counts and exercised all collection types |

Source: user requirements; current implementation; `agents/tmp/2026-08-27-browser-map-editor/script/editor_browser_check.mjs` production-browser run on 2026-08-27.

## Validation results

- `npm run typecheck` passed. Source: local command output, 2026-08-27.
- `npm test` passed: 1 file and 11 tests. Source: local Vitest output, 2026-08-27.
- `npm run build` passed and emitted `dist/index.html` plus `dist/editor.html` with relative assets. Source: local Vite 8.2.2 output and generated files, 2026-08-27.
- `git diff --check` passed. Source: local Git output, 2026-08-27.
- The Chromium workflow passed against `vite preview`: entry navigation, complete field coverage, collection add/remove, invalid-edit blocking, coordinate dragging, malformed-load recovery, valid load, and JSON download contents. Source: `agents/tmp/2026-08-27-browser-map-editor/script/editor_browser_check.mjs`, 2026-08-27.
- Maintained MVP and root documentation now describe the editor and current 11-test validation baseline. Source: `README.md`, `doc/mvp/README.md`, `doc/mvp/tech.md`, `doc/mvp/user-experience.md`, and `doc/mvp/validation.md`.
