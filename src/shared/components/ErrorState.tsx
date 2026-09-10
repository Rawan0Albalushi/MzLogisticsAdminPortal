import { useTranslation } from 'react-i18next'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className="mz-state">
      <h3>{t('common.error')}</h3>
      <p>{message ?? t('common.errorHint')}</p>
      {onRetry ? (
        <button type="button" className="mz-btn mz-btn--ghost" onClick={onRetry} style={{ marginTop: 12 }}>
          {t('common.retry')}
        </button>
      ) : null}
    </div>
  )
}
