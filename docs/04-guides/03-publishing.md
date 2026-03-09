# Publishing Guide

Based on `guides/publishing.md`.

## Current state

Publishing is currently maintainer-driven and largely manual.

## Practical npm order for this monorepo

1. `telva-vec`
2. `telva-intersect`
3. `telva-core`
4. `telva-curve`
5. `telva`

Publishing dependencies first prevents install-time range resolution errors.
