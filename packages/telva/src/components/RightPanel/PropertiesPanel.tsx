import * as React from 'react'
import { Utils } from 'telva-core'
import { useTelvaApp } from '~hooks'
import { fills, strokes } from '~state/shapes/shared'
import { styled } from '~styles'
import {
  AlignStyle,
  AlignType,
  DashStyle,
  Decoration,
  DistributeType,
  EffectType,
  FontStyle,
  ShapeStyles,
  StretchType,
  TVEffect,
  TVExportType,
  TVShape,
  TVShapeType,
  TVSnapshot,
} from '~types'
import { ColorSwatchInput, hexToRgb, rgbToHex } from './ColorPicker'
import { DraggableInput } from './DraggableInput'
import { GradientData, GradientPicker } from './GradientPicker'

// ─── RGBA helpers (used for labelColor / labelBackground with opacity) ───
function hexToRgba(hex: string, opacity: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${opacity.toFixed(3)})`
}
function parseCssColor(
  css: string | undefined,
  fallback: string
): { hex: string; opacity: number } {
  if (!css || css === 'transparent') return { hex: 'transparent', opacity: 1 }
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (m) {
    const hex = rgbToHex(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]))
    return { hex, opacity: m[4] !== undefined ? parseFloat(m[4]) : 1 }
  }
  if (css.startsWith('#')) return { hex: css.slice(0, 7), opacity: 1 }
  return { hex: fallback, opacity: 1 }
}

// === Selectors ===
const selectedDataSelector = (s: TVSnapshot) => {
  const page = s.document.pages[s.appState.currentPageId]
  const ids = s.document.pageStates[s.appState.currentPageId].selectedIds
  const shapes = ids.map((id) => page.shapes[id]).filter(Boolean)
  return { shapes, key: JSON.stringify(shapes) }
}
const themeSelector = (s: TVSnapshot) => (s.settings.isDarkMode ? 'dark' : 'light')

// ===================== MAIN =====================
export const PropertiesPanel = React.memo(function PropertiesPanel() {
  const app = useTelvaApp()
  const { shapes: selectedShapes } = app.useStore(selectedDataSelector)
  const theme = app.useStore(themeSelector)

  if (selectedShapes.length === 0) {
    return (
      <Panel>
        <SectionWrap>
          <SectionTitle>Design</SectionTitle>
          <Hint>Select an element to edit</Hint>
        </SectionWrap>
      </Panel>
    )
  }

  const shape = selectedShapes[0]
  const multi = selectedShapes.length > 1
  const isText =
    shape.type === TVShapeType.Text || shape.type === TVShapeType.Sticky || 'label' in shape
  const isArrow = shape.type === TVShapeType.Arrow
  const isRect = shape.type === TVShapeType.Rectangle
  const isNodeEditable = shape.type === TVShapeType.Pen

  return (
    <Panel>
      <HeaderSection shape={shape} multi={multi} count={selectedShapes.length} />
      <Divider />

      {!multi && isNodeEditable && (
        <>
          <NodeEditSection shape={shape} app={app} />
          <Divider />
        </>
      )}

      {!multi && <PositionSection shape={shape} app={app} />}
      {multi && <AlignmentSection app={app} />}
      <Divider />

      {!multi && <LayoutSection shape={shape} app={app} />}
      {!multi && <Divider />}

      <AppearanceSection shape={shape} app={app} isRect={isRect} />
      <Divider />

      <FillSection style={shape.style} theme={theme} app={app} />
      <Divider />

      <CollapsibleRow title="Stroke">
        <StrokeSection style={shape.style} theme={theme} app={app} />
      </CollapsibleRow>
      <Divider />

      {/* Gradient Section */}
      <CollapsibleRow title="Gradient">
        <GradientSection shape={shape} app={app} />
      </CollapsibleRow>
      <Divider />

      {/* Text Color & Background (for shapes with text) */}
      {isText && (
        <>
          <CollapsibleRow title="Text Style" defaultOpen>
            <TextStyleSection style={shape.style} app={app} theme={theme} />
          </CollapsibleRow>
          <Divider />
        </>
      )}

      <CollapsibleRow title="Effects">
        <EffectsSection shape={shape} app={app} />
      </CollapsibleRow>
      <Divider />

      {isArrow && !multi && (
        <>
          <CollapsibleRow title="Arrow" defaultOpen>
            <ArrowSection shape={shape} app={app} />
          </CollapsibleRow>
          <Divider />
        </>
      )}

      {isText && (
        <>
          <CollapsibleRow title="Typography" defaultOpen>
            <TypographySection style={shape.style} app={app} />
          </CollapsibleRow>
          <Divider />
        </>
      )}

      <CollapsibleRow title="Export">
        <ExportSection shape={shape} app={app} />
      </CollapsibleRow>

      <div style={{ height: 40 }} />
    </Panel>
  )
})

// ===================== SECTIONS =====================

// --- Header ---
function HeaderSection({ shape, multi, count }: { shape: TVShape; multi: boolean; count: number }) {
  const name = multi
    ? count + ' Selected'
    : shape.type.charAt(0).toUpperCase() + shape.type.slice(1)
  return (
    <SectionWrap style={{ padding: '10px 12px 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionTitle style={{ marginBottom: 0, fontSize: '11px' }}>{name}</SectionTitle>
        <div style={{ display: 'flex', gap: 4 }}>
          {['\u229E', '\u25D1', '\u229F', '\u22A0'].map((icon, i) => (
            <IconBtn key={i} title={['Clip Mask', 'Component', 'Boolean', 'Flatten'][i]}>
              {icon}
            </IconBtn>
          ))}
        </div>
      </div>
    </SectionWrap>
  )
}

// --- Position ---
function PositionSection({ shape, app }: { shape: TVShape; app: any }) {
  const point = shape.point || [0, 0]
  const rotation = Math.round((shape.rotation || 0) * (180 / Math.PI))

  const update = React.useCallback(
    (field: string, value: number) => {
      const u: any = { id: shape.id }
      switch (field) {
        case 'x':
          u.point = [value, point[1]]
          break
        case 'y':
          u.point = [point[0], value]
          break
        case 'r':
          u.rotation = (value * Math.PI) / 180
          break
      }
      app.updateShapes(u)
    },
    [shape.id, point, app]
  )

  return (
    <SectionWrap>
      <SectionTitle>Position</SectionTitle>
      <AlignGrid>
        {[
          {
            fn: () => app.align(AlignType.Left),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="2" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <rect
                  x="4"
                  y="4"
                  width="7"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="4"
                  y="8"
                  width="5"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Left',
          },
          {
            fn: () => app.align(AlignType.CenterHorizontal),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line
                  x1="7"
                  y1="1"
                  x2="7"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2 1"
                />
                <rect
                  x="3"
                  y="4"
                  width="8"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="4"
                  y="8"
                  width="6"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Center H',
          },
          {
            fn: () => app.align(AlignType.Right),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="12" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <rect
                  x="3"
                  y="4"
                  width="7"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="5"
                  y="8"
                  width="5"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Right',
          },
          {
            fn: () => app.align(AlignType.Top),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="2" y1="2" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" />
                <rect
                  x="4"
                  y="4"
                  width="2.5"
                  height="7"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="8"
                  y="4"
                  width="2.5"
                  height="5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Top',
          },
          {
            fn: () => app.align(AlignType.CenterVertical),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line
                  x1="1"
                  y1="7"
                  x2="13"
                  y2="7"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2 1"
                />
                <rect
                  x="4"
                  y="2"
                  width="2.5"
                  height="10"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="8"
                  y="3"
                  width="2.5"
                  height="8"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Center V',
          },
          {
            fn: () => app.align(AlignType.Bottom),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="2" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <rect
                  x="4"
                  y="3"
                  width="2.5"
                  height="7"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="8"
                  y="5"
                  width="2.5"
                  height="5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Bottom',
          },
        ].map(({ fn, icon, t }, i) => (
          <SmallBtn key={i} onClick={fn} title={t}>
            {icon}
          </SmallBtn>
        ))}
      </AlignGrid>

      <FieldGrid style={{ marginTop: 8 }}>
        <DraggableInput label="X" value={Math.round(point[0])} onChange={(v) => update('x', v)} />
        <DraggableInput label="Y" value={Math.round(point[1])} onChange={(v) => update('y', v)} />
      </FieldGrid>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <DraggableInput
          label="R"
          value={rotation}
          onChange={(v) => update('r', v)}
          suffix={'\u00B0'}
          style={{ flex: 1 }}
        />
        <div style={{ display: 'flex', gap: 2 }}>
          <SmallBtn onClick={() => app.flipHorizontal()} title="Flip Horizontal">
            <svg width="20" height="20" viewBox="0 0 14 14">
              <path
                d="M7 2v10M3 5l-1 4h4zM11 5l1 4h-4z"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </SmallBtn>
          <SmallBtn onClick={() => app.flipVertical()} title="Flip Vertical">
            <svg width="20" height="20" viewBox="0 0 14 14">
              <path
                d="M2 7h10M5 3l4-1v4zM5 11l4 1v-4z"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </SmallBtn>
        </div>
      </div>
    </SectionWrap>
  )
}

// --- Layout (W/H + aspect lock) - FIXED UI ---
function LayoutSection({ shape, app }: { shape: TVShape; app: any }) {
  const size =
    'size' in shape
      ? (shape as any).size
      : 'radius' in shape
      ? [(shape as any).radius[0] * 2, (shape as any).radius[1] * 2]
      : [0, 0]
  const [locked, setLocked] = React.useState(false)

  const handleSize = React.useCallback(
    (dim: 'w' | 'h', value: number) => {
      const u: any = { id: shape.id }
      if ('size' in shape) {
        if (dim === 'w') {
          const newH = locked ? (value / size[0]) * size[1] : size[1]
          u.size = [value, newH]
        } else {
          const newW = locked ? (value / size[1]) * size[0] : size[0]
          u.size = [newW, value]
        }
      } else if ('radius' in shape) {
        if (dim === 'w')
          u.radius = [
            value / 2,
            locked ? ((value / 2 / size[0]) * size[1]) / 2 : (shape as any).radius[1],
          ]
        else
          u.radius = [
            locked ? ((value / 2 / size[1]) * size[0]) / 2 : (shape as any).radius[0],
            value / 2,
          ]
      }
      app.updateShapes(u)
    },
    [shape, size, locked, app]
  )

  return (
    <SectionWrap>
      <SectionTitle>Layout</SectionTitle>
      <LayoutGrid>
        <DraggableInput
          label="W"
          value={Math.round(size[0])}
          onChange={(v) => handleSize('w', v)}
          min={1}
        />
        {/* <LockBtn
          onClick={(e) => { e.stopPropagation(); setLocked((l) => !l) }}
          title={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          locked={locked || undefined}
        >
          {locked ? (
            <svg width="14" height="14" viewBox="0 0 14 14">
              <rect
                x="3"
                y="6"
                width="8"
                height="6"
                rx="1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path d="M5 6V4a2 2 0 014 0v2" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14">
              <rect
                x="3"
                y="6"
                width="8"
                height="6"
                rx="1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path d="M5 6V4a2 2 0 014 0" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </LockBtn> */}
        <DraggableInput
          label="H"
          value={Math.round(size[1])}
          onChange={(v) => handleSize('h', v)}
          min={1}
        />
      </LayoutGrid>
    </SectionWrap>
  )
}

// --- Appearance (Opacity + Corner Radius) ---
function AppearanceSection({ shape, app, isRect }: { shape: TVShape; app: any; isRect: boolean }) {
  const opacityPct = Math.round((shape.style.opacity ?? 1) * 100)
  const borderRadius = shape.style.borderRadius ?? 0

  return (
    <SectionWrap>
      <SectionTitle>Appearance</SectionTitle>
      <DraggableInput
        label="Opacity"
        value={opacityPct}
        onChange={(v) => app.style({ opacity: v / 100 })}
        min={0}
        max={100}
        suffix="%"
        labelWidth={36}
      />
      {isRect && (
        <div style={{ marginTop: 4 }}>
          <DraggableInput
            label="Corner"
            value={borderRadius}
            onChange={(v) => app.style({ borderRadius: v })}
            min={0}
            suffix="px"
            labelWidth={36}
          />
        </div>
      )}
      <FieldRow style={{ marginTop: 4 }}>
        <FieldLabel style={{ width: 36 }}>Dash</FieldLabel>
        <BtnGroup>
          {[
            { val: DashStyle.Draw, label: '~' },
            { val: DashStyle.Solid, label: '\u2014' },
            { val: DashStyle.Dashed, label: '- -' },
            { val: DashStyle.Dotted, label: '\u00B7\u00B7\u00B7' },
          ].map(({ val, label }) => (
            <SmallBtn
              key={val}
              isActive={shape.style.dash === val}
              onClick={() => app.style({ dash: val })}
            >
              {label}
            </SmallBtn>
          ))}
        </BtnGroup>
      </FieldRow>
    </SectionWrap>
  )
}

// --- Fill Section (uses ColorSwatchInput) ---
function FillSection({ style, theme, app }: { style: ShapeStyles; theme: string; app: any }) {
  const fillHex = style.isFilled
    ? style.fillHex || fills[theme as 'light' | 'dark']?.[style.color] || fills.light[style.color]
    : 'transparent'

  const commit = React.useCallback(
    (hex: string, opacity: number) => {
      if (hex === 'transparent') {
        app.style({ isFilled: false })
      } else {
        app.style({ fillHex: hex, isFilled: true, opacity })
      }
    },
    [app]
  )

  return (
    <SectionWrap>
      <SectionTitle>Fill</SectionTitle>
      <ColorSwatchInput
        color={fillHex}
        opacity={style.opacity ?? 1}
        onChange={commit}
        showTransparent={true}
        showOpacity={true}
        label="Color"
      />
      {/*         <SmallBtn
          onClick={() => app.style({ isFilled: !style.isFilled })}
          title={style.isFilled ? 'Hide fill' : 'Show fill'}
          style={{ flex: 0, width: 24, height: 24 }}
        >
          {style.isFilled ? '\uD83D\uDC41' : '\uD83D\uDE48'}
        </SmallBtn> */}
    </SectionWrap>
  )
}

// --- Stroke Section (uses ColorSwatchInput) ---
function StrokeSection({ style, theme, app }: { style: ShapeStyles; theme: string; app: any }) {
  const strokeHex =
    style.strokeHex ||
    strokes[theme as 'light' | 'dark']?.[style.color] ||
    strokes.light[style.color]
  const strokeWidth =
    style.strokeWidthOverride ?? ({ small: 2, medium: 3.5, large: 5 }[style.size] || 2)

  return (
    <div>
      <ColorSwatchInput
        color={strokeHex}
        opacity={1}
        onChange={(hex) => app.style({ strokeHex: hex })}
        showTransparent={true}
        showOpacity={false}
      />
      <div style={{ marginTop: 6 }}>
        <DraggableInput
          label="Width"
          value={strokeWidth}
          onChange={(v) => app.style({ strokeWidthOverride: v })}
          min={0}
          step={0.01}
          suffix="px"
          max={10}
          labelWidth={36}
        />
      </div>
    </div>
  )
}

// --- Gradient Section ---
function GradientSection({ shape, app }: { shape: TVShape; app: any }) {
  const [enabled, setEnabled] = React.useState(!!shape.style.gradient)
  const gradientData = shape.style.gradient as GradientData | undefined

  const handleToggle = React.useCallback(() => {
    if (enabled) {
      app.style({ gradient: undefined })
      setEnabled(false)
    } else {
      const defaultGrad: GradientData = {
        type: 'linear',
        stops: [
          { color: '#0D99FF', position: 0, opacity: 1 },
          { color: '#FF6B00', position: 100, opacity: 1 },
        ],
        angle: 90,
        centerX: 50,
        centerY: 50,
      }
      app.style({ gradient: defaultGrad, isFilled: true })
      setEnabled(true)
    }
  }, [enabled, app])

  return (
    <div>
      <FieldRow>
        <FieldLabel style={{ width: 36 }}>Enable</FieldLabel>
        <Toggle checked={enabled} onClick={handleToggle}>
          <ToggleThumb checked={enabled} />
        </Toggle>
      </FieldRow>
      {enabled && (
        <div style={{ marginTop: 8 }}>
          <GradientPicker
            value={gradientData}
            onChange={(data, _css) => {
              app.style({ gradient: data })
            }}
          />
        </div>
      )}
    </div>
  )
}

// --- Text Style Section (Color & Background with opacity) ---
function TextStyleSection({ style, app, theme }: { style: ShapeStyles; app: any; theme: string }) {
  const defaultColor = strokes[theme as 'light' | 'dark']?.[style.color] || '#000000'
  const { hex: labelColorHex, opacity: labelColorOp } = parseCssColor(
    style.labelColor,
    defaultColor
  )
  const { hex: labelBgHex, opacity: labelBgOp } = parseCssColor(
    style.labelBackground,
    'transparent'
  )
  const textGradient = style.textGradient as GradientData | undefined
  const [textGradEnabled, setTextGradEnabled] = React.useState(!!textGradient)

  const handleTextGradToggle = React.useCallback(() => {
    if (textGradEnabled) {
      app.style({ textGradient: undefined })
      setTextGradEnabled(false)
    } else {
      const defaultGrad: GradientData = {
        type: 'linear',
        stops: [
          { color: '#0D99FF', position: 0, opacity: 1 },
          { color: '#FF6B00', position: 100, opacity: 1 },
        ],
        angle: 90,
        centerX: 50,
        centerY: 50,
      }
      app.style({ textGradient: defaultGrad })
      setTextGradEnabled(true)
    }
  }, [textGradEnabled, app])

  return (
    <div>
      <ColorSwatchInput
        color={labelColorHex}
        opacity={labelColorOp}
        onChange={(hex, opacity) => {
          const val = hex === 'transparent' ? 'transparent' : hexToRgba(hex, opacity)
          app.style({ labelColor: val })
        }}
        showTransparent={true}
        showOpacity={true}
        label="Text"
      />
      <div style={{ marginTop: 6 }}>
        <ColorSwatchInput
          color={labelBgHex}
          opacity={labelBgOp}
          onChange={(hex, opacity) => {
            const val = hex === 'transparent' ? 'transparent' : hexToRgba(hex, opacity)
            app.style({ labelBackground: val })
          }}
          showTransparent={true}
          showOpacity={true}
          label="Text Bg"
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <FieldRow>
          <FieldLabel style={{ width: 60 }}>Text Grad</FieldLabel>
          <Toggle checked={textGradEnabled} onClick={handleTextGradToggle}>
            <ToggleThumb checked={textGradEnabled} />
          </Toggle>
        </FieldRow>
        {textGradEnabled && (
          <div style={{ marginTop: 8 }}>
            <GradientPicker
              value={textGradient}
              onChange={(data) => app.style({ textGradient: data })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function normalizeEffects(raw: any): TVEffect[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  const arr: TVEffect[] = []
  if (raw.dropShadow) {
    arr.push({
      id: Utils.uniqueId(),
      type: 'dropShadow',
      enabled: raw.dropShadow.enabled,
      x: raw.dropShadow.x,
      y: raw.dropShadow.y,
      blur: raw.dropShadow.blur,
      spread: raw.dropShadow.spread,
      color: raw.dropShadow.color,
    })
  }
  const defaults: Record<string, number> = {
    layerBlur: 0,
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hueRotate: 0,
    grayscale: 0,
    sepia: 0,
  }
  for (const k of Object.keys(defaults)) {
    if (raw[k] !== undefined && raw[k] !== defaults[k]) {
      arr.push({ id: Utils.uniqueId(), type: k as EffectType, enabled: true, value: raw[k] })
    }
  }
  if (raw.invert) arr.push({ id: Utils.uniqueId(), type: 'invert', enabled: true })
  return arr
}

const EFFECT_NAMES: Record<EffectType, string> = {
  dropShadow: 'Drop Shadow',
  blur: 'Blur',
  layerBlur: 'Layer Blur',
  brightness: 'Brightness',
  contrast: 'Contrast',
  saturate: 'Saturation',
  hueRotate: 'Hue Rotate',
  grayscale: 'Grayscale',
  sepia: 'Sepia',
  invert: 'Invert',
}

function EffectsSection({ shape, app }: { shape: TVShape; app: any }) {
  const effects = normalizeEffects((shape as any).effects)

  const updateEffects = React.useCallback(
    (newEffects: TVEffect[]) => app.updateShapes({ id: shape.id, effects: newEffects }),
    [app, shape.id]
  )

  const updateEffect = (id: string, patch: Partial<TVEffect>) => {
    updateEffects(effects.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  const removeEffect = (id: string) => {
    updateEffects(effects.filter((e) => e.id !== id))
  }

  const addEffect = (type: EffectType) => {
    const newEff: TVEffect = { id: Utils.uniqueId(), type, enabled: true }
    if (type === 'dropShadow') {
      Object.assign(newEff, { x: 2, y: 4, blur: 8, spread: 0, color: '#00000080' })
    } else if (['layerBlur', 'blur'].includes(type)) {
      newEff.value = 4
    } else if (['brightness', 'contrast', 'saturate'].includes(type)) {
      newEff.value = 100
    } else {
      newEff.value = 0
    }
    updateEffects([...effects, newEff])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {effects.map((eff) => (
        <div
          key={eff.id}
          style={{ borderBottom: '1px solid var(--colors-separator)', paddingBottom: 6 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Toggle
                checked={eff.enabled}
                onClick={() => updateEffect(eff.id, { enabled: !eff.enabled })}
              >
                <ToggleThumb checked={eff.enabled} />
              </Toggle>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--colors-text)' }}>
                {EFFECT_NAMES[eff.type]}
              </span>
            </div>
            <button
              onClick={() => removeEffect(eff.id)}
              style={{ all: 'unset', cursor: 'pointer', opacity: 0.5, fontSize: 12, lineHeight: 1 }}
              title="Remove effect"
            >
              ✕
            </button>
          </div>

          {/* Effect Properties */}
          {eff.enabled && (
            <div style={{ paddingLeft: 22 }}>
              {eff.type === 'dropShadow' && (
                <>
                  <FieldGrid style={{ marginBottom: 4 }}>
                    <DraggableInput
                      label="X"
                      value={eff.x ?? 0}
                      onChange={(v) => updateEffect(eff.id, { x: v })}
                    />
                    <DraggableInput
                      label="Y"
                      value={eff.y ?? 0}
                      onChange={(v) => updateEffect(eff.id, { y: v })}
                    />
                    <DraggableInput
                      label="Blur"
                      value={eff.blur ?? 0}
                      onChange={(v) => updateEffect(eff.id, { blur: Math.max(0, v) })}
                      labelWidth={26}
                    />
                    <DraggableInput
                      label="Sprd"
                      value={eff.spread ?? 0}
                      onChange={(v) => updateEffect(eff.id, { spread: v })}
                      labelWidth={28}
                    />
                  </FieldGrid>
                  <FieldRow>
                    <FieldLabel style={{ width: 40, textAlign: 'left' }}>Color</FieldLabel>
                    <input
                      type="color"
                      value={(eff.color ?? '#000000').slice(0, 7)}
                      onChange={(e) => updateEffect(eff.id, { color: e.target.value + '80' })}
                      style={{
                        width: 24,
                        height: 20,
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    />
                  </FieldRow>
                </>
              )}
              {['layerBlur', 'blur'].includes(eff.type) && (
                <DraggableInput
                  label="Radius"
                  value={eff.value ?? 0}
                  onChange={(v) => updateEffect(eff.id, { value: Math.max(0, v) })}
                  suffix="px"
                  labelWidth={40}
                />
              )}
              {['brightness', 'contrast', 'saturate'].includes(eff.type) && (
                <DraggableInput
                  label="Amount"
                  value={eff.value ?? 100}
                  onChange={(v) => updateEffect(eff.id, { value: Math.max(0, v) })}
                  suffix="%"
                  labelWidth={40}
                />
              )}
              {['hueRotate'].includes(eff.type) && (
                <DraggableInput
                  label="Angle"
                  value={eff.value ?? 0}
                  onChange={(v) => updateEffect(eff.id, { value: v })}
                  suffix="°"
                  labelWidth={40}
                />
              )}
              {['grayscale', 'sepia'].includes(eff.type) && (
                <DraggableInput
                  label="Amount"
                  value={eff.value ?? 0}
                  onChange={(v) => updateEffect(eff.id, { value: Math.max(0, Math.min(100, v)) })}
                  suffix="%"
                  labelWidth={40}
                />
              )}
            </div>
          )}
        </div>
      ))}

      <div style={{ position: 'relative' }}>
        <select
          value=""
          onChange={(e) => addEffect(e.target.value as EffectType)}
          style={{
            width: '100%',
            padding: '4px 6px',
            fontSize: 10,
            borderRadius: 4,
            background: 'var(--colors-inputBg)',
            color: 'var(--colors-textSecondary)',
            border: '1px dashed var(--colors-separator)',
            cursor: 'pointer',
          }}
        >
          <option value="" disabled>
            + Add Effect
          </option>
          {Object.entries(EFFECT_NAMES).map(([val, name]) => (
            <option key={val} value={val}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// --- Arrow Section ---
function ArrowSection({ shape, app }: { shape: TVShape; app: any }) {
  const arrow = shape as any
  const hasStartDec = !!arrow.decorations?.start
  const hasEndDec = arrow.decorations?.end !== undefined

  return (
    <div>
      <FieldRow>
        <FieldLabel style={{ width: 36 }}>Start</FieldLabel>
        <BtnGroup>
          <SmallBtn
            isActive={!hasStartDec}
            onClick={() =>
              app.updateShapes({
                id: shape.id,
                decorations: { ...arrow.decorations, start: undefined },
              })
            }
          >
            None
          </SmallBtn>
          <SmallBtn
            isActive={hasStartDec}
            onClick={() =>
              app.updateShapes({
                id: shape.id,
                decorations: { ...arrow.decorations, start: Decoration.Arrow },
              })
            }
          >
            {'\u25C4'}
          </SmallBtn>
        </BtnGroup>
      </FieldRow>
      <FieldRow>
        <FieldLabel style={{ width: 36 }}>End</FieldLabel>
        <BtnGroup>
          <SmallBtn
            isActive={!hasEndDec}
            onClick={() =>
              app.updateShapes({
                id: shape.id,
                decorations: { ...arrow.decorations, end: undefined },
              })
            }
          >
            None
          </SmallBtn>
          <SmallBtn
            isActive={hasEndDec}
            onClick={() =>
              app.updateShapes({
                id: shape.id,
                decorations: { ...arrow.decorations, end: Decoration.Arrow },
              })
            }
          >
            {'\u25BA'}
          </SmallBtn>
        </BtnGroup>
      </FieldRow>
      <div style={{ marginTop: 4 }}>
        <DraggableInput
          label="Bend"
          value={Math.round((arrow.bend || 0) * 100)}
          onChange={(v) => app.updateShapes({ id: shape.id, bend: v / 100 })}
          min={-99}
          max={99}
          suffix="%"
          labelWidth={36}
        />
      </div>
    </div>
  )
}

// --- Typography Section (Google Fonts) ---
function TypographySection({ style, app }: { style: ShapeStyles; app: any }) {
  const [fontSearch, setFontSearch] = React.useState('')
  const [showDrop, setShowDrop] = React.useState(false)
  const [filtered, setFiltered] = React.useState<
    Array<{ family: string; category: string; variants: string[] }>
  >([])
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    import('./googleFonts').then((mod) => {
      setFiltered(mod.searchGoogleFonts(fontSearch))
    })
  }, [fontSearch])

  const selectFont = React.useCallback(
    (font: { family: string; category: string; variants: string[] }) => {
      import('./googleFonts').then((mod) => {
        mod.loadGoogleFont(font.family, font.variants)
        // Map Google Fonts category → telva FontStyle enum
        const fontEnum =
          font.category === 'monospace'
            ? FontStyle.Mono
            : font.category === 'serif'
            ? FontStyle.Serif
            : font.category === 'handwriting'
            ? FontStyle.Script
            : FontStyle.Sans
        // Apply both font enum and exact family name in a single style command
        app.style({ font: fontEnum, fontFamily: font.family } as any)
        setFontSearch('')
        setShowDrop(false)
      })
    },
    [app]
  )

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDrop(false)
        setFontSearch('')
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const curFont =
    style.font === FontStyle.Mono
      ? 'Monospace'
      : style.font === FontStyle.Serif
      ? 'Serif'
      : style.font === FontStyle.Script
      ? 'Script'
      : 'Sans Serif'
  const displayFont = (style as any).fontFamily || curFont
  const scalePct = Math.round((style.scale ?? 1) * 100)

  return (
    <div>
      <FieldRow>
        <FieldLabel style={{ width: 36 }}>Font</FieldLabel>
        <div ref={ref} style={{ position: 'relative', flex: 1 }}>
          <Input
            value={fontSearch || displayFont}
            onChange={(e) => {
              setFontSearch(e.target.value)
              setShowDrop(true)
            }}
            onFocus={() => {
              setShowDrop(true)
              import('./googleFonts').then((m) => m.fetchGoogleFonts())
            }}
            placeholder="Search fonts..."
            style={{ fontSize: 9 }}
          />
          {showDrop && filtered.length > 0 && (
            <Dropdown>
              {filtered.map((f) => (
                <DropItem
                  key={f.family}
                  onMouseDown={(e: React.MouseEvent) => {
                    e.preventDefault()
                    selectFont(f)
                  }}
                  style={{ fontFamily: f.family }}
                >
                  {f.family}
                </DropItem>
              ))}
            </Dropdown>
          )}
        </div>
      </FieldRow>
      <div style={{ marginTop: 4 }}>
        <DraggableInput
          label="Size"
          value={scalePct}
          onChange={(v) => app.style({ scale: v / 100 })}
          min={25}
          max={300}
          suffix="%"
          labelWidth={36}
        />
      </div>
      <FieldRow style={{ marginTop: 4 }}>
        <FieldLabel style={{ width: 36 }}>Align</FieldLabel>
        <BtnGroup>
          {[
            {
              val: AlignStyle.Start,
              svg: (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path
                    d="M1 2H11M1 5H7M1 8H9M1 11H5"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
              ),
            },
            {
              val: AlignStyle.Middle,
              svg: (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path
                    d="M1 2H11M3 5H9M2 8H10M4 11H8"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
              ),
            },
            {
              val: AlignStyle.End,
              svg: (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path
                    d="M1 2H11M5 5H11M3 8H11M7 11H11"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
              ),
            },
            {
              val: AlignStyle.Justify,
              svg: (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path
                    d="M1 2H11M1 5H11M1 8H11M1 11H11"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
              ),
            },
          ].map(({ val, svg }) => (
            <SmallBtn
              key={val}
              isActive={style.textAlign === val}
              onClick={() => app.style({ textAlign: val })}
            >
              {svg}
            </SmallBtn>
          ))}
        </BtnGroup>
      </FieldRow>
    </div>
  )
}

// --- Alignment Section (multi-select) ---
function AlignmentSection({ app }: { app: any }) {
  return (
    <SectionWrap>
      <SectionTitle>Alignment</SectionTitle>
      <AlignGrid>
        {[
          {
            fn: () => app.align(AlignType.Left),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="2" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <rect
                  x="4"
                  y="4"
                  width="7"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="4"
                  y="8"
                  width="5"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Left',
          },
          {
            fn: () => app.align(AlignType.CenterHorizontal),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line
                  x1="7"
                  y1="1"
                  x2="7"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2 1"
                />
                <rect
                  x="3"
                  y="4"
                  width="8"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="4"
                  y="8"
                  width="6"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Center H',
          },
          {
            fn: () => app.align(AlignType.Right),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="12" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <rect
                  x="3"
                  y="4"
                  width="7"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="5"
                  y="8"
                  width="5"
                  height="2.5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Right',
          },
          {
            fn: () => app.align(AlignType.Top),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="2" y1="2" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" />
                <rect
                  x="4"
                  y="4"
                  width="2.5"
                  height="7"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="8"
                  y="4"
                  width="2.5"
                  height="5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Top',
          },
          {
            fn: () => app.align(AlignType.CenterVertical),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line
                  x1="1"
                  y1="7"
                  x2="13"
                  y2="7"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2 1"
                />
                <rect
                  x="4"
                  y="2"
                  width="2.5"
                  height="10"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="8"
                  y="3"
                  width="2.5"
                  height="8"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Center V',
          },
          {
            fn: () => app.align(AlignType.Bottom),
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="2" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <rect
                  x="4"
                  y="3"
                  width="2.5"
                  height="7"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="8"
                  y="5"
                  width="2.5"
                  height="5"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            ),
            t: 'Bottom',
          },
        ].map(({ fn, icon, t }, i) => (
          <SmallBtn key={i} onClick={fn} title={t}>
            {icon}
          </SmallBtn>
        ))}
      </AlignGrid>
      <SmallText style={{ display: 'block', marginTop: 8, marginBottom: 4 }}>Distribute</SmallText>
      <AlignGrid style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <SmallBtn
          onClick={() => app.distribute(DistributeType.Horizontal)}
          title="Distribute Horizontal"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <line x1="1" y1="2" x2="1" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="13" y1="2" x2="13" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <rect x="4" y="4" width="6" height="6" rx="0.5" fill="currentColor" opacity="0.5" />
          </svg>
        </SmallBtn>
        <SmallBtn
          onClick={() => app.distribute(DistributeType.Vertical)}
          title="Distribute Vertical"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <line x1="2" y1="1" x2="12" y2="1" stroke="currentColor" strokeWidth="1.5" />
            <line x1="2" y1="13" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" />
            <rect x="4" y="4" width="6" height="6" rx="0.5" fill="currentColor" opacity="0.5" />
          </svg>
        </SmallBtn>
      </AlignGrid>
      <SmallText style={{ display: 'block', marginTop: 8, marginBottom: 4 }}>Stretch</SmallText>
      <AlignGrid style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <SmallBtn onClick={() => app.stretch(StretchType.Horizontal)} title="Stretch Width">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <line x1="1" y1="2" x2="1" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="13" y1="2" x2="13" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line
              x1="1"
              y1="7"
              x2="13"
              y2="7"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 1"
            />
            <path d="M3 5.5h8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <path d="M3 8.5h8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </svg>
        </SmallBtn>
        <SmallBtn onClick={() => app.stretch(StretchType.Vertical)} title="Stretch Height">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <line x1="2" y1="1" x2="12" y2="1" stroke="currentColor" strokeWidth="1.5" />
            <line x1="2" y1="13" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" />
            <line
              x1="7"
              y1="1"
              x2="7"
              y2="13"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 1"
            />
            <path d="M5.5 3v8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <path d="M8.5 3v8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </svg>
        </SmallBtn>
      </AlignGrid>
    </SectionWrap>
  )
}

// --- Export Section ---
function _downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// --- Node Edit Toggle ---
function NodeEditSection({ shape, app }: { shape: TVShape; app: any }) {
  const isNodeEditing = app.useStore((s: TVSnapshot) => s.appState.nodeEditingId === shape.id)
  const toggleNodeEdit = React.useCallback(() => {
    if (isNodeEditing) {
      app.setNodeEditingId(undefined)
    } else {
      app.setNodeEditingId(shape.id)
    }
  }, [app, shape.id, isNodeEditing])

  return (
    <SectionWrap>
      <SmallBtn onClick={toggleNodeEdit} isActive={isNodeEditing} style={{ width: '100%' }}>
        {isNodeEditing ? 'Exit Edit Mode' : 'Edit Shape'}
      </SmallBtn>
    </SectionWrap>
  )
}

function ExportSection({ shape, app }: { shape: TVShape; app: any }) {
  const [loading, setLoading] = React.useState<string | null>(null)
  const slug = shape.type + '-' + shape.id.slice(0, 6)

  const handleSvg = async () => {
    setLoading('svg')
    try {
      const blob = await app.exportImage(TVExportType.SVG, { ids: [shape.id] })
      if (blob) _downloadBlob(blob, slug + '.svg')
    } catch (e) {
      console.error('SVG export failed', e)
    }
    setLoading(null)
  }

  const handlePng = async () => {
    setLoading('png')
    try {
      const blob = await app.exportImage(TVExportType.PNG, { ids: [shape.id] })
      if (blob) _downloadBlob(blob, slug + '.png')
    } catch (e) {
      console.error('PNG export failed', e)
    }
    setLoading(null)
  }

  const handleJson = () => {
    const json = JSON.stringify(shape, null, 2)
    navigator.clipboard.writeText(json).catch((_e) => {
      /* fallback: already downloading */
    })
    _downloadBlob(new Blob([json], { type: 'application/json' }), slug + '.json')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        <SmallBtn style={{ flex: 1 }} onClick={handleSvg} title="Export as SVG">
          {loading === 'svg' ? '...' : 'SVG'}
        </SmallBtn>
        <SmallBtn style={{ flex: 1 }} onClick={handlePng} title="Export as PNG">
          {loading === 'png' ? '...' : 'PNG'}
        </SmallBtn>
        <SmallBtn style={{ flex: 1 }} onClick={handleJson} title="Copy JSON & download">
          JSON
        </SmallBtn>
      </div>
    </div>
  )
}

// ===================== COLLAPSIBLE =====================
function CollapsibleRow({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <SectionWrap>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        <SectionTitle style={{ marginBottom: 0 }}>{title}</SectionTitle>
        <IconBtn
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
        >
          {open ? '\u2212' : '+'}
        </IconBtn>
      </div>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </SectionWrap>
  )
}

// ===================== STYLES =====================
const Panel = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  '&::-webkit-scrollbar': { width: '3px' },
  '&::-webkit-scrollbar-thumb': { background: '$separator', borderRadius: '2px' },
})

const SectionWrap = styled('div', { padding: '8px 12px' })
const SectionTitle = styled('div', {
  fontSize: '10px',
  fontWeight: 600,
  color: '$textSecondary',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '8px',
})
const Divider = styled('div', { height: '1px', background: '$separator' })
const Hint = styled('div', { fontSize: '10px', color: '$textSecondary', fontStyle: 'italic' })

const FieldGrid = styled('div', { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' })
const FieldRow = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '4px',
})
const FieldLabel = styled('label', {
  fontSize: '9px',
  color: '$textSecondary',
  fontWeight: 500,
  width: '18px',
  flexShrink: 0,
  textAlign: 'right',
  cursor: 'ew-resize',
  userSelect: 'none',
})
const _Unit = styled('span', { fontSize: '9px', color: '$textSecondary' })

const Input = styled('input', {
  width: '100%',
  background: '$inputBg',
  border: '1px solid $inputBorder',
  borderRadius: '$1',
  color: '$text',
  fontSize: '10px',
  padding: '4px 6px',
  fontFamily: '$ui',
  outline: 'none',
  transition: 'border-color 0.1s',
  '&:focus': { borderColor: '$accent' },
  '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { display: 'none' },
})

const SmallText = styled('span', { fontSize: '9px', color: '$textSecondary', fontFamily: '$mono' })

const AlignGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '3px',
})

const BtnGroup = styled('div', { display: 'flex', gap: '2px', flex: 1 })
const SmallBtn = styled('button', {
  all: 'unset',
  flex: 1,
  height: '24px',
  border: '1px solid $separator',
  borderRadius: '$1',
  color: '$textSecondary',
  cursor: 'pointer',
  fontSize: '9px',
  fontFamily: '$ui',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.08s',
  '&:hover': { background: '$hover', color: '$text' },
  variants: {
    isActive: {
      true: {
        background: '$accent',
        borderColor: '$accent',
        color: 'white',
        '&:hover': { background: '$accent', color: 'white' },
      },
    },
  },
})

const IconBtn = styled('button', {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  borderRadius: '$0',
  cursor: 'pointer',
  color: '$textSecondary',
  fontSize: '11px',
  '&:hover': { background: '$hover', color: '$text' },
})

const Toggle = styled('button', {
  all: 'unset',
  width: '28px',
  height: '16px',
  borderRadius: '$pill',
  cursor: 'pointer',
  padding: '2px',
  transition: 'background 0.12s',
  background: '$inputBg',
  variants: { checked: { true: { background: '$accent' } } },
})

const ToggleThumb = styled('div', {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: 'white',
  transition: 'transform 0.12s',
  variants: { checked: { true: { transform: 'translateX(12px)' } } },
})

const LayoutGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: '4px',
  alignItems: 'center',
})

const LockBtn = styled('button', {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: '$1',
  border: '1px solid $separator',
  cursor: 'pointer',
  color: '$textSecondary',
  transition: 'all 0.08s',
  flexShrink: 0,
  '&:hover': { background: '$hover', color: '$text' },
  variants: {
    locked: {
      true: {
        background: 'rgba(13,153,255,0.15)',
        borderColor: '$accent',
        color: '$accent',
      },
    },
  },
})

const Dropdown = styled('div', {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  maxHeight: '140px',
  overflowY: 'auto',
  background: '$panel',
  border: '1px solid $separator',
  borderRadius: '$2',
  zIndex: 1000,
  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  marginTop: '2px',
  '&::-webkit-scrollbar': { width: '3px' },
  '&::-webkit-scrollbar-thumb': { background: '$separator', borderRadius: '2px' },
})

const DropItem = styled('div', {
  padding: '4px 8px',
  fontSize: '10px',
  color: '$text',
  cursor: 'pointer',
  '&:hover': { background: '$hover' },
})
