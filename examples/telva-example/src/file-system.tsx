import * as React from 'react'
import { Telva, useFileSystem } from 'telva'

export default function FileSystem() {
  const fileSystemEvents = useFileSystem()

  // Use the Menu > File to create, open, and save .tldr files.

  return (
    <div className="telva">
      <Telva {...fileSystemEvents} />
    </div>
  )
}
