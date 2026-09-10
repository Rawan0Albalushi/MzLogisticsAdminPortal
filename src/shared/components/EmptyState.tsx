import { useTranslation } from 'react-i18next'

interface EmptyStateProps {
  title?: string
  hint?: string
}

export function EmptyState({ title, hint }: EmptyStateProps) {
  const { t } = useTranslation()
  return (
    <div className="mz-state">
      <h3>{title ?? t('common.empty')}</h3>
      <p>{hint ?? t('common.emptyHint')}</p>
    </div>
  )
}
