import { TVDR } from '~state/TVDR'
import type { TelvaApp } from '~state/TelvaApp'
import type { TVShape, TelvaCommand } from '~types'

export function updateShapes(
  app: TelvaApp,
  updates: ({ id: string } & Partial<TVShape>)[],
  pageId: string
): TelvaCommand {
  const ids = updates.map((update) => update.id)

  const change = TVDR.mutateShapes(
    app.state,
    ids.filter((id) => !app.getShape(id, pageId).isLocked),
    (_shape, i) => updates[i],
    pageId
  )

  return {
    id: 'update',
    before: {
      document: {
        pages: {
          [pageId]: {
            shapes: change.before,
          },
        },
      },
    },
    after: {
      document: {
        pages: {
          [pageId]: {
            shapes: change.after,
          },
        },
      },
    },
  }
}
