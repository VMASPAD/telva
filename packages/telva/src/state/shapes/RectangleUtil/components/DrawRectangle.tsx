import * as React from 'react'
import { getShapeStyle, useGradientFill } from '~state/shapes/shared'
import type { ShapeStyles } from '~types'
import { getRectangleIndicatorPathTDSnapshot, getRectanglePath } from '../rectangleHelpers'

interface RectangleSvgProps {
  id: string
  style: ShapeStyles
  isSelected: boolean
  isDarkMode: boolean
  size: number[]
}

export const DrawRectangle = React.memo(function DrawRectangle({
  id,
  style,
  size,
  isSelected,
  isDarkMode,
}: RectangleSvgProps) {
  const { isFilled } = style
  const { stroke, strokeWidth, fill } = getShapeStyle(style, isDarkMode)
  const { defs, gradFill } = useGradientFill(id, style)
  const activeFill = gradFill ?? fill
  const pathTDSnapshot = getRectanglePath(id, style, size)
  const innerPath = getRectangleIndicatorPathTDSnapshot(id, style, size)

  return (
    <>
      {defs}
      <path
        className={style.isFilled || isSelected ? 'tv-fill-hitarea' : 'tv-stroke-hitarea'}
        d={innerPath}
      />
      {isFilled && <path d={innerPath} fill={activeFill} pointerEvents="none" />}
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
