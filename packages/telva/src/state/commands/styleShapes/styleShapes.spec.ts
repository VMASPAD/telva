import { TVDR } from '~state/TVDR'
import { TelvaTestApp, mockDocument } from '~test'
import { SizeStyle, TVShapeType } from '~types'

describe('Style command', () => {
  it('does, undoes and redoes command', () => {
    const app = new TelvaTestApp().loadDocument(mockDocument).select('rect1')
    expect(app.getShape('rect1').style.size).toEqual(SizeStyle.Medium)

    app.style({ size: SizeStyle.Small })

    expect(app.getShape('rect1').style.size).toEqual(SizeStyle.Small)

    app.undo()

    expect(app.getShape('rect1').style.size).toEqual(SizeStyle.Medium)

    app.redo()

    expect(app.getShape('rect1').style.size).toEqual(SizeStyle.Small)
  })

  describe('When styling groups', () => {
    it('applies style to all group children', () => {
      const app = new TelvaTestApp()
      app
        .loadDocument(mockDocument)
        .group(['rect1', 'rect2'], 'groupA')
        .select('groupA')
        .style({ size: SizeStyle.Small })

      expect(app.getShape('rect1').style.size).toEqual(SizeStyle.Small)
      expect(app.getShape('rect2').style.size).toEqual(SizeStyle.Small)

      app.undo()

      expect(app.getShape('rect1').style.size).toEqual(SizeStyle.Medium)
      expect(app.getShape('rect2').style.size).toEqual(SizeStyle.Medium)

      app.redo()

      expect(app.getShape('rect1').style.size).toEqual(SizeStyle.Small)
      expect(app.getShape('rect2').style.size).toEqual(SizeStyle.Small)
    })
  })

  describe('When styling text', () => {
    it('recenters the shape if the size changed', () => {
      const app = new TelvaTestApp().createShapes({
        id: 'text1',
        type: TVShapeType.Text,
        text: 'Hello world',
      })

      const centerA = TVDR.getShapeUtil(TVShapeType.Text).getCenter(app.getShape('text1'))

      app.select('text1').style({ size: SizeStyle.Large })

      const centerB = TVDR.getShapeUtil(TVShapeType.Text).getCenter(app.getShape('text1'))

      app.style({ size: SizeStyle.Small })

      const centerC = TVDR.getShapeUtil(TVShapeType.Text).getCenter(app.getShape('text1'))

      app.style({ size: SizeStyle.Medium })

      const centerD = TVDR.getShapeUtil(TVShapeType.Text).getCenter(app.getShape('text1'))

      expect(centerA).toEqual(centerB)
      expect(centerA).toEqual(centerC)
      expect(centerB).toEqual(centerD)
    })
  })
})

describe('when running the command', () => {
  it('restores selection on undo', () => {
    const app = new TelvaTestApp()
      .loadDocument(mockDocument)
      .select('rect1')
      .style({ size: SizeStyle.Small })
      .selectNone()
      .undo()

    expect(app.selectedIds).toEqual(['rect1'])

    app.selectNone().redo()

    expect(app.selectedIds).toEqual(['rect1'])
  })
})
