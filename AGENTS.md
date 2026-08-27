# Supply War

Supply War is a browser war game about managing supply routes, inspired by Flash game Tentacle Wars.

The key fun point is defeating a stronger but badly positioned enemy force with fewer forces by disrupting its supply route.

## Project constraints

- Keep map data separate from the core engine to support future modding and a map editor.
- Keep simulation and visual rendering on separate ticks.

Road crossings are allowed by the game and editor. Avoiding crossings is a map-design preference, not a project requirement. Source: user review, 2026-08-27.

## Current MVP

Source: user-confirmed MVP review, 2026-08-26.

The detailed MVP design, mechanics, map, balance values, acceptance criteria, and deferred scope are maintained in the [formal MVP documentation set](doc/mvp/README.md).

Use those documents as the source of truth for implementation. Update the relevant category document when MVP decisions change; retain the [progress record](agents/progress/2026-08-26-game-demo-plan-grill.md) as the decision and implementation history.
