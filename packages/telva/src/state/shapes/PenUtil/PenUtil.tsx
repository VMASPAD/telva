import * as React from 'react'
import { SVGContainer, TLBounds, Utils } from 'telva-core'
import { intersectBoundsPolyline, intersectLineSegmentLineSegment } from 'telva-intersect'
import { Vec } from 'telva-vec'
import { GHOSTED_OPACITY } from '~constants'
import { useTelvaApp } from '~hooks'
import { TVShapeUtil } from '~state/shapes/TVShapeUtil'
import { defaultStyle, getShapeStyle } from '~state/shapes/shared'
import { useGradientFill } from '~state/shapes/shared/gradient-fill'
import { DashStyle, PenSegment, PenShape, TVMeta, TVShapeType } from '~types'
import { getSegmentsBounds, getSegmentsPolyline, mirrorHandle, segmentsToPath } from './penHelpers'

type T = PenShape
type E = SVGSVGElement

// ─────────────────────────────────────────────────────────────────────────────
// Node editing drag state
// ─────────────────────────────────────────────────────────────────────────────
type DragTarget =
  | { kind: 'node'; idx: number }
  | { kind: 'cp1'; idx: number }
  | { kind: 'cp2'; idx: number }

export class PenUtil extends TVShapeUtil<T, E> {
  type = TVShapeType.Pen as const

  canClone = true

  pointsBoundsCache = new WeakMap<T['segments'], TLBounds>()
  shapeBoundsCache = new Map<string, TLBounds>()
  pointCache: Record<string, number[]> = {}

  getShape = (props: Partial<T>): T => {
    return Utils.deepMerge<T>(
      {
        id: 'id',
        type: TVShapeType.Pen,
        name: 'Pen',
        parentId: 'page',
        childIndex: 1,
        point: [0, 0],
        rotation: 0,
        style: defaultStyle,
        segments: [],
        isClosed: false,
        isComplete: false,
        previewPoint: undefined,
        isPlacingHandle: false,
      },
      props
    )
  }

