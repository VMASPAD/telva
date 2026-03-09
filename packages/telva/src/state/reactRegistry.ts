/**
 * React Component Registry — Type definitions and context.
 *
 * The actual component registry is configured in apps/www/react/registry.tsx.
 * Components are passed to <Telva> via the `reactComponents` prop.
 */
import * as React from 'react'

export interface ReactComponentEntry {
  id: string
  name: string
  description: string
  /** Default width/height when placed on canvas */
  defaultSize: [number, number]
  /** Source file path (for reference/display) */
  sourcePath: string
  /** Thumbnail color for the components list */
  previewColor?: string
  /** The actual React component to render */
  component: React.ComponentType<any>
}

/**
 * Context that provides the registry to the ComponentsTab.
 * Populated by Telva from the `reactComponents` prop.
 */
export const ReactRegistryContext = React.createContext<ReactComponentEntry[]>([])

export function useReactRegistry() {
  return React.useContext(ReactRegistryContext)
}
