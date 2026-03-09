import type { Action } from 'state/constants'
import { getPagePoint } from 'state/helpers'
import { mutables } from 'state/mutables'
import type { TLPointerInfo } from 'telva-core'

export const updatePointer: Action = (data, payload: TLPointerInfo) => {
  mutables.previousPoint = [...mutables.currentPoint]
  mutables.currentPoint = getPagePoint(payload.point, data.pageState)
}
