import { Utils } from 'telva-core'
import type { PenSegment } from '~types'

const DEFAULT_CURVE_STEPS = 24

function cubicPointAt(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
  const mt = 1 - t
  const mt2 = mt * mt
  const t2 = t * t
  const a = mt2 * mt
  const b = 3 * mt2 * t
  const c = 3 * mt * t2
  const d = t2 * t

  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ]
}

function appendSegmentSamples(
  points: number[][],
  prev: PenSegment,
  curr: PenSegment,
  curveSteps: number
) {
  const c1 = prev.cp2 ?? prev.point
  const c2 = curr.cp1 ?? curr.point
  const hasHandles = prev.cp2 != null || curr.cp1 != null

  if (!hasHandles) {
    points.push(curr.point)
    return
  }

  const steps = Math.max(4, curveSteps)
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    points.push(cubicPointAt(prev.point, c1, c2, curr.point, t))
  }
}

/**
 * Approximate the pen path as a polyline in shape-local space.
 * Curved segments are sampled at regular intervals.
 */
export function getSegmentsPolyline(
  segments: PenSegment[],
  isClosed: boolean,
  curveSteps = DEFAULT_CURVE_STEPS
): number[][] {
  if (segments.length === 0) return []
  if (segments.length === 1) return [segments[0].point]

  const points: number[][] = [segments[0].point]

  for (let i = 1; i < segments.length; i++) {
    appendSegmentSamples(points, segments[i - 1], segments[i], curveSteps)
  }

  if (isClosed && segments.length > 2) {
    appendSegmentSamples(points, segments[segments.length - 1], segments[0], curveSteps)
  }

  return points
}

/**
 * Build SVG path `d` string from PenShape segments.
 * Uses cubic Bézier (C) when handles are present, else line (L).
 */
export function segmentsToPath(segments: PenSegment[], isClosed: boolean): string {
  if (segments.length === 0) return ''
  if (segments.length === 1) {
    const { point } = segments[0]
    return `M ${point[0]} ${point[1]}`
  }

  let d = `M ${segments[0].point[0].toFixed(2)} ${segments[0].point[1].toFixed(2)}`

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1]
    const curr = segments[i]
    const c1 = prev.cp2 ?? prev.point
    const c2 = curr.cp1 ?? curr.point
    const hasHandles = prev.cp2 != null || curr.cp1 != null
    if (hasHandles) {
      d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(
        2
      )} ${curr.point[0].toFixed(2)} ${curr.point[1].toFixed(2)}`
    } else {
      d += ` L ${curr.point[0].toFixed(2)} ${curr.point[1].toFixed(2)}`
    }
  }

  if (isClosed && segments.length > 2) {
    const prev = segments[segments.length - 1]
    const curr = segments[0]
    const c1 = prev.cp2 ?? prev.point
    const c2 = curr.cp1 ?? curr.point
    const hasHandles = prev.cp2 != null || curr.cp1 != null
    if (hasHandles) {
      d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(
        2
      )} ${curr.point[0].toFixed(2)} ${curr.point[1].toFixed(2)}`
    }
    d += ' Z'
  }

  return d
}

/**
 * Compute bounding box from the rendered path (with sampled Bézier curves).
 */
export function getSegmentsBounds(segments: PenSegment[], isClosed = false) {
  if (segments.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 }

  const pts = getSegmentsPolyline(segments, isClosed)
  if (pts.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 }

  return Utils.getBoundsFromPoints(pts)
}

/**
 * Normalize segments so bounding box top-left = (0, 0).
 * Returns normalized segments + the offset to add to shape.point.
 */
export function normalizeSegments(
  segments: PenSegment[],
  isClosed = false
): {
  segments: PenSegment[]
  offset: number[]
} {
  if (segments.length === 0) return { segments, offset: [0, 0] }
  const bounds = getSegmentsBounds(segments, isClosed)
  const offset = [bounds.minX, bounds.minY]
  const normalized = segments.map((s) => ({
    point: [s.point[0] - offset[0], s.point[1] - offset[1]],
    cp1: s.cp1 ? [s.cp1[0] - offset[0], s.cp1[1] - offset[1]] : undefined,
    cp2: s.cp2 ? [s.cp2[0] - offset[0], s.cp2[1] - offset[1]] : undefined,
  }))
  return { segments: normalized, offset }
}

/**
 * Return the symmetric opposite of a handle (for smooth bezier nodes).
 */
export function mirrorHandle(anchor: number[], handle: number[]): number[] {
  return [2 * anchor[0] - handle[0], 2 * anchor[1] - handle[1]]
}
