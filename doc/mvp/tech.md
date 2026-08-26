# MVP Technology

Source: user-confirmed implementation choices and repository implementation summarized in [the progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), Sections 4–6, on 2026-08-26.

## Architecture

| Component | Responsibility | Primary location |
| --- | --- | --- |
| Browser shell | Header, canvas, restart control, and module entry | [`index.html`](../../index.html) |
| View and input | Canvas rendering, visual feedback, drag/right-click commands, independent render cadence | [`src/main.ts`](../../src/main.ts) |
| Simulation | Deterministic ownership, production, transports, packets, capture, siege, and victory | [`src/game.ts`](../../src/game.ts) |
| Map data | Versioned nodes, roads, settings, and initial enemy transports | [`maps/mvp.json`](../../maps/mvp.json) |
| Tests | Simulation mechanics and intended/direct scenarios | [`test/game.test.ts`](../../test/game.test.ts) |

## Runtime model

The browser stack is vanilla TypeScript, Vite, and Canvas 2D. The simulation advances in fixed 0.1-second steps (10 Hz); `requestAnimationFrame` renders independently. Source: user-confirmed stack/tick decisions; implementation: [`src/main.ts`](../../src/main.ts).

For each simulation step, the engine produces force, delivers due packets, cancels transports that lost their sources, applies siege, repeats source-loss cancellation, dispatches new packets, and checks base ownership for victory. Source: [`src/game.ts`](../../src/game.ts).

## Configuration boundary

`MapConfig` defines versioned map data and validates settings, node IDs, road endpoints and uniqueness, and initial transports at startup. The JSON map owns forces, production, geometry, road widths, initial flows, timing values, and the selected siege-formula identifier. Source: [`src/game.ts`](../../src/game.ts), [`maps/mvp.json`](../../maps/mvp.json).

This boundary supports a later map editor without coupling map content to the simulation engine. Source: project constraint in [`AGENTS.md`](../../AGENTS.md).

## Narrow extension point

`SiegeFormula` is the internal plugin interface. The map selects `exponential-half-life`; its half-life is configurable. This is deliberately a narrow formula boundary, not a runtime mod platform. Source: user-confirmed scope and [`src/game.ts`](../../src/game.ts).

## Local operation

Requires Node 22+ and npm. Source: [`package.json`](../../package.json), [`README.md`](../../README.md).

```bash
npm install
npm run dev
```
