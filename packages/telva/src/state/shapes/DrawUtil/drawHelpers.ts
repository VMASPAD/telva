import {
  StrokeOptions,
  StrokePoint,
  getStrokeOutlinePoints,
  getStrokePoints,
} from 'perfect-freehand'
import { Utils } from 'telva-core'
import Vec from 'telva-vec'
import { getShapeStyle } from '~state/shapes/shared'
import type { DrawShape } from '~types'

const simulatePressureSettings: StrokeOptions = {
  easing: (t) => Math.sin((t * Math.PI) / 2),
  simulatePressure: true,
}

const realPressureSettings: StrokeOptions = {
  easing: (t) => t * t,
  simulatePressure: false,
}

export function getFreehandOptions(shape: DrawShape) {
  const styles = getShapeStyle(shape.style)

  const options: StrokeOptions = {
    size: 1 + styles.strokeWidth * 1.5,
    thinning: 0.7,
    streamline: 0.35,
    smoothing: 0.5,
    ...(shape.points[1][2] === 0.5 ? simulatePressureSettings : realPressureSettings),
    last: shape.isComplete,
  }

  return options
}

export function getFillPath(shape: DrawShape) {
  if (shape.points.length < 2) return ''

  return Utils.getSvgPathFromStroke(
    getStrokePoints(shape.points, getFreehandOptions(shape)).map((pt) => pt.point)
  )
}

export function getDrawStrokePoints(shape: DrawShape, options: StrokeOptions) {
  return getStrokePoints(shape.points, options)
}

/**
 * Get path data for a stroke with the DashStyle.Draw dash style.
 */
export function getDrawStrokePathTDSnapshot(shape: DrawShape) {
  if (shape.points.length < 2) return ''
  const options = getFreehandOptions(shape)
  const strokePoints = getDrawStrokePoints(shape, options)
  const path = Utils.getSvgPathFromStroke(getStrokeOutlinePoints(strokePoints, options))
  return path
}

/**
 * Get SVG path data for a shape that has a DashStyle other than DashStyles.Draw.
 */
export function getSolidStrokePathTDSnapshot(shape: DrawShape) {
  const { points } = shape
  if (points.length < 2) return 'M 0 0 L 0 0'
  const options = getFreehandOptions(shape)
  const strokePoints = getDrawStrokePoints(shape, options)
  const last = points[points.length - 1]
  if (!Vec.isEqual(strokePoints[0].point, last)) strokePoints.push({ point: last } as StrokePoint)
  const path = Utils.getSvgPathFromStrokePoints(strokePoints)
  return path
}

/**
 * Get SVG path data for straight-line mode.
 * Simplifies the freehand points into clean line segments.
 */
export function getStraightStrokePath(shape: DrawShape) {
  const { points } = shape
  if (points.length < 2) return 'M 0 0 L 0 0'

  // Simplify the points using Ramer-Douglas-Peucker algorithm
  const simplified = simplifyPoints(points, 3)

  if (simplified.length < 2) {
    return `M ${points[0][0]} ${points[0][1]} L ${points[points.length - 1][0]} ${
      points[points.length - 1][1]
    }`
  }

  let path = `M ${simplified[0][0].toFixed(2)} ${simplified[0][1].toFixed(2)}`
  for (let i = 1; i < simplified.length; i++) {
    path += ` L ${simplified[i][0].toFixed(2)} ${simplified[i][1].toFixed(2)}`
  }

  return path
}

/**
 * Get fill path for straight mode.
 */
export function getStraightFillPath(shape: DrawShape) {
  const { points } = shape
  if (points.length < 3) return ''

  const simplified = simplifyPoints(points, 3)
  if (simplified.length < 3) return ''

  let path = `M ${simplified[0][0].toFixed(2)} ${simplified[0][1].toFixed(2)}`
  for (let i = 1; i < simplified.length; i++) {
    path += ` L ${simplified[i][0].toFixed(2)} ${simplified[i][1].toFixed(2)}`
  }
  path += ' Z'

  return path
}

/**
 * Ramer-Douglas-Peucker line simplification.
 */
export function simplifyPoints(points: number[][], tolerance: number): number[][] {
  if (points.length <= 2) return points

  let maxDist = 0
  let maxIndex = 0

  const first = points[0]
  const last = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last)
    if (dist > maxDist) {
      maxDist = dist
      maxIndex = i
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPoints(points.slice(0, maxIndex + 1), tolerance)
    const right = simplifyPoints(points.slice(maxIndex), tolerance)
    return [...left.slice(0, -1), ...right]
  }

  return [first, last]
}

function perpendicularDistance(point: number[], lineStart: number[], lineEnd: number[]): number {
  const dx = lineEnd[0] - lineStart[0]
  const dy = lineEnd[1] - lineStart[1]
  const mag = Math.sqrt(dx * dx + dy * dy)
  if (mag === 0) return Vec.dist(point, lineStart)
  const u = ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (mag * mag)
  const closest = [lineStart[0] + u * dx, lineStart[1] + u * dy]
  return Vec.dist(point, closest)
}
