import * as React from 'react'
import { getShapeStyle, useGradientFill } from '~state/shapes/shared'
import type { ShapeStyles } from '~types'
import { getEllipseIndicatorPath, getEllipsePath } from '../ellipseHelpers'

interface EllipseSvgProps {
  id: string
  radius: number[]
  style: ShapeStyles
  isSelected: boolean
  isDarkMode: boolean
}

export const DrawEllipse = React.memo(function DrawEllipse({
  id,
  radius,
  style,
  isSelected,
  isDarkMode,
}: EllipseSvgProps) {
  const { stroke, strokeWidth, fill } = getShapeStyle(style, isDarkMode)
  const { defs, gradFill } = useGradientFill(id, style)
  const activeFill = gradFill ?? fill
  const innerPath = getEllipsePath(id, radius, style)

  return (
    <>
      {defs}
      <ellipse
        className={style.isFilled || isSelected ? 'tv-fill-hitarea' : 'tv-stroke-hitarea'}
        cx={radius[0]}
        cy={radius[1]}
        rx={radius[0]}
        ry={radius[1]}
      />
      {style.isFilled && (
        <path
          d={getEllipseIndicatorPath(id, radius, style)}
          stroke="none"
          fill={activeFill}
          pointerEvents="none"
        />
      )}
      <path
        d={innerPath}
        fill={stroke}
        stroke={stroke}
        strokeWidth={strokeWidth}
        pointerEvents="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
})
