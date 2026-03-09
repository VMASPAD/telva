# telva

Embeddable React drawing editor package.

## Install

```bash
npm i telva
```

## Peer dependencies

- `react >= 16.8`
- `react-dom >= 16.8`

## Basic usage

```tsx
import { Telva } from 'telva'

export function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Telva />
    </div>
  )
}
```

## Next.js client-only usage

```tsx
import dynamic from 'next/dynamic'

;('use client')

const Telva = dynamic(() => import('telva').then((m) => m.Telva), {
  ssr: false,
})

export default function Page() {
  return <Telva />
}
```

## Workspace scripts

```bash
yarn dev
yarn build
yarn test
yarn lint
```
