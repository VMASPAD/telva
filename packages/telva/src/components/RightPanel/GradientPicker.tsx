import * as React from 'react'
import { styled } from '~styles'
import { ColorPicker, pushColorHistory } from './ColorPicker'

// ─── Types ───
export interface GradientStop {
  color: string
  position: number // 0-100
  opacity: number // 0-1
}

export type GradientType = 'linear' | 'radial' | 'conic' | 'diamond'

export interface GradientData {
  type: GradientType
  stops: GradientStop[]
  angle: number
  centerX: number
  centerY: number
}

// ─── Utils ───
export function buildCssGradient(data: GradientData): string {
  const sorted = [...data.stops].sort((a, b) => a.position - b.position)
  const stops = sorted
    .map((s) => {
      const hex = s.color
      const alpha = Math.round(s.opacity * 255)
        .toString(16)
        .padStart(2, '0')
      return `${hex}${alpha} ${s.position}%`
    })
    .join(', ')

  switch (data.type) {
    case 'linear':
      return `linear-gradient(${data.angle}deg, ${stops})`
    case 'radial':
      return `radial-gradient(circle at ${data.centerX}% ${data.centerY}%, ${stops})`
    case 'conic':
      return `conic-gradient(from ${data.angle}deg at ${data.centerX}% ${data.centerY}%, ${stops})`
    case 'diamond':
      return `conic-gradient(from ${data.angle}deg, ${stops})`
  }
}

const DEFAULT_DATA: GradientData = {
  type: 'linear',
  stops: [
    { color: '#0D99FF', position: 0, opacity: 1 },
    { color: '#FF6B00', position: 100, opacity: 1 },
  ],
  angle: 90,
  centerX: 50,
  centerY: 50,
}

// ─── Presets ───
const PRESETS_KEY = 'telva_gradient_presets'
function getPresets(): GradientData[] {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]')
  } catch {
    return []
  }
}
function savePreset(data: GradientData) {
  const presets = getPresets()
  presets.unshift(data)
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.slice(0, 12)))
}
function removePreset(idx: number) {
  const presets = getPresets()
  presets.splice(idx, 1)
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
}

// ─── Type Icons ───
function LinearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0D99FF" />
          <stop offset="100%" stopColor="#FF6B00" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="12" height="12" rx="2" fill="url(#lg)" />
    </svg>
  )
}
function RadialIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <defs>
        <radialGradient id="rg">
          <stop offset="0%" stopColor="#0D99FF" />
          <stop offset="100%" stopColor="#FF6B00" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="12" height="12" rx="2" fill="url(#rg)" />
    </svg>
  )
}
function ConicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <circle cx="7" cy="7" r="6" fill="none" stroke="#0D99FF" strokeWidth="1.5" />
      <line x1="7" y1="7" x2="7" y2="1" stroke="#FF6B00" strokeWidth="1.5" />
    </svg>
  )
}
function DiamondIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <polygon points="7,1 13,7 7,13 1,7" fill="none" stroke="#0D99FF" strokeWidth="1.2" />
      <circle cx="7" cy="7" r="2" fill="#FF6B00" />
    </svg>
  )
}

const TYPE_ICONS: Record<GradientType, React.ReactNode> = {
  linear: <LinearIcon />,
  radial: <RadialIcon />,
  conic: <ConicIcon />,
  diamond: <DiamondIcon />,
}

interface GradientPickerProps {
  value?: GradientData
  onChange: (data: GradientData, css: string) => void
}

