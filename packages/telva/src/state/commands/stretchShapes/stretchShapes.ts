import { TLBoundsCorner, Utils } from 'telva-core'
import { TVDR } from '~state/TVDR'
import type { TelvaApp } from '~state/TelvaApp'
import { StretchType, TVShapeType } from '~types'
import type { TelvaCommand } from '~types'

export function stretchShapes(app: TelvaApp, ids: string[], type: StretchType): TelvaCommand {
  const { currentPageId, selectedIds } = app

  const initialShapes = ids.map((id) => app.getShape(id))

  const boundsForShapes = initialShapes.map((shape) => TVDR.getBounds(shape))

  const commonBounds = Utils.getCommonBounds(boundsForShapes)

  const idsToMutate = ids
    .flatMap((id) => {
      const shape = app.getShape(id)
      return shape.children ? shape.children : shape.id
    })
    .filter((id) => !app.getShape(id).isLocked)

  const { before, after } = TVDR.mutateShapes(
    app.state,
    idsToMutate,
    (shape) => {
      const bounds = TVDR.getBounds(shape)

      switch (type) {
        case StretchType.Horizontal: {
          const newBounds = {
            ...bounds,
            minX: commonBounds.minX,
            maxX: commonBounds.maxX,
            width: commonBounds.width,
          }

          return TVDR.getShapeUtil(shape).transformSingle(shape, newBounds, {
            type: TLBoundsCorner.TopLeft,
            scaleX: newBounds.width / bounds.width,
            scaleY: 1,
            initialShape: shape,
            transformOrigin: [0.5, 0.5],
          })
        }
        case StretchType.Vertical: {
          const newBounds = {
            ...bounds,
            minY: commonBounds.minY,
            maxY: commonBounds.maxY,
            height: commonBounds.height,
          }

          return TVDR.getShapeUtil(shape).transformSingle(shape, newBounds, {
            type: TLBoundsCorner.TopLeft,
            scaleX: 1,
            scaleY: newBounds.height / bounds.height,
            initialShape: shape,
            transformOrigin: [0.5, 0.5],
          })
        }
      }
    },
    currentPageId
  )

  initialShapes.forEach((shape) => {
    if (shape.type === TVShapeType.Group) {
      delete before[shape.id]
      delete after[shape.id]
    }
  })

  return {
    id: 'stretch',
    before: {
      document: {
        pages: {
          [currentPageId]: { shapes: before },
        },
        pageStates: {
          [currentPageId]: {
            selectedIds,
          },
        },
      },
    },
    after: {
      document: {
        pages: {
          [currentPageId]: { shapes: after },
        },
        pageStates: {
          [currentPageId]: {
            selectedIds: ids,
          },
        },
      },
    },
  }
}
