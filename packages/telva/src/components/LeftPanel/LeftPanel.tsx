import * as React from 'react'
import { styled } from '~styles'
import { LayersPanel } from './LayersPanel'

export const LeftPanel = React.memo(function LeftPanel() {
  return (
    <StyledLeftPanel>
      <LayersPanel />
    </StyledLeftPanel>
  )
})

const StyledLeftPanel = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  width: '200px',
  height: '100%',
  background: '$panel',
  borderRight: '1px solid $separator',
  zIndex: 200,
  pointerEvents: 'all',
  overflow: 'hidden',
  flexShrink: 0,
})
