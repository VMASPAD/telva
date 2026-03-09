import { TelvaApp } from '~state'
import { RectangleTool } from '.'

describe('RectangleTool', () => {
  it('creates tool', () => {
    const app = new TelvaApp()
    new RectangleTool(app)
  })
})
