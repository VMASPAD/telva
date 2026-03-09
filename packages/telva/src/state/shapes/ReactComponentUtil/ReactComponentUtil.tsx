import * as React from 'react'
import { HTMLContainer, Utils } from 'telva-core'
import { GHOSTED_OPACITY } from '~constants'
import { useReactRegistry } from '~state/reactRegistry'
import { TVShapeUtil } from '~state/shapes/TVShapeUtil'
import {
  defaultStyle,
  getBoundsRectangle,
  transformRectangle,
  transformSingleRectangle,
} from '~state/shapes/shared'
import { ReactComponentShape, TVMeta, TVShapeType } from '~types'

type T = ReactComponentShape
type E = HTMLDivElement

export class ReactComponentUtil extends TVShapeUtil<T, E> {
  type = TVShapeType.ReactComponent as const

  canBind = false
  canClone = true
  isAspectRatioLocked = false
  showCloneHandles = false

  getShape = (props: Partial<T>): T => {
    return Utils.deepMerge<T>(
      {
        id: 'reactComponent',
        type: TVShapeType.ReactComponent,
        name: 'React Component',
        parentId: 'page',
        childIndex: 1,
        point: [0, 0],
        size: [400, 300],
        rotation: 0,
        style: { ...defaultStyle, isFilled: true },
        componentId: '',
      },
      props
    )
  }

  Component = TVShapeUtil.Component<T, E, TVMeta>(({ shape, isGhost, events }, ref) => {
    const { size, componentId } = shape
    const rWrapper = React.useRef<HTMLDivElement>(null)

    // Keep wrapper dimensions in sync with shape size
    React.useLayoutEffect(() => {
      const wrapper = rWrapper.current
      if (!wrapper) return
      wrapper.style.width = `${size[0]}px`
      wrapper.style.height = `${size[1]}px`
    }, [size])

    return (
      <HTMLContainer ref={ref} {...events}>
        <div
          id={`${shape.id}_react_component`}
          ref={rWrapper}
          style={{
            width: `${size[0]}px`,
            height: `${size[1]}px`,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '4px',
            opacity: isGhost ? GHOSTED_OPACITY : 1,
            pointerEvents: 'all',
          }}
        >
          <LiveReactComponent componentId={componentId} width={size[0]} height={size[1]} />
        </div>
      </HTMLContainer>
    )
  })

  Indicator = TVShapeUtil.Indicator<T>(({ shape }) => {
    const {
      size: [width, height],
    } = shape
    return (
      <rect
        x={0}
        y={0}
        rx={4}
        ry={4}
        width={Math.max(1, width)}
        height={Math.max(1, height)}
        fill="none"
        stroke="var(--tv-selected)"
      />
    )
  })

  getBounds = (shape: T) => {
    return getBoundsRectangle(shape, this.boundsCache)
  }

  shouldRender = (prev: T, next: T) => {
    return (
      next.size !== prev.size || next.style !== prev.style || next.componentId !== prev.componentId
    )
  }

  transform = transformRectangle
  transformSingle = transformSingleRectangle

  getSvgElement = async (shape: T, isDarkMode: boolean): Promise<SVGElement | void> => {
    // Attempt to capture the component directly
    const wrapper = document.getElementById(`${shape.id}_react_component`)
    if (!wrapper) return

    const [width, height] = shape.size

    try {
      // For WebGL, try to grab the canvas dataUrl first if possible
      const canvasEl = wrapper.querySelector('canvas')
      let dataUrl = ''

      if (canvasEl) {
        // Try getting it directly from canvas to preserve WebGL context if preserveDrawingBuffer is on
        dataUrl = canvasEl.toDataURL('image/png')
      }

      // Fallback: use html2canvas for everything else
      if (!dataUrl || dataUrl === 'data:,') {
        // Clone the element outside of telva's CSS transform context so
        // html2canvas can measure and capture it correctly.
        const clone = document.createElement('div')
        clone.style.cssText = [
          `position:fixed`,
          `top:0`,
          `left:0`,
          `width:${width}px`,
          `height:${height}px`,
          `overflow:hidden`,
          `border-radius:4px`,
          `background:#ffffff`,
          `z-index:-9999`,
          `pointer-events:none`,
        ].join(';')
        // Copy rendered DOM content (static snapshot is enough for export)
        clone.innerHTML = wrapper.innerHTML
        document.body.appendChild(clone)

        try {
          const html2canvas = (await import('html2canvas')).default
          const captured = await html2canvas(clone, {
            width,
            height,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
          })
          dataUrl = captured.toDataURL('image/png')
        } finally {
          document.body.removeChild(clone)
        }
      }

      if (!dataUrl || dataUrl === 'data:,') return

      const elm = document.createElementNS('http://www.w3.org/2000/svg', 'image')
      elm.setAttribute('width', `${width}`)
      elm.setAttribute('height', `${height}`)
      elm.setAttribute('href', dataUrl)
      return elm
    } catch (err) {
      console.warn('Failed to snapshot React Component for SVG export', err)
    }
  }
}

/**
 * Resolves a React component from the registry and renders it.
 * The parent wrapper div (in Component above) provides explicit pixel
 * dimensions so ResizeObserver / CSS 100% / h-full all work correctly.
 */
function LiveReactComponent({
  componentId,
  width,
  height,
}: {
  componentId: string
  width: number
  height: number
}) {
  const registry = useReactRegistry()
  const entry = React.useMemo(
    () => registry.find((r) => r.id === componentId),
    [registry, componentId]
  )

  if (!entry) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontSize: 14,
          fontFamily: 'DM Sans, sans-serif',
          borderRadius: 4,
        }}
      >
        Component "{componentId}" not found
      </div>
    )
  }

  const Comp = entry.component

  // Render the component — it fills its parent which has explicit pixel dims
  return <Comp />
}
