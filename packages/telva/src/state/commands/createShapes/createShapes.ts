import type { TelvaApp } from '~state/TelvaApp'
import type { Patch, TVBinding, TVShape, TelvaCommand } from '~types'

export function createShapes(
  app: TelvaApp,
  shapes: TVShape[],
  bindings: TVBinding[] = []
): TelvaCommand {
  const { currentPageId } = app

  const beforeShapes: Record<string, Patch<TVShape> | undefined> = {}
  const afterShapes: Record<string, Patch<TVShape> | undefined> = {}

  shapes.forEach((shape) => {
    beforeShapes[shape.id] = undefined
    afterShapes[shape.id] = shape
  })

  const beforeBindings: Record<string, Patch<TVBinding> | undefined> = {}
  const afterBindings: Record<string, Patch<TVBinding> | undefined> = {}

  bindings.forEach((binding) => {
    beforeBindings[binding.id] = undefined
    afterBindings[binding.id] = binding
  })

  return {
    id: 'create',
    before: {
      document: {
        pages: {
          [currentPageId]: {
            shapes: beforeShapes,
            bindings: beforeBindings,
          },
        },
        pageStates: {
          [currentPageId]: {
            selectedIds: [...app.selectedIds],
          },
        },
      },
    },
    after: {
      document: {
        pages: {
          [currentPageId]: {
            shapes: afterShapes,
            bindings: afterBindings,
          },
        },
        pageStates: {
          [currentPageId]: {
            selectedIds: shapes.map((shape) => shape.id),
          },
        },
      },
    },
  }
}
