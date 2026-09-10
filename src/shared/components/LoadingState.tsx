import { useTranslation } from 'react-i18next'

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation()
  return (
    <div className="mz-state">
      <div className="mz-spinner" aria-hidden="true" />
      <p>{label ?? t('common.loading')}</p>
    </div>
  )
}
