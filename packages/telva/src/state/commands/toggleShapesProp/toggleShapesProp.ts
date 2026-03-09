import type { TelvaApp } from '~state'
import type { TVShape, TelvaCommand } from '~types'

export function toggleShapeProp(app: TelvaApp, ids: string[], prop: keyof TVShape): TelvaCommand {
  const { currentPageId } = app

  const initialShapes = ids
    .map((id) => app.getShape(id))
    .filter((shape) => (prop === 'isLocked' ? true : !shape.isLocked))

  const isAllToggled = initialShapes.every((shape) => shape[prop])

  const before: Record<string, Partial<TVShape>> = {}
  const after: Record<string, Partial<TVShape>> = {}

  initialShapes.forEach((shape) => {
    before[shape.id] = { [prop]: shape[prop] }
    after[shape.id] = { [prop]: !isAllToggled }
  })

  return {
    id: 'toggle',
    before: {
      document: {
        pages: {
          [currentPageId]: {
            shapes: before,
          },
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
          [currentPageId]: {
            shapes: after,
          },
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
