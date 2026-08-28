# Supply War

Supply War is a browser war game about managing supply routes, inspired by Flash game Tentacle Wars.

The key fun point is defeating a stronger but badly positioned enemy force with fewer forces by disrupting its supply route.

## Project constraints

- Keep map data separate from the core engine to support future modding and a map editor.
- Keep simulation and visual rendering on separate ticks.

Before every map design or modification, read and apply [`doc/map-design.md`](doc/map-design.md). Source: user instruction, 2026-08-28.

Canvas text must be device-pixel-ratio aware and visually crisp like surrounding DOM text. Source: user visual-design instruction, 2026-08-28.

When display space is limited, explicitly prioritize information and hide lower-priority elements before shrinking or obscuring higher-priority elements. Source: user visual-design instruction, 2026-08-28.

Road crossings are allowed by the game and editor. Avoiding crossings is a map-design preference, not a project requirement. Source: user review, 2026-08-27.

## Current prototype

Source: user-confirmed MVP review, 2026-08-26; tutorial-progression goal, 2026-08-27; and approved Demo plan, 2026-08-28.

Normal play contains four focused tutorial maps, `maps/mvp.json` as their final exam, and the large-map `maps/demo.json`. The Demo has deterministic fog-limited AI, fog with discovery memory, player/AI Interdiction, semantic node/road presentation, and locally bundled Barlow. Human fun and 10–15-minute pacing remain unverified. Source: user-approved plan and follow-up, `src/levels.ts`, `maps/demo.json`, and `agents/progress/2026-08-28-demo-plan.md`, 2026-08-28.

The current mechanics, maps, architecture, validation, and remaining Demo risks are maintained in the [formal prototype documentation set](doc/mvp/README.md).

Use those documents as the source of truth for implementation. Update the relevant category document when behavior changes; retain the [game progress record](agents/progress/2026-08-26-game-demo-plan-grill.md), [tutorial progress record](agents/progress/2026-08-27-tutorial-level-progression.md), and [Demo progress record](agents/progress/2026-08-28-demo-plan.md) as decision and implementation history.

## Shell commands

When a shell search pattern contains Markdown backticks, wrap the pattern in single quotes so the shell cannot interpret it as command substitution. Source: agent tool mistake, 2026-08-28.

## Browser checks

`editor.html` places `.editor-header` beside `main.editor-layout`, not inside it. Page-wide editor text assertions should query `body`; reserve `main` for preview/form content. Source: agent browser-test mistake, 2026-08-28.

Use exact accessible-label matching when one editor label prefixes others, such as `Interdiction`, `Interdiction duration`, and `Interdiction cooldown`. Source: agent browser-test mistake, 2026-08-28.

Browser assertions that depend on the selected map object must select that object immediately before the assertion; inspecting another object changes the editor selection. Source: agent browser-test mistake, 2026-08-28.

When displaying time accumulated by fixed simulation steps, add a small floating-point tolerance before flooring to whole seconds so values such as `17.999999` do not render one second behind. Source: agent browser-test finding, 2026-08-28.
