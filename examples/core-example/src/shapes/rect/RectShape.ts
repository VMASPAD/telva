import type { TLShape } from 'telva-core'

export interface RectShape extends TLShape {
  type: 'rect'
  size: number[]
}
