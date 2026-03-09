# Scripts and Workflows

## Root scripts (`package.json`)

- `yarn start` — run `telva-example` dev flow
- `yarn start:www` — run `apps/www`
- `yarn start:core` — run advanced core example
- `yarn build` — run all builds via Turbo
- `yarn lint` — run lint pipelines
- `yarn test` — run tests across workspaces
- `yarn clean` — run workspace clean scripts

## Useful filtered builds

- `yarn build:www`
- `yarn build:core`
- `yarn build:packages`
- `yarn build:apps`

## Typical development workflow

1. Install dependencies: `yarn`
2. Run the target workspace (for example `yarn start`)
3. Implement and test changes
4. Run `yarn lint` and `yarn test`
5. Build before release with `yarn build`
