import { TLBoundsCorner, Utils } from 'telva-core'
import { TVDR } from '~state/TVDR'
import type { TelvaApp } from '~state/TelvaApp'
import { FlipType } from '~types'
import type { TelvaCommand } from '~types'

export function flipShapes(app: TelvaApp, ids: string[], type: FlipType): TelvaCommand {
  const {
    selectedIds,
    currentPageId,
    page: { shapes },
  } = app

  const boundsForShapes = ids.map((id) => TVDR.getBounds(shapes[id]))

  const isSinglySelectedGroup = ids.length === 1 && shapes[ids[0]].type === 'group'

  const commonBounds = Utils.getCommonBounds(boundsForShapes)

  const { before, after } = TVDR.mutateShapes(
    app.state,
    ids,
    (shape) => {
      const shapeBounds = TVDR.getBounds(shape)
      const isChildOfGroup = shape.parentId !== currentPageId
      switch (type) {
        case FlipType.Horizontal: {
          if (isChildOfGroup && !isSinglySelectedGroup) {
            // do translation of this child
            const groupBounds = TVDR.getBounds(shapes[shape.parentId])
            const newGroupBounds = Utils.getRelativeTransformedBoundingBox(
              commonBounds,
              commonBounds,
              groupBounds,
              true,
              false
            )
            const dx = newGroupBounds.minX - groupBounds.minX
            return TVDR.getShapeUtil(shape).transform(
              shape,
              { ...shapeBounds, minX: shapeBounds.minX + dx, maxX: shapeBounds.maxX + dx },
              {
                type: TLBoundsCorner.TopLeft,
                scaleX: 1,
                scaleY: 1,
                initialShape: shape,
                transformOrigin: [0.5, 0.5],
              }
            )
          }

          const newShapeBounds = Utils.getRelativeTransformedBoundingBox(
            commonBounds,
            commonBounds,
            shapeBounds,
            true,
            false
          )

          return TVDR.getShapeUtil(shape).transform(shape, newShapeBounds, {
            type: TLBoundsCorner.TopLeft,
            scaleX: -1,
            scaleY: 1,
            initialShape: shape,
            transformOrigin: [0.5, 0.5],
          })
        }
        case FlipType.Vertical: {
          if (isChildOfGroup && !isSinglySelectedGroup) {
            // do translation of this child
            const groupBounds = TVDR.getBounds(shapes[shape.parentId])
            const newGroupBounds = Utils.getRelativeTransformedBoundingBox(
              commonBounds,
              commonBounds,
              groupBounds,
              false,
              true
            )
            const dy = newGroupBounds.minY - groupBounds.minY
            return TVDR.getShapeUtil(shape).transform(
              shape,
              { ...shapeBounds, minY: shapeBounds.minY + dy, maxY: shapeBounds.maxY + dy },
              {
                type: TLBoundsCorner.TopLeft,
                scaleX: 1,
                scaleY: 1,
                initialShape: shape,
                transformOrigin: [0.5, 0.5],
              }
            )
          }
          const newShapeBounds = Utils.getRelativeTransformedBoundingBox(
            commonBounds,
            commonBounds,
            shapeBounds,
            false,
            true
          )

          return TVDR.getShapeUtil(shape).transform(shape, newShapeBounds, {
            type: TLBoundsCorner.TopLeft,
            scaleX: 1,
            scaleY: -1,
            initialShape: shape,
            transformOrigin: [0.5, 0.5],
          })
        }
      }
    },
    currentPageId,
    true
  )

  return {
    id: 'flip',
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
