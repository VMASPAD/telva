import * as React from 'react'
import { styled } from '~styles'

interface DraggableInputProps {
  value: number
  onChange: (value: number) => void
  label?: string
  min?: number
  max?: number
  step?: number
  suffix?: string
  style?: React.CSSProperties
  labelWidth?: number
}

export const DraggableInput = React.memo(function DraggableInput({
  value,
  onChange,
  label,
  min = -Infinity,
  max = Infinity,
  step = 1,
  suffix,
  style,
  labelWidth = 18,
}: DraggableInputProps) {
  const [editing, setEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(String(value))
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dragRef = React.useRef({ active: false, startX: 0, startVal: 0 })

  React.useEffect(() => {
    if (!editing) setEditValue(String(Math.round(value * 100) / 100))
  }, [value, editing])

  const clamp = (v: number) => Math.min(max, Math.max(min, v))

  // Drag from label
  const onLabelPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLLabelElement>) => {
      e.preventDefault()
      e.stopPropagation()
      dragRef.current = { active: true, startX: e.clientX, startVal: value }
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)

      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current.active) return
        const dx = ev.clientX - dragRef.current.startX
        const speed = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1
        const delta = Math.round(dx * speed * step)
        onChange(clamp(dragRef.current.startVal + delta))
      }

      const onUp = () => {
        dragRef.current.active = false
        el.releasePointerCapture(e.pointerId)
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [value, onChange, min, max, step]
  )

  // Drag from value display
  const onValuePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const startVal = value
      let dragged = false
      dragRef.current = { active: true, startX, startVal }

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX
        if (Math.abs(dx) > 2) dragged = true
        if (!dragged) return
        const speed = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1
        const delta = Math.round(dx * speed * step)
        onChange(clamp(startVal + delta))
      }

      const onUp = () => {
        dragRef.current.active = false
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        if (!dragged) {
          setEditing(true)
          setTimeout(() => inputRef.current?.select(), 0)
        }
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [value, onChange, min, max, step]
  )

  const commitEdit = React.useCallback(() => {
    setEditing(false)
    const n = parseFloat(editValue)
    if (!isNaN(n)) onChange(clamp(n))
  }, [editValue, onChange, min, max])

  return (
    <Wrap style={style}>
      {label && (
        <DragLabel
          style={{ width: labelWidth, cursor: 'ew-resize' }}
          onPointerDown={onLabelPointerDown}
        >
          {label}
        </DragLabel>
      )}
      {editing ? (
        <StyledInput
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') setEditing(false)
            e.stopPropagation()
          }}
          autoFocus
        />
      ) : (
        <ValueDisplay onPointerDown={onValuePointerDown}>
          {Math.round(value * 100) / 100}
          {suffix && <Suffix>{suffix}</Suffix>}
        </ValueDisplay>
      )}
    </Wrap>
  )
})

const Wrap = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  minWidth: 0,
})

const DragLabel = styled('label', {
  fontSize: '9px',
  color: '$textSecondary',
  fontWeight: 500,
  flexShrink: 0,
  textAlign: 'right',
  userSelect: 'none',
  cursor: 'ew-resize',
  '&:active': { cursor: 'ew-resize' },
})

const StyledInput = styled('input', {
  width: '100%',
  background: '$inputBg',
  border: '1px solid $accent',
  borderRadius: '$1',
  color: '$text',
  fontSize: '10px',
  padding: '3px 5px',
  fontFamily: '$mono',
  outline: 'none',
  '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { display: 'none' },
})

const ValueDisplay = styled('div', {
  flex: 1,
  background: '$inputBg',
  border: '1px solid $inputBorder',
  borderRadius: '$1',
  color: '$text',
  fontSize: '10px',
  padding: '3px 5px',
  fontFamily: '$mono',
  cursor: 'ew-resize',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  transition: 'border-color 0.1s',
  '&:hover': { borderColor: '$accent' },
})

const Suffix = styled('span', {
  fontSize: '8px',
  color: '$textSecondary',
  marginLeft: '1px',
})
