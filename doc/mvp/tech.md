# MVP Technology

Source: user-confirmed implementation choices and repository implementation summarized in [the game progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), Sections 4–6, and [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md), on 2026-08-27.

## Architecture

| Component | Responsibility | Primary location |
| --- | --- | --- |
| Game shell | Header, map-editor entry, canvas, restart control, and game module entry | [`index.html`](../../index.html) |
| View and input | Canvas rendering, visual feedback, drag/right-click commands, independent render cadence | [`src/main.ts`](../../src/main.ts) |
| Simulation | Deterministic ownership, production, transports, packets, capture, siege, and victory | [`src/game.ts`](../../src/game.ts) |
| Map data | Versioned nodes, roads, settings, and initial enemy transports | [`maps/mvp.json`](../../maps/mvp.json) |
| Editor shell | File actions, preview, complete version-1 map form, and editor module entry | [`editor.html`](../../editor.html) |
| Editor behavior | Draft editing, validation feedback, preview drawing/dragging, JSON load, and JSON download | [`src/editor.ts`](../../src/editor.ts) |
| Tests | Simulation mechanics, scenarios, and external map validation | [`test/game.test.ts`](../../test/game.test.ts) |

## Runtime model

The browser stack is vanilla TypeScript, Vite, and Canvas 2D. The simulation advances in fixed 0.1-second steps (10 Hz); `requestAnimationFrame` renders independently. Source: user-confirmed stack/tick decisions; implementation: [`src/main.ts`](../../src/main.ts).

For each simulation step, the engine produces force, delivers due packets, cancels transports that lost their sources, applies siege, repeats source-loss cancellation, dispatches new packets, and checks base ownership for victory. Source: [`src/game.ts`](../../src/game.ts).

## Configuration boundary

`MapConfig` defines versioned map data. One strict validator checks every version-1 scalar field, node IDs and required victory nodes, road IDs/endpoints/topology uniqueness, and usable initial transports at simulation startup and editor import/save time. The JSON map owns forces, production, geometry, road widths, initial flows, timing values, and the selected siege-formula identifier. Source: [`src/game.ts`](../../src/game.ts), [`maps/mvp.json`](../../maps/mvp.json).

This shared boundary lets the browser editor change map content without coupling it to the simulation engine. Source: project constraint in [`AGENTS.md`](../../AGENTS.md); implementation in [`src/editor.ts`](../../src/editor.ts).

## Browser map editor

Vite builds `index.html` and `editor.html` as separate browser entries. The game links to the editor with a relative URL so both pages work under the GitHub Pages project path. Source: [`vite.config.ts`](../../vite.config.ts), [`index.html`](../../index.html), [`editor.html`](../../editor.html).

The editor starts from the authored MVP map and exposes `version`, every settings value, every node/road/initial-transport field, and collection add/remove controls. A preview draws partial drafts safely and supports coordinate dragging. Import validates parsed JSON before replacing the current draft; download remains disabled until the current draft validates. Source: [`src/editor.ts`](../../src/editor.ts), user requirements in [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md).

## Narrow extension point

`SiegeFormula` is the internal plugin interface. The map selects `exponential-half-life`; its half-life is configurable. This is deliberately a narrow formula boundary, not a runtime mod platform. Source: user-confirmed scope and [`src/game.ts`](../../src/game.ts).

## Local operation

Requires Node 22+ and npm. Source: [`package.json`](../../package.json), [`README.md`](../../README.md).

```bash
npm install
npm run dev
```
