import { TelvaApp } from '~state'
import { ArrowTool } from '.'

describe('ArrowTool', () => {
  it('creates tool', () => {
    const app = new TelvaApp()
    new ArrowTool(app)
  })
})
