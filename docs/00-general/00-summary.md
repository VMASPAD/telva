# Project Summary

Telva is a TypeScript monorepo that combines:

- reusable drawing libraries in `packages/`
- production app code in `apps/`
- runnable demos in `examples/`

The repo is managed with Yarn workspaces and Turbo for coordinated builds, tests, and linting.

## Main goals

- Keep core drawing logic reusable and publishable
- Build app experiences on top of shared packages
- Provide clear examples for integration and experimentation

## Key technologies

- TypeScript
- React
- Next.js (web app)
- Vite (examples)
- Jest + Testing Library (tests)
- Turbo (task orchestration)
