import { TelvaApp } from '~state'
import { TextTool } from '.'

describe('TextTool', () => {
  it('creates tool', () => {
    const app = new TelvaApp()
    new TextTool(app)
  })
})
