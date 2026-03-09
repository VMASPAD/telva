import * as React from 'react'
import { SVGContainer, TLBounds, Utils } from 'telva-core'
import {
  intersectBoundsPolygon,
  intersectLineSegmentPolyline,
  intersectRayLineSegment,
} from 'telva-intersect'
import Vec from 'telva-vec'
import { BINDING_DISTANCE, GHOSTED_OPACITY, LABEL_POINT } from '~constants'
import { useTelvaApp } from '~hooks'
import { TVShapeUtil } from '~state/shapes/TVShapeUtil'
import {
  TextLabel,
  defaultStyle,
  getBoundsRectangle,
  getFontStyle,
  getShapeStyle,
  transformRectangle,
  transformSingleRectangle,
} from '~state/shapes/shared'
import { styled } from '~styles'
import { DashStyle, TVMeta, TVShape, TVShapeType, TriangleShape } from '~types'
import { DashedTriangle } from './components/DashedTriangle'
import { DrawTriangle } from './components/DrawTriangle'
import { TriangleBindingIndicator } from './components/TriangleBindingIndicator'
import { getTriangleCentroid, getTrianglePoints } from './triangleHelpers'

type T = TriangleShape
type E = HTMLDivElement

export class TriangleUtil extends TVShapeUtil<T, E> {
  type = TVShapeType.Triangle as const

  canBind = true

  canClone = true

  canEdit = true

  getShape = (props: Partial<T>): T => {
    return Utils.deepMerge<T>(
      {
        id: 'id',
        type: TVShapeType.Triangle,
        name: 'Triangle',
        parentId: 'page',
        childIndex: 1,
        point: [0, 0],
        size: [1, 1],
        rotation: 0,
        style: defaultStyle,
        label: '',
        labelPoint: [0.5, 0.5],
      },
      props
    )
  }

