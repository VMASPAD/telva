import type { TVSnapshot, Theme } from '~types'
import { useTelvaApp } from './useTelvaApp'

const themeSelector = (data: TVSnapshot): Theme => (data.settings.isDarkMode ? 'dark' : 'light')

export function useTheme() {
  const app = useTelvaApp()
  const theme = app.useStore(themeSelector)

  return {
    theme,
    toggle: app.toggleDarkMode,
  }
}
