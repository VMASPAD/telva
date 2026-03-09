import type { TelvaApp } from '~state/TelvaApp'
import { removeShapesFromPage } from '~state/commands/shared'
import type { TVAsset, TVAssets, TelvaCommand } from '~types'

const removeAssetsFromDocument = (assets: TVAssets, idsToRemove: string[]) => {
  const afterAssets: Record<string, TVAsset | undefined> = { ...assets }
  idsToRemove.forEach((id) => (afterAssets[id] = undefined))
  return afterAssets
}

export function deleteShapes(
  app: TelvaApp,
  ids: string[],
  pageId = app.currentPageId
): TelvaCommand {
  const {
    pageState,
    selectedIds,
    document: { assets: beforeAssets },
  } = app
  const { before, after, assetsToRemove } = removeShapesFromPage(app.state, ids, pageId)
  const afterAssets = removeAssetsFromDocument(beforeAssets, assetsToRemove)

  return {
    id: 'delete',
    before: {
      document: {
        assets: beforeAssets,
        pages: {
          [pageId]: before,
        },
        pageStates: {
          [pageId]: { selectedIds: [...app.selectedIds] },
        },
      },
    },
    after: {
      document: {
        assets: afterAssets,
        pages: {
          [pageId]: after,
        },
        pageStates: {
          [pageId]: {
            selectedIds: selectedIds.filter((id) => !ids.includes(id)),
            hoveredId:
              pageState.hoveredId && ids.includes(pageState.hoveredId)
                ? undefined
                : pageState.hoveredId,
          },
        },
      },
    },
  }
}