  Component = TVShapeUtil.Component<T, E, TVMeta>(
    (
      {
        shape,
        bounds,
        isBinding,
        isEditing,
        isSelected,
        isGhost,
        meta,
        events,
        onShapeChange,
        onShapeBlur,
      },
      ref
    ) => {
      const { id, label = '', size, style, labelPoint = LABEL_POINT } = shape
      const font = getFontStyle(style)
      const styles = getShapeStyle(style, meta.isDarkMode)
      const isStraight = meta.canvasMode === 'straight'
      const Component = !isStraight && style.dash === DashStyle.Draw ? DrawTriangle : DashedTriangle
      const handleLabelChange = React.useCallback(
        (label: string) => onShapeChange?.({ id, label }),
        [onShapeChange]
      )
      const offsetY = React.useMemo(() => {
        const center = Vec.div(size, 2)
        const centroid = getTriangleCentroid(size)
        return (centroid[1] - center[1]) * 0.72
      }, [size])

      // ── Node editing ──
      const isNodeEditing = meta.nodeEditingId === shape.id
      const app = useTelvaApp()
      const dragRef = React.useRef<{ nodeIdx: number; fixedPage: number[] } | null>(null)
      const [hoveredNode, setHoveredNode] = React.useState<number | null>(null)
      const zoom = app.zoom ?? 1

      const nodeOverlay = React.useMemo(() => {
        if (!isNodeEditing) return null
        const [w, h] = size
        const corners: number[][] = [
          [0, 0],
          [w, 0],
          [w, h],
          [0, h],
        ]
        const opposites = [2, 3, 0, 1]
        const r = 5 / zoom
        const lw = 1 / zoom

        // Also draw the triangle vertices for visual reference
        const verts = getTrianglePoints(size)

        return (
          <g>
            {/* Triangle edges (visual guide) */}
            {verts.map((v: number[], vi: number) => {
              const next = verts[(vi + 1) % verts.length]
              return (
                <line
                  key={`tl-${vi}`}
                  x1={v[0]}
                  y1={v[1]}
                  x2={next[0]}
                  y2={next[1]}
                  stroke="#0D99FF"
                  strokeWidth={lw}
                  strokeOpacity={0.3}
                  pointerEvents="none"
                />
              )
            })}
            {/* Corner resize nodes */}
            {corners.map(([cx, cy], ci) => (
              <circle
                key={`cn-${ci}`}
                cx={cx}
                cy={cy}
                r={hoveredNode === ci ? r * 1.4 : r}
                fill={hoveredNode === ci ? '#0D99FF' : 'white'}
                stroke="#0D99FF"
                strokeWidth={1.5 / zoom}
                style={{ cursor: 'nwse-resize' }}
                onPointerEnter={() => setHoveredNode(ci)}
                onPointerLeave={() => setHoveredNode(null)}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  ;(e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId)
                  const fixedLocal = corners[opposites[ci]]
                  dragRef.current = {
                    nodeIdx: ci,
                    fixedPage: Vec.add(shape.point, fixedLocal),
                  }
                }}
                onPointerMove={(e) => {
                  if (!dragRef.current || dragRef.current.nodeIdx !== ci) return
                  e.stopPropagation()
                  const pp = app.getPagePoint([e.clientX, e.clientY])
                  const fp = dragRef.current.fixedPage
                  const x0 = Math.min(pp[0], fp[0]),
                    y0 = Math.min(pp[1], fp[1])
                  const x1 = Math.max(pp[0], fp[0]),
                    y1 = Math.max(pp[1], fp[1])
                  app.patchState({
                    document: {
                      pages: {
                        [app.currentPageId]: {
                          shapes: {
                            [shape.id]: {
                              point: [x0, y0],
                              size: [Math.max(1, x1 - x0), Math.max(1, y1 - y0)],
                            },
                          },
                        },
                      },
                    },
                  })
                }}
                onPointerUp={(e) => {
                  if (!dragRef.current) return
                  e.stopPropagation()
                  const pp = app.getPagePoint([e.clientX, e.clientY])
                  const fp = dragRef.current.fixedPage
                  const x0 = Math.min(pp[0], fp[0]),
                    y0 = Math.min(pp[1], fp[1])
                  const x1 = Math.max(pp[0], fp[0]),
                    y1 = Math.max(pp[1], fp[1])
                  dragRef.current = null
                  app.updateShapes({
                    id: shape.id,
                    point: [x0, y0],
                    size: [Math.max(1, x1 - x0), Math.max(1, y1 - y0)],
                  })
                }}
              />
            ))}
          </g>
        )
      }, [isNodeEditing, size, zoom, hoveredNode, shape.id, shape.point, app])

      const svgOverflow = isNodeEditing ? { overflow: 'visible' as const } : undefined

