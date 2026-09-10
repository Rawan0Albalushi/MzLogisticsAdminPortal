import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.language.startsWith('ar') ? 'ar' : 'en'

  return (
    <div className="mz-lang" role="group" aria-label={t('common.language')}>
      <button type="button" className={current === 'en' ? 'is-active' : ''} onClick={() => void i18n.changeLanguage('en')}>
        {t('common.english')}
      </button>
      <button type="button" className={current === 'ar' ? 'is-active' : ''} onClick={() => void i18n.changeLanguage('ar')}>
        {t('common.arabic')}
      </button>
    </div>
  )
}
