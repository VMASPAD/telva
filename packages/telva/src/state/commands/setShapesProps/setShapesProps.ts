import type { TelvaApp } from '~state'
import type { TVShape, TelvaCommand } from '~types'

export function setShapesProps<T extends TVShape>(
  app: TelvaApp,
  ids: string[],
  partial: Partial<T>
): TelvaCommand {
  const { currentPageId, selectedIds } = app

  const initialShapes = ids
    .map((id) => app.getShape<T>(id))
    .filter((shape) => (partial['isLocked'] ? true : !shape.isLocked))

  const before: Record<string, Partial<TVShape>> = {}
  const after: Record<string, Partial<TVShape>> = {}

  const keys = Object.keys(partial) as (keyof T)[]

  initialShapes.forEach((shape) => {
    before[shape.id] = Object.fromEntries(keys.map((key) => [key, shape[key]]))
    after[shape.id] = partial
  })

  return {
    id: 'set_props',
    before: {
      document: {
        pages: {
          [currentPageId]: {
            shapes: before,
          },
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
          [currentPageId]: {
            shapes: after,
          },
        },
        pageStates: {
          [currentPageId]: {
            selectedIds,
          },
        },
      },
    },
  }
}
