import * as React from 'react'
import { useBoundsHandleEvents } from '~hooks'
import { TLBounds, TLBoundsCorner } from '~types'

const cornerBgClassnames = {
  [TLBoundsCorner.TopLeft]: 'tv-cursor-nwse',
  [TLBoundsCorner.TopRight]: 'tv-cursor-nesw',
  [TLBoundsCorner.BottomRight]: 'tv-cursor-nwse',
  [TLBoundsCorner.BottomLeft]: 'tv-cursor-nesw',
}

export interface CornerHandleProps {
  size: number
  targetSize: number
  bounds: TLBounds
  corner: TLBoundsCorner
  isHidden?: boolean
}

function _CornerHandle({ size, targetSize, isHidden, corner, bounds }: CornerHandleProps) {
  const events = useBoundsHandleEvents(corner)

  const isTop = corner === TLBoundsCorner.TopLeft || corner === TLBoundsCorner.TopRight
  const isLeft = corner === TLBoundsCorner.TopLeft || corner === TLBoundsCorner.BottomLeft

  return (
    <g opacity={isHidden ? 0 : 1}>
      <rect
        className={'tv-transparent ' + (isHidden ? '' : cornerBgClassnames[corner])}
        aria-label="corner transparent"
        x={(isLeft ? -1 : bounds.width + 1) - targetSize}
        y={(isTop ? -1 : bounds.height + 1) - targetSize}
        width={targetSize * 2}
        height={targetSize * 2}
        pointerEvents={isHidden ? 'none' : 'all'}
        {...events}
      />
      <rect
        className="tv-corner-handle"
        aria-label="corner handle"
        x={(isLeft ? -1 : bounds.width + 1) - size / 2}
        y={(isTop ? -1 : bounds.height + 1) - size / 2}
        width={size}
        height={size}
        pointerEvents="none"
      />
    </g>
  )
}

export const CornerHandle = React.memo(_CornerHandle)
