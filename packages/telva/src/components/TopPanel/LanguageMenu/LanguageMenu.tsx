import { ExternalLinkIcon } from '@radix-ui/react-icons'
import * as React from 'react'
import { FormattedMessage } from 'react-intl'
import { Divider } from '~components/Primitives/Divider'
import { DMCheckboxItem, DMContent, DMItem } from '~components/Primitives/DropdownMenu'
import { SmallIcon } from '~components/Primitives/SmallIcon'
import { useTelvaApp } from '~hooks'
import { TRANSLATIONS, TVLanguage } from '~translations'
import { TVSnapshot } from '~types'

const languageSelector = (s: TVSnapshot) => s.settings.language

export const LanguageMenu = () => {
  const app = useTelvaApp()
  const language = app.useStore(languageSelector)

  const handleChangeLanguage = React.useCallback(
    (locale: TVLanguage) => {
      app.setSetting('language', locale)
    },
    [app]
  )

  return (
    <DMContent variant="menu" overflow id="language-menu" side="left" sideOffset={8}>
      {TRANSLATIONS.map(({ locale, label }) => (
        <DMCheckboxItem
          key={locale}
          checked={language === locale}
          onCheckedChange={() => handleChangeLanguage(locale)}
          id={`TD-MenuItem-Language-${locale}`}
        >
          {label}
        </DMCheckboxItem>
      ))}
      <Divider />
      <a
        href="https://github.com/telva/telva/blob/main/guides/translation.md"
        target="_blank"
        rel="nofollow"
      >
        <DMItem id="TD-MenuItem-Translation-Link">
          <FormattedMessage id="translation.link" />
          <SmallIcon>
            <ExternalLinkIcon />
          </SmallIcon>
        </DMItem>
      </a>
    </DMContent>
  )
}
