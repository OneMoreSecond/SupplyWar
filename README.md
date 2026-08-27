# Supply War MVP

Browser prototype for a supply-route strategy game. Capture the enemy resource to break its support transport, siege the frontline, then bypass the enemy backup to take the base.

The game page links to a browser map editor. It can load and save version-1 map JSON, edit all settings and collection fields, add or remove nodes, roads, and initial transports, and drag nodes in a live preview. Source: [`editor.html`](editor.html), [`src/editor.ts`](src/editor.ts).

Source: [MVP documentation set](doc/mvp/README.md).

Requires Node 22+ and npm.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, then select **Map editor** on the game page. Source: browser navigation in [`index.html`](index.html).

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
