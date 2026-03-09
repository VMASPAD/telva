/**
 * React Component Registry — Configuration
 *
 * Add your React components here to make them available in the editor.
 * Each entry maps an id to a React component + metadata.
 *
 * To add a new component:
 * 1. Create the component file in this folder (apps/www/react/)
 * 2. Import it below and add an entry to REACT_COMPONENTS
 */
import type { ReactComponentEntry } from 'telva'
import FloatingLines from './FloatingLines'
import Grainient from './Grainient'

export const REACT_COMPONENTS: ReactComponentEntry[] = [
  {
    id: 'grainient',
    name: 'Grainient',
    description: 'Animated gradient shader background',
    defaultSize: [400, 300],
    sourcePath: 'apps/www/react/Grainient.tsx',
    previewColor: '#7B2FFF',
    component: Grainient,
  },
  {
    id: 'floatinglines',
    name: 'FloatingLines',
    description: 'Animated gradient shader background',
    defaultSize: [400, 300],
    sourcePath: 'apps/www/react/FloatingLines.tsx',
    previewColor: '#7B2FFF',
    component: FloatingLines,
  },
  // ----- Add more components below -----
  // {
  //   id: 'my-component',
  //   name: 'My Component',
  //   description: 'Description of what it does',
  //   defaultSize: [300, 200],
  //   sourcePath: 'apps/www/react/MyComponent.tsx',
  //   previewColor: '#FF6B6B',
  //   component: MyComponent,
  // },
]
