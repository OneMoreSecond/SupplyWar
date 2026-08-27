# Supply War MVP

Browser prototype for a supply-route strategy game. Four focused tutorials teach transport, allied supply, supply cutting, and siege before the original MVP map combines them as a final exam. Source: [`src/levels.ts`](src/levels.ts) and [`maps/`](maps/).

The main page starts at Tutorial 1. Use the `Level` picker to open any map; winning a tutorial reveals `Next level`. Source: [`index.html`](index.html) and [`src/main.ts`](src/main.ts).

The game page links to a browser map editor. It can load and save version-1 map JSON, edit every setting and collection field, attach an optional initial transport to each road, drag nodes and road connectors, pan or zoom across unbounded map coordinates, and playtest the current draft at 1×–8× speed. Source: [`editor.html`](editor.html), [`src/editor.ts`](src/editor.ts), [`src/main.ts`](src/main.ts).

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

The current gameplay, player experience, map, technology, and validation references are in the [MVP documentation set](doc/mvp/README.md). The [progress record](agents/progress/2026-08-26-game-demo-plan-grill.md) retains the decision and implementation history.
