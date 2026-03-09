import type { Action } from 'state/constants'
import type { TLPointerInfo } from 'telva-core'

export const setHoveredShape: Action = (data, payload: TLPointerInfo) => {
  data.pageState.hoveredId = payload.target
}
