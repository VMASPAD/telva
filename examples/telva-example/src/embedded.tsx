import * as React from 'react'
import { Telva } from 'telva'

export default function Embedded() {
  return (
    <div style={{ padding: '2% 10%', width: 'calc(100% - 100px)' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '500px',
          overflow: 'hidden',
          marginBottom: '32px',
        }}
      >
        <Telva id="small5" />
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '500px',
          overflow: 'hidden',
        }}
      >
        <Telva id="embedded" />
      </div>
    </div>
  )
}
