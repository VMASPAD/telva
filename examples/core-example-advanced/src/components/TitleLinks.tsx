import * as React from 'react'
import styled from 'stitches.config'

export function TitleLinks() {
  return (
    <TitleLinksContainer>
      <a href="https://github.com/telva/telva/tree/main/packages/core">telva-core</a>
    </TitleLinksContainer>
  )
}

const TitleLinksContainer = styled('div', {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  fontSize: '$3',

  '& > a': {
    color: '$text',
    textDecoration: 'none',
    padding: '$2 $4',
    fontWeight: '$2',
    pointerEvents: 'all',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
})
