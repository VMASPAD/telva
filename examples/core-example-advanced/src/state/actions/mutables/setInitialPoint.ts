import type { Action } from 'state/constants'
import { getPagePoint } from 'state/helpers'
import { mutables } from 'state/mutables'
import type { TLPointerInfo } from 'telva-core'

export const setInitialPoint: Action = (data, payload: TLPointerInfo) => {
  mutables.initialPoint = getPagePoint(payload.origin, data.pageState)
  mutables.previousPoint = [...mutables.initialPoint]
}
