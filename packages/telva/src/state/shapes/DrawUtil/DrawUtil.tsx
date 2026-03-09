import * as React from 'react'
import { SVGContainer, TLBounds, Utils } from 'telva-core'
import {
  intersectBoundsBounds,
  intersectBoundsPolyline,
  intersectLineSegmentBounds,
  intersectLineSegmentLineSegment,
} from 'telva-intersect'
import { Vec } from 'telva-vec'
import { GHOSTED_OPACITY } from '~constants'
import { useTelvaApp } from '~hooks'
import { TVShapeUtil } from '~state/shapes/TVShapeUtil'
import { defaultStyle, getShapeStyle } from '~state/shapes/shared'
import { useGradientFill } from '~state/shapes/shared/gradient-fill'
import { DashStyle, DrawShape, TVMeta, TVShapeType, TransformInfo } from '~types'
import {
  getDrawStrokePathTDSnapshot,
  getFillPath,
  getSolidStrokePathTDSnapshot,
  getStraightFillPath,
  getStraightStrokePath,
} from './drawHelpers'

type T = DrawShape
type E = SVGSVGElement

export class DrawUtil extends TVShapeUtil<T, E> {
  type = TVShapeType.Draw as const

  pointsBoundsCache = new WeakMap<T['points'], TLBounds>([])

  shapeBoundsCache = new Map<string, TLBounds>()

  rotatedCache = new WeakMap<T, number[][]>([])

  pointCache: Record<string, number[]> = {}

  canClone = true

  getShape = (props: Partial<T>): T => {
    return Utils.deepMerge<T>(
      {
        id: 'id',
        type: TVShapeType.Draw,
        name: 'Draw',
        parentId: 'page',
        childIndex: 1,
        point: [0, 0],
        rotation: 0,
        style: defaultStyle,
        points: [],
        isComplete: false,
      },
      props
    )
  }

