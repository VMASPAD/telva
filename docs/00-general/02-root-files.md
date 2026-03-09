# Root Files

Important repository root files and their purpose:

- `package.json` — workspace and root-level scripts.
- `turbo.json` — Turbo task graph and pipeline behavior.
- `tsconfig.json` / `tsconfig.base.json` — shared TypeScript configuration.
- `setupTests.ts` — shared test setup used by package Jest configs.
- `repo-map.tldr` — high-level repository mapping notes.
- `guides/` — process docs (development, publishing, documentation, translation).
- `CODE_OF_CONDUCT.md` / `CONTRIBUTING.md` — contribution standards.
- `LICENSE.md` / `TRADEMARKS.md` — legal and branding policy.

## Notes

- Most day-to-day tasks are run from root scripts.
- Workspace-level scripts are also available within each package/app/example.
