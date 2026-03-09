/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { Telva, TelvaApp, useFileSystem } from 'telva'
import { REACT_COMPONENTS } from '../react/registry'

declare const window: Window & { app: TelvaApp }

export default function Develop() {
  const rTelvaApp = React.useRef<TelvaApp>()

  const fileSystemEvents = useFileSystem()

  const handleMount = React.useCallback((app: TelvaApp) => {
    window.app = app
    rTelvaApp.current = app
    // app.reset()
    // app.createShapes({
    //   id: 'box1',
    //   type: TVShapeType.Rectangle,
    //   point: [200, 200],
    //   size: [200, 200],
    // })
  }, [])

  const handlePersist = React.useCallback(() => {
    // noop
  }, [])

  return (
    <div className="telva">
      <Telva
        id="develop"
        {...fileSystemEvents}
        onMount={handleMount}
        onPersist={handlePersist}
        reactComponents={REACT_COMPONENTS}
        googleFontsApiKey="AIzaSyDL5Ws3ShsqQ8UioCT4jU_9Ir9iWKmGXrE"
      />
    </div>
  )
}
