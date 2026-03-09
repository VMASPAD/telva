import * as React from 'react'

export type OverlayProps = {
  camera: { point: number[]; zoom: number }
  children: React.ReactNode
}

function _Overlay({ camera: { zoom, point }, children }: OverlayProps) {
  const l = 2.5 / zoom
  return (
    <svg className="tv-overlay">
      <defs>
        <g id="tv-snap-point">
          <path
            className="tv-snap-point"
            d={`M ${-l},${-l} L ${l},${l} M ${-l},${l} L ${l},${-l}`}
          />
        </g>
      </defs>
      <g transform={`scale(${zoom}) translate(${point})`}>{children}</g>
    </svg>
  )
}

export const Overlay = React.memo(_Overlay)
