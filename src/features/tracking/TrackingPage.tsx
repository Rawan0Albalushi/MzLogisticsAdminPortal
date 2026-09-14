import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchTrips } from '@/core/api/services.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { EmptyState } from '@/shared/components/EmptyState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue, formatCoords, formatDateTime, mapUrl } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

const TRACK_STATUSES = ['assigned', 'arrived_at_pickup', 'loaded', 'in_transit', 'arrived']

export function TrackingPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const status = list.status || 'in_transit'
  const downloadButton = (
    <DownloadReportButton
      build={async () => {
        const items = await fetchAllPages((page, perPage) =>
          fetchTrips({
            status,
            search: list.search,
            city: list.city,
            page,
            per_page: perPage,
          }),
        )
        return createListReport({
          title: t('tracking.title'),
          subtitle: t('tracking.subtitle'),
          filters: listReportFilters(t, { ...list, status }),
          columns: [
            t('common.reference'),
            t('common.driver'),
            t('common.truck'),
            t('common.pickup'),
            t('common.delivery'),
            t('common.location'),
            t('common.eta'),
            t('common.status'),
          ],
          rows: items.map((row) => [
            row.reference,
            displayValue(row.driver?.name),
            displayValue(row.truck?.plate_number),
            displayValue(row.pickup_city),
            displayValue(row.delivery_city),
            formatCoords(row.current_lat, row.current_lng),
            formatDateTime(row.eta_at),
            reportStatus(t, row.status),
          ]),
        })
      }}
    />
  )
  const query = useQuery({
    queryKey: ['tracking', status, list.search, list.city, list.page],
    queryFn: () =>
      fetchTrips({
        status,
        search: list.search,
        city: list.city,
        page: list.page,
        per_page: 24,
      }),
  })

  if (query.isLoading) {
    return (
      <>
        <PageHeader title={t('tracking.title')} subtitle={t('tracking.subtitle')} actions={downloadButton} />
        <LoadingState />
      </>
    )
  }

  if (query.isError) {
    return (
      <>
        <PageHeader title={t('tracking.title')} subtitle={t('tracking.subtitle')} actions={downloadButton} />
        <ErrorState onRetry={() => void query.refetch()} />
      </>
    )
  }

  const trips = query.data?.items ?? []

  return (
    <>
      <PageHeader title={t('tracking.title')} subtitle={t('tracking.subtitle')} actions={downloadButton} />
      <FilterBar>
        <SearchInput
          value={list.search}
          onChange={(value) => list.setFilter('search', value)}
          placeholder={t('common.searchReference')}
        />
        <SearchInput value={list.city} onChange={(value) => list.setFilter('city', value)} placeholder={t('common.cityPlaceholder')} />
        <StatusFilter
          value={status}
          options={TRACK_STATUSES}
          onChange={(value) => list.setFilter('status', value)}
          allLabel={t('tracking.inTransitOnly')}
          label={(value) => t(`status.${value}`)}
        />
      </FilterBar>
      {trips.length === 0 ? (
        <div className="mz-card">
          <EmptyState />
        </div>
      ) : (
        <div className="mz-track-grid">
          {trips.map((trip) => {
            const href = mapUrl(trip.current_lat, trip.current_lng)
            return (
              <article key={trip.id} className="mz-card mz-track-card">
                <div className="mz-track-card__meta">
                  <Link className="mz-link" to={`/trips/${trip.id}`}>
                    {trip.reference}
                  </Link>
                  <StatusBadge status={trip.status} />
                </div>
                <p>
                  {t('common.driver')}: {displayValue(trip.driver?.name)}
                </p>
                <p>
                  {t('common.truck')}: {displayValue(trip.truck?.plate_number)}
                </p>
                <p>
                  {displayValue(trip.pickup_city)} → {displayValue(trip.delivery_city)}
                </p>
                <p className="mz-coords">
                  {t('common.location')}: {formatCoords(trip.current_lat, trip.current_lng)}
                </p>
                <p>
                  {t('common.eta')}: {formatDateTime(trip.eta_at)}
                </p>
                {href ? (
                  <p style={{ marginTop: 10 }}>
                    <a className="mz-link" href={href} target="_blank" rel="noreferrer">
                      {t('common.openInGoogleMaps')}
                    </a>
                  </p>
                ) : (
                  <p style={{ marginTop: 10, color: 'var(--mz-muted)' }}>{t('tracking.noCoords')}</p>
                )}
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
