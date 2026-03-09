import * as React from 'react'
import { Telva, TelvaApp, TVShapeType, useFileSystem } from 'telva'
import { useUploadAssets } from '~hooks/useUploadAssets'
import { REACT_COMPONENTS } from '~react/registry'

export default function ReactCanvasExportTest() {
  const fileSystemEvents = useFileSystem()
  const { onAssetUpload } = useUploadAssets()
  const rApp = React.useRef<TelvaApp>()
  const [status, setStatus] = React.useState('Listo para probar export de React components')

  const handleMount = React.useCallback((app: TelvaApp) => {
    rApp.current = app
  }, [])

  const addCanvasComponent = React.useCallback(() => {
    const app = rApp.current
    if (!app) return

    const id = `canvas_component_${Date.now()}`
    app.createShapes({
      id,
      type: TVShapeType.ReactComponent,
      point: [160, 140],
      size: [560, 320],
      componentId: 'canvas-grid-scan',
    })
    app.select(id)
    setStatus('Componente canvas agregado y seleccionado')
  }, [])

  const convertSelectionToImage = React.useCallback(async () => {
    const app = rApp.current
    if (!app) return

    await app.convertToImage()
    setStatus('Selección convertida a imagen')
  }, [])

  const copySelectedAsSvg = React.useCallback(async () => {
    const app = rApp.current
    if (!app) return

    const svg = await app.copySvg()
    if (!svg) {
      setStatus('No se pudo generar SVG')
      return
    }

    setStatus(`SVG generado (${svg.length} chars)`)
  }, [])

  return (
    <div className="telva">
      <div
        style={{
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 3000,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: 10,
          borderRadius: 12,
          background: 'rgba(13, 12, 20, 0.85)',
          color: 'white',
          fontSize: 12,
          fontFamily: 'DM Sans, sans-serif',
          backdropFilter: 'blur(6px)',
        }}
      >
        <button onClick={addCanvasComponent}>Agregar Canvas Component</button>
        <button onClick={convertSelectionToImage}>Convertir selección a imagen</button>
        <button onClick={copySelectedAsSvg}>Copiar SVG selección</button>
        <span>{status}</span>
      </div>

      <Telva
        id="react-canvas-export-test"
        onMount={handleMount}
        onAssetUpload={onAssetUpload}
        reactComponents={REACT_COMPONENTS}
        {...fileSystemEvents}
      />
    </div>
  )
}
