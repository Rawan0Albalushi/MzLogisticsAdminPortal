import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { EmptyState } from '@/shared/components/EmptyState.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'
import type { IconName } from '@/shared/icons/NavIcons.tsx'

export interface WorkQueueItem {
  id: number
  title: string
  meta: string
  status: string
  to: string
}

interface WorkQueueProps {
  title: string
  viewAllTo: string
  items: WorkQueueItem[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  icon?: IconName
}

export function WorkQueue({ title, viewAllTo, items, isLoading, isError, onRetry, icon }: WorkQueueProps) {
  const { t } = useTranslation()

  return (
    <article className="mz-card mz-queue-card">
      <div className="mz-card__body">
        <div className="mz-card__head">
          <div className="mz-card__title-row">
            {icon ? <IconWell name={icon} size="sm" /> : null}
            <h2 className="mz-card__title">{title}</h2>
          </div>
          <Link className="mz-link" to={viewAllTo}>
            {t('dashboard.viewAll')}
          </Link>
        </div>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState onRetry={onRetry} /> : null}
        {!isLoading && !isError && items.length === 0 ? (
          <EmptyState title={t('common.empty')} hint={t('dashboard.queueEmpty')} />
        ) : null}
        {!isLoading && !isError && items.length > 0 ? (
          <ul className="mz-queue-list">
            {items.map((item) => (
              <li key={item.id}>
                <Link className="mz-queue-list__row" to={item.to}>
                  <div className="mz-queue-list__meta">
                    <strong>{item.title}</strong>
                    <small>{item.meta}</small>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  )
}
