import * as React from 'react'
import { Utils } from 'telva-core'
import { BINDING_DISTANCE } from '~constants'
import { getShapeStyle, useGradientFill } from '~state/shapes/shared'
import type { ShapeStyles } from '~types'

interface RectangleSvgProps {
  id: string
  style: ShapeStyles
  isSelected: boolean
  size: number[]
  isDarkMode: boolean
}

export const DashedRectangle = React.memo(function DashedRectangle({
  id,
  style,
  size,
  isSelected,
  isDarkMode,
}: RectangleSvgProps) {
  const { stroke, strokeWidth, fill } = getShapeStyle(style, isDarkMode)
  const { defs, gradFill } = useGradientFill(id, style)
  const activeFill = gradFill ?? fill

  const sw = 1 + strokeWidth * 1.618
  const w = Math.max(0, size[0] - sw / 2)
  const h = Math.max(0, size[1] - sw / 2)
  const r = style.borderRadius ?? 0

  // When borderRadius > 0 or solid, use a <rect> with rx/ry instead of line segments
  const useRect = r > 0 || style.dash === 'solid'

  const { strokeDasharray, strokeDashoffset } = Utils.getPerfectDashProps(
    2 * (w + h),
    strokeWidth * 1.618,
    style.dash
  )

  return (
    <>
      {defs}
      <rect
        className={isSelected || style.isFilled ? 'tv-fill-hitarea' : 'tv-stroke-hitarea'}
        x={sw / 2}
        y={sw / 2}
        width={w}
        height={h}
        rx={r}
        ry={r}
        strokeWidth={BINDING_DISTANCE}
      />
      {style.isFilled && (
        <rect
          x={sw / 2}
          y={sw / 2}
          width={w}
          height={h}
          rx={r}
          ry={r}
          fill={activeFill}
          pointerEvents="none"
        />
      )}
      {useRect ? (
        <rect
          x={sw / 2}
          y={sw / 2}
          width={w}
          height={h}
          rx={r}
          ry={r}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          pointerEvents="none"
          strokeLinecap="round"
        />
      ) : (
        <g pointerEvents="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
          {[
            [[sw / 2, sw / 2], [w, sw / 2], w - sw / 2],
            [[w, sw / 2], [w, h], h - sw / 2],
            [[w, h], [sw / 2, h], w - sw / 2],
            [[sw / 2, h], [sw / 2, sw / 2], h - sw / 2],
          ].map(([start, end, length], i) => {
            const dash = Utils.getPerfectDashProps(
              length as number,
              strokeWidth * 1.618,
              style.dash
            )
            return (
              <line
                key={id + '_' + i}
                x1={(start as number[])[0]}
                y1={(start as number[])[1]}
                x2={(end as number[])[0]}
                y2={(end as number[])[1]}
                strokeDasharray={dash.strokeDasharray}
                strokeDashoffset={dash.strokeDashoffset}
              />
            )
          })}
        </g>
      )}
    </>
  )
})
