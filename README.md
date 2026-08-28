# Supply War

Browser prototype for a supply-route strategy game. Four focused tutorials teach transport, allied supply, supply cutting, and siege; the original MVP map is their final exam; and the large Central Campaign baseline adds deterministic enemy expansion across 32 nodes. Source: [`src/levels.ts`](src/levels.ts), [`maps/demo.json`](maps/demo.json), and [the Demo progress record](agents/progress/2026-08-28-demo-plan.md).

The main page starts at Tutorial 1. Use the `Level` picker to open any map; winning opens a congratulation dialog with replay and next-level actions, or a close action after the Demo. Source: [`index.html`](index.html), [`src/levels.ts`](src/levels.ts), and [`src/main.ts`](src/main.ts).

The game page links to a browser map editor. It can load and save version-1 and version-2 map JSON, edit every setting and collection field, attach an optional initial transport to each road, drag nodes and road connectors, pan or zoom across unbounded map coordinates, and playtest the current draft at 1×–8× speed. Source: [`editor.html`](editor.html), [`src/editor.ts`](src/editor.ts), and [`src/main.ts`](src/main.ts).

Source: [MVP documentation set](doc/mvp/README.md).

Requires Node 22+ and npm.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite to start Tutorial 1, or select **Map editor** to edit and playtest map JSON. Source: browser navigation in [`index.html`](index.html).

Validation:

```bash
npm run typecheck
npm test
npm run build
```

## GitHub Pages

Pushes to `main` build and deploy `dist/` through [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).
In the repository settings, set Pages > Build and deployment > Source to **GitHub Actions**. GitHub then publishes the site at the repository's Pages URL.

The current gameplay, player experience, map, technology, and validation references are in the [maintained prototype documentation set](doc/mvp/README.md). The [MVP progress record](agents/progress/2026-08-26-game-demo-plan-grill.md) and [Demo progress record](agents/progress/2026-08-28-demo-plan.md) retain decision and implementation history.
