import type { TLBounds, TLShape } from 'telva-core'
import Vec from 'telva-vec'

/**
 * Transform a single rectangular shape.
 * @param shape
 * @param bounds
 */
export function transformSingleRectangle<T extends TLShape & { size: number[] }>(
  shape: T,
  bounds: TLBounds
) {
  return {
    size: Vec.toFixed([bounds.width, bounds.height]),
    point: Vec.toFixed([bounds.minX, bounds.minY]),
  }
}
