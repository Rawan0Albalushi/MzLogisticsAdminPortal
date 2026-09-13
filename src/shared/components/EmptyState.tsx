import { useTranslation } from 'react-i18next'
import { IconWell } from '@/shared/components/IconWell.tsx'

interface EmptyStateProps {
  title?: string
  hint?: string
}

export function EmptyState({ title, hint }: EmptyStateProps) {
  const { t } = useTranslation()
  return (
    <div className="mz-state">
      <IconWell name="empty" tone="muted" size="lg" />
      <h3>{title ?? t('common.empty')}</h3>
      <p>{hint ?? t('common.emptyHint')}</p>
    </div>
  )
}
