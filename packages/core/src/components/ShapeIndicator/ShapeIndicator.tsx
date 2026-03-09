import * as React from 'react'
import { usePosition, useTLContext } from '~hooks'
import type { TLShape, TLUser } from '~types'

export interface IndicatorProps<T extends TLShape, M = unknown> {
  shape: T
  meta: M extends unknown ? M : undefined
  isSelected?: boolean
  isHovered?: boolean
  isEditing?: boolean
  user?: TLUser
}

function _ShapeIndicator<T extends TLShape, M>({
  isHovered = false,
  isSelected = false,
  isEditing = false,
  shape,
  user,
  meta,
}: IndicatorProps<T, M>) {
  const { shapeUtils } = useTLContext()
  const utils = shapeUtils[shape.type]
  const bounds = utils.getBounds(shape)
  const rPositioned = usePosition(bounds, shape.rotation)

  return (
    <div
      ref={rPositioned}
      draggable={false}
      className={[
        'tv-indicator',
        'tv-absolute',
        isSelected && !user ? 'tv-selected' : 'tv-hovered',
        isEditing ? 'tv-editing' : '',
        shape.isLocked ? 'tv-locked' : '',
      ].join(' ')}
    >
      <svg width="100%" height="100%">
        <g className="tv-centered-g" stroke={user?.color}>
          <utils.Indicator
            shape={shape}
            meta={meta}
            user={user}
            bounds={bounds}
            isSelected={isSelected}
            isHovered={isHovered}
          />
        </g>
      </svg>
    </div>
  )
}

export const ShapeIndicator = React.memo(_ShapeIndicator)
