import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import ar from '@/locales/ar.json'
import en from '@/locales/en.json'

export const supportedLanguages = ['en', 'ar'] as const
export type AppLanguage = (typeof supportedLanguages)[number]

export function applyDocumentDirection(language: string): void {
  const dir = language.startsWith('ar') ? 'rtl' : 'ltr'
  document.documentElement.lang = language.startsWith('ar') ? 'ar' : 'en'
  document.documentElement.dir = dir
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: [...supportedLanguages],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

applyDocumentDirection(i18n.language)

i18n.on('languageChanged', applyDocumentDirection)

export default i18n
