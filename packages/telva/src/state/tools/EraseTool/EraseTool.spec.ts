import { TelvaApp } from '~state'
import { EraseTool } from './EraseTool'

describe('EraseTool', () => {
  it('creates tool', () => {
    const app = new TelvaApp()
    new EraseTool(app)
  })

  it.todo('restores previous tool after erasing')
})
