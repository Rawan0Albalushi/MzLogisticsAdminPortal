import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft !== value) {
        onChange(draft)
      }
    }, 350)
    return () => window.clearTimeout(timer)
  }, [draft, onChange, value])

  return (
    <label className="mz-search-wrap">
      <AppIcon name="search" width={16} height={16} />
      <input
        className="mz-search"
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder ?? t('common.searchPlaceholder')}
        aria-label={t('common.search')}
      />
    </label>
  )
}
