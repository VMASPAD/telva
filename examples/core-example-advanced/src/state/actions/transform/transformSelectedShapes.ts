import type { Action } from 'state/constants'
import { mutables } from 'state/mutables'
import type { TLPointerInfo } from 'telva-core'
import { resizeSelectedShapes } from './resizeSelectedShapes'
import { rotateSelectedShapes } from './rotateSelectedShapes'

export const transformSelectedShapes: Action = (data, payload: TLPointerInfo) => {
  const { pointedBoundsHandleId } = mutables

  if (pointedBoundsHandleId === 'rotate') {
    rotateSelectedShapes(data, payload)
  } else {
    resizeSelectedShapes(data, payload)
  }
}
