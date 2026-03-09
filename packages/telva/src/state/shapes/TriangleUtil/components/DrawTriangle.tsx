import * as React from 'react'
import { getShapeStyle, useGradientFill } from '~state/shapes/shared'
import type { ShapeStyles } from '~types'
import { getTriangleIndicatorPathTDSnapshot, getTrianglePath } from '../triangleHelpers'

interface TriangleSvgProps {
  id: string
  size: number[]
  style: ShapeStyles
  isSelected: boolean
  isDarkMode: boolean
}

export const DrawTriangle = React.memo(function DrawTriangle({
  id,
  size,
  style,
  isSelected,
  isDarkMode,
}: TriangleSvgProps) {
  const { stroke, strokeWidth, fill } = getShapeStyle(style, isDarkMode)
  const { defs, gradFill } = useGradientFill(id, style)
  const activeFill = gradFill ?? fill
  const pathTDSnapshot = getTrianglePath(id, size, style)
  const indicatorPath = getTriangleIndicatorPathTDSnapshot(id, size, style)
  return (
    <>
      {defs}
      <path
        className={style.isFilled || isSelected ? 'tv-fill-hitarea' : 'tv-stroke-hitarea'}
        d={indicatorPath}
      />
      {style.isFilled && <path d={indicatorPath} fill={activeFill} pointerEvents="none" />}
      <path
        d={pathTDSnapshot}
        fill={stroke}
        stroke={stroke}
        strokeWidth={strokeWidth}
        pointerEvents="none"
      />
    </>
  )
})
