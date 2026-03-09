import * as React from 'react'
import { TVUserStatus, Telva, TelvaApp } from 'telva'
import { CursorComponent } from 'telva-core'

// A custom cursor component.
const CustomCursor: CursorComponent<{ name: 'Steve' }> = ({ color, metadata }) => {
  return (
    <div style={{ display: 'flex', width: 'fit-content', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 12,
          height: 12,
          background: color,
          borderRadius: '100%',
        }}
      />
      <div style={{ background: 'white', padding: '4px 8px', borderRadius: 4 }}>
        {metadata!.name}
      </div>
    </div>
  )
}

// Component overrides for the telva renderer
const components = {
  Cursor: CustomCursor,
}

export default function CustomCursorsExample() {
  function handleMount(app: TelvaApp) {
    // On mount, create a fake other user
    app.updateUsers([
      {
        id: 'fakeuser1',
        point: [100, 100],
        color: 'orange',
        status: TVUserStatus.Connected,
        activeShapes: [],
        selectedIds: [],
        metadata: { name: 'Steve' }, // <-- our custom metadata
      },
      {
        id: 'fakeuser2',
        point: [200, 300],
        color: 'dodgerblue',
        status: TVUserStatus.Connected,
        activeShapes: [],
        selectedIds: [],
        metadata: { name: 'Jamie' }, // <-- our custom metadata
      },
    ])
  }

  return (
    <div className="telva">
      <Telva
        components={components} // Pass in our component overrides
        onMount={handleMount}
      />
    </div>
  )
}
