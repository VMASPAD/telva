import { TelvaTestApp, mockDocument } from '~test'
import { SessionType, TVShapeType, TVStatus } from '~types'

describe('Handle session', () => {
  it('begins, updateSession', () => {
    const app = new TelvaTestApp()
      .loadDocument(mockDocument)
      .createShapes({
        id: 'arrow1',
        type: TVShapeType.Arrow,
      })
      .select('arrow1')
      .movePointer([-10, -10])
      .startSession(SessionType.Arrow, 'arrow1', 'end')
      .movePointer([10, 10])
      .completeSession()

    expect(app.status).toBe(TVStatus.Idle)

    app.undo().redo()
  })

  it('cancels session', () => {
    const app = new TelvaTestApp()
      .loadDocument(mockDocument)
      .createShapes({
        type: TVShapeType.Arrow,
        id: 'arrow1',
      })
      .select('arrow1')
      .movePointer([-10, -10])
      .startSession(SessionType.Arrow, 'arrow1', 'end')
      .movePointer([10, 10])
      .cancelSession()

    expect(app.getShape('rect1').point).toStrictEqual([0, 0])
  })
})
