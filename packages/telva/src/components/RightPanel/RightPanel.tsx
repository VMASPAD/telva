import * as React from 'react'
import { styled } from '~styles'
import { PropertiesPanel } from './PropertiesPanel'

export const RightPanel = React.memo(function RightPanel() {
  return (
    <StyledRightPanel>
      <PropertiesPanel />
    </StyledRightPanel>
  )
})

const StyledRightPanel = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  width: '240px',
  height: '100%',
  background: '$panel',
  borderLeft: '1px solid $separator',
  zIndex: 200,
  pointerEvents: 'all',
  overflow: 'hidden',
  flexShrink: 0,
})
