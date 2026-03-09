# File Inventory

## Repository root

- `package.json` — root scripts and workspace declaration
- `turbo.json` — task pipeline orchestration
- `tsconfig.base.json` / `tsconfig.json` — TypeScript baseline config
- `setupTests.ts` — shared test setup
- `guides/` — process and contributor guides

## apps/www

- `package.json` — Next.js workspace scripts and dependencies
- `pages/` — routes and API endpoints
- `components/`, `hooks/`, `utils/` — app architecture building blocks
- `public/` — static and PWA assets

## packages

- `packages/telva` — top-level embeddable editor package
- `packages/core` — editor engine and rendering core
- `packages/vec` — vector math primitives
- `packages/intersect` — intersection math utilities
- `packages/curve` — curve and spline utilities

## examples

- `examples/telva-example` — full editor integration sample
- `examples/core-example` — minimal core integration
- `examples/core-example-advanced` — advanced core integration
