import { useTranslation } from 'react-i18next'
import { TRIP_STAGES, tripStageId } from '@/core/constants/statuses.ts'

export function TripTimeline({ status }: { status: string }) {
  const { t } = useTranslation()
  const currentId = tripStageId(status)
  const currentIndex = TRIP_STAGES.findIndex((stage) => stage.id === currentId)
  const cancelled = status === 'cancelled'

  return (
    <div>
      <ol className="mz-trip-steps">
        {TRIP_STAGES.map((step, index) => {
          const isDone = !cancelled && currentIndex > index
          const isCurrent = !cancelled && currentIndex === index
          return (
            <li
              key={step.id}
              className={['mz-trip-steps__item', isDone ? 'is-done' : '', isCurrent ? 'is-current' : ''].filter(Boolean).join(' ')}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="mz-trip-steps__dot" aria-hidden="true" />
              <span className="mz-trip-steps__name">{t(`status.${step.id}`)}</span>
            </li>
          )
        })}
      </ol>
      {cancelled ? <p className="mz-trip-steps__cancelled">{t('status.cancelled')}</p> : null}
    </div>
  )
}
