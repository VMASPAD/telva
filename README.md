# Telva Monorepo

This repository contains the Telva ecosystem: reusable drawing libraries, a Next.js web app, and runnable Vite examples.

## Workspaces

- `packages/*` — publishable libraries (`telva`, `telva-core`, `telva-vec`, `telva-intersect`, `telva-curve`)
- `apps/*` — application workspaces (currently `apps/www`)
- `examples/*` — integration and demo projects

## Requirements

- Node.js 18+
- Yarn 1.22.x

## Install

```bash
yarn
```

## Common scripts (run at repo root)

```bash
yarn start         # run telva-example
yarn start:www     # run Next.js app
yarn start:core    # run core advanced example

yarn build
yarn lint
yarn test
```

## Package publishing order

When publishing manually to npm, publish internal dependencies first:

1. `packages/vec`
2. `packages/intersect`
3. `packages/core`
4. `packages/curve`
5. `packages/telva`

## Documentation

Project documentation is organized under `docs/` by category.

## License

See `LICENSE.md` at the repository root and each workspace package license file.
