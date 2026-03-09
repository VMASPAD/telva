/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { Telva, TelvaApp } from 'telva'

declare const window: Window & { app: TelvaApp }

export default function Scroll() {
  const rTelvaApp = React.useRef<TelvaApp>()

  const handleMount = React.useCallback((app: TelvaApp) => {
    window.app = app
    rTelvaApp.current = app
  }, [])

  return (
    <div style={{ height: 1600, width: 1600, padding: 200 }}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Telva id="develop" onMount={handleMount} />
      </div>
    </div>
  )
}
