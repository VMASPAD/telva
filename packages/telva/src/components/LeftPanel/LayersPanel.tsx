import {
  ChevronDownIcon,
  ChevronRightIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  LockClosedIcon,
  LockOpen1Icon,
} from '@radix-ui/react-icons'
import * as React from 'react'
import { useTelvaApp } from '~hooks'
import { styled } from '~styles'
import { GroupShape, TVShape, TVShapeType, TVSnapshot } from '~types'
import { ComponentsTab } from './ComponentsTab'

// --- Selectors ---
const shapesSelector = (s: TVSnapshot) => {
  const page = s.document.pages[s.appState.currentPageId]
  return Object.values(page.shapes).sort((a, b) => b.childIndex - a.childIndex)
}

const selectedIdsSelector = (s: TVSnapshot) =>
  s.document.pageStates[s.appState.currentPageId].selectedIds

// --- Shape type icons ---
const shapeIcons: Record<string, React.ReactNode> = {
  [TVShapeType.Draw]: (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <path
        d="M2 12C4 8 8 4 10 6C12 8 13 3 13 3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  [TVShapeType.Rectangle]: (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <rect
        x="2"
        y="3"
        width="11"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  ),
  [TVShapeType.Ellipse]: (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <ellipse
        cx="7.5"
        cy="7.5"
        rx="5.5"
        ry="4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  ),
  [TVShapeType.Triangle]: (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 2L13 13H2L7.5 2Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  ),
  [TVShapeType.Arrow]: (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <path
        d="M3 12L12 3M12 3H6M12 3V9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  [TVShapeType.Text]: (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <path d="M3 3H12M7.5 3V12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  [TVShapeType.Sticky]: (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <rect
        x="2"
        y="2"
        width="11"
        height="11"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <path d="M5 6H10M5 9H8" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  ),
  [TVShapeType.Line]: (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <line
        x1="2"
        y1="13"
        x2="13"
        y2="2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  [TVShapeType.Image]: (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <rect
        x="2"
        y="3"
        width="11"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <circle cx="5" cy="6" r="1" fill="currentColor" />
    </svg>
  ),
  [TVShapeType.Video]: (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <rect
        x="2"
        y="3"
        width="11"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <path d="M6 6V9L9 7.5L6 6Z" fill="currentColor" />
    </svg>
  ),
  [TVShapeType.Group]: (
    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
      <rect
        x="1"
        y="4"
        width="8"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <rect
        x="5"
        y="2"
        width="8"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  ),
}

// --- Main component with tabs ---
export const LayersPanel = React.memo(function LayersPanel() {
  const [activeTab, setActiveTab] = React.useState<'layers' | 'components'>('layers')

  return (
    <StyledPanel
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <StyledTabBar>
        <StyledTab isActive={activeTab === 'layers'} onClick={() => setActiveTab('layers')}>
          Layers
        </StyledTab>
        <StyledTab isActive={activeTab === 'components'} onClick={() => setActiveTab('components')}>
          Components
        </StyledTab>
      </StyledTabBar>
      {activeTab === 'layers' ? <LayersList /> : <ComponentsTab />}
    </StyledPanel>
  )
})

// --- Layers list ---
function LayersList() {
  const app = useTelvaApp()
  const allShapes = app.useStore(shapesSelector)
  const selectedIds = app.useStore(selectedIdsSelector)
  const [dragOverInfo, setDragOverInfo] = React.useState<{
    id: string
    position: 'before' | 'after'
  } | null>(null)
  const draggingId = React.useRef<string | null>(null)

  const topLevelShapes = React.useMemo(
    () => allShapes.filter((s) => s.parentId === app.currentPageId),
    [allShapes, app.currentPageId]
  )

  const handleReorder = React.useCallback(
    (fromId: string, targetId: string, position: 'before' | 'after') => {
      if (fromId === targetId) return
      const sorted = [...topLevelShapes]
      const fromIdx = sorted.findIndex((s) => s.id === fromId)
      if (fromIdx === -1) return
      const reordered = sorted.filter((s) => s.id !== fromId)
      const newToIdx = reordered.findIndex((s) => s.id === targetId)
      if (newToIdx === -1) return
      const insertAt = position === 'before' ? newToIdx : newToIdx + 1
      reordered.splice(insertAt, 0, sorted[fromIdx])
      const total = reordered.length
      const updates: Record<string, { childIndex: number }> = {}
      reordered.forEach((s, i) => {
        updates[s.id] = { childIndex: total - i }
      })
      app.patchState(
        { document: { pages: { [app.currentPageId]: { shapes: updates } } } },
        'reorder_layers'
      )
    },
    [topLevelShapes, app]
  )

  return (
    <StyledList
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => {
        draggingId.current = null
        setDragOverInfo(null)
      }}
    >
      {topLevelShapes.length === 0 ? (
        <StyledEmpty>No elements on canvas</StyledEmpty>
      ) : (
        topLevelShapes.map((shape) => (
          <LayerItem
            key={shape.id}
            shape={shape}
            allShapes={allShapes}
            selectedIds={selectedIds}
            app={app}
            depth={0}
            dragOverInfo={dragOverInfo}
            onLayerDragStart={(id) => {
              draggingId.current = id
            }}
            onLayerDragOver={(id, pos) => setDragOverInfo({ id, position: pos })}
            onLayerDrop={(targetId, pos) => {
              if (draggingId.current) handleReorder(draggingId.current, targetId, pos)
              draggingId.current = null
              setDragOverInfo(null)
            }}
            onLayerDragEnd={() => {
              draggingId.current = null
              setDragOverInfo(null)
            }}
          />
        ))
      )}
    </StyledList>
  )
}

// --- LayerItem with accordion for groups ---
function LayerItem({
  shape,
  allShapes,
  selectedIds,
  app,
  depth,
  dragOverInfo,
  onLayerDragStart,
  onLayerDragOver,
  onLayerDrop,
  onLayerDragEnd,
}: {
  shape: TVShape
  allShapes: TVShape[]
  selectedIds: string[]
  app: any
  depth: number
  dragOverInfo?: { id: string; position: 'before' | 'after' } | null
  onLayerDragStart?: (id: string) => void
  onLayerDragOver?: (id: string, position: 'before' | 'after') => void
  onLayerDrop?: (targetId: string, position: 'before' | 'after') => void
  onLayerDragEnd?: () => void
}) {
  const isSelected = selectedIds.includes(shape.id)
  const isGroup = shape.type === TVShapeType.Group
  const children = isGroup ? (shape as GroupShape).children || [] : []
  const hasChildren = children.length > 0
  const [expanded, setExpanded] = React.useState(true)

  const handleSelect = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (e.shiftKey) {
        if (isSelected) app.deselect(shape.id)
        else app.select(...selectedIds, shape.id)
      } else {
        app.select(shape.id)
      }
    },
    [app, shape.id, selectedIds, isSelected]
  )

  const handleToggleVisibility = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      app.toggleHidden([shape.id])
    },
    [app, shape.id]
  )

  const handleToggleLock = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      app.toggleLocked([shape.id])
    },
    [app, shape.id]
  )

  const icon = shapeIcons[shape.type] || shapeIcons[TVShapeType.Rectangle]
  const name = shape.name || shape.type

  const childShapes = React.useMemo(() => {
    if (!hasChildren) return []
    return children.map((id) => allShapes.find((s) => s.id === id)).filter(Boolean) as TVShape[]
  }, [hasChildren, children, allShapes])

  const isDragTarget = dragOverInfo?.id === shape.id
  const dropStyle: React.CSSProperties = isDragTarget
    ? dragOverInfo!.position === 'before'
      ? { borderTop: '2px solid #0D99FF' }
      : { borderBottom: '2px solid #0D99FF' }
    : {}

  return (
    <>
      <StyledLayerItem
        draggable={!!onLayerDragStart}
        onClick={handleSelect}
        isSelected={isSelected}
        style={{
          paddingLeft: `${8 + depth * 14}px`,
          cursor: onLayerDragStart ? 'grab' : 'pointer',
          ...dropStyle,
        }}
        onDragStart={(e) => {
          e.stopPropagation()
          e.dataTransfer.effectAllowed = 'move'
          onLayerDragStart?.(shape.id)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
          onLayerDragOver?.(shape.id, pos)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
          onLayerDrop?.(shape.id, pos)
        }}
        onDragEnd={(e) => {
          e.stopPropagation()
          onLayerDragEnd?.()
        }}
      >
        {hasChildren ? (
          <StyledChevron
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </StyledChevron>
        ) : (
          <StyledChevronPlaceholder />
        )}
        <StyledIcon>{icon}</StyledIcon>
        <StyledName>{name}</StyledName>
        <StyledActions>
          <StyledActionBtn onClick={handleToggleVisibility}>
            {shape.isHidden ? <EyeClosedIcon /> : <EyeOpenIcon />}
          </StyledActionBtn>
          <StyledActionBtn onClick={handleToggleLock}>
            {shape.isLocked ? <LockClosedIcon /> : <LockOpen1Icon />}
          </StyledActionBtn>
        </StyledActions>
      </StyledLayerItem>
      {hasChildren && expanded && (
        <StyledChildrenWrap>
          {childShapes.map((child) => (
            <LayerItem
              key={child.id}
              shape={child}
              allShapes={allShapes}
              selectedIds={selectedIds}
              app={app}
              depth={depth + 1}
            />
          ))}
        </StyledChildrenWrap>
      )}
    </>
  )
}

