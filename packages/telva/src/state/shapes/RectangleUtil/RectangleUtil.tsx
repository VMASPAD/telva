import * as React from 'react'
import { SVGContainer, Utils } from 'telva-core'
import Vec from 'telva-vec'
import { GHOSTED_OPACITY, LABEL_POINT } from '~constants'
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
import { DashStyle, RectangleShape, TVMeta, TVShapeType } from '~types'
import { BindingIndicator } from './components/BindingIndicator'
import { DashedRectangle } from './components/DashedRectangle'
import { DrawRectangle } from './components/DrawRectangle'
import { getRectangleIndicatorPathTDSnapshot } from './rectangleHelpers'

type T = RectangleShape
type E = HTMLDivElement

export class RectangleUtil extends TVShapeUtil<T, E> {
  type = TVShapeType.Rectangle as const

  canBind = true

  canClone = true

  canEdit = true

  getShape = (props: Partial<T>): T => {
    return Utils.deepMerge<T>(
      {
        id: 'id',
        type: TVShapeType.Rectangle,
        name: 'Rectangle',
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
        isEditing,
        isBinding,
        isSelected,
        isGhost,
        meta,
        bounds,
        events,
        onShapeBlur,
        onShapeChange,
      },
      ref
    ) => {
      const { id, size, style, label = '', labelPoint = LABEL_POINT } = shape
      const font = getFontStyle(style)
      const styles = getShapeStyle(style, meta.isDarkMode)
      const isStraight = meta.canvasMode === 'straight'
      const Component =
        !isStraight && style.dash === DashStyle.Draw ? DrawRectangle : DashedRectangle
      const handleLabelChange = React.useCallback(
        (label: string) => onShapeChange?.({ id, label }),
        [onShapeChange]
      )

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

        return (
          <g>
            {corners.map((c, ci) => {
              const next = corners[(ci + 1) % 4]
              return (
                <line
                  key={`el-${ci}`}
                  x1={c[0]}
                  y1={c[1]}
                  x2={next[0]}
                  y2={next[1]}
                  stroke="#0D99FF"
                  strokeWidth={lw}
                  strokeOpacity={0.4}
                  pointerEvents="none"
                />
              )
            })}
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
            {/* Midpoint insertion nodes */}
            {corners.map((c, ci) => {
              const next = corners[(ci + 1) % 4]
              const mx = (c[0] + next[0]) / 2
              const my = (c[1] + next[1]) / 2
              return (
                <circle
                  key={`mid-${ci}`}
                  cx={mx}
                  cy={my}
                  r={3.5 / zoom}
                  fill="white"
                  stroke="#0D99FF"
                  strokeWidth={lw}
                  strokeDasharray={`${2 / zoom} ${2 / zoom}`}
                  style={{ cursor: 'crosshair' }}
                  pointerEvents="none"
                />
              )
            })}
          </g>
        )
      }, [isNodeEditing, size, zoom, hoveredNode, shape.id, shape.point, app])

      const svgOverflow = isNodeEditing ? { overflow: 'visible' as const } : undefined

      return (
        <FullWrapper ref={ref} {...events}>
          <TextLabel
            isEditing={isEditing}
            onChange={handleLabelChange}
            onBlur={onShapeBlur}
            font={font}
            text={label}
            color={style.labelColor ?? styles.stroke}
            background={style.labelBackground}
            textGradient={style.textGradient}
            offsetX={(labelPoint[0] - 0.5) * bounds.width}
            offsetY={(labelPoint[1] - 0.5) * bounds.height}
            width={Math.max(0, bounds.width - 16)}
          />
          <SVGContainer
            id={shape.id + '_svg'}
            opacity={isGhost ? GHOSTED_OPACITY : styles.opacity}
            style={svgOverflow}
          >
            {isBinding && <BindingIndicator strokeWidth={styles.strokeWidth} size={size} />}
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

  Indicator = TVShapeUtil.Indicator<T>(({ shape, meta }) => {
    const { id, style, size } = shape
    const isStraight = (meta as any)?.canvasMode === 'straight'

    if (!isStraight && style.dash === DashStyle.Draw) {
      return <path d={getRectangleIndicatorPathTDSnapshot(id, style, size)} />
    }

    return (
      <rect
        x={0}
        y={0}
        rx={style.borderRadius ?? 0}
        ry={style.borderRadius ?? 0}
        width={Math.max(1, size[0])}
        height={Math.max(1, size[1])}
      />
    )
  })

  getBounds = (shape: T) => {
    return getBoundsRectangle(shape, this.boundsCache)
  }

  shouldRender = (prev: T, next: T) => {
    return next.size !== prev.size || next.style !== prev.style || next.label !== prev.label
  }

  transform = transformRectangle

  transformSingle = transformSingleRectangle
}

const FullWrapper = styled('div', { width: '100%', height: '100%' })
