# MVP Technology

Source: user-confirmed implementation choices and repository implementation summarized in [the game progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), Sections 4–6, [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md), and [the tutorial progress record](../../agents/progress/2026-08-27-tutorial-level-progression.md), on 2026-08-27.

## Architecture

| Component | Responsibility | Primary location |
| --- | --- | --- |
| Game shell | Level picker, guidance, completion dialog, map-editor entry, canvas, and restart control | [`index.html`](../../index.html) |
| View and input | Level routing, Canvas rendering, victory/dialog state, visual feedback, drag/right-click commands, and independent render cadence | [`src/main.ts`](../../src/main.ts) |
| Level catalog | Ordered tutorial/final-exam metadata and authored map configs | [`src/levels.ts`](../../src/levels.ts) |
| Camera | Shared world/screen conversion, panning, pointer-anchored zoom, and fit-to-map | [`src/camera.ts`](../../src/camera.ts) |
| Simulation | Deterministic ownership, production, transports, packets, capture, siege, and victory | [`src/game.ts`](../../src/game.ts) |
| Map data | Versioned nodes, roads, settings, and initial transports for five authored levels | [`maps/`](../../maps/) |
| Editor shell | File actions, selectable preview, object inspector, complete version-1 map form, and editor module entry | [`editor.html`](../../editor.html) |
| Editor behavior | Draft editing, object selection, node/road gestures, validation feedback, JSON load/download, reset confirmation, and playtest transfer | [`src/editor.ts`](../../src/editor.ts) |
| Playtest transfer | Browser-local keys shared by the editor and game entries | [`src/playtest.ts`](../../src/playtest.ts) |
| Tests | Simulation mechanics, scenarios, external map validation, camera transforms, tutorial focus, and catalog navigation | [`test/game.test.ts`](../../test/game.test.ts), [`test/camera.test.ts`](../../test/camera.test.ts), [`test/levels.test.ts`](../../test/levels.test.ts) |

## Runtime model

The browser stack is vanilla TypeScript, Vite, and Canvas 2D. The simulation advances in fixed 0.1-second steps (10 Hz); `requestAnimationFrame` renders independently. During editor playtests, a 1×–8× multiplier scales elapsed time accumulated into those same fixed steps. Source: user-confirmed stack/tick and playtest-speed decisions; implementation: [`src/main.ts`](../../src/main.ts).

For each simulation step, the engine produces force, delivers due packets, cancels transports that lost their sources, applies siege, repeats source-loss cancellation, dispatches new packets, and checks base ownership for victory. Source: [`src/game.ts`](../../src/game.ts).

## Configuration boundary

`MapConfig` defines versioned map data. One strict validator checks every version-1 scalar field, node IDs and required victory nodes, road IDs/endpoints/topology uniqueness, and usable initial transports at simulation startup and editor import/save time. Road crossings are allowed. The JSON map owns forces, production, unbounded world coordinates, road widths, initial flows, timing values, and the selected siege-formula identifier. Source: [`src/game.ts`](../../src/game.ts), [`maps/mvp.json`](../../maps/mvp.json), and user review, 2026-08-27.

This shared boundary lets the browser editor change map content without coupling it to the simulation engine. Source: project constraint in [`AGENTS.md`](../../AGENTS.md); implementation in [`src/editor.ts`](../../src/editor.ts).

## Authored level flow

`src/levels.ts` is an ordered catalog of four tutorials followed by `maps/mvp.json`. It owns player-facing level names and guidance without extending `MapConfig`. Normal entry resolves `?level=<id>` and defaults unknown or missing IDs to Tutorial 1. The picker changes that query. An authored player victory opens one native completion dialog: tutorials offer replay and the catalog successor, while the final exam offers replay and close. Source: user goal and review; implementation: [`src/levels.ts`](../../src/levels.ts), [`src/main.ts`](../../src/main.ts), and [`index.html`](../../index.html).

Editor `?playtest=1` remains a separate, higher-priority route: it hides authored-level controls and runs the validated `sessionStorage` draft. Missing or invalid draft storage retains the existing MVP fallback. Source: existing playtest contract and [`src/main.ts`](../../src/main.ts).

## Browser map editor

Vite builds `index.html` and `editor.html` as separate browser entries. The game links to the editor with a relative URL so both pages work under the GitHub Pages project path. Source: [`vite.config.ts`](../../vite.config.ts), [`index.html`](../../index.html), [`editor.html`](../../editor.html).

The editor starts from the authored MVP map and exposes `version`, every settings value, every node/road/initial-transport field, and collection add/remove controls. Global settings stay visible; node properties appear only for the selected node, while a road's optional one initial transport appears inside that road's inspector. Node-body dragging changes world coordinates, dragging a node's square connector creates a road, empty-space dragging pans, wheel input zooms at the pointer, and `Fit map` frames all nodes. Source: [`src/editor.ts`](../../src/editor.ts), user requirements in [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md).

Import validates parsed JSON before replacing the current draft; download and playtest remain unavailable until the draft validates. Playtest serializes the valid draft and filename to `sessionStorage`, opens the game with `?playtest=1`, and returns through `editor.html?playtest=1`, where the same draft is restored. The authored `maps/mvp.json` is unchanged. Reset uses a confirmation dialog before replacing unsaved state. Source: [`src/editor.ts`](../../src/editor.ts), [`src/main.ts`](../../src/main.ts), [`src/playtest.ts`](../../src/playtest.ts), and user review comments in [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md).

Both editor and game use `Camera2D`, so simulation distances remain in authored world units while rendering and pointer input share one reversible transform. Nodes and roads keep screen-readable marker widths at any zoom. Source: [`src/camera.ts`](../../src/camera.ts), [`src/editor.ts`](../../src/editor.ts), and [`src/main.ts`](../../src/main.ts).

## Narrow extension point

`SiegeFormula` is the internal plugin interface. The map selects `exponential-half-life`; its half-life is configurable. This is deliberately a narrow formula boundary, not a runtime mod platform. Source: user-confirmed scope and [`src/game.ts`](../../src/game.ts).

## Local operation

Requires Node 22+ and npm. Source: [`package.json`](../../package.json), [`README.md`](../../README.md).

```bash
npm install
npm run dev
```
