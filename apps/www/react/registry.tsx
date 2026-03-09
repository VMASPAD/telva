import type { ReactComponentEntry } from 'telva'
import Grainient from './Grainient'
import { GridScan } from './CanvasGridScan'
import ASCIIText from './ASCCIIText'

export const REACT_COMPONENTS: ReactComponentEntry[] = [
  {
    id: 'canvas-grid-scan',
    name: 'GridScan',
    description: 'Canvas-only component for export testing',
    defaultSize: [1260, 920],
    sourcePath: 'apps/www/react/GridScan.tsx',
    previewColor: '#A855F7',
    component: GridScan,
  },
  {
    id: 'ASCIIText',
    name: 'ASCIIText',
    description: 'Animated gradient shader background',
    defaultSize: [400, 300],
    sourcePath: 'apps/www/react/ASCCIIText.tsx',
    previewColor: '#7B2FFF',
    component: ASCIIText,
  },
]
