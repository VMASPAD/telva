import {
  ArrowTopRightIcon,
  CursorArrowIcon,
  ImageIcon,
  Pencil1Icon,
  Pencil2Icon,
  TextIcon,
} from '@radix-ui/react-icons'
import * as React from 'react'
import { useIntl } from 'react-intl'
import { EraserIcon } from '~components/Primitives/icons'
import { ShapesMenu } from '~components/ToolsPanel/ShapesMenu'
import { useTelvaApp } from '~hooks'
import { styled } from '~styles'
import { TVShapeType, TVSnapshot } from '~types'

const activeToolSelector = (s: TVSnapshot) => s.appState.activeTool
const toolLockedSelector = (s: TVSnapshot) => s.appState.isToolLocked
const canvasModeSelector = (s: TVSnapshot) => s.settings.canvasMode

export const CenterToolbar = React.memo(function CenterToolbar() {
  const app = useTelvaApp()
  const intl = useIntl()
  const activeTool = app.useStore(activeToolSelector)
  const isToolLocked = app.useStore(toolLockedSelector)
  const canvasMode = app.useStore(canvasModeSelector)

  const selectSelectTool = React.useCallback(() => app.selectTool('select'), [app])
  const selectEraseTool = React.useCallback(() => app.selectTool('erase'), [app])
  const selectDrawTool = React.useCallback(() => app.selectTool(TVShapeType.Draw), [app])
  const selectPenTool = React.useCallback(() => app.selectTool(TVShapeType.Pen), [app])
  const selectArrowTool = React.useCallback(() => app.selectTool(TVShapeType.Arrow), [app])
  const selectTextTool = React.useCallback(() => app.selectTool(TVShapeType.Text), [app])
  const selectStickyTool = React.useCallback(() => app.selectTool(TVShapeType.Sticky), [app])
  const uploadMedias = React.useCallback(async () => app.openAsset(), [app])
  const toggleCanvasMode = React.useCallback(() => app.toggleCanvasMode(), [app])

  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <StyledToolbarWrap onPointerDown={handlePointerDown}>
      <StyledToolbarPill>
        <ToolBtn
          onClick={selectSelectTool}
          isActive={activeTool === 'select'}
          title={intl.formatMessage({ id: 'select' })}
        >
          <CursorArrowIcon />
        </ToolBtn>

        <StyledDivider />

        <ToolBtn
          onClick={selectDrawTool}
          isActive={activeTool === TVShapeType.Draw}
          title={intl.formatMessage({ id: 'draw' })}
        >
          <Pencil1Icon />
        </ToolBtn>

        <ToolBtn onClick={selectPenTool} isActive={activeTool === TVShapeType.Pen} title="Pen">
          <Pencil2Icon />
        </ToolBtn>

        <ToolBtn
          onClick={selectEraseTool}
          isActive={activeTool === 'erase'}
          title={intl.formatMessage({ id: 'eraser' })}
        >
          <EraserIcon />
        </ToolBtn>

        <StyledDivider />

        <ShapesMenuWrap>
          <ShapesMenu activeTool={activeTool} isToolLocked={isToolLocked} />
        </ShapesMenuWrap>

        <ToolBtn
          onClick={selectArrowTool}
          isActive={activeTool === TVShapeType.Arrow}
          title={intl.formatMessage({ id: 'arrow' })}
        >
          <ArrowTopRightIcon />
        </ToolBtn>

        <ToolBtn
          onClick={selectTextTool}
          isActive={activeTool === TVShapeType.Text}
          title={intl.formatMessage({ id: 'text' })}
        >
          <TextIcon />
        </ToolBtn>

        <ToolBtn
          onClick={selectStickyTool}
          isActive={activeTool === TVShapeType.Sticky}
          title="Sticky Note"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
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
            <line x1="5" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1" />
            <line x1="5" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="1" />
          </svg>
        </ToolBtn>

        <ToolBtn onClick={uploadMedias} title={intl.formatMessage({ id: 'image' })}>
          <ImageIcon />
        </ToolBtn>

        <StyledDivider />

        <ToolBtn
          onClick={toggleCanvasMode}
          isActive={canvasMode === 'straight'}
          title={canvasMode === 'freehand' ? 'Straight mode' : 'Freehand mode'}
        >
          {canvasMode === 'freehand' ? (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M2 12C4 8 6 4 8 6C10 8 11 3 13 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M2 12L7.5 3L13 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          )}
        </ToolBtn>
      </StyledToolbarPill>
    </StyledToolbarWrap>
  )
})

// -- Styled --

const StyledToolbarWrap = styled('div', {
  position: 'absolute',
  bottom: '16px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 300,
  pointerEvents: 'all',
})

const StyledToolbarPill = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  padding: '6px 8px',
  background: '$panel',
  borderRadius: '$pill',
  boxShadow: '0 2px 16px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
  backdropFilter: 'blur(12px)',
})

const ToolBtn = styled('button', {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: '$2',
  color: '$textSecondary',
  cursor: 'pointer',
  transition: 'all 0.12s ease',
  flexShrink: 0,

  '& svg': {
    width: '16px',
    height: '16px',
  },

  '&:hover': {
    background: '$hover',
    color: '$text',
  },

  variants: {
    isActive: {
      true: {
        background: '$accent',
        color: 'white',
        '&:hover': {
          background: '$accent',
          color: 'white',
        },
      },
    },
  },
})

const StyledDivider = styled('div', {
  width: '1px',
  height: '20px',
  background: '$separator',
  margin: '0 4px',
  flexShrink: 0,
  opacity: 0.5,
})

const ShapesMenuWrap = styled('div', {
  display: 'flex',
  '& button': {
    width: '36px',
    height: '36px',
    padding: 0,
    borderRadius: '$2',
    border: 'none',
  },
  '& [class*="StyledToolButtonInner"]': {
    borderRadius: '$2',
    background: 'transparent',
  },
})
