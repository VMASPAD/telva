import type { TLShape } from 'telva-core'

export interface BoxShape extends TLShape {
  type: 'box'
  size: number[]
}
