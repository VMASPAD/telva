import * as React from 'react'
import { styled } from '~styles'

// ─── Color Utilities ───
export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = h / 360
  s = s / 100
  v = v / 100
  let r = 0,
    g = 0,
    b = 0
  const i = Math.floor(h * 6),
    f = h * 6 - i,
    p = v * (1 - s),
    q = v * (1 - f * s),
    t = v * (1 - (1 - f) * s)
  switch (i % 6) {
    case 0:
      r = v
      g = t
      b = p
      break
    case 1:
      r = q
      g = v
      b = p
      break
    case 2:
      r = p
      g = v
      b = t
      break
    case 3:
      r = p
      g = q
      b = v
      break
    case 4:
      r = t
      g = p
      b = v
      break
    case 5:
      r = v
      g = p
      b = q
      break
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b),
    d = mx - mn
  let h = 0
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }
  const s = mx === 0 ? 0 : Math.round((d / mx) * 100)
  const v = Math.round(mx * 100)
  return [h, s, v]
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return [0, 0, 0]
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
}

// ─── History ───
const HISTORY_KEY = 'telva_color_history'
export function getColorHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]').slice(0, 16)
  } catch {
    return []
  }
}
export function pushColorHistory(hex: string) {
  if (hex === 'transparent') return
  const h = getColorHistory().filter((c) => c !== hex)
  h.unshift(hex)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 16)))
}

// ─── Checker pattern for transparent ───
const CHECKER =
  'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIElEQVQYV2P8////fwYkwMjIyIjCZmBgYEBlMDIiiwEAGiYFA/wQA1AAAAAASUVORK5CYII=")'
export { CHECKER }

interface ColorPickerProps {
  color: string
  opacity?: number
  onChange: (color: string, opacity: number) => void
  showTransparent?: boolean
  showOpacity?: boolean
}

