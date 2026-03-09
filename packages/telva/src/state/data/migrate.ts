import {
  Decoration,
  FontStyle,
  TVExportBackground,
  TVShapeType,
  TVSnapshot,
  TextShape,
} from '~types'

export function migrate(state: TVSnapshot, newVersion: number): TVSnapshot {
  const { document, settings } = state
  const { version = 0 } = document

  if (!('assets' in document)) {
    document.assets = {}
  }

  // Remove unused assets when loading a document
  const assetIdsInUse = new Set<string>()

  Object.values(document.pages).forEach((page) =>
    Object.values(page.shapes).forEach((shape) => {
      const { parentId, children, assetId } = shape

      if (assetId) {
        assetIdsInUse.add(assetId)
      }

      // Fix missing parent bug
      if (parentId !== page.id && !page.shapes[parentId]) {
        console.warn('Encountered a shape with a missing parent!')
        shape.parentId = page.id
      }

      if (shape.type === TVShapeType.Group && children) {
        children.forEach((childId) => {
          if (!page.shapes[childId]) {
            console.warn('Encountered a parent with a missing child!', shape.id, childId)
            children?.splice(children.indexOf(childId), 1)
          }
        })

        // TODO: Remove the shape if it has no children
      }
    })
  )

  Object.keys(document.assets).forEach((assetId) => {
    if (!assetIdsInUse.has(assetId)) {
      delete document.assets[assetId]
    }
  })

  if (version !== newVersion) {
    if (version < 14) {
      Object.values(document.pages).forEach((page) => {
        Object.values(page.shapes)
          .filter((shape) => shape.type === TVShapeType.Text)
          .forEach((shape) => (shape as TextShape).style.font === FontStyle.Script)
      })
    }

    // Lowercase styles, move binding meta to binding
    if (version <= 13) {
      Object.values(document.pages).forEach((page) => {
        Object.values(page.bindings).forEach((binding) => {
          Object.assign(binding, (binding as any).meta)
        })

        Object.values(page.shapes).forEach((shape) => {
          Object.entries(shape.style).forEach(([id, style]) => {
            if (typeof style === 'string') {
              // @ts-ignore
              shape.style[id] = style.toLowerCase()
            }
          })

          if (shape.type === TVShapeType.Arrow) {
            if (shape.decorations) {
              Object.entries(shape.decorations).forEach(([id, decoration]) => {
                if ((decoration as unknown) === 'Arrow') {
                  shape.decorations = {
                    ...shape.decorations,
                    [id]: Decoration.Arrow,
                  }
                }
              })
            }
          }
        })
      })
    }

    // Add document name and file system handle
    if (version <= 13.1) {
      document.name = 'New Document'
    }

    if (version < 15) {
      document.assets = {}
    }

    Object.values(document.pages).forEach((page) => {
      Object.values(page.shapes).forEach((shape) => {
        if (version < 15.2) {
          if (shape.type === TVShapeType.Image || shape.type === TVShapeType.Video) {
            shape.style.isFilled = true
          }
        }

        if (version < 15.3) {
          if (
            shape.type === TVShapeType.Rectangle ||
            shape.type === TVShapeType.Triangle ||
            shape.type === TVShapeType.Ellipse ||
            shape.type === TVShapeType.Arrow
          ) {
            shape.label = (shape as any).text || ''
            shape.labelPoint = [0.5, 0.5]
          }
        }
      })
    })

    if (version < 15.4) {
      settings.dockPosition = 'bottom'
    }

    if (version < 15.5) {
      settings.exportBackground = TVExportBackground.Transparent
    }
  }

  // Cleanup
  Object.values(document.pageStates).forEach((pageState) => {
    pageState.selectedIds = pageState.selectedIds.filter((id) => {
      return document.pages[pageState.id].shapes[id] !== undefined
    })
    pageState.bindingId = undefined
    pageState.editingId = undefined
    pageState.hoveredId = undefined
    pageState.pointedId = undefined
  })

  // ── Repair Arrow shapes that are missing handles (e.g. loaded from .tld) ──
  Object.values(document.pages).forEach((page) => {
    Object.values(page.shapes).forEach((shape) => {
      if (shape.type === TVShapeType.Arrow) {
        const arrow = shape as any
        if (!arrow.handles || !arrow.handles.start || !arrow.handles.end || !arrow.handles.bend) {
          const startPt: number[] = arrow.handles?.start?.point ?? [0, 0]
          const endPt: number[] = arrow.handles?.end?.point ?? [100, 0]
          const bendPt: number[] = arrow.handles?.bend?.point ?? [
            (startPt[0] + endPt[0]) / 2,
            (startPt[1] + endPt[1]) / 2,
          ]
          arrow.handles = {
            start: {
              id: 'start',
              index: 0,
              point: startPt,
              canBind: true,
              ...arrow.handles?.start,
            },
            bend: { id: 'bend', index: 1, point: bendPt, ...arrow.handles?.bend },
            end: { id: 'end', index: 2, point: endPt, canBind: true, ...arrow.handles?.end },
          }
        }
        // Ensure bend scalar exists
        if (typeof arrow.bend !== 'number') {
          arrow.bend = 0
        }
      }
    })
  })

  document.version = newVersion

  return state
}
