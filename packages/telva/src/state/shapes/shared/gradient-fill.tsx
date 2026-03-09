import * as React from 'react'
import type { ShapeStyles } from '~types'

/**
 * Returns SVG <defs> element for a gradient defined in style.gradient,
 * and an SVG fill string to reference it.
 */
export function useGradientFill(
  id: string,
  style: ShapeStyles
): { defs: React.ReactElement | null; gradFill: string | null } {
  const g = style.gradient
  if (!g || !style.isFilled || !g.stops || g.stops.length < 2) {
    return { defs: null, gradFill: null }
  }

  const gradId = `grad-${id}`

  const stops = g.stops.map((s, i) => (
    <stop key={i} offset={`${s.position}%`} stopColor={s.color} stopOpacity={s.opacity} />
  ))

  if (g.type === 'linear') {
    const angleDeg = g.angle ?? 90
    // Convert angle to SVG x1/y1 x2/y2 coordinates
    const rad = ((angleDeg - 90) * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const x1 = 50 - cos * 50
    const y1 = 50 - sin * 50
    const x2 = 50 + cos * 50
    const y2 = 50 + sin * 50
    const defs = (
      <defs>
        <linearGradient
          id={gradId}
          x1={`${x1}%`}
          y1={`${y1}%`}
          x2={`${x2}%`}
          y2={`${y2}%`}
          gradientUnits="objectBoundingBox"
        >
          {stops}
        </linearGradient>
      </defs>
    )
    return { defs, gradFill: `url(#${gradId})` }
  }

  if (g.type === 'radial') {
    const cx = (g.centerX ?? 50) / 100
    const cy = (g.centerY ?? 50) / 100
    const defs = (
      <defs>
        <radialGradient id={gradId} cx={cx} cy={cy} r="0.5" gradientUnits="objectBoundingBox">
          {stops}
        </radialGradient>
      </defs>
    )
    return { defs, gradFill: `url(#${gradId})` }
  }

  // 'conic' / 'diamond' – approximate as linear
  const defs = (
    <defs>
      <linearGradient
        id={gradId}
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
        gradientUnits="objectBoundingBox"
      >
        {stops}
      </linearGradient>
    </defs>
  )
  return { defs, gradFill: `url(#${gradId})` }
}