  Component = TVShapeUtil.Component<T, E, TVMeta>(
    ({ shape, meta, isSelected, isGhost, events }, ref) => {
      const { points, style, isComplete } = shape
      const isStraight = meta.canvasMode === 'straight'
      const isNodeEditing = meta.nodeEditingId === shape.id

      // ── All hooks must be called before any conditional return ──
      const app = useTelvaApp()
      const dragRef = React.useRef<{ nodeIdx: number } | null>(null)
      const [hoveredNode, setHoveredNode] = React.useState<number | null>(null)

      const screenToLocal = React.useCallback(
        (clientX: number, clientY: number) => {
          return Vec.sub(app.getPagePoint([clientX, clientY]), shape.point)
        },
        [app, shape.point]
      )

      const commitNodeMove = React.useCallback(
        (newPts: number[][]) => {
          if (newPts.length === 0) return
          const minX = Math.min(...newPts.map((p) => p[0]))
          const minY = Math.min(...newPts.map((p) => p[1]))
          const normalized = newPts.map(([x, y, pr]) => [
            +((x - minX) as number).toFixed(2),
            +((y - minY) as number).toFixed(2),
            pr ?? 0.5,
          ])
          const newShapePoint = Vec.add(shape.point, [minX, minY])
          app.updateShapes({ id: shape.id, point: newShapePoint, points: normalized })
        },
        [app, shape.id, shape.point]
      )

      const polygonPathTDSnapshot = React.useMemo(() => {
        if (isStraight) return getStraightFillPath(shape)
        return getFillPath(shape)
      }, [points, style.size, isStraight, (style as any).strokeWidthOverride])

      const pathTDSnapshot = React.useMemo(() => {
        if (isStraight) {
          return getStraightStrokePath(shape)
        }
        return style.dash === DashStyle.Draw
          ? getDrawStrokePathTDSnapshot(shape)
          : getSolidStrokePathTDSnapshot(shape)
      }, [
        points,
        style.size,
        style.dash,
        isComplete,
        isStraight,
        (style as any).strokeWidthOverride,
      ])

      const styles = getShapeStyle(style, meta.isDarkMode)
      const { stroke, fill, strokeWidth, opacity: shapeOpacity } = styles
      const { defs, gradFill } = useGradientFill(shape.id, style)
      const activeFill = gradFill ?? fill

      // ── Node editing overlay ──
      const zoom = app.zoom ?? 1
      const nodeOverlay = React.useMemo(() => {
        if (!isNodeEditing || points.length < 1) return null

        const r = 5 / zoom
        const rmid = 3.5 / zoom

        const nodeHandles = points.map((pt: number[], i: number) => (
          <circle
            key={`n-${i}`}
            cx={pt[0]}
            cy={pt[1]}
            r={hoveredNode === i ? r * 1.4 : r}
            fill={hoveredNode === i ? '#0D99FF' : 'white'}
            stroke="#0D99FF"
            strokeWidth={1.5 / zoom}
            style={{ cursor: 'move', pointerEvents: 'all' }}
            onPointerEnter={() => setHoveredNode(i)}
            onPointerLeave={() => setHoveredNode(null)}
            onPointerDown={(e) => {
              e.stopPropagation()
              ;(e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId)
              dragRef.current = { nodeIdx: i }
            }}
            onPointerMove={(e) => {
              if (!dragRef.current || dragRef.current.nodeIdx !== i) return
              e.stopPropagation()
              const local = screenToLocal(e.clientX, e.clientY)
              const np = [...points]
              np[i] = [local[0], local[1], points[i][2] ?? 0.5]
              app.patchState({
                document: {
                  pages: {
                    [app.currentPageId]: {
                      shapes: { [shape.id]: { points: np } },
                    },
                  },
                },
              })
            }}
            onPointerUp={(e) => {
              if (!dragRef.current) return
              e.stopPropagation()
              const local = screenToLocal(e.clientX, e.clientY)
              const np = [...points]
              np[i] = [local[0], local[1], points[i][2] ?? 0.5]
              dragRef.current = null
              commitNodeMove(np)
            }}
          />
        ))

        const midHandles = points.slice(0, -1).map((pt: number[], i: number) => {
          const next = points[i + 1]
          const mx = (pt[0] + next[0]) / 2
          const my = (pt[1] + next[1]) / 2
          return (
            <circle
              key={`m-${i}`}
              cx={mx}
              cy={my}
              r={rmid}
              fill="white"
              stroke="#0D99FF"
              strokeWidth={1 / zoom}
              strokeDasharray={`${2 / zoom} ${2 / zoom}`}
              style={{ cursor: 'crosshair', pointerEvents: 'all' }}
              onPointerDown={(e) => {
                e.stopPropagation()
                const newPt: number[] = [mx, my, 0.5]
                const np = [...points.slice(0, i + 1), newPt, ...points.slice(i + 1)]
                app.updateShapes({ id: shape.id, points: np })
              }}
            />
          )
        })

        return (
          <g style={{ pointerEvents: 'none' }}>
            {/* connector lines */}
            {points.slice(0, -1).map((pt: number[], i: number) => (
              <line
                key={`l-${i}`}
                x1={pt[0]}
                y1={pt[1]}
                x2={points[i + 1][0]}
                y2={points[i + 1][1]}
                stroke="#0D99FF"
                strokeWidth={1 / zoom}
                strokeOpacity={0.4}
                pointerEvents="none"
              />
            ))}
            {midHandles}
            {nodeHandles}
          </g>
        )
      }, [isNodeEditing, points, zoom, hoveredNode, shape.id, app.currentPageId])

      // ── Render ──
      const bounds = this.getBounds(shape)
      const verySmall = bounds.width <= strokeWidth / 2 && bounds.height <= strokeWidth / 2

      if (verySmall) {
        const sw = 1 + strokeWidth
        return (
          <SVGContainer ref={ref} id={shape.id + '_svg'} {...events}>
            {defs}
            <circle
              r={sw}
              fill={stroke}
              stroke={stroke}
              pointerEvents="all"
              opacity={isGhost ? GHOSTED_OPACITY : shapeOpacity}
            />
          </SVGContainer>
        )
      }

      const shouldFill =
        style.isFilled &&
        points.length > 3 &&
        Vec.dist(points[0], points[points.length - 1]) < strokeWidth * 2

      const svgOverflowStyle = isNodeEditing ? { overflow: 'visible' as const } : undefined

      if (!isStraight && shape.style.dash === DashStyle.Draw) {
        return (
          <SVGContainer ref={ref} id={shape.id + '_svg'} {...events} style={svgOverflowStyle}>
            {defs}
            <g opacity={isGhost ? GHOSTED_OPACITY : shapeOpacity}>
              <path
                className={shouldFill || isSelected ? 'tv-fill-hitarea' : 'tv-stroke-hitarea'}
                d={pathTDSnapshot}
              />
              {shouldFill && (
                <path
                  d={polygonPathTDSnapshot}
                  stroke="none"
                  fill={activeFill}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  pointerEvents="none"
                />
              )}
              <path
                d={pathTDSnapshot}
                fill={stroke}
                stroke={stroke}
                strokeWidth={strokeWidth / 2}
                strokeLinejoin="round"
                strokeLinecap="round"
                pointerEvents="none"
              />
            </g>
            {nodeOverlay}
          </SVGContainer>
        )
      }

      const strokeDasharray = isStraight
        ? 'none'
        : {
            [DashStyle.Draw]: 'none',
            [DashStyle.Solid]: `none`,
            [DashStyle.Dotted]: `0.1 ${strokeWidth * 4}`,
            [DashStyle.Dashed]: `${strokeWidth * 4} ${strokeWidth * 4}`,
          }[style.dash as DashStyle]

      const strokeDashoffset = isStraight
        ? 'none'
        : {
            [DashStyle.Draw]: 'none',
            [DashStyle.Solid]: `none`,
            [DashStyle.Dotted]: `0`,
            [DashStyle.Dashed]: `0`,
          }[style.dash as DashStyle]

      const sw = 1 + strokeWidth * 1.5

      return (
        <SVGContainer ref={ref} id={shape.id + '_svg'} {...events} style={svgOverflowStyle}>
          {defs}
          <g opacity={isGhost ? GHOSTED_OPACITY : shapeOpacity}>
            <path
              className={shouldFill && isSelected ? 'tv-fill-hitarea' : 'tv-stroke-hitarea'}
              d={pathTDSnapshot}
            />
            <path
              d={pathTDSnapshot}
              fill={shouldFill ? activeFill : 'none'}
              stroke="none"
              strokeWidth={Math.min(4, strokeWidth * 2)}
              strokeLinejoin={isStraight ? 'miter' : 'round'}
              strokeLinecap={isStraight ? 'square' : 'round'}
              pointerEvents="none"
            />
            <path
              d={pathTDSnapshot}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinejoin={isStraight ? 'miter' : 'round'}
              strokeLinecap={isStraight ? 'square' : 'round'}
              pointerEvents="none"
            />
          </g>
          {nodeOverlay}
        </SVGContainer>
      )
    }
  )