export const GradientPicker = React.memo(function GradientPicker({
  value,
  onChange,
}: GradientPickerProps) {
  const [data, setData] = React.useState<GradientData>(value || DEFAULT_DATA)
  const [selectedIdx, setSelectedIdx] = React.useState(0)
  const [showPresets, setShowPresets] = React.useState(false)
  const barRef = React.useRef<HTMLDivElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (value) setData(value)
  }, [value])

  // Handle Delete key for removing selected stop
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (data.stops.length > 2) {
          e.preventDefault()
          removeStopAtIdx(selectedIdx)
        }
      }
    }
    const el = wrapperRef.current
    if (el) {
      el.addEventListener('keydown', onKey)
      return () => el.removeEventListener('keydown', onKey)
    }
    return undefined
  }, [data.stops.length, selectedIdx])

  const update = React.useCallback(
    (patch: Partial<GradientData>) => {
      setData((d) => {
        const next = { ...d, ...patch }
        onChange(next, buildCssGradient(next))
        return next
      })
    },
    [onChange]
  )

  const updateStop = React.useCallback(
    (idx: number, patch: Partial<GradientStop>) => {
      setData((d) => {
        const stops = d.stops.map((s, i) => (i === idx ? { ...s, ...patch } : s))
        const next = { ...d, stops }
        onChange(next, buildCssGradient(next))
        return next
      })
    },
    [onChange]
  )

  const addStop = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!barRef.current || (e.target as HTMLElement).dataset.thumb) return
      const rect = barRef.current.getBoundingClientRect()
      const pos = Math.round(((e.clientX - rect.left) / rect.width) * 100)
      const newStop: GradientStop = { color: '#888888', position: pos, opacity: 1 }
      setData((d) => {
        const stops = [...d.stops, newStop]
        const next = { ...d, stops }
        onChange(next, buildCssGradient(next))
        setSelectedIdx(stops.length - 1)
        return next
      })
    },
    [onChange]
  )

  const removeStopAtIdx = React.useCallback(
    (idx: number) => {
      if (data.stops.length <= 2) return
      setData((d) => {
        const stops = d.stops.filter((_, i) => i !== idx)
        const next = { ...d, stops }
        onChange(next, buildCssGradient(next))
        setSelectedIdx(Math.min(idx, stops.length - 1))
        return next
      })
    },
    [data.stops.length, onChange]
  )

  const onThumbDown = React.useCallback(
    (e: React.PointerEvent, idx: number) => {
      e.preventDefault()
      e.stopPropagation()
      setSelectedIdx(idx)
      const rect = barRef.current!.getBoundingClientRect()
      const onMove = (ev: PointerEvent) => {
        const pos = Math.max(
          0,
          Math.min(100, Math.round(((ev.clientX - rect.left) / rect.width) * 100))
        )
        updateStop(idx, { position: pos })
      }
      const onUp = () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
      }
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [updateStop]
  )

  const cssGrad = buildCssGradient(data)
  const selectedStop = data.stops[selectedIdx]
  const presets = getPresets()

  return (
    <Wrapper
      ref={wrapperRef}
      tabIndex={-1}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Type selector */}
      <TypeRow>
        {(['linear', 'radial', 'conic', 'diamond'] as const).map((t) => (
          <TypeBtn
            key={t}
            $active={data.type === t}
            onClick={() => update({ type: t })}
            title={t.charAt(0).toUpperCase() + t.slice(1)}
          >
            {TYPE_ICONS[t]}
            <TypeLabel>{t.charAt(0).toUpperCase() + t.slice(1)}</TypeLabel>
          </TypeBtn>
        ))}
      </TypeRow>

      {/* Preview */}
      <PreviewBox style={{ background: cssGrad }} />

      {/* Gradient bar + stop thumbs */}
      <BarSection>
        <BarLabel>Stops ({data.stops.length})</BarLabel>
        <BarContainer ref={barRef} onClick={addStop}>
          <GradientBar style={{ background: cssGrad }} />
          {data.stops.map((stop, i) => (
            <StopThumb
              key={i}
              data-thumb="true"
              $selected={i === selectedIdx}
              style={{ left: `${stop.position}%`, backgroundColor: stop.color }}
              onPointerDown={(e) => onThumbDown(e, i)}
              onDoubleClick={() => removeStopAtIdx(i)}
            />
          ))}
        </BarContainer>
        <BarHint>Click to add · Double-click to remove · Drag to move</BarHint>
      </BarSection>

      {/* Selected stop position */}
      {selectedStop && (
        <StopPosRow>
          <StopPosLabel>Stop {selectedIdx + 1}</StopPosLabel>
          <GeomInput
            type="number"
            min={0}
            max={100}
            value={selectedStop.position}
            onChange={(e) =>
              updateStop(selectedIdx, {
                position: Math.max(0, Math.min(100, Number(e.target.value))),
              })
            }
            onKeyDown={(e) => e.stopPropagation()}
          />
          <GeomLabel>%</GeomLabel>
        </StopPosRow>
      )}

      {/* Selected stop's color picker */}
      {selectedStop && (
        <ColorPicker
          color={selectedStop.color}
          opacity={selectedStop.opacity}
          onChange={(c, a) => {
            updateStop(selectedIdx, { color: c, opacity: a })
            if (c !== 'transparent') pushColorHistory(c)
          }}
          showTransparent={false}
        />
      )}

      {/* Geometry controls */}
      <GeomSection>
        <GeomSectionTitle>Geometry</GeomSectionTitle>
        {(data.type === 'linear' || data.type === 'conic') && (
          <GeomRow>
            <GeomLabel>Angle</GeomLabel>
            <AngleDial
              style={{ transform: `rotate(${data.angle}deg)` }}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                const cx = rect.left + rect.width / 2,
                  cy = rect.top + rect.height / 2
                const onMove = (ev: PointerEvent) => {
                  const ang = Math.round(
                    Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI) + 90
                  )
                  update({ angle: ((ang % 360) + 360) % 360 })
                }
                const onUp = () => {
                  document.removeEventListener('pointermove', onMove)
                  document.removeEventListener('pointerup', onUp)
                }
                document.addEventListener('pointermove', onMove)
                document.addEventListener('pointerup', onUp)
              }}
            >
              <DialLine />
            </AngleDial>
            <GeomInput
              type="number"
              value={data.angle}
              onChange={(e) => update({ angle: ((Number(e.target.value) % 360) + 360) % 360 })}
              onKeyDown={(e) => e.stopPropagation()}
            />
            <GeomLabel>°</GeomLabel>
          </GeomRow>
        )}
        {(data.type === 'radial' || data.type === 'conic' || data.type === 'diamond') && (
          <GeomRow>
            <GeomLabel>Center</GeomLabel>
            <GeomLabel>X</GeomLabel>
            <GeomInput
              type="number"
              min={0}
              max={100}
              value={data.centerX}
              onChange={(e) => update({ centerX: Number(e.target.value) })}
              onKeyDown={(e) => e.stopPropagation()}
            />
            <GeomLabel>%</GeomLabel>
            <GeomLabel style={{ marginLeft: 4 }}>Y</GeomLabel>
            <GeomInput
              type="number"
              min={0}
              max={100}
              value={data.centerY}
              onChange={(e) => update({ centerY: Number(e.target.value) })}
              onKeyDown={(e) => e.stopPropagation()}
            />
            <GeomLabel>%</GeomLabel>
          </GeomRow>
        )}
      </GeomSection>

      {/* Actions */}
      <ActionRow>
        <ActionBtn
          onClick={() => {
            const reversed = [...data.stops].map((s) => ({ ...s, position: 100 - s.position }))
            update({ stops: reversed })
          }}
          title="Reverse gradient"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M1 6h10M3 4l-2 2 2 2M9 4l2 2-2 2"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
            />
          </svg>
          Reverse
        </ActionBtn>
        <ActionBtn
          onClick={() => removeStopAtIdx(selectedIdx)}
          disabled={data.stops.length <= 2}
          title="Remove selected stop"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Remove
        </ActionBtn>
        <ActionBtn
          onClick={() => {
            savePreset(data)
            setShowPresets(true)
          }}
          title="Save as preset"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 2h8v8H2z" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M4 2v3h4V2" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <rect x="3" y="7" width="6" height="1" fill="currentColor" opacity="0.5" />
          </svg>
          Save
        </ActionBtn>
      </ActionRow>

      {/* Presets */}
      {(showPresets || presets.length > 0) && (
        <PresetsSection>
          <PresetsTitle onClick={() => setShowPresets(!showPresets)}>
            Presets ({presets.length})<PresetsToggle>{showPresets ? '−' : '+'}</PresetsToggle>
          </PresetsTitle>
          {showPresets && (
            <PresetsGrid>
              {presets.map((p, i) => (
                <PresetSwatch
                  key={i}
                  style={{ background: buildCssGradient(p) }}
                  onClick={() => {
                    setData(p)
                    onChange(p, buildCssGradient(p))
                    setSelectedIdx(0)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    removePreset(i)
                    setShowPresets(true)
                  }}
                  title="Click to apply · Right-click to remove"
                />
              ))}
              {presets.length === 0 && <BarHint>No presets saved yet</BarHint>}
            </PresetsGrid>
          )}
        </PresetsSection>
      )}
    </Wrapper>
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
  gap: '8px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
  outline: 'none',
})

