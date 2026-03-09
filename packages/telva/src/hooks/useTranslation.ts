import * as React from 'react'
import { TVLanguage, getTranslation } from '~translations'

export function useTranslation(locale?: TVLanguage) {
  return React.useMemo(() => {
    const defaultLocale =
      typeof navigator !== 'undefined' ? (navigator.language.split(/[-_]/)[0] as TVLanguage) : 'en'

    return getTranslation(locale ?? defaultLocale)
  }, [locale])
}
