import * as React from 'react'
import { Telva, useFileSystem } from 'telva'
import { useUploadAssets } from '~hooks/useUploadAssets'
import { BetaNotification } from './BetaNotification'

type Props = {
  id: string
  showUI?: boolean
  readOnly?: boolean
}

export default function Editor({ id, showUI = true, readOnly = false }: Props) {
  const fileSystemEvents = useFileSystem()
  const { onAssetUpload } = useUploadAssets()

  return (
    <div className="telva">
      <Telva
        id={id}
        showUI={showUI}
        readOnly={readOnly}
        onAssetUpload={onAssetUpload}
        {...fileSystemEvents}
      />
      {showUI ? <BetaNotification /> : null}
    </div>
  )
}
