import type { TLShape } from 'telva-core'

export interface PencilShape extends TLShape {
  type: 'pencil'
  points: number[][]
}
