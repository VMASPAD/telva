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
          <LiveReactComponent componentId={componentId} />
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

  getSvgElement = async (shape: T, _isDarkMode: boolean): Promise<SVGElement | void> => {
    // Attempt to capture the component directly
    const wrapper = document.getElementById(`${shape.id}_react_component`)
    if (!wrapper) return

    const [width, height] = shape.size

    try {
      let dataUrl = ''

      // First try a full DOM snapshot (best for mixed DOM/WebGL components)
      try {
        const html2canvas = (await import('html2canvas-pro')).default
        const captured = await html2canvas(wrapper, {
          width,
          height,
          scale: 1,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        })
        dataUrl = captured.toDataURL('image/png')
      } catch {
        // Fallback: direct canvas capture if present (works when preserveDrawingBuffer is enabled)
        const canvasEl = wrapper.querySelector('canvas')
        if (canvasEl) {
          dataUrl = canvasEl.toDataURL('image/png')
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
}: {
  componentId: string
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
