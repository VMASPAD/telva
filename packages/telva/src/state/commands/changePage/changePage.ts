import type { TelvaApp } from '~state/TelvaApp'
import type { TelvaCommand } from '~types'

export function changePage(app: TelvaApp, pageId: string): TelvaCommand {
  return {
    id: 'change_page',
    before: {
      appState: {
        currentPageId: app.currentPageId,
      },
    },
    after: {
      appState: {
        currentPageId: pageId,
      },
    },
  }
}
