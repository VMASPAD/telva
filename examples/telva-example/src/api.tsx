import * as React from 'react'
import { ColorStyle, TVShapeType, Telva, TelvaApp } from 'telva'

declare const window: Window & { app: TelvaApp }

export default function Api() {
  const rTelvaApp = React.useRef<TelvaApp>()

  const handleMount = React.useCallback((app: TelvaApp) => {
    rTelvaApp.current = app

    window.app = app

    app
      .createShapes({
        id: 'rect1',
        type: TVShapeType.Rectangle,
        point: [100, 100],
        size: [200, 200],
      })
      .selectAll()
      .nudge([1, 1], true)
      .duplicate()
      .select('rect1')
      .style({ color: ColorStyle.Blue })
      .selectNone()
  }, [])

  return (
    <div className="telva">
      <Telva onMount={handleMount} />
    </div>
  )
}
