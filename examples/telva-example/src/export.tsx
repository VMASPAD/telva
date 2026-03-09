import * as React from 'react'
import { TVExport, TVExportType, Telva, TelvaApp } from 'telva'

const ACTION = 'download' as 'download' | 'open'

export default function Export() {
  const handleExport = React.useCallback(async (app: TelvaApp, info: TVExport) => {
    // When a user exports, the default behavior is to download
    // the exported data as a file. If the onExport callback is
    // provided, it will be called instead.

    switch (ACTION) {
      case 'download': {
        // Download the file
        const blobUrl = URL.createObjectURL(info.blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = info.name + '.' + info.type
        link.click()
        break
      }
      case 'open': {
        // Open the file in a new tab
        const blobUrl = URL.createObjectURL(info.blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.target = '_blank'
        link.click()
        break
      }
    }
  }, [])

  const [app, setApp] = React.useState<TelvaApp>()

  const handleExportSVG = React.useCallback(() => {
    app?.exportImage(TVExportType.SVG, { scale: 1, quality: 1 })
  }, [app])

  const handleExportPNG = React.useCallback(() => {
    app?.exportImage(TVExportType.PNG, { scale: 2, quality: 1 })
  }, [app])

  const handleExportJPG = React.useCallback(() => {
    app?.exportImage(TVExportType.JPG, { scale: 2, quality: 1 })
  }, [app])

  const handleMount = React.useCallback((app: TelvaApp) => {
    setApp(app)
  }, [])

  return (
    <div className="telva">
      <Telva id="export_example" onMount={handleMount} onExport={handleExport} />
      <div style={{ position: 'fixed', top: 128, left: 32, zIndex: 100 }}>
        <button onClick={handleExportPNG}>Export as PNG</button>
        <button onClick={handleExportSVG}>Export as SVG</button>
        <button onClick={handleExportJPG}>Export as JPG</button>
      </div>
    </div>
  )
}
