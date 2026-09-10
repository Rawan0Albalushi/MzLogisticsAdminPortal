import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchTrip } from '@/core/api/services.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { DetailList } from '@/shared/components/DetailList.tsx'
import { TripTimeline } from '@/features/trips/TripTimeline.tsx'
import { displayValue, formatCoords, formatDateTime, mapUrl } from '@/shared/utils/format.ts'

export function TripDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const query = useQuery({ queryKey: ['trip', id], queryFn: () => fetchTrip(id), enabled: Boolean(id) })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const trip = query.data
  const liveMap = mapUrl(trip.current_lat, trip.current_lng)

  return (
    <>
      <PageHeader
        title={trip.reference}
        subtitle={t('trips.detailTitle')}
        crumbs={[{ label: t('trips.title'), to: '/trips' }, { label: trip.reference }]}
      />
      <section className="mz-card">
        <div className="mz-card__body">
          <h2 className="mz-card__title">{t('trips.timeline')}</h2>
          <TripTimeline status={trip.status} />
        </div>
      </section>
      <section className="mz-card mz-section">
        <div className="mz-card__body">
          <DetailList
            items={[
              { label: t('common.status'), value: <StatusBadge status={trip.status} /> },
              {
                label: t('common.job'),
                value: trip.job ? (
                  <Link className="mz-link" to={`/jobs/${trip.job.id}`}>
                    {trip.job.reference}
                  </Link>
                ) : (
                  t('common.noValue')
                ),
              },
              { label: t('trips.sequence'), value: displayValue(trip.sequence) },
              { label: t('common.driver'), value: displayValue(trip.driver?.name) },
              { label: t('common.truck'), value: displayValue(trip.truck?.plate_number) },
              { label: t('common.pickup'), value: `${displayValue(trip.pickup_city)} — ${displayValue(trip.pickup_address)}` },
              { label: t('common.delivery'), value: `${displayValue(trip.delivery_city)} — ${displayValue(trip.delivery_address)}` },
              { label: t('trips.plannedQuantity'), value: displayValue(trip.planned_quantity) },
              { label: t('trips.deliveredQuantity'), value: displayValue(trip.delivered_quantity) },
              { label: t('common.location'), value: formatCoords(trip.current_lat, trip.current_lng) },
              { label: t('common.eta'), value: formatDateTime(trip.eta_at) },
              { label: t('trips.otp'), value: displayValue(trip.otp_code) },
              { label: t('trips.assignedAt'), value: formatDateTime(trip.assigned_at) },
              { label: t('trips.arrivedPickupAt'), value: formatDateTime(trip.arrived_pickup_at) },
              { label: t('trips.loadedAt'), value: formatDateTime(trip.loaded_at) },
              { label: t('trips.inTransitAt'), value: formatDateTime(trip.in_transit_at) },
              { label: t('trips.arrivedAt'), value: formatDateTime(trip.arrived_at) },
              { label: t('trips.deliveredAt'), value: formatDateTime(trip.delivered_at) },
              { label: t('trips.completedAt'), value: formatDateTime(trip.completed_at) },
              { label: t('trips.receiverName'), value: displayValue(trip.proof_of_delivery?.receiver_name) },
            ]}
          />
          {liveMap ? (
            <p style={{ marginTop: 14 }}>
              <a className="mz-link" href={liveMap} target="_blank" rel="noreferrer">
                {t('tracking.openMap')}
              </a>
            </p>
          ) : null}
        </div>
      </section>
    </>
  )
}