  Indicator = TVShapeUtil.Indicator<T>(({ shape }) => {
    const { points } = shape

    const pathTDSnapshot = React.useMemo(() => {
      return getSolidStrokePathTDSnapshot(shape)
    }, [points, shape.style.size, shape.style.strokeWidthOverride])

    const bounds = this.getBounds(shape)

    const verySmall = bounds.width < 4 && bounds.height < 4

    if (verySmall) {
      return <circle x={bounds.width / 2} y={bounds.height / 2} r={1} />
    }

    return <path d={pathTDSnapshot} />
  })

  transform = (
    shape: T,
    bounds: TLBounds,
    { initialShape, scaleX, scaleY }: TransformInfo<T>
  ): Partial<T> => {
    const initialShapeBounds = Utils.getFromCache(this.boundsCache, initialShape, () =>
      Utils.getBoundsFromPoints(initialShape.points)
    )

    const points = initialShape.points.map(([x, y, r]) => {
      return [
        bounds.width *
          (scaleX < 0 // * sin?
            ? 1 - x / initialShapeBounds.width
            : x / initialShapeBounds.width),
        bounds.height *
          (scaleY < 0 // * cos?
            ? 1 - y / initialShapeBounds.height
            : y / initialShapeBounds.height),
        r,
      ]
    })

    const newBounds = Utils.getBoundsFromPoints(shape.points)

    const point = Vec.sub([bounds.minX, bounds.minY], [newBounds.minX, newBounds.minY])

    return {
      points,
      point,
    }
  }