export const ColorPicker = React.memo(function ColorPicker({
  color,
  opacity = 1,
  onChange,
  showTransparent = true,
  showOpacity = true,
}: ColorPickerProps) {
  const isTransparent = color === 'transparent'
  const rgb = isTransparent ? ([255, 255, 255] as [number, number, number]) : hexToRgb(color)
  const [hsv, setHsv] = React.useState<[number, number, number]>(() => rgbToHsv(...rgb))

  React.useEffect(() => {
    if (!isTransparent) {
      const newRgb = hexToRgb(color)
      const newHsv = rgbToHsv(...newRgb)
      setHsv(newHsv)
    }
  }, [color])

  const satCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const hueCanvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = satCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width,
      h = canvas.height
    const [r, g, b] = hsvToRgb(hsv[0], 100, 100)
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(0, 0, w, h)
    const gw = ctx.createLinearGradient(0, 0, w, 0)
    gw.addColorStop(0, 'rgba(255,255,255,1)')
    gw.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gw
    ctx.fillRect(0, 0, w, h)
    const gb = ctx.createLinearGradient(0, 0, 0, h)
    gb.addColorStop(0, 'rgba(0,0,0,0)')
    gb.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = gb
    ctx.fillRect(0, 0, w, h)
  }, [hsv[0]])

  React.useEffect(() => {
    const canvas = hueCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const g = ctx.createLinearGradient(0, 0, w, 0)
    for (let i = 0; i <= 6; i++) {
      const [r, gb2, b] = hsvToRgb((i / 6) * 360, 100, 100)
      g.addColorStop(i / 6, `rgb(${r},${gb2},${b})`)
    }
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, canvas.height)
  }, [])

  const emit = React.useCallback(
    (h: number, s: number, v: number, a: number) => {
      const [r, g, b] = hsvToRgb(h, s, v)
      const hex = rgbToHex(r, g, b)
      pushColorHistory(hex)
      onChange(hex, a)
    },
    [onChange]
  )

  const onSatDown = React.useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const canvas = satCanvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const update = (ev: { clientX: number; clientY: number }) => {
        const s = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100))
        const v = Math.max(0, Math.min(100, (1 - (ev.clientY - rect.top) / rect.height) * 100))
        setHsv([hsv[0], s, v])
        emit(hsv[0], s, v, opacity)
      }
      update(e)
      const onMove = (ev: PointerEvent) => update(ev)
      const onUp = () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
      }
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [hsv, opacity, emit]
  )

  const onHueDown = React.useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const canvas = hueCanvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const update = (ev: { clientX: number }) => {
        const h = Math.max(0, Math.min(360, ((ev.clientX - rect.left) / rect.width) * 360))
        setHsv([h, hsv[1], hsv[2]])
        emit(h, hsv[1], hsv[2], opacity)
      }
      update(e)
      const onMove = (ev: PointerEvent) => update(ev)
      const onUp = () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
      }
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [hsv, opacity, emit]
  )

  const opacityBarRef = React.useRef<HTMLDivElement>(null)
  const onOpacityDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const bar = opacityBarRef.current!
      const rect = bar.getBoundingClientRect()
      const update = (ev: { clientX: number }) => {
        const a = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
        if (!isTransparent) emit(hsv[0], hsv[1], hsv[2], a)
        else onChange('transparent', a)
      }
      update(e)
      const onMove = (ev: PointerEvent) => update(ev)
      const onUp = () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
      }
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [hsv, isTransparent, emit, onChange]
  )

  const currentHex = isTransparent ? 'transparent' : rgbToHex(...hsvToRgb(hsv[0], hsv[1], hsv[2]))
  const currentRgb = isTransparent ? [255, 255, 255] : hsvToRgb(hsv[0], hsv[1], hsv[2])

  return (
    <Wrapper onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <SatPanel>
        <canvas
          ref={satCanvasRef}
          width={200}
          height={130}
          onPointerDown={onSatDown}
          style={{ width: '100%', height: '100%', cursor: 'crosshair', borderRadius: 4 }}
        />
        {!isTransparent && (
          <SatMarker
            style={{
              left: `${hsv[1]}%`,
              top: `${100 - hsv[2]}%`,
              borderColor: hsv[2] > 50 ? '#000' : '#fff',
            }}
          />
        )}
      </SatPanel>

      <BarWrap>
        <canvas
          ref={hueCanvasRef}
          width={200}
          height={12}
          onPointerDown={onHueDown}
          style={{ width: '100%', height: '100%', cursor: 'pointer', borderRadius: 6 }}
        />
        {!isTransparent && <BarThumb style={{ left: `${(hsv[0] / 360) * 100}%` }} />}
      </BarWrap>

      {showOpacity && (
        <BarWrap>
          <OpacityBar
            ref={opacityBarRef}
            onPointerDown={onOpacityDown}
            style={{
              background: `linear-gradient(to right, transparent, ${
                currentHex === 'transparent' ? '#fff' : currentHex
              })`,
              cursor: 'pointer',
            }}
          />
          <BarThumb style={{ left: `${opacity * 100}%` }} />
        </BarWrap>
      )}

      <InputRow>
        <HexInput
          value={isTransparent ? '' : currentHex.replace('#', '')}
          placeholder="hex"
          maxLength={6}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
            if (v.length === 6) {
              const r2 = hexToRgb('#' + v)
              setHsv(rgbToHsv(...r2))
              onChange('#' + v, opacity)
              pushColorHistory('#' + v)
            }
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        {[0, 1, 2].map((i) => (
          <RgbInput
            key={i}
            value={currentRgb[i]}
            type="number"
            min={0}
            max={255}
            onChange={(e) => {
              const v = Math.max(0, Math.min(255, Number(e.target.value)))
              const newRgb = [...currentRgb] as [number, number, number]
              newRgb[i] = v
              setHsv(rgbToHsv(...newRgb))
              const hex = rgbToHex(...newRgb)
              onChange(hex, opacity)
              pushColorHistory(hex)
            }}
            onKeyDown={(e) => e.stopPropagation()}
          />
        ))}
        {showOpacity && (
          <RgbInput
            value={Math.round(opacity * 100)}
            type="number"
            min={0}
            max={100}
            onChange={(e) => {
              const a = Math.max(0, Math.min(100, Number(e.target.value))) / 100
              if (!isTransparent) emit(hsv[0], hsv[1], hsv[2], a)
              else onChange('transparent', a)
            }}
            onKeyDown={(e) => e.stopPropagation()}
            style={{ width: 32 }}
          />
        )}
      </InputRow>
      <InputLabels>
        <span style={{ flex: 2 }}>Hex</span>
        <span>R</span>
        <span>G</span>
        <span>B</span>
        {showOpacity && <span>A</span>}
      </InputLabels>

      <SwatchRow>
        {showTransparent && (
          <Swatch
            title="Transparent"
            $active={isTransparent}
            style={{ backgroundImage: CHECKER, backgroundSize: '6px 6px' }}
            onClick={() => onChange('transparent', opacity)}
          />
        )}
        {getColorHistory().map((c) => (
          <Swatch
            key={c}
            style={{ backgroundColor: c }}
            $active={currentHex === c}
            onClick={() => {
              const r2 = hexToRgb(c)
              setHsv(rgbToHsv(...r2))
              onChange(c, opacity)
            }}
          />
        ))}
      </SwatchRow>
    </Wrapper>
  )
})

