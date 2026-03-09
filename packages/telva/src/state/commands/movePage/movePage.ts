import type { TelvaApp } from '~state/TelvaApp'
import type { TVPage, TelvaCommand } from '~types'

export function movePage(app: TelvaApp, pageId: string, index: number): TelvaCommand {
  const { pages } = app.document

  const movingPage = pages[pageId]

  const beforePages = Object.values(pages).sort((a, b) => (a.childIndex ?? 0) - (b.childIndex ?? 0))

  const fromIndex = beforePages.indexOf(movingPage)

  const afterPages = [...beforePages]
  afterPages.splice(fromIndex, 1)
  afterPages.splice(index > fromIndex ? index - 1 : index, 0, movingPage)

  return {
    id: 'move_page',
    before: {
      document: {
        pages: Object.fromEntries(
          beforePages.map((p: TVPage) => [p.id, { childIndex: p.childIndex }])
        ),
      },
    },
    after: {
      document: {
        pages: Object.fromEntries(
          afterPages.map((p: TVPage, childIndex) => [p.id, { childIndex }])
        ),
      },
    },
  }
}
