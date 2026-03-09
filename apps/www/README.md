# telva-www

`telva-www` is the Next.js application workspace for the Telva web experience.

## Tech stack

- Next.js 12
- React 18
- TypeScript
- Liveblocks integration for multiplayer features

## Liveblocks configuration

Liveblocks is optional and disabled by default.

Enable it explicitly with:

- `NEXT_PUBLIC_ENABLE_LIVEBLOCKS=true`

Then choose one auth mode:

- Public key mode (client-side): set `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_API_KEY`.
- Private auth endpoint mode (recommended for local/private setups): set `LIVEBLOCKS_SECRET_KEY` and the app will use `/api/liveblocks-auth` automatically.

If `NEXT_PUBLIC_ENABLE_LIVEBLOCKS` is not `true`, multiplayer routes will run in local mode (no shared canvas sync).

## Run from repo root

```bash
yarn start:www
```

## Run from this workspace

```bash
yarn dev
yarn build
yarn start
yarn lint
```

## Notes

- Workspace package name: `telva-www`
- The app consumes local workspace packages such as `telva` and `telva-core`.
