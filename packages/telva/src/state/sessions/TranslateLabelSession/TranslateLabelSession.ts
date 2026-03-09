import type { TLBounds } from 'telva-core'
import { TVDR } from '~state/TVDR'
import type { TelvaApp } from '~state/TelvaApp'
import { BaseSession } from '~state/sessions/BaseSession'
import {
  ArrowShape,
  EllipseShape,
  RectangleShape,
  SessionType,
  TVStatus,
  TelvaCommand,
  TelvaPatch,
  TriangleShape,
} from '~types'

export class TranslateLabelSession extends BaseSession {
  type = SessionType.Handle
  performanceMode = undefined
  status = TVStatus.TranslatingHandle
  initialShape: RectangleShape | TriangleShape | EllipseShape | ArrowShape
  initialShapeBounds: TLBounds

  constructor(app: TelvaApp, shapeId: string) {
    super(app)
    this.initialShape = this.app.getShape<
      RectangleShape | TriangleShape | EllipseShape | ArrowShape
    >(shapeId)
    this.initialShapeBounds = this.app.getShapeBounds(shapeId)
  }

  start = (): TelvaPatch | undefined => void null

  update = (): TelvaPatch | undefined => {
    const {
      initialShapeBounds,
      app: { currentPageId, currentPoint },
    } = this

    const newHandlePoint = [
      Math.max(0, Math.min(1, currentPoint[0] / initialShapeBounds.width)),
      Math.max(0, Math.min(1, currentPoint[1] / initialShapeBounds.height)),
    ]

    // First update the handle's next point
    const change = {
      handlePoint: newHandlePoint,
    } as Partial<RectangleShape | TriangleShape | EllipseShape | ArrowShape>

    return {
      document: {
        pages: {
          [currentPageId]: {
            shapes: {
              [this.initialShape.id]: change,
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
