import type { TLShape } from 'telva-core'

export interface ArrowShape extends TLShape {
  type: 'arrow'
  handles: {
    start: {
      id: 'start'
      index: number
      point: number[]
    }
    end: {
      id: 'end'
      index: number
      point: number[]
    }
  }
}
