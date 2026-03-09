import { TelvaApp } from '~state'
import { TriangleTool } from '.'

describe('TriangleTool', () => {
  it('creates tool', () => {
    const app = new TelvaApp()
    new TriangleTool(app)
  })
})