      return (
        <FullWrapper ref={ref} {...events}>
          <TextLabel
            font={font}
            text={label}
            color={style.labelColor ?? styles.stroke}
            background={style.labelBackground}
            textGradient={style.textGradient}
            offsetX={(labelPoint[0] - 0.5) * bounds.width}
            offsetY={offsetY + (labelPoint[1] - 0.5) * bounds.height}
            width={Math.max(0, bounds.width * 0.5 - 16)}
            isEditing={isEditing}
            onChange={handleLabelChange}
            onBlur={onShapeBlur}
          />
          <SVGContainer
            id={shape.id + '_svg'}
            opacity={isGhost ? GHOSTED_OPACITY : styles.opacity}
            style={svgOverflow}
          >
            {isBinding && <TriangleBindingIndicator size={size} />}
            <Component
              id={id}
              style={style}
              size={size}
              isSelected={isSelected}
              isDarkMode={meta.isDarkMode}
            />
            {nodeOverlay}
          </SVGContainer>
        </FullWrapper>
      )
    }
  )

  Indicator = TVShapeUtil.Indicator<T>(({ shape }) => {
    const { size } = shape
    return <polygon points={getTrianglePoints(size).join()} />
  })

  private getPoints(shape: T) {
    const {
      rotation = 0,
      point: [x, y],
      size: [w, h],
    } = shape
    return [
      [x + w / 2, y],
      [x, y + h],
      [x + w, y + h],
    ].map((pt) => Vec.rotWith(pt, this.getCenter(shape), rotation))
  }

  shouldRender = (prev: T, next: T) => {
    return next.size !== prev.size || next.style !== prev.style || next.label !== prev.label
  }

  getBounds = (shape: T) => {
    return getBoundsRectangle(shape, this.boundsCache)
  }

  getExpandedBounds = (shape: T) => {
    return Utils.getBoundsFromPoints(
      getTrianglePoints(shape.size, this.bindingDistance).map((pt) => Vec.add(pt, shape.point))
    )
  }

  hitTestLineSegment = (shape: T, A: number[], B: number[]): boolean => {
    return intersectLineSegmentPolyline(A, B, this.getPoints(shape)).didIntersect
  }

  hitTestBounds = (shape: T, bounds: TLBounds): boolean => {
    return (
      Utils.boundsContained(this.getBounds(shape), bounds) ||
      intersectBoundsPolygon(bounds, this.getPoints(shape)).length > 0
    )
  }

  getBindingPoint = <K extends TVShape>(
    shape: T,
    fromShape: K,
    point: number[],
    origin: number[],
    direction: number[],
    bindAnywhere: boolean
  ) => {
    // Algorithm time! We need to find the binding point (a normalized point inside of the shape, or around the shape, where the arrow will point to) and the distance from the binding shape to the anchor.

    const expandedBounds = this.getExpandedBounds(shape)

    if (!Utils.pointInBounds(point, expandedBounds)) return

    const points = getTrianglePoints(shape.size).map((pt) => Vec.add(pt, shape.point))

    const expandedPoints = getTrianglePoints(shape.size, this.bindingDistance).map((pt) =>
      Vec.add(pt, shape.point)
    )

    const closestDistanceToEdge = Utils.pointsToLineSegments(points, true)
      .map(([a, b]) => Vec.distanceToLineSegment(a, b, point))
      .sort((a, b) => a - b)[0]

    if (
      !(Utils.pointInPolygon(point, expandedPoints) || closestDistanceToEdge < this.bindingDistance)
    )
      return

    const intersections = Utils.pointsToLineSegments(expandedPoints.concat([expandedPoints[0]]))
      .map((segment) => intersectRayLineSegment(origin, direction, segment[0], segment[1]))
      .filter((intersection) => intersection.didIntersect)
      .flatMap((intersection) => intersection.points)

    if (!intersections.length) return

    // The center of the triangle
    const center = Vec.add(getTriangleCentroid(shape.size), shape.point)

    // Find furthest intersection between ray from origin through point and expanded bounds. TODO: What if the shape has a curve? In that case, should we intersect the circle-from-three-points instead?
    const intersection = intersections.sort((a, b) => Vec.dist(b, origin) - Vec.dist(a, origin))[0]

    // The point between the handle and the intersection
    const middlePoint = Vec.med(point, intersection)

    let anchor: number[]
    let distance: number

    if (bindAnywhere) {
      anchor = Vec.dist(point, center) < BINDING_DISTANCE / 2 ? center : point
      distance = 0
    } else {
      if (Vec.distanceToLineSegment(point, middlePoint, center) < BINDING_DISTANCE / 2) {
        anchor = center
      } else {
        anchor = middlePoint
      }

      if (Utils.pointInPolygon(point, points)) {
        distance = this.bindingDistance
      } else {
        distance = Math.max(this.bindingDistance, closestDistanceToEdge)
      }
    }

    const bindingPoint = Vec.divV(Vec.sub(anchor, [expandedBounds.minX, expandedBounds.minY]), [
      expandedBounds.width,
      expandedBounds.height,
    ])

    return {
      point: Vec.clampV(bindingPoint, 0, 1),
      distance,
    }
  }

  transform = transformRectangle

  transformSingle = transformSingleRectangle
}

const FullWrapper = styled('div', { width: '100%', height: '100%' })
