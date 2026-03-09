import { styled } from '@stitches/react'
import * as React from 'react'
import { HTMLContainer, Utils } from 'telva-core'
import { GHOSTED_OPACITY } from '~constants'
import { TVShapeUtil } from '~state/shapes/TVShapeUtil'
import {
  defaultStyle,
  getBoundsRectangle,
  transformRectangle,
  transformSingleRectangle,
} from '~state/shapes/shared'
import { ImageShape, TVImageAsset, TVMeta, TVShapeType } from '~types'

type T = ImageShape
type E = HTMLDivElement

export class ImageUtil extends TVShapeUtil<T, E> {
  type = TVShapeType.Image as const

  canBind = true

  canClone = true

  isAspectRatioLocked = true

  showCloneHandles = false

  getShape = (props: Partial<T>): T => {
    return Utils.deepMerge<T>(
      {
        id: 'image',
        type: TVShapeType.Image,
        name: 'Image',
        parentId: 'page',
        childIndex: 1,
        point: [0, 0],
        size: [1, 1],
        rotation: 0,
        style: { ...defaultStyle, isFilled: true },
        assetId: 'assetId',
      },
      props
    )
  }

  Component = TVShapeUtil.Component<T, E, TVMeta>(
    ({ shape, asset = { src: '' }, isBinding, isGhost, meta, events, onShapeChange }, ref) => {
      const { size, style } = shape
      const { bindingDistance } = this

      const rImage = React.useRef<HTMLImageElement>(null)
      const rWrapper = React.useRef<HTMLDivElement>(null)

      React.useLayoutEffect(() => {
        const wrapper = rWrapper.current
        if (!wrapper) return
        const [width, height] = size
        wrapper.style.width = `${width}px`
        wrapper.style.height = `${height}px`
      }, [size])

      return (
        <HTMLContainer ref={ref} {...events}>
          {isBinding && (
            <div
              className="tv-binding-indicator"
              style={{
                position: 'absolute',
                top: `calc(${-bindingDistance}px * var(--tv-zoom))`,
                left: `calc(${-bindingDistance}px * var(--tv-zoom))`,
                width: `calc(100% + ${bindingDistance * 2}px * var(--tv-zoom))`,
                height: `calc(100% + ${bindingDistance * 2}px * var(--tv-zoom))`,
                backgroundColor: 'var(--tv-selectFill)',
              }}
            />
          )}
          <Wrapper
            ref={rWrapper}
            isDarkMode={meta.isDarkMode} //
            isFilled={style.isFilled}
            isGhost={isGhost}
          >
            <ImageElement
              id={shape.id + '_image'}
              ref={rImage}
              src={(asset as TVImageAsset).src}
              alt="tl_image_asset"
              draggable={false}
            />
          </Wrapper>
        </HTMLContainer>
      )
    }
  )

  Indicator = TVShapeUtil.Indicator<T>(({ shape }) => {
    const {
      size: [width, height],
    } = shape

    return (
      <rect x={0} y={0} rx={2} ry={2} width={Math.max(1, width)} height={Math.max(1, height)} />
    )
  })

  getBounds = (shape: T) => {
    return getBoundsRectangle(shape, this.boundsCache)
  }

  shouldRender = (prev: T, next: T) => {
    return next.size !== prev.size || next.style !== prev.style
  }

  transform = transformRectangle

  transformSingle = transformSingleRectangle

  getSvgElement = (shape: ImageShape) => {
    const bounds = this.getBounds(shape)
    const elm = document.createElementNS('http://www.w3.org/2000/svg', 'image')
    elm.setAttribute('width', `${bounds.width}`)
    elm.setAttribute('height', `${bounds.height}`)
    elm.setAttribute('xmlns:xlink', `http://www.w3.org/1999/xlink`)
    return elm
  }
}

const Wrapper = styled('div', {
  pointerEvents: 'all',
  position: 'relative',
  fontFamily: 'sans-serif',
  fontSize: '2em',
  height: '100%',
  width: '100%',
  borderRadius: '3px',
  perspective: '800px',
  overflow: 'hidden',
  p: {
    userSelect: 'none',
  },
  img: {
    userSelect: 'none',
  },
  variants: {
    isGhost: {
      false: { opacity: 1 },
      true: { transition: 'opacity .2s', opacity: GHOSTED_OPACITY },
    },
    isFilled: {
      true: {},
      false: {},
    },
    isDarkMode: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      isFilled: true,
      isDarkMode: true,
      css: {
        boxShadow:
          '2px 3px 12px -2px rgba(0,0,0,.3), 1px 1px 4px rgba(0,0,0,.3), 1px 1px 2px rgba(0,0,0,.3)',
      },
    },
    {
      isFilled: true,
      isDarkMode: false,
      css: {
        boxShadow:
          '2px 3px 12px -2px rgba(0,0,0,.2), 1px 1px 4px rgba(0,0,0,.16),  1px 1px 2px rgba(0,0,0,.16)',
      },
    },
  ],
})

const ImageElement = styled('img', {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  maxWidth: '100%',
  minWidth: '100%',
  pointerEvents: 'none',
  objectFit: 'cover',
  userSelect: 'none',
  borderRadius: 2,
})
