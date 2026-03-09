import * as React from 'react'
import { Utils } from 'telva-core'
import { getShapeStyle, useGradientFill } from '~state/shapes/shared'
import type { ShapeStyles } from '~types'

interface EllipseSvgProps {
  id: string
  radius: number[]
  style: ShapeStyles
  isSelected: boolean
  isDarkMode: boolean
}

export const DashedEllipse = React.memo(function DashedEllipse({
  id,
  radius,
  style,
  isSelected,
  isDarkMode,
}: EllipseSvgProps) {
  const { stroke, strokeWidth, fill } = getShapeStyle(style, isDarkMode)
  const { defs, gradFill } = useGradientFill(id, style)
  const activeFill = gradFill ?? fill
  const sw = 1 + strokeWidth * 1.618
  const rx = Math.max(0, radius[0] - sw / 2)
  const ry = Math.max(0, radius[1] - sw / 2)
  const perimeter = Utils.perimeterOfEllipse(rx, ry)
  const { strokeDasharray, strokeDashoffset } = Utils.getPerfectDashProps(
    perimeter < 64 ? perimeter * 2 : perimeter,
    strokeWidth * 1.618,
    style.dash,
    4
  )

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
      <ellipse
        cx={radius[0]}
        cy={radius[1]}
        rx={rx}
        ry={ry}
        fill={activeFill}
        stroke={stroke}
        strokeWidth={sw}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        pointerEvents="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
})
