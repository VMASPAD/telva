# Packages Overview

`packages/` contains the reusable libraries that power apps and examples.

## Package list

- `packages/telva` → npm package `telva`
- `packages/core` → npm package `telva-core`
- `packages/vec` → npm package `telva-vec`
- `packages/intersect` → npm package `telva-intersect`
- `packages/curve` → npm package `telva-curve`

## Dependency chain

- `telva-vec` is foundational.
- `telva-intersect` builds on `telva-vec`.
- `telva-core` uses `telva-vec` + `telva-intersect`.
- `telva` exposes an embeddable editor and composes the lower layers.

## Common package scripts

Most packages provide:

- `yarn dev`
- `yarn build`
- `yarn lint`
- `yarn clean`