// ─── Inline Color Swatch (for use in property rows) ───
interface ColorSwatchInputProps {
  color: string
  opacity?: number
  onChange: (color: string, opacity: number) => void
  showTransparent?: boolean
  showOpacity?: boolean
  label?: string
}

export const ColorSwatchInput = React.memo(function ColorSwatchInput({
  color,
  opacity = 1,
  onChange,
  showTransparent = true,
  showOpacity = true,
  label,
}: ColorSwatchInputProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const isTransparent = color === 'transparent'

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const displayHex = isTransparent ? 'transparent' : color

  return (
    <SwatchInputWrap ref={ref}>
      <SwatchInputRow>
        {label && <SwatchLabel>{label}</SwatchLabel>}
        <SwatchPreview
          onClick={() => setOpen(!open)}
          style={{
            backgroundColor: isTransparent ? 'transparent' : color,
            backgroundImage: isTransparent ? CHECKER : 'none',
            backgroundSize: '6px 6px',
          }}
        />
        <SwatchHexText
          value={isTransparent ? '' : displayHex.replace('#', '').toUpperCase()}
          placeholder="—"
          maxLength={6}
          onChange={(e) => {
            const v = e.target.value
            if (v.toLowerCase() === 'transparent') {
              onChange('transparent', opacity)
              return
            }
            const clean = v.replace(/[^0-9a-fA-F#]/g, '').slice(0, 7)
            if (/^#[0-9a-fA-F]{6}$/i.test(clean) || /^[0-9a-fA-F]{6}$/i.test(clean)) {
              const hex = clean.startsWith('#') ? clean : '#' + clean
              onChange(hex, opacity)
              pushColorHistory(hex)
            }
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        <SwatchOpacityText>{Math.round(opacity * 100)}%</SwatchOpacityText>
      </SwatchInputRow>
      {open && (
        <SwatchPopover>
          <ColorPicker
            color={color}
            opacity={opacity}
            onChange={(c, a) => onChange(c, a)}
            showTransparent={showTransparent}
            showOpacity={showOpacity}
          />
        </SwatchPopover>
      )}
    </SwatchInputWrap>
  )
})

// ─── Styles ───
const Wrapper = styled('div', {
  background: '$panel',
  border: '1px solid $separator',
  borderRadius: '8px',
  padding: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
  minWidth: 210,
})

const SatPanel = styled('div', {
  position: 'relative',
  width: '100%',
  height: 130,
  borderRadius: 4,
  overflow: 'hidden',
})

const SatMarker = styled('div', {
  position: 'absolute',
  width: 10,
  height: 10,
  borderRadius: '50%',
  border: '2px solid white',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
  boxShadow: '0 0 2px rgba(0,0,0,0.5)',
})

const BarWrap = styled('div', {
  position: 'relative',
  width: '100%',
  height: 12,
  borderRadius: 6,
  overflow: 'visible',
})

const BarThumb = styled('div', {
  position: 'absolute',
  top: '50%',
  width: 14,
  height: 14,
  borderRadius: '50%',
  background: '#fff',
  border: '2px solid rgba(0,0,0,0.2)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
})

const OpacityBar = styled('div', {
  width: '100%',
  height: '100%',
  borderRadius: 6,
  backgroundImage: CHECKER,
  backgroundSize: '8px 8px',
  position: 'relative',
})

const InputRow = styled('div', {
  display: 'flex',
  gap: 3,
  alignItems: 'center',
})

const InputLabels = styled('div', {
  display: 'flex',
  gap: 3,
  fontSize: '7px',
  color: 'rgba(255,255,255,0.35)',
  padding: '0 1px',
  '& > span': { flex: 1, textAlign: 'center' },
})

const HexInput = styled('input', {
  flex: 2,
  background: '$inputBg',
  border: '1px solid $inputBorder',
  borderRadius: 4,
  color: '$text',
  fontSize: '9px',
  padding: '3px 5px',
  fontFamily: '$mono',
  outline: 'none',
  textTransform: 'uppercase',
  '&:focus': { borderColor: '$accent' },
  '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { display: 'none' },
})

const RgbInput = styled('input', {
  flex: 1,
  width: 28,
  background: '$inputBg',
  border: '1px solid $inputBorder',
  borderRadius: 4,
  color: '$text',
  fontSize: '9px',
  padding: '3px 4px',
  fontFamily: '$mono',
  outline: 'none',
  textAlign: 'center',
  '&:focus': { borderColor: '$accent' },
  '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { display: 'none' },
})

const SwatchRow = styled('div', {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 3,
  paddingTop: 2,
})

const Swatch = styled('div', {
  width: 18,
  height: 18,
  borderRadius: 3,
  cursor: 'pointer',
  border: '1px solid $separator',
  transition: 'transform 0.08s, box-shadow 0.08s',
  '&:hover': { transform: 'scale(1.15)' },
  variants: {
    $active: {
      true: {
        boxShadow: '0 0 0 2px $colors$accent',
        transform: 'scale(1.1)',
      },
    },
  },
})

const SwatchInputWrap = styled('div', {
  position: 'relative',
  width: '100%',
})

const SwatchInputRow = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
})

const SwatchLabel = styled('label', {
  fontSize: '9px',
  color: '$textSecondary',
  fontWeight: 500,
  width: 36,
  flexShrink: 0,
  textAlign: 'right',
})

const SwatchPreview = styled('div', {
  width: 20,
  height: 20,
  borderRadius: '$0',
  border: '1px solid $separator',
  flexShrink: 0,
  cursor: 'pointer',
  transition: 'box-shadow 0.08s',
  '&:hover': { boxShadow: '0 0 0 1px $colors$accent' },
})

const SwatchHexText = styled('input', {
  flex: 1,
  background: '$inputBg',
  border: '1px solid $inputBorder',
  borderRadius: '$1',
  color: '$text',
  fontSize: '9px',
  padding: '3px 5px',
  fontFamily: '$mono',
  outline: 'none',
  textTransform: 'uppercase',
  '&:focus': { borderColor: '$accent' },
})

const SwatchOpacityText = styled('span', {
  fontSize: '9px',
  color: '$textSecondary',
  fontFamily: '$mono',
  width: 32,
  textAlign: 'initial',
  flexShrink: 0,
})

const SwatchPopover = styled('div', {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1000,
  marginTop: 4,
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  borderRadius: '$2',
  overflow: 'visible',
})
