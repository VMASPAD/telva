import { TelvaApp } from '~state'
import { EllipseTool } from '.'

describe('EllipseTool', () => {
  it('creates tool', () => {
    const app = new TelvaApp()
    new EllipseTool(app)
  })
})
