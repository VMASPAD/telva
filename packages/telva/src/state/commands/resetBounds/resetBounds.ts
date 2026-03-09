import { TVDR } from '~state/TVDR'
import type { TelvaApp } from '~state/TelvaApp'
import type { TelvaCommand } from '~types'

export function resetBounds(app: TelvaApp, ids: string[], pageId: string): TelvaCommand {
  const { currentPageId } = app

  const { before, after } = TVDR.mutateShapes(
    app.state,
    ids,
    (shape) => app.getShapeUtil(shape).onDoubleClickBoundsHandle?.(shape),
    pageId
  )

  return {
    id: 'reset_bounds',
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
