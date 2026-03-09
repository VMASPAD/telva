# Translation Guide

Based on `guides/translation.md`.

## Updating an existing locale

1. Create a branch.
2. Edit the target locale JSON in `packages/telva/src/translations`.
3. Open a pull request.

## Adding a new locale

1. Duplicate `main.json` in `packages/telva/src/translations`.
2. Rename it to the target language code (for example: `eo.json`).
3. Register the locale in `packages/telva/src/translations/translations.ts`.
4. Translate all messages.
5. Open a pull request.
