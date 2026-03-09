# Package: telva

`telva` is the main embeddable React editor package.

## Key exports

- `Telva` React component
- `TelvaApp` class and editor APIs
- workspace-level utilities and shared types

## Source layout (high-level)

- `src/Telva.tsx` — primary component entry
- `src/hooks/` — editor hooks (state, translation, interactions)
- `src/state/` — editor state model and commands
- `src/components/` — UI controls and panels

## Runtime notes

- Intended for browser usage
- Next.js users should import client-side when needed

## Package version

- Current workspace version: `1.1.1`
