import type { TelvaApp } from '~state/TelvaApp'
import type { TelvaCommand } from '~types'

export function renamePage(app: TelvaApp, pageId: string, name: string): TelvaCommand {
  const { page } = app

  return {
    id: 'rename_page',
    before: {
      document: {
        pages: {
          [pageId]: { name: page.name },
        },
      },
    },
    after: {
      document: {
        pages: {
          [pageId]: { name: name },
        },
      },
    },
  }
}
