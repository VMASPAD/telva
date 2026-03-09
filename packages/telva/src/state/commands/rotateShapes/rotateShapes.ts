import { Utils } from 'telva-core'
import { TVDR } from '~state/TVDR'
import type { TelvaApp } from '~state/TelvaApp'
import type { TVShape, TelvaCommand } from '~types'

const PI2 = Math.PI * 2

export function rotateShapes(app: TelvaApp, ids: string[], delta = -PI2 / 4): TelvaCommand | void {
  const { currentPageId } = app

  // The shapes for the before patch
  const before: Record<string, Partial<TVShape>> = {}

  // The shapes for the after patch
  const after: Record<string, Partial<TVShape>> = {}

  // Find the shapes that we want to rotate.
  // We don't rotate groups: we rotate their children instead.
  const shapesToRotate = ids
    .flatMap((id) => {
      const shape = app.getShape(id)
      return shape.children ? shape.children.map((childId) => app.getShape(childId)) : shape
    })
    .filter((shape) => !shape.isLocked)

  // Find the common center to all shapes
  // This is the point that we'll rotate around
  const origin = Utils.getBoundsCenter(
    Utils.getCommonBounds(shapesToRotate.map((shape) => TVDR.getBounds(shape)))
  )

  // Find the rotate mutations for each shape
  shapesToRotate.forEach((shape) => {
    const change = TVDR.getRotatedShapeMutation(shape, TVDR.getCenter(shape), origin, delta)
    if (!change) return
    before[shape.id] = TVDR.getBeforeShape(shape, change)
    after[shape.id] = change
  })

  return {
    id: 'rotate',
    before: {
      document: {
        pages: {
          [currentPageId]: { shapes: before },
        },
        pageStates: {
          [currentPageId]: {
            selectedIds: ids,
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