// --- Styles ---

const StyledPanel = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
})

const StyledTabBar = styled('div', {
  display: 'flex',
  borderBottom: '1px solid $separator',
  flexShrink: 0,
})

const StyledTab = styled('button', {
  all: 'unset',
  flex: 1,
  padding: '6px 0',
  fontSize: '9px',
  fontWeight: 600,
  textAlign: 'center',
  color: '$textSecondary',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  transition: 'all 0.1s',
  borderBottom: '2px solid transparent',
  '&:hover': { color: '$text' },
  variants: {
    isActive: {
      true: {
        color: '$accent',
        borderBottomColor: '$accent',
      },
    },
  },
})

const StyledList = styled('div', {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  '&::-webkit-scrollbar': { width: '3px' },
  '&::-webkit-scrollbar-thumb': { background: '$separator', borderRadius: '2px' },
})

const StyledEmpty = styled('div', {
  padding: '16px 12px',
  fontSize: '10px',
  color: '$textSecondary',
  fontStyle: 'italic',
  textAlign: 'center',
})

const StyledLayerItem = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  height: '26px',
  paddingRight: '6px',
  cursor: 'pointer',
  transition: 'background 0.08s',
  '&:hover': { background: '$hover' },
  variants: {
    isSelected: {
      true: {
        background: 'rgba(13, 153, 255, 0.15)',
        '&:hover': { background: 'rgba(13, 153, 255, 0.2)' },
      },
    },
  },
})

const StyledChevron = styled('button', {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '14px',
  height: '14px',
  cursor: 'pointer',
  color: '$textSecondary',
  flexShrink: 0,
  '& svg': { width: '10px', height: '10px' },
  '&:hover': { color: '$text' },
})

const StyledChevronPlaceholder = styled('div', { width: '14px', flexShrink: 0 })

const StyledIcon = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '14px',
  height: '14px',
  color: '$textSecondary',
  flexShrink: 0,
})

const StyledName = styled('span', {
  fontSize: '10px',
  color: '$text',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flex: 1,
  fontWeight: 500,
})

const StyledActions = styled('div', {
  display: 'flex',
  gap: '1px',
  opacity: 0,
  transition: 'opacity 0.1s',
  [`${StyledLayerItem}:hover &`]: { opacity: 1 },
})

const StyledActionBtn = styled('button', {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '18px',
  height: '18px',
  borderRadius: '$0',
  color: '$textSecondary',
  cursor: 'pointer',
  '& svg': { width: '10px', height: '10px' },
  '&:hover': { color: '$text', background: '$hover' },
})

const StyledChildrenWrap = styled('div', {
  borderLeft: '1px solid $separator',
  marginLeft: '18px',
})
