import { useTranslation } from 'react-i18next'
import { TRIP_TIMELINE } from '@/core/constants/statuses.ts'

export function TripTimeline({ status }: { status: string }) {
  const { t } = useTranslation()
  const currentIndex = TRIP_TIMELINE.indexOf(status as (typeof TRIP_TIMELINE)[number])
  const cancelled = status === 'cancelled'

  return (
    <div>
      <div className="mz-timeline" role="list">
        {TRIP_TIMELINE.map((step, index) => {
          const isDone = !cancelled && currentIndex > index
          const isCurrent = !cancelled && currentIndex === index
          return (
            <div
              key={step}
              role="listitem"
              className={`mz-timeline__step${isDone ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
            >
              {t(`status.${step}`)}
            </div>
          )
        })}
      </div>
      {cancelled ? <p style={{ marginTop: 8 }}><strong>{t('status.cancelled')}</strong></p> : null}
    </div>
  )
}