const TypeRow = styled('div', {
  display: 'flex',
  gap: 2,
  background: '$inputBg',
  borderRadius: 6,
  padding: 2,
})

const TypeBtn = styled('button', {
  all: 'unset',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  fontSize: '8px',
  fontWeight: 600,
  textAlign: 'center',
  padding: '5px 0',
  borderRadius: 4,
  color: '$textSecondary',
  cursor: 'pointer',
  transition: 'all 0.12s',
  '&:hover': { color: '$text' },
  variants: {
    $active: {
      true: {
        background: '$accent',
        color: '#fff',
      },
    },
  },
})

const TypeLabel = styled('span', {
  fontSize: '7px',
  fontWeight: 500,
  letterSpacing: '0.02em',
})

const PreviewBox = styled('div', {
  width: '100%',
  height: 40,
  borderRadius: 6,
  border: '1px solid $separator',
})

const BarSection = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
})

const BarLabel = styled('span', {
  fontSize: '8px',
  color: '$textSecondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
})

const BarContainer = styled('div', {
  position: 'relative',
  height: 24,
  borderRadius: 6,
  cursor: 'crosshair',
  overflow: 'visible',
})

const GradientBar = styled('div', {
  width: '100%',
  height: '100%',
  borderRadius: 6,
  border: '1px solid $separator',
})

