import { Vec } from 'telva-vec'
import { TVDR } from '~state/TVDR'
import type { TelvaApp } from '~state/TelvaApp'
import { Patch, ShapeStyles, TVShape, TVShapeType, TelvaCommand, TextShape } from '~types'

export function styleShapes(
  app: TelvaApp,
  ids: string[],
  changes: Partial<ShapeStyles>
): TelvaCommand {
  const { currentPageId, selectedIds } = app

  const shapeIdsToMutate = ids
    .flatMap((id) => TVDR.getDocumentBranch(app.state, id, currentPageId))
    .filter((id) => !app.getShape(id).isLocked)

  const beforeShapes: Record<string, Patch<TVShape>> = {}
  const afterShapes: Record<string, Patch<TVShape>> = {}

  shapeIdsToMutate
    .map((id) => app.getShape(id))
    .filter((shape) => !shape.isLocked)
    .forEach((shape) => {
      beforeShapes[shape.id] = {
        style: {
          ...Object.fromEntries(
            Object.keys(changes).map((key) => [key, shape.style[key as keyof typeof shape.style]])
          ),
        },
      }

      afterShapes[shape.id] = {
        style: changes,
      }

      if (shape.type === TVShapeType.Text) {
        beforeShapes[shape.id].point = shape.point
        afterShapes[shape.id].point = Vec.toFixed(
          Vec.add(
            shape.point,
            Vec.sub(
              app.getShapeUtil(shape).getCenter(shape),
              app.getShapeUtil(shape).getCenter({
                ...shape,
                style: { ...shape.style, ...changes },
              } as TextShape)
            )
          )
        )
      }
    })

  return {
    id: 'style',
    before: {
      document: {
        pages: {
          [currentPageId]: {
            shapes: beforeShapes,
          },
        },
        pageStates: {
          [currentPageId]: {
            selectedIds: selectedIds,
          },
        },
      },
      appState: {
        currentStyle: { ...app.appState.currentStyle },
      },
    },
    after: {
      document: {
        pages: {
          [currentPageId]: {
            shapes: afterShapes,
          },
        },
        pageStates: {
          [currentPageId]: {
            selectedIds: ids,
          },
        },
      },
      appState: {
        currentStyle: changes,
      },
    },
  }
}
