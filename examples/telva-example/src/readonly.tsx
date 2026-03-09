import * as React from 'react'
import { TVFile, Telva } from 'telva'

export default function ReadOnly() {
  const [file, setFile] = React.useState<TVFile>()

  React.useEffect(() => {
    async function loadFile(): Promise<void> {
      const file = await fetch('Example.tldr').then((response) => response.json())
      setFile(file)
    }

    loadFile()
  }, [])

  return (
    <div className="telva">
      <Telva readOnly document={file?.document} />
    </div>
  )
}