const StopThumb = styled('div', {
  position: 'absolute',
  top: '50%',
  width: 14,
  height: 14,
  borderRadius: '50%',
  border: '2px solid #fff',
  transform: 'translate(-50%, -50%)',
  cursor: 'ew-resize',
  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
  transition: 'box-shadow 0.08s',
  zIndex: 2,
  variants: {
    $selected: {
      true: {
        boxShadow: '0 0 0 2px $colors$accent, 0 1px 4px rgba(0,0,0,0.5)',
        zIndex: 3,
        width: 16,
        height: 16,
      },
    },
  },
})

const BarHint = styled('span', {
  fontSize: '7px',
  color: '$textSecondary',
  fontStyle: 'italic',
  opacity: 0.6,
})

const StopPosRow = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
})

const StopPosLabel = styled('span', {
  fontSize: '8px',
  color: '$textSecondary',
  fontWeight: 500,
  flex: 1,
})

const GeomSection = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  borderTop: '1px solid $separator',
  paddingTop: 8,
})

const GeomSectionTitle = styled('span', {
  fontSize: '8px',
  color: '$textSecondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
})

const GeomRow = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
})

const GeomLabel = styled('span', {
  fontSize: '8px',
  color: '$textSecondary',
  fontWeight: 500,
})

const GeomInput = styled('input', {
  width: 40,
  background: '$inputBg',
  border: '1px solid $inputBorder',
  borderRadius: 4,
  color: '$text',
  fontSize: '9px',
  padding: '3px 4px',
  fontFamily: '$mono',
  textAlign: 'center',
  outline: 'none',
  '&:focus': { borderColor: '$accent' },
  '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { display: 'none' },
})

const AngleDial = styled('div', {
  width: 28,
  height: 28,
  borderRadius: '50%',
  border: '1px solid $inputBorder',
  background: '$inputBg',
  cursor: 'pointer',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

const DialLine = styled('div', {
  width: 2,
  height: '40%',
  background: '$accent',
  borderRadius: 1,
  position: 'absolute',
  top: 3,
  left: '50%',
  transform: 'translateX(-50%)',
})

const ActionRow = styled('div', {
  display: 'flex',
  gap: 3,
  borderTop: '1px solid $separator',
  paddingTop: 8,
})

const ActionBtn = styled('button', {
  all: 'unset',
  flex: 1,
  fontSize: '8px',
  fontWeight: 500,
  textAlign: 'center',
  padding: '5px 0',
  borderRadius: 4,
  color: '$textSecondary',
  border: '1px solid $separator',
  cursor: 'pointer',
  transition: 'all 0.1s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  '&:hover': { background: '$hover', color: '$text' },
  '&:disabled': { opacity: 0.3, cursor: 'default' },
})

const PresetsSection = styled('div', {
  borderTop: '1px solid $separator',
  paddingTop: 6,
})

const PresetsTitle = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '8px',
  color: '$textSecondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  '&:hover': { color: '$text' },
})

const PresetsToggle = styled('span', {
  fontSize: '10px',
  color: '$textSecondary',
})

const PresetsGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 4,
  marginTop: 6,
})

const PresetSwatch = styled('div', {
  height: 24,
  borderRadius: 4,
  border: '1px solid $separator',
  cursor: 'pointer',
  transition: 'transform 0.08s, box-shadow 0.08s',
  '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 0 1px $colors$accent' },
})
