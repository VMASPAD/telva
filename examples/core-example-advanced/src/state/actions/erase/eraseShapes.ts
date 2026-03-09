import { getShapeUtils } from 'shapes'
import type { Action } from 'state/constants'
import { mutables } from 'state/mutables'
import type { TLPointerInfo } from 'telva-core'

export const eraseShapes: Action = (data, payload: TLPointerInfo) => {
  const { previousPoint } = mutables

  Object.values(data.page.shapes)
    .filter((shape) => !shape.isGhost)
    .forEach((shape) => {
      if (getShapeUtils(shape).hitTestLineSegment(shape, previousPoint, mutables.currentPoint)) {
        shape.isGhost = true
      }
    })
}
