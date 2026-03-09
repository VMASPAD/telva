# apps/www

`apps/www` is the Next.js app workspace named `telva-www`.

## Purpose

- Hosts the main web experience
- Integrates the `telva` editor package into pages and routes
- Provides multiplayer and app-specific glue code

## Main folders

- `pages/` — route entry points and API routes
- `components/` — app-level React components
- `hooks/` — integration hooks (state, assets, multiplayer)
- `styles/` — app styling
- `utils/` — utility functions
- `public/` — static assets and PWA artifacts

## Liveblocks auth setup

`apps/www` supports two authentication paths:

- Public key path via `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_API_KEY`.
- Server auth path via `/api/liveblocks-auth` using `LIVEBLOCKS_SECRET_KEY`.

If no public key is provided, the app automatically falls back to server auth endpoint mode.

## Scripts

From this workspace:

```bash
yarn dev
yarn build
yarn start
yarn lint
```