  Component = TVShapeUtil.Component<T, E, TVMeta>(
    ({ shape, meta, isSelected, isGhost, events }, ref) => {
      const { segments, style, isClosed, isComplete, previewPoint, isPlacingHandle } = shape
      const isNodeEditing = meta.nodeEditingId === shape.id

      // ── Hooks (must be before any conditional returns) ──
      const app = useTelvaApp()
      const dragRef = React.useRef<DragTarget | null>(null)
      const [hoveredTarget, setHoveredTarget] = React.useState<string | null>(null)

      const screenToLocal = React.useCallback(
        (clientX: number, clientY: number) =>
          Vec.sub(app.getPagePoint([clientX, clientY]), shape.point),
        [app, shape.point]
      )

      const patchSegments = React.useCallback(
        (newSegs: PenSegment[]) => {
          app.patchState({
            document: {
              pages: {
                [app.currentPageId]: { shapes: { [shape.id]: { segments: newSegs } } },
              },
            },
          })
        },
        [app, shape.id]
      )

      const commitSegments = React.useCallback(
        (newSegs: PenSegment[]) => {
          // No normalization during node editing — shape.point stays fixed.
          // Normalization only happens in PenTool.finishShape / closePath.
          app.updateShapes({ id: shape.id, segments: newSegs })
        },
        [app, shape.id]
      )

      const styles = getShapeStyle(style, meta.isDarkMode)
      const { stroke, fill, strokeWidth, opacity: shapeOpacity } = styles
      const { defs, gradFill } = useGradientFill(shape.id, style)
      const activeFill = gradFill ?? fill

      const pathData = React.useMemo(() => segmentsToPath(segments, isClosed), [segments, isClosed])

      const zoom = app.zoom ?? 1

      // ── SVG stroking style ──
      const sw = 1 + strokeWidth * 1.5
      const strokeDasharray =
        {
          [DashStyle.Draw]: 'none',
          [DashStyle.Solid]: 'none',
          [DashStyle.Dotted]: `0.1 ${strokeWidth * 4}`,
          [DashStyle.Dashed]: `${strokeWidth * 4} ${strokeWidth * 4}`,
        }[style.dash as DashStyle] ?? 'none'

      const strokeDashoffset =
        {
          [DashStyle.Draw]: '0',
          [DashStyle.Solid]: '0',
          [DashStyle.Dotted]: '0',
          [DashStyle.Dashed]: '0',
        }[style.dash as DashStyle] ?? '0'

      // ── Node editing overlay ──
      const nodeOverlay = React.useMemo(() => {
        if (!isNodeEditing || segments.length === 0) return null

        const nodeR = 5 / zoom
        const handleR = 3.5 / zoom
        const lineW = 1 / zoom

        const nodeEls: React.ReactElement[] = []
        const handleEls: React.ReactElement[] = []
        const lineEls: React.ReactElement[] = []

        segments.forEach((seg: PenSegment, i: number) => {
          const [px, py] = seg.point

          // Incoming handle (cp1)
          if (seg.cp1) {
            const [hx, hy] = seg.cp1
            const hKey = `cp1-${i}`
            lineEls.push(
              <line
                key={`lcp1-${i}`}
                x1={px}
                y1={py}
                x2={hx}
                y2={hy}
                stroke="#0D99FF"
                strokeWidth={lineW}
                strokeOpacity={0.6}
                pointerEvents="none"
              />
            )
            handleEls.push(
              <circle
                key={hKey}
                cx={hx}
                cy={hy}
                r={hoveredTarget === hKey ? handleR * 1.4 : handleR}
                fill={hoveredTarget === hKey ? '#0D99FF' : 'white'}
                stroke="#0D99FF"
                strokeWidth={lineW}
                style={{ cursor: 'move' }}
                onPointerEnter={() => setHoveredTarget(hKey)}
                onPointerLeave={() => setHoveredTarget(null)}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  ;(e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId)
                  dragRef.current = { kind: 'cp1', idx: i }
                }}
                onPointerMove={(e) => {
                  if (
                    !dragRef.current ||
                    dragRef.current.kind !== 'cp1' ||
                    dragRef.current.idx !== i
                  )
                    return
                  e.stopPropagation()
                  const local = screenToLocal(e.clientX, e.clientY)
                  const ns = [...segments]
                  ns[i] = { ...ns[i], cp1: local }
                  patchSegments(ns)
                }}
                onPointerUp={(e) => {
                  if (!dragRef.current) return
                  e.stopPropagation()
                  const local = screenToLocal(e.clientX, e.clientY)
                  const ns = [...segments]
                  ns[i] = { ...ns[i], cp1: local }
                  dragRef.current = null
                  commitSegments(ns)
                }}
              />
            )
          }

          // Outgoing handle (cp2)
          if (seg.cp2) {
            const [hx, hy] = seg.cp2
            const hKey = `cp2-${i}`
            lineEls.push(
              <line
                key={`lcp2-${i}`}
                x1={px}
                y1={py}
                x2={hx}
                y2={hy}
                stroke="#0D99FF"
                strokeWidth={lineW}
                strokeOpacity={0.6}
                pointerEvents="none"
              />
            )
            handleEls.push(
              <circle
                key={hKey}
                cx={hx}
                cy={hy}
                r={hoveredTarget === hKey ? handleR * 1.4 : handleR}
                fill={hoveredTarget === hKey ? '#0D99FF' : 'white'}
                stroke="#0D99FF"
                strokeWidth={lineW}
                style={{ cursor: 'move' }}
                onPointerEnter={() => setHoveredTarget(hKey)}
                onPointerLeave={() => setHoveredTarget(null)}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  ;(e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId)
                  dragRef.current = { kind: 'cp2', idx: i }
                }}
                onPointerMove={(e) => {
                  if (
                    !dragRef.current ||
                    dragRef.current.kind !== 'cp2' ||
                    dragRef.current.idx !== i
                  )
                    return
                  e.stopPropagation()
                  const local = screenToLocal(e.clientX, e.clientY)
                  const ns = [...segments]
                  ns[i] = { ...ns[i], cp2: local }
                  // Mirror to cp1 of next segment for smooth node
                  if (i + 1 < ns.length) {
                    ns[i + 1] = { ...ns[i + 1], cp1: mirrorHandle(ns[i].point, local) }
                  }
                  patchSegments(ns)
                }}
                onPointerUp={(e) => {
                  if (!dragRef.current) return
                  e.stopPropagation()
                  const local = screenToLocal(e.clientX, e.clientY)
                  const ns = [...segments]
                  ns[i] = { ...ns[i], cp2: local }
                  if (i + 1 < ns.length) {
                    ns[i + 1] = { ...ns[i + 1], cp1: mirrorHandle(ns[i].point, local) }
                  }
                  dragRef.current = null
                  commitSegments(ns)
                }}
              />
            )
          }

          // Anchor node
          const nKey = `node-${i}`
          nodeEls.push(
            <circle
              key={nKey}
              cx={px}
              cy={py}
              r={hoveredTarget === nKey ? nodeR * 1.4 : nodeR}
              fill={hoveredTarget === nKey ? '#0D99FF' : 'white'}
              stroke="#0D99FF"
              strokeWidth={1.5 / zoom}
              style={{ cursor: 'move' }}
              onPointerEnter={() => setHoveredTarget(nKey)}
              onPointerLeave={() => setHoveredTarget(null)}
              onPointerDown={(e) => {
                e.stopPropagation()
                ;(e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId)
                dragRef.current = { kind: 'node', idx: i }
              }}
              onPointerMove={(e) => {
                if (
                  !dragRef.current ||
                  dragRef.current.kind !== 'node' ||
                  dragRef.current.idx !== i
                )
                  return
                e.stopPropagation()
                const local = screenToLocal(e.clientX, e.clientY)
                const prev = segments[i].point
                const delta = Vec.sub(local, prev)
                const ns = [...segments]
                ns[i] = {
                  ...ns[i],
                  point: local,
                  cp1: ns[i].cp1 ? Vec.add(ns[i].cp1!, delta) : undefined,
                  cp2: ns[i].cp2 ? Vec.add(ns[i].cp2!, delta) : undefined,
                }
                patchSegments(ns)
              }}
              onPointerUp={(e) => {
                if (!dragRef.current) return
                e.stopPropagation()
                const local = screenToLocal(e.clientX, e.clientY)
                const prev = segments[i].point
                const delta = Vec.sub(local, prev)
                const ns = [...segments]
                ns[i] = {
                  ...ns[i],
                  point: local,
                  cp1: ns[i].cp1 ? Vec.add(ns[i].cp1!, delta) : undefined,
                  cp2: ns[i].cp2 ? Vec.add(ns[i].cp2!, delta) : undefined,
                }
                dragRef.current = null
                commitSegments(ns)
              }}
            />
          )

          // Midpoint insertion
          if (i < segments.length - 1) {
            const next = segments[i + 1]
            const mx = (px + next.point[0]) / 2
            const my = (py + next.point[1]) / 2
            nodeEls.push(
              <circle
                key={`mid-${i}`}
                cx={mx}
                cy={my}
                r={handleR}
                fill="white"
                stroke="#0D99FF"
                strokeWidth={lineW}
                strokeDasharray={`${2 / zoom} ${2 / zoom}`}
                style={{ cursor: 'crosshair' }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  const newSeg: PenSegment = { point: [mx, my] }
                  const ns = [...segments.slice(0, i + 1), newSeg, ...segments.slice(i + 1)]
                  app.updateShapes({ id: shape.id, segments: ns })
                }}
              />
            )
          }
        })

        // Note: NO pointerEvents:none on outer <g> — individual non-interactive
        // elements use pointerEvents="none" attribute directly.
        return (
          <g>
            {lineEls}
            {handleEls}
            {nodeEls}
          </g>
        )
      }, [
        isNodeEditing,
        segments,
        zoom,
        hoveredTarget,
        shape.id,
        screenToLocal,
        patchSegments,
        commitSegments,
        app,
      ])

      // ── Render ──
      if (segments.length === 0) {
        return (
          <SVGContainer ref={ref} id={shape.id + '_svg'} {...events}>
            <circle r={4} fill={stroke} stroke={stroke} pointerEvents="all" />
          </SVGContainer>
        )
      }

      const svgOverflowStyle =
        isNodeEditing || !isComplete ? { overflow: 'visible' as const } : undefined

      return (
        <SVGContainer ref={ref} id={shape.id + '_svg'} {...events} style={svgOverflowStyle}>
          {defs}
          <g opacity={isGhost ? GHOSTED_OPACITY : shapeOpacity}>
            <path
              className={style.isFilled && isSelected ? 'tv-fill-hitarea' : 'tv-stroke-hitarea'}
              d={pathData}
            />
            {style.isFilled && isClosed && (
              <path d={pathData} fill={activeFill} stroke="none" pointerEvents="none" />
            )}
            <path
              d={pathData}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinejoin="round"
              strokeLinecap="round"
              pointerEvents="none"
            />
            {/* Live rubber-band preview: last anchor → cursor */}
            {!isComplete &&
              previewPoint &&
              segments.length > 0 &&
              (() => {
                const last = segments[segments.length - 1]
                let previewD: string
                if (isPlacingHandle && last.cp2) {
                  // Show tentative bezier curve from last anchor using current cp2
                  const [ax, ay] = last.point
                  const [c2x, c2y] = last.cp2
                  const [px, py] = previewPoint
                  previewD = `M ${ax} ${ay} C ${c2x} ${c2y} ${px} ${py} ${px} ${py}`
                } else {
                  const [ax, ay] = last.point
                  const [px, py] = previewPoint
                  previewD = `M ${ax} ${ay} L ${px} ${py}`
                }
                return (
                  <path
                    d={previewD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={sw * 0.8}
                    strokeDasharray={`${sw * 4} ${sw * 3}`}
                    strokeLinecap="round"
                    opacity={0.55}
                    pointerEvents="none"
                  />
                )
              })()}
            {/* Close-snap indicator: highlight first node when cursor is near it */}
            {!isComplete &&
              previewPoint &&
              segments.length >= 2 &&
              (() => {
                const first = segments[0]
                const dist = Math.hypot(
                  previewPoint[0] - first.point[0],
                  previewPoint[1] - first.point[1]
                )
                const snapLocalDist = 12 / zoom
                return dist <= snapLocalDist ? (
                  <circle
                    cx={first.point[0]}
                    cy={first.point[1]}
                    r={8 / zoom}
                    fill="none"
                    stroke="#0D99FF"
                    strokeWidth={1.5 / zoom}
                    opacity={0.8}
                    pointerEvents="none"
                  />
                ) : null
              })()}
            {/* Dot on last placed anchor while drawing */}
            {!isComplete && segments.length > 0 && (
              <circle
                cx={segments[segments.length - 1].point[0]}
                cy={segments[segments.length - 1].point[1]}
                r={4 / zoom}
                fill={stroke}
                stroke="none"
                pointerEvents="none"
              />
            )}
          </g>
          {nodeOverlay}
        </SVGContainer>
      )
    }
  )

  Indicator = TVShapeUtil.Indicator<T>(({ shape }) => {
    const { segments, isClosed } = shape
    const pathData = segmentsToPath(segments, isClosed)
    if (!pathData) return <circle r={1} />
    return <path d={pathData} />
  })

  getBounds = (shape: T) => {
    const pointsHaveChanged = !this.pointsBoundsCache.has(shape.segments)
    const pointHasChanged = !(this.pointCache[shape.id] === shape.point)

    if (pointsHaveChanged) {
      const bounds =
        shape.segments.length > 0
          ? getSegmentsBounds(shape.segments, shape.isClosed)
          : { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 }

      // Ensure minimum size
      const safeBounds = {
        ...bounds,
        width: Math.max(bounds.width, 1),
        height: Math.max(bounds.height, 1),
      }
      this.pointsBoundsCache.set(shape.segments, safeBounds as TLBounds)
      this.shapeBoundsCache.set(
        shape.id,
        Utils.translateBounds(safeBounds as TLBounds, shape.point)
      )
      this.pointCache[shape.id] = shape.point
    } else if (pointHasChanged) {
      this.pointCache[shape.id] = shape.point
      this.shapeBoundsCache.set(
        shape.id,
        Utils.translateBounds(this.pointsBoundsCache.get(shape.segments)!, shape.point)
      )
    }

    return this.shapeBoundsCache.get(shape.id)!
  }

  shouldRender = (prev: T, next: T) => {
    return (
      next.segments !== prev.segments ||
      next.style !== prev.style ||
      next.isClosed !== prev.isClosed ||
      next.isComplete !== prev.isComplete ||
      next.previewPoint !== prev.previewPoint ||
      next.isPlacingHandle !== prev.isPlacingHandle
    )
  }

  transform = (
    shape: T,
    bounds: TLBounds,
    { initialShape, scaleX, scaleY }: { initialShape: T; scaleX: number; scaleY: number }
  ): Partial<T> => {
    const initialBounds = this.getBounds(initialShape)
    const iW = Math.max(initialBounds.width, 1)
    const iH = Math.max(initialBounds.height, 1)

    const scaleSegment = (seg: PenSegment): PenSegment => ({
      point: [
        bounds.width *
          (scaleX < 0
            ? 1 - (seg.point[0] - initialBounds.minX) / iW
            : (seg.point[0] - initialBounds.minX) / iW),
        bounds.height *
          (scaleY < 0
            ? 1 - (seg.point[1] - initialBounds.minY) / iH
            : (seg.point[1] - initialBounds.minY) / iH),
      ],
      cp1: seg.cp1
        ? [
            bounds.width *
              (scaleX < 0
                ? 1 - (seg.cp1[0] - initialBounds.minX) / iW
                : (seg.cp1[0] - initialBounds.minX) / iW),
            bounds.height *
              (scaleY < 0
                ? 1 - (seg.cp1[1] - initialBounds.minY) / iH
                : (seg.cp1[1] - initialBounds.minY) / iH),
          ]
        : undefined,
      cp2: seg.cp2
        ? [
            bounds.width *
              (scaleX < 0
                ? 1 - (seg.cp2[0] - initialBounds.minX) / iW
                : (seg.cp2[0] - initialBounds.minX) / iW),
            bounds.height *
              (scaleY < 0
                ? 1 - (seg.cp2[1] - initialBounds.minY) / iH
                : (seg.cp2[1] - initialBounds.minY) / iH),
          ]
        : undefined,
    })

    const newSegs = initialShape.segments.map(scaleSegment)
    const newBounds = getSegmentsBounds(newSegs, shape.isClosed)
    const point = Vec.sub([bounds.minX, bounds.minY], [newBounds.minX, newBounds.minY])

    return { segments: newSegs, point } as Partial<T>
  }

  hitTestPoint = (shape: T, point: number[]) => {
    const polyline = getSegmentsPolyline(shape.segments, shape.isClosed)
    if (polyline.length === 0) return false

    const localPoint = Vec.sub(point, shape.point)
    const hitDistance = 8

    if (shape.isClosed && shape.style.isFilled && Utils.pointInPolygon(localPoint, polyline)) {
      return true
    }

    if (polyline.length === 1) {
      return Vec.dist(localPoint, polyline[0]) <= hitDistance
    }

    return Utils.pointInPolyline(localPoint, polyline, hitDistance)
  }

  hitTestLineSegment = (shape: T, A: number[], B: number[]) => {
    const polyline = getSegmentsPolyline(shape.segments, shape.isClosed)
    if (polyline.length === 0) return false

    const ptA = Vec.sub(A, shape.point)
    const ptB = Vec.sub(B, shape.point)
    const hitDistance = 8

    if (polyline.length === 1) {
      return Vec.distanceToLineSegment(ptA, ptB, polyline[0]) <= hitDistance
    }

    for (let i = 1; i < polyline.length; i++) {
      if (intersectLineSegmentLineSegment(polyline[i - 1], polyline[i], ptA, ptB).didIntersect) {
        return true
      }
    }

    if (shape.isClosed && shape.style.isFilled) {
      if (Utils.pointInPolygon(ptA, polyline) || Utils.pointInPolygon(ptB, polyline)) {
        return true
      }
    }

    return (
      Utils.pointInPolyline(ptA, polyline, hitDistance) ||
      Utils.pointInPolyline(ptB, polyline, hitDistance)
    )
  }

  hitTestBounds = (shape: T, bounds: TLBounds) => {
    const shapeBounds = this.getBounds(shape)
    if (Utils.boundsContain(bounds, shapeBounds)) return true

    const polyline = getSegmentsPolyline(shape.segments, shape.isClosed)
    if (polyline.length === 0) return false

    const localBounds = Utils.translateBounds(bounds, Vec.neg(shape.point))

    if (polyline.some((pt) => Utils.pointInBounds(pt, localBounds))) {
      return true
    }

    if (intersectBoundsPolyline(localBounds, polyline).length > 0) {
      return true
    }

    if (shape.isClosed && shape.style.isFilled) {
      const center = [
        localBounds.minX + localBounds.width / 2,
        localBounds.minY + localBounds.height / 2,
      ]

      if (Utils.pointInPolygon(center, polyline)) {
        return true
      }
    }

    return false
  }
}
