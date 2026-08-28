# Supply War Technology

Status: schema version 2, rooted supply, deterministic AI, and the large-map baseline are implemented. Fog, Interdiction, and the planned game-view extraction are pending.

Source: current repository implementation and [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md), updated 2026-08-28.

## Architecture

| Component | Responsibility | Primary location | Source |
| --- | --- | --- | --- |
| Game shell | Level picker, guidance, completion dialog, editor entry, canvas, and restart | [`index.html`](../../index.html) | Current HTML |
| Orchestration/view | Level routing, fixed-step accumulation, AI cadence, Canvas drawing, input, and completion state | [`src/main.ts`](../../src/main.ts) | Current implementation |
| Simulation | Validation/upgrade boundary, force, transports, rooted supply, siege, and victory | [`src/game.ts`](../../src/game.ts) | Current implementation |
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

`validateMap` strictly validates either external version. `upgradeMap` clones version 2 unchanged or explicitly upgrades version 1 with `travelTimeMultiplier: 1`, disabled feature rules, and `siegeSupport: "direct"`. `Simulation` consumes only the normalized version-2 runtime type. This preserves old behavior without scattering optional defaults through the engine. Source: [`src/game.ts`](../../src/game.ts) and versioning tests in [`test/game.test.ts`](../../test/game.test.ts).

Version-2 fog and Interdiction configuration is present so authored data has a stable future seam, but validation currently rejects `enabled: true`; no valid map can silently request unimplemented behavior. Source: [`src/game.ts`](../../src/game.ts) and [`test/game.test.ts`](../../test/game.test.ts).

## Rooted supply algorithm

For each player/enemy owner, the simulation starts reachability at owned base/resource nodes and repeatedly follows active same-owner transports currently in support mode. Siege checks the attacked node against that reachable set. The bounded graph traversal handles branches and cycles without a separate supply object model. Source: [`src/game.ts`](../../src/game.ts); root, multi-hop, isolated-cycle, rooted-cycle, and root-capture tests in [`test/game.test.ts`](../../test/game.test.ts).

## AI boundary

`createAIObservation` copies only tactical node, road, transport, supply, threat, and reserve facts. `chooseAICommand` is pure and returns start, cancel, or wait; `applyAICommand` uses the same `Simulation` methods as player input. Stable ID ordering resolves equal choices. Source: [`src/ai.ts`](../../src/ai.ts) and [`test/ai.test.ts`](../../test/ai.test.ts).

The implementation intentionally has no behavior tree, path planner, direct force mutation, event bus, difficulty system, or randomness. Source: approved simplicity decision in [the Demo progress record](../../agents/progress/2026-08-28-demo-plan.md).

## Browser editor

The editor loads both versions, keeps partially invalid form state in an explicit editable type, and uses the shared validator before save/playtest. Changing version 1→2 adds explicit legacy-compatible rules and multiplier `1`; changing 2→1 removes version-2 fields. Version-2 settings and per-road travel multiplier are editable. Source: [`src/editor.ts`](../../src/editor.ts) and [`editor.html`](../../editor.html).

The existing selection, connector-drag roads, node movement, unbounded camera, JSON load/save, reset confirmation, session-storage playtest round trip, and 1×–8× playtest speed remain. Source: [`src/editor.ts`](../../src/editor.ts), [`src/playtest.ts`](../../src/playtest.ts), and [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md).

## Deferred technical work

- Gate C human play, including confirmation that animated routes remain legible, before hiding information. Source: refreshed production screenshot and Demo plan.
- `src/visibility.ts`, fog-aware drawing/hit testing, and discovered-state memory. Source: pending Phase D in the Demo progress record.
- Simulation-owned Interdiction timers/cooldowns and player/AI commands. Source: pending Phase D in the Demo progress record.
- Cohesive game-view extraction, node shapes, road styles, HUD, and bundled font. Source: pending Phase E in the Demo progress record.
