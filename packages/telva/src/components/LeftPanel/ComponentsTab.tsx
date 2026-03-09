import * as React from 'react'
import { Utils } from 'telva-core'
import { useTelvaApp } from '~hooks'
import { ReactComponentEntry, useReactRegistry } from '~state/reactRegistry'
import { styled } from '~styles'
import { TVShapeType } from '~types'

/**
 * ComponentsTab — lists registered React components from the registry context
 * and allows importing them into the canvas as LIVE ReactComponent shapes.
 */
export const ComponentsTab = React.memo(function ComponentsTab() {
  const app = useTelvaApp()
  const registry = useReactRegistry()
  const [importing, setImporting] = React.useState<string | null>(null)

  const handleImport = React.useCallback(
    (entry: ReactComponentEntry) => {
      setImporting(entry.id)
      try {
        const [w, h] = entry.defaultSize

        // Place at center of viewport
        const pagePoint = app.getPagePoint([
          window.innerWidth / 2 - w / 2,
          window.innerHeight / 2 - h / 2,
        ])

        const shapeId = Utils.uniqueId()

        // Create a live ReactComponent shape (not a static image!)
        app.createShapes({
          id: shapeId,
          type: TVShapeType.ReactComponent,
          name: entry.name,
          point: pagePoint,
          size: [w, h],
          componentId: entry.id,
          style: { color: 'black' as any, size: 'small' as any, dash: 'draw' as any },
        } as any)

        app.select(shapeId)
      } catch (err) {
        console.error('Failed to import component:', err)
      } finally {
        setImporting(null)
      }
    },
    [app]
  )

  return (
    <StyledComponentsList>
      {registry.length === 0 ? (
        <StyledEmpty>
          No components registered.
          <br />
          Add components in <code>apps/www/react/registry.tsx</code>
        </StyledEmpty>
      ) : (
        registry.map((entry) => (
          <StyledComponentCard key={entry.id}>
            <StyledPreview style={{ background: entry.previewColor || '#6366f1' }}>
              <span>{'<' + entry.name + ' />'}</span>
            </StyledPreview>
            <StyledCardInfo>
              <StyledCardName>{entry.name}</StyledCardName>
              <StyledCardDesc>{entry.description}</StyledCardDesc>
              <StyledCardPath>{entry.sourcePath}</StyledCardPath>
            </StyledCardInfo>
            <StyledImportBtn onClick={() => handleImport(entry)} disabled={importing === entry.id}>
              {importing === entry.id ? '...' : 'Import'}
            </StyledImportBtn>
          </StyledComponentCard>
        ))
      )}

      <StyledHelpText>
        Components render LIVE on your canvas.
        <br />
      </StyledHelpText>
    </StyledComponentsList>
  )
})

// --- Styles ---

const StyledComponentsList = styled('div', {
  flex: 1,
  padding: '6px',
  overflowY: 'auto',
  '&::-webkit-scrollbar': { width: '3px' },
  '&::-webkit-scrollbar-thumb': { background: '$separator', borderRadius: '2px' },
})

const StyledEmpty = styled('div', {
  padding: '16px 8px',
  fontSize: '10px',
  color: '$textSecondary',
  textAlign: 'center',
  lineHeight: 1.5,
  '& code': { fontSize: '9px', background: '$inputBg', padding: '1px 4px', borderRadius: '$0' },
})

const StyledComponentCard = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px',
  borderRadius: '$2',
  border: '1px solid $separator',
  marginBottom: '4px',
  transition: 'background 0.08s',
  '&:hover': { background: '$hover' },
})

const StyledPreview = styled('div', {
  width: '36px',
  height: '36px',
  borderRadius: '$1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& span': { fontSize: '7px', color: 'rgba(255,255,255,0.8)', fontFamily: '$mono' },
})

const StyledCardInfo = styled('div', { flex: 1, minWidth: 0 })

const StyledCardName = styled('div', {
  fontSize: '10px',
  fontWeight: 600,
  color: '$text',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const StyledCardDesc = styled('div', {
  fontSize: '9px',
  color: '$textSecondary',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const StyledCardPath = styled('div', {
  fontSize: '8px',
  color: '$textSecondary',
  opacity: 0.6,
  fontFamily: '$mono',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const StyledImportBtn = styled('button', {
  all: 'unset',
  fontSize: '9px',
  fontWeight: 600,
  color: 'white',
  background: '$accent',
  padding: '3px 8px',
  borderRadius: '$1',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'opacity 0.1s',
  '&:hover': { opacity: 0.85 },
  '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
})

const StyledHelpText = styled('div', {
  padding: '10px 6px',
  fontSize: '8px',
  color: '$textSecondary',
  lineHeight: 1.4,
  borderTop: '1px solid $separator',
  marginTop: '6px',
  '& code': { fontSize: '8px', background: '$inputBg', padding: '1px 3px', borderRadius: '$0' },
})
