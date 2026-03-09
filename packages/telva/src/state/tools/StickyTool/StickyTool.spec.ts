import { TelvaApp } from '~state'
import { StickyTool } from '.'

describe('StickyTool', () => {
  it('creates tool', () => {
    const app = new TelvaApp()
    new StickyTool(app)
  })
})
