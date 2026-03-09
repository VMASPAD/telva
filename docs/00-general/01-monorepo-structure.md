# Monorepo Structure

## Workspace layout

```text
.
├── apps/
│   └── www/
├── examples/
│   ├── telva-example/
│   ├── core-example/
│   └── core-example-advanced/
└── packages/
    ├── telva/
    ├── core/
    ├── vec/
    ├── intersect/
    └── curve/
```

## Dependency flow

- `telva-vec` is a base math package.
- `telva-intersect` depends on `telva-vec`.
- `telva-core` depends on `telva-vec` and `telva-intersect`.
- `telva` depends on `telva-core`, `telva-vec`, and `telva-intersect`.
- App and example workspaces consume `telva` and/or `telva-core`.

## Build orchestration

- Root scripts call Turbo pipelines.
- Turbo resolves workspace dependency order automatically.
- Packages and apps can be built independently with filters.
