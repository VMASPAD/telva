import * as React from 'react'
import type { TLShapeUtil } from '~TLShapeUtil'
import { Container } from '~components/Container'
import { useShapeEvents } from '~hooks'
import { useTLContext } from '~hooks'
import type { IShapeTreeNode, TLShape } from '~types'
import { RenderedShape } from './RenderedShape'

export interface ShapeProps<T extends TLShape, E extends Element, M> extends IShapeTreeNode<T, M> {
  utils: TLShapeUtil<T, E, M>
}

function _computeEffectFilter(effects: any): string | undefined {
  if (!effects) return undefined
  const f: string[] = []

  // Array format: TVEffect[] — stored by EffectsSection
  if (Array.isArray(effects)) {
    for (const eff of effects) {
      if (!eff.enabled) continue
      switch (eff.type) {
        case 'dropShadow':
          f.push(
            `drop-shadow(${eff.x ?? 0}px ${eff.y ?? 0}px ${eff.blur ?? 0}px ${
              eff.color ?? '#00000080'
            })`
          )
          break
        case 'layerBlur':
        case 'blur':
          if ((eff.value ?? 0) > 0) f.push(`blur(${eff.value}px)`)
          break
        case 'brightness':
          if ((eff.value ?? 100) !== 100) f.push(`brightness(${eff.value}%)`)
          break
        case 'contrast':
          if ((eff.value ?? 100) !== 100) f.push(`contrast(${eff.value}%)`)
          break
        case 'saturate':
          if ((eff.value ?? 100) !== 100) f.push(`saturate(${eff.value}%)`)
          break
        case 'hueRotate':
          if ((eff.value ?? 0) !== 0) f.push(`hue-rotate(${eff.value}deg)`)
          break
        case 'grayscale':
          if ((eff.value ?? 0) > 0) f.push(`grayscale(${eff.value}%)`)
          break
        case 'sepia':
          if ((eff.value ?? 0) > 0) f.push(`sepia(${eff.value}%)`)
          break
        case 'invert':
          f.push(`invert(1)`)
          break
      }
    }
    return f.length ? f.join(' ') : undefined
  }

  // Legacy object format fallback
  const {
    dropShadow,
    layerBlur,
    blur,
    brightness,
    contrast,
    saturate,
    hueRotate,
    grayscale,
    sepia,
    invert,
  } = effects
  if (dropShadow?.enabled) {
    f.push(
      `drop-shadow(${dropShadow.x}px ${dropShadow.y}px ${dropShadow.blur}px ${dropShadow.color})`
    )
  }
  if ((layerBlur ?? 0) > 0) f.push(`blur(${layerBlur}px)`)
  if ((blur ?? 0) > 0) f.push(`blur(${blur}px)`)
  if (brightness !== undefined && brightness !== 100) f.push(`brightness(${brightness}%)`)
  if (contrast !== undefined && contrast !== 100) f.push(`contrast(${contrast}%)`)
  if (saturate !== undefined && saturate !== 100) f.push(`saturate(${saturate}%)`)
  if (hueRotate !== undefined && hueRotate !== 0) f.push(`hue-rotate(${hueRotate}deg)`)
  if ((grayscale ?? 0) > 0) f.push(`grayscale(${grayscale}%)`)
  if ((sepia ?? 0) > 0) f.push(`sepia(${sepia}%)`)
  if (invert) f.push(`invert(1)`)
  return f.length ? f.join(' ') : undefined
}

function _Shape<T extends TLShape, E extends Element, M>({
  shape,
  utils,
  meta,
  ...rest
}: ShapeProps<T, E, M>) {
  const { callbacks } = useTLContext()
  const bounds = utils.getBounds(shape)
  const events = useShapeEvents(shape.id)
  const effectFilter = _computeEffectFilter((shape as any).effects)

  return (
    <Container
      id={shape.id}
      bounds={bounds}
      rotation={shape.rotation}
      data-shape={shape.type}
      isGhost={rest.isGhost}
      isSelected={rest.isSelected}
      style={{
        opacity: shape.isHidden ? 0 : 1,
        pointerEvents: shape.isHidden ? 'none' : 'none',
        filter: effectFilter || undefined,
      }}
    >
      <RenderedShape
        shape={shape}
        utils={utils as any}
        meta={meta}
        events={events}
        bounds={bounds}
        onShapeChange={callbacks.onShapeChange}
        onShapeBlur={callbacks.onShapeBlur}
        {...rest}
      />
    </Container>
  )
}

export const Shape = React.memo(_Shape)
