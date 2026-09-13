import { useTranslation } from 'react-i18next'
import { IconWell } from '@/shared/components/IconWell.tsx'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className="mz-state">
      <IconWell name="error" tone="danger" size="lg" />
      <h3>{t('common.error')}</h3>
      <p>{message ?? t('common.errorHint')}</p>
      {onRetry ? (
        <button type="button" className="mz-btn mz-btn--ghost" onClick={onRetry} style={{ marginTop: 12 }}>
          <AppIcon name="refresh" width={15} height={15} />
          {t('common.retry')}
        </button>
      ) : null}
    </div>
  )
}
