import { Vec } from 'telva-vec'
import { TVDR } from '~state/TVDR'
import type { TelvaApp } from '~state/TelvaApp'
import { BaseSession } from '~state/sessions/BaseSession'
import { SessionType, ShapesWithProp, TVStatus, TelvaCommand, TelvaPatch } from '~types'

export class HandleSession extends BaseSession {
  type = SessionType.Handle
  performanceMode = undefined
  status = TVStatus.TranslatingHandle
  commandId: string
  topLeft: number[]
  shiftKey = false
  initialShape: ShapesWithProp<'handles'>
  handleId: string

  constructor(app: TelvaApp, shapeId: string, handleId: string, commandId = 'move_handle') {
    super(app)
    const { originPoint } = app
    this.topLeft = [...originPoint]
    this.handleId = handleId
    this.initialShape = this.app.getShape(shapeId)
    this.commandId = commandId
  }

  start = (): TelvaPatch | undefined => void null

  update = (): TelvaPatch | undefined => {
    const {
      initialShape,
      app: { currentPageId, currentPoint },
    } = this

    const shape = this.app.getShape<ShapesWithProp<'handles'>>(initialShape.id)

    if (shape.isLocked) return void null

    const handles = shape.handles

    const handleId = this.handleId as keyof typeof handles

    const delta = Vec.sub(currentPoint, handles[handleId].point)

    const handleChanges = {
      [handleId]: {
        ...handles[handleId],
        point: Vec.sub(Vec.add(handles[handleId].point, delta), shape.point),
      },
    }

    // First update the handle's next point
    const change = TVDR.getShapeUtil(shape).onHandleChange?.(shape, handleChanges)

    if (!change) return

    return {
      document: {
        pages: {
          [currentPageId]: {
            shapes: {
              [shape.id]: change,
            },
          },
        },
      },
    }
  }

  cancel = (): TelvaPatch | undefined => {
    const {
      initialShape,
      app: { currentPageId },
    } = this

    return {
      document: {
        pages: {
          [currentPageId]: {
            shapes: {
              [initialShape.id]: initialShape,
            },
          },
        },
      },
    }
  }

  complete = (): TelvaPatch | TelvaCommand | undefined => {
    const {
      initialShape,
      app: { currentPageId },
    } = this

    return {
      id: this.commandId,
      before: {
        document: {
          pages: {
            [currentPageId]: {
              shapes: {
                [initialShape.id]: initialShape,
              },
            },
          },
        },
      },
      after: {
        document: {
          pages: {
            [currentPageId]: {
              shapes: {
                [initialShape.id]: TVDR.onSessionComplete(this.app.getShape(this.initialShape.id)),
              },
            },
          },
        },
      },
    }
  }
}
