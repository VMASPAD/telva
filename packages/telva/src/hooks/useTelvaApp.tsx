import * as React from 'react'
import type { TelvaApp } from '~state'

export const TelvaContext = React.createContext<TelvaApp>({} as TelvaApp)

const useForceUpdate = () => {
  const [_state, setState] = React.useState(0)
  React.useEffect(() => setState(1))
}

export function useTelvaApp() {
  const context = React.useContext(TelvaContext)
  return context
}

export const ContainerContext = React.createContext({} as React.RefObject<HTMLDivElement>)

export function useContainer() {
  const context = React.useContext(ContainerContext)
  useForceUpdate()
  return context
}
