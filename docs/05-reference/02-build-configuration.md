# Build Configuration

## Turbo

- Workspace orchestration is defined in `turbo.json`.
- Root scripts call Turbo pipelines for build, test, lint, and clean.
- Filtered builds target specific workspaces when needed.

## TypeScript

- `tsconfig.base.json` provides shared compiler settings.
- Workspace-level `tsconfig.json` files extend and customize local behavior.

## Package bundling

- Publishable packages in `packages/*` use `@tldraw/lfg` for builds.
- Output artifacts are emitted to each package `dist/` folder.

## App and examples

- `apps/www` builds with Next.js.
- `examples/*` build with Vite + TypeScript.