  getBounds = (shape: T) => {
    // The goal here is to avoid recalculating the bounds from the
    // points array, which is expensive. However, we still need a
    // new bounds if the point has changed, but we will reuse the
    // previous bounds-from-points result if we can.

    const pointsHaveChanged = !this.pointsBoundsCache.has(shape.points)
    const pointHasChanged = !(this.pointCache[shape.id] === shape.point)

    if (pointsHaveChanged) {
      // If the points have changed, then bust the points cache
      const bounds = Utils.getBoundsFromPoints(shape.points)
      this.pointsBoundsCache.set(shape.points, bounds)
      this.shapeBoundsCache.set(shape.id, Utils.translateBounds(bounds, shape.point))
      this.pointCache[shape.id] = shape.point
    } else if (pointHasChanged && !pointsHaveChanged) {
      // If the point have has changed, then bust the point cache
      this.pointCache[shape.id] = shape.point
      this.shapeBoundsCache.set(
        shape.id,
        Utils.translateBounds(this.pointsBoundsCache.get(shape.points)!, shape.point)
      )
    }

    return this.shapeBoundsCache.get(shape.id)!
  }

  shouldRender = (prev: T, next: T) => {
    return (
      next.points !== prev.points ||
      next.style !== prev.style ||
      next.isComplete !== prev.isComplete
    )
  }

  hitTestPoint = (shape: T, point: number[]) => {
    const ptA = Vec.sub(point, shape.point)
    return Utils.pointInPolyline(ptA, shape.points)
  }

  hitTestLineSegment = (shape: T, A: number[], B: number[]): boolean => {
    const { points, point } = shape
    const ptA = Vec.sub(A, point)
    const ptB = Vec.sub(B, point)
    const bounds = this.getBounds(shape)

    if (bounds.width < 8 && bounds.height < 8) {
      return Vec.distanceToLineSegment(A, B, Utils.getBoundsCenter(bounds)) < 5 // divide by zoom
    }

    if (intersectLineSegmentBounds(ptA, ptB, bounds)) {
      for (let i = 1; i < points.length; i++) {
        if (intersectLineSegmentLineSegment(points[i - 1], points[i], ptA, ptB).didIntersect) {
          return true
        }
      }
    }

    return false
  }

  hitTestBounds = (shape: T, bounds: TLBounds) => {
    // Test axis-aligned shape
    if (!shape.rotation) {
      const shapeBounds = this.getBounds(shape)

      return (
        Utils.boundsContain(bounds, shapeBounds) ||
        ((Utils.boundsContain(shapeBounds, bounds) ||
          intersectBoundsBounds(shapeBounds, bounds).length > 0) &&
          intersectBoundsPolyline(Utils.translateBounds(bounds, Vec.neg(shape.point)), shape.points)
            .length > 0)
      )
    }

    // Test rotated shape
    const rBounds = this.getRotatedBounds(shape)

    const rotatedBounds = Utils.getFromCache(this.rotatedCache, shape, () => {
      const c = Utils.getBoundsCenter(Utils.getBoundsFromPoints(shape.points))
      return shape.points.map((pt) => Vec.rotWith(pt, c, shape.rotation || 0))
    })

    return (
      Utils.boundsContain(bounds, rBounds) ||
      intersectBoundsPolyline(Utils.translateBounds(bounds, Vec.neg(shape.point)), rotatedBounds)
        .length > 0
    )
  }
}
