# Supply War Technology

Status: schema version 2, rooted supply, fog projection, deterministic AI, Interdiction, and the extracted game view are implemented.

Source: current repository implementation and [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md), updated 2026-08-28.

## Architecture

| Component | Responsibility | Primary location | Source |
| --- | --- | --- | --- |
| Game shell | Level picker, formal match timer, guidance, completion dialog, editor entry, Canvas, and restart | [`index.html`](../../index.html) | Current HTML |
| Browser orchestration | Level routing, fixed-step accumulation, timer/AI cadence, ability/HUD state, and completion state | [`src/main.ts`](../../src/main.ts) | Current implementation |
| Game view | Fog-aware, zoom-prioritized Canvas drawing and node/route hit testing | [`src/game-view.ts`](../../src/game-view.ts) | Current implementation |
| Canvas preparation | Device-pixel-ratio backing-store sizing, logical viewport resize, and crisp shared transform | [`src/canvas.ts`](../../src/canvas.ts) | Current implementation |
| Visibility | Current visibility plus persistent discovered-node projection | [`src/visibility.ts`](../../src/visibility.ts) | Current implementation |
| Simulation | Validation/upgrade boundary, force, transports, rooted supply, siege, Interdiction timers/cooldowns, and victory | [`src/game.ts`](../../src/game.ts) | Current implementation |
| AI policy | Immutable observation, deterministic command choice, and normal command application | [`src/ai.ts`](../../src/ai.ts) | Current implementation |
| Level catalog | Four tutorials, MVP final exam, and Demo metadata/configs | [`src/levels.ts`](../../src/levels.ts) | Current implementation |
| Camera | Shared world/screen transforms, pan, zoom, and fit | [`src/camera.ts`](../../src/camera.ts) | Current implementation |
| Map data | Six authored version-2 scenarios | [`maps/`](../../maps/) | Current JSON |
| Editor | Version-1/version-2 forms, direct canvas editing, validation, save, and playtest | [`editor.html`](../../editor.html), [`src/editor.ts`](../../src/editor.ts) | Current implementation |
| Tests | Simulation/schema, AI, camera, authored scenarios, and catalog | [`test/`](../../test/) | Current suite |

## Runtime model

The browser stack is vanilla TypeScript, Vite, and Canvas 2D. Simulation advances in fixed configured steps—`0.1s` in maintained maps—while `requestAnimationFrame` renders independently. Editor playtests may multiply accumulated elapsed time from 1× to 8× without changing the fixed step. Source: [`src/main.ts`](../../src/main.ts), maintained map JSON, and project constraint in [`AGENTS.md`](../../AGENTS.md).

Each step produces force, delivers due packets, cancels transports whose sources changed owner, applies siege, repeats source-loss cancellation, dispatches new packets, and checks base ownership. On AI-enabled maps, browser orchestration asks for at most one enemy command at each configured decision time after the simulation step. Source: [`src/game.ts`](../../src/game.ts), [`src/main.ts`](../../src/main.ts), and [`src/ai.ts`](../../src/ai.ts).

## Versioned map boundary

| Version | Rules | Roads | Current use | Source |
| --- | --- | --- | --- | --- |
| 1 | Legacy direct-target support blocks siege | `id`, endpoints, width | Imported old maps | [`src/game.ts`](../../src/game.ts) |
| 2 | Explicit `rules`, including `siegeSupport`, AI, fog, and Interdiction settings | Version-1 fields plus required `travelTimeMultiplier >= 1` | All six maintained maps | [`src/game.ts`](../../src/game.ts), authored JSON |

`validateMap` strictly validates either external version, including optional node `guardedBy` references, self-reference, and duplicates. `upgradeMap` clones version 2 unchanged or explicitly upgrades version 1 with `travelTimeMultiplier: 1`, disabled feature rules, and `siegeSupport: "direct"`. `Simulation` consumes only the normalized version-2 runtime type. This preserves old behavior without scattering optional defaults through the engine. Source: [`src/game.ts`](../../src/game.ts) and versioning/Guard tests in [`test/game.test.ts`](../../test/game.test.ts).

Version-2 fog and Interdiction settings are fully authorable and validated; the Demo enables both while the other maintained maps disable them. Source: [`src/game.ts`](../../src/game.ts), [`src/editor.ts`](../../src/editor.ts), authored JSON, and [`test/game.test.ts`](../../test/game.test.ts).

## Rooted supply algorithm

For each player/enemy owner, the simulation starts reachability only at owned base nodes and repeatedly follows operational same-owner transports currently in support mode. Interdicted routes leave this graph until their timer ends. Siege checks the attacked node against that reachable set, so an unsupported resource decays while a base remains rooted. Source: user supply-root change, 2026-08-28; [`src/game.ts`](../../src/game.ts); rooted-supply and Interdiction tests in [`test/game.test.ts`](../../test/game.test.ts).

Guard is a start-command constraint, not a new combat subsystem. `Simulation.startTransport` rejects a hostile target while any node named by that target's `guardedBy` still shares its owner; the AI observation exposes the same guarded state and excludes such targets. Source: user Guard requirement, 2026-08-28; [`src/game.ts`](../../src/game.ts), [`src/ai.ts`](../../src/ai.ts), and their tests.

## AI boundary

`createAIObservation` copies only fog-visible tactical node, road, transport, supply, threat, reserve, and cooldown facts. `chooseAICommand` is pure and returns start, cancel, Interdict, or wait; `applyAICommand` uses the same `Simulation` methods as player input. Stable ID ordering resolves equal choices. Source: [`src/ai.ts`](../../src/ai.ts), [`src/visibility.ts`](../../src/visibility.ts), and [`test/ai.test.ts`](../../test/ai.test.ts).

The implementation intentionally has no behavior tree, path planner, direct force mutation, event bus, difficulty system, or randomness. Source: approved simplicity decision in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md).

## Browser editor

The editor loads both versions, keeps partially invalid form state in an explicit editable type, and uses the shared validator before save/playtest. Changing version 1→2 adds explicit legacy-compatible rules and multiplier `1`; changing 2→1 removes version-2 fields. Version-2 settings, per-road travel multiplier, and each node's comma-separated `guardedBy` IDs are editable. Renaming a node updates Guard references. Source: [`src/editor.ts`](../../src/editor.ts) and [`editor.html`](../../editor.html).

The existing selection, connector-drag roads, node movement, unbounded camera, JSON load/save, reset confirmation, session-storage playtest round trip, and 1×–8× playtest speed remain. Source: [`src/editor.ts`](../../src/editor.ts), [`src/playtest.ts`](../../src/playtest.ts), and [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md).

Game and editor Canvas elements keep world coordinates independent of rendering scale. Before each draw, `prepareHiDPICanvas` matches the backing store to CSS size × device pixel ratio, updates the camera's logical viewport, and applies a logical-pixel transform. Node radii then scale with camera zoom but stop at a text-safe minimum; hit testing uses the same radius. Source: user rendering instructions, 2026-08-28; [`src/canvas.ts`](../../src/canvas.ts), [`src/camera.ts`](../../src/camera.ts), [`src/game-view.ts`](../../src/game-view.ts), and [`src/editor.ts`](../../src/editor.ts).

## Deferred technical work

- Tune map JSON and AI weights from human sessions without changing core formulas solely to hit duration. Source: Gate F in the Demo progress record.
- Add broader browser automation only when human findings identify a missing behavior; current changed surfaces already have focused coverage. Source: simplicity constraint in [`AGENTS.md`](../../AGENTS.md) and current validation evidence.
