# Supply War

Supply War is a browser war game about managing supply routes, inspired by Flash game Tentacle Wars.

The key fun point is defeating a stronger but badly positioned enemy force with fewer forces by disrupting its supply route.

## Project constraints

- Keep map data separate from the core engine to support future modding and a map editor.
- Keep simulation and visual rendering on separate ticks.

Road crossings are allowed by the game and editor. Avoiding crossings is a map-design preference, not a project requirement. Source: user review, 2026-08-27.

## Current prototype

Source: user-confirmed MVP review, 2026-08-26; tutorial-progression goal, 2026-08-27; and approved Demo plan, 2026-08-28.

Normal play contains four focused tutorial maps, `maps/mvp.json` as their final exam, and the in-progress large-map baseline `maps/demo.json`. The Demo currently has deterministic enemy AI and full visibility; its fog, Interdiction, visual refinement, and human fun/pacing gates remain pending. Source: user-approved plan, `src/levels.ts`, `maps/demo.json`, and `agents/progress/2026-08-28-demo-plan.md`, 2026-08-28.

The current mechanics, maps, architecture, validation, and remaining Demo risks are maintained in the [formal prototype documentation set](doc/mvp/README.md).

Use those documents as the source of truth for implementation. Update the relevant category document when behavior changes; retain the [game progress record](agents/progress/2026-08-26-game-demo-plan-grill.md), [tutorial progress record](agents/progress/2026-08-27-tutorial-level-progression.md), and [Demo progress record](agents/progress/2026-08-28-demo-plan.md) as decision and implementation history.

## Shell commands

When a shell search pattern contains Markdown backticks, wrap the pattern in single quotes so the shell cannot interpret it as command substitution. Source: agent tool mistake, 2026-08-28.

## Browser checks

`editor.html` places `.editor-header` beside `main.editor-layout`, not inside it. Page-wide editor text assertions should query `body`; reserve `main` for preview/form content. Source: agent browser-test mistake, 2026-08-28.
