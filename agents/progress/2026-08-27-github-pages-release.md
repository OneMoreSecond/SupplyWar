Task ID: 2026-08-27-github-pages-release

# Original request

Source: user instruction, 2026-08-27.

`I have removed dist/ directory from .gitignore, and want to release it to github pages. please write configuration.`

---

# 1. Research

- The repository is a Vite application. Source: `package.json`, `npm run build` script.
- The production output directory is `dist/`. Source: Vite build convention and the generated repository output present before this task.
- The repository remote is `https://github.com/OneMoreSecond/SupplyWar.git`; this is a project Pages site rather than an account-root site. Source: `git remote -v`.
- The application imports map data at build time, so the deployed artifact does not need a separate runtime map copy. Source: `src/main.ts`.
- GitHub's documented custom workflow uses `actions/upload-pages-artifact` followed by `actions/deploy-pages`, with Pages write and OIDC token permissions. Source: [GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
- Vite requires a non-root base for repository project sites; this configuration uses a relative base so the artifact also works when served below the repository path. Source: [Vite static deployment guide](https://vite.dev/guide/static-deploy.html).

| Term | Meaning | Source |
| --- | --- | --- |
| Pages | GitHub's static website hosting service | GitHub Docs |
| Project site | A Pages site served below a repository path | Vite static deployment guide |
| Artifact | The packaged static files passed from the build job to the deployment job | GitHub Docs |
| `dist/` | Vite's generated production output directory | `package.json` build script and repository output |

# 2. Constraint and Assumption

- Keep the deployment configuration small and use the existing `npm run build` command. Source: repository `package.json`; project simplicity instructions in `AGENTS.md`.
- Deploy only from `main` automatically; allow manual runs with `workflow_dispatch`. Source: deployment scope inferred from the current branch and user request.
- Use Node 22 because the project declares Node `>=22`. Source: `package.json`.
- Keep `dist/` tracked as requested by the user; the workflow independently rebuilds it for the Pages artifact. Source: user instruction and current `.gitignore`/Git status.
- The repository Pages setting still needs to be set to GitHub Actions in GitHub's web UI. Source: GitHub Docs.

# 3. Challenges

- Project Pages URLs require generated asset references to resolve below the repository path. A root-relative asset path would work locally but fail when published below `/SupplyWar/`. Source: Vite deployment guidance and the pre-task `dist/index.html`.
- The checked-in `dist/` may become stale when source changes. The workflow must build from source before deployment, while retaining the tracked output requested by the user. Source: user instruction and repository build scripts.

# 4. Decisions

- Use a GitHub Actions artifact deployment workflow instead of a `gh-pages` branch. This keeps source and deployment output separate while using GitHub's current Pages deployment mechanism. Source: GitHub Docs and project simplicity constraint.
- Configure Vite with `base: "./"`. This resolves generated assets relative to the deployed page and remains usable for local development. Source: Vite deployment guidance; design judgment for this static single-page application.
- Use `actions/checkout@v6`, `actions/setup-node@v6`, `actions/upload-pages-artifact@v4`, and `actions/deploy-pages@v4`. Source: current official GitHub action documentation.
- Build with Node 22 and `npm ci`, then upload only `dist/`. Source: `package.json`, `package-lock.json`, and GitHub Pages artifact contract.

# 5. Design

1. `vite.config.ts` sets a relative production base.
2. `.github/workflows/deploy-pages.yml` runs on pushes to `main` and manual dispatches.
3. The build job checks out source, installs the lockfile dependencies with Node 22, runs the existing build, and uploads `dist/`.
4. The deploy job waits for the build and publishes the Pages artifact using the `github-pages` environment.
5. `README.md` documents the required Pages source setting.

# 6. Todo

- [x] Inspect the existing Vite build and asset loading.
- [x] Verify the current GitHub Pages workflow pattern from official documentation.
- [x] Add the Vite base configuration.
- [x] Add the GitHub Pages build/deploy workflow.
- [x] Document the GitHub Pages setting.
- [x] Run the repository validation commands.
- [x] Confirm the generated `dist/` asset URLs use relative paths.

# 7. Results

- Added [`vite.config.ts`](../../vite.config.ts) with `base: "./"`; the built `dist/index.html` now references `./assets/...`. Source: local production build, 2026-08-27.
- Added [`.github/workflows/deploy-pages.yml`](../../.github/workflows/deploy-pages.yml). Pushes to `main` and manual dispatches install Node 22 dependencies, run `npm run build`, upload `dist/`, and deploy the Pages artifact. Source: workflow configuration and GitHub Pages deployment model.
- Documented the required Pages setting in [`README.md`](../../README.md). Source: repository documentation update.
- `npm run typecheck` passed. Source: local validation, 2026-08-27.
- `npm test` passed: 1 test file and 7 tests. Source: local validation, 2026-08-27.
- `npm run build` passed with Vite 8.2.2. Source: local validation, 2026-08-27.

After pushing these changes to `main`, set repository Settings > Pages > Build and deployment > Source to **GitHub Actions**. GitHub will then publish the generated site. Source: [GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
