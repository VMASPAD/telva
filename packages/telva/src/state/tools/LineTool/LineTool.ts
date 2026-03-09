import { TLPointerEventHandler, Utils } from 'telva-core'
import Vec from 'telva-vec'
import { Arrow } from '~state/shapes'
import { BaseTool, Status } from '~state/tools/BaseTool'
import { SessionType, TVShapeType } from '~types'

export class LineTool extends BaseTool {
  type = TVShapeType.Line as const

  /* ----------------- Event Handlers ----------------- */

  onPointerDown: TLPointerEventHandler = () => {
    if (this.app.readOnly) return
    if (this.status !== Status.Idle) return

    const {
      currentPoint,
      currentGrid,
      settings: { showGrid },
      appState: { currentPageId, currentStyle },
    } = this.app

    const childIndex = this.getNextChildIndex()

    const id = Utils.uniqueId()

    const newShape = Arrow.create({
      id,
      parentId: currentPageId,
      childIndex,
      point: showGrid ? Vec.snap(currentPoint, currentGrid) : currentPoint,
      decorations: {
        start: undefined,
        end: undefined,
      },
      style: { ...currentStyle },
    })

    this.app.patchCreate([newShape])

    this.app.startSession(SessionType.Arrow, newShape.id, 'end', true)

    this.setStatus(Status.Creating)
  }
}
