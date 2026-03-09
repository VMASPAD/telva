import { TelvaApp } from '~state'
import { LineTool } from '.'

describe('LineTool', () => {
  it('creates tool', () => {
    const app = new TelvaApp()
    new LineTool(app)
  })
})
