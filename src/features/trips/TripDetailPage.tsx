import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchTrip } from '@/core/api/services.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { InfoGrid } from '@/shared/components/InfoGrid.tsx'
import { TripTimeline } from '@/features/trips/TripTimeline.tsx'
import { LocationMap } from '@/shared/components/LocationMap.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import { LIVE_TRACKING_ENABLED } from '@/core/constants/features.ts'
import { displayValue, formatCoords, formatDateTime, formatNumber } from '@/shared/utils/format.ts'

function numericValue(value?: string | number | null) {
  if (value == null || value === '') {
    return null
  }
  return formatNumber(value)
}

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
  const pod = trip.proof_of_delivery
  const routeLabel =
    trip.pickup_city || trip.delivery_city
      ? `${displayValue(trip.pickup_city)} → ${displayValue(trip.delivery_city)}`
      : null

  const jobLink = trip.job ? (
    <Link className="mz-link" to={`/jobs/${trip.job.id}`}>
      {trip.job.reference}
    </Link>
  ) : null

  return (
    <>
      <PageHeader
        title={trip.reference}
        subtitle={t('trips.detailTitle')}
        crumbs={[{ label: t('trips.title'), to: '/trips' }, { label: trip.reference }]}
        actions={<StatusBadge status={trip.status} />}
      />

      <section className="mz-card">
        <div className="mz-card__body">
          <SectionTitle icon="trips" title={t('trips.timeline')} />
          <TripTimeline status={trip.status} />
        </div>
      </section>

      <div className="mz-grid-2 mz-section">
        <section className="mz-card">
          <div className="mz-card__body">
            <div className="mz-profile">
              <IconWell name="trips" size="lg" />
              <div className="mz-profile__body">
                <h2 className="mz-profile__name">{trip.reference}</h2>
                {routeLabel ? <p className="mz-profile__aka">{routeLabel}</p> : null}
                <div className="mz-profile__contacts">
                  <StatusBadge status={trip.status} />
                  {trip.job ? (
                    <Link className="mz-profile__chip" to={`/jobs/${trip.job.id}`}>
                      <AppIcon name="jobs" />
                      {trip.job.reference}
                    </Link>
                  ) : null}
                  {trip.driver?.name ? (
                    <span className="mz-profile__chip">
                      <AppIcon name="drivers" />
                      {trip.driver.name}
                    </span>
                  ) : null}
                  {trip.truck?.plate_number ? (
                    <span className="mz-profile__chip" dir="ltr">
                      <AppIcon name="fleet" />
                      {trip.truck.plate_number}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <SectionTitle icon="dispatch" title={t('trips.assignmentSection')} />
            <InfoGrid
              fields={[
                { icon: 'jobs', label: t('common.job'), value: jobLink },
                { icon: 'quantity', label: t('trips.sequence'), value: numericValue(trip.sequence) },
                { icon: 'drivers', label: t('common.driver'), value: trip.driver?.name },
                { icon: 'fleet', label: t('common.truck'), value: trip.truck?.plate_number, dir: 'ltr' },
                ...(!LIVE_TRACKING_ENABLED
                  ? [
                      {
                        icon: 'roles' as const,
                        label: t('trips.otp'),
                        value: trip.otp_required ? t('trips.otpRequired') : t('trips.otpNotRequired'),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </section>

        <div className="mz-stack">
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="quantity" title={t('trips.quantitiesSection')} />
              <InfoGrid
                fields={[
                  { icon: 'quantity', label: t('trips.plannedQuantity'), value: numericValue(trip.planned_quantity) },
                  { icon: 'delivery', label: t('trips.deliveredQuantity'), value: numericValue(trip.delivered_quantity) },
                ]}
              />
            </div>
          </section>
          {LIVE_TRACKING_ENABLED ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="clock" title={t('trips.liveSection')} />
                <InfoGrid
                  fields={[
                    {
                      icon: 'tracking',
                      label: t('common.location'),
                      value: formatCoords(trip.current_lat, trip.current_lng),
                      dir: 'ltr',
                    },
                    { icon: 'clock', label: t('common.eta'), value: trip.eta_at ? formatDateTime(trip.eta_at) : null },
                    { icon: 'roles', label: t('trips.otp'), value: trip.otp_required ? t('trips.otpRequired') : t('trips.otpNotRequired') },
                  ]}
                />
              </div>
            </section>
          ) : null}
          {pod?.receiver_name || pod?.notes ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="verify" title={t('trips.pod')} />
                <InfoGrid
                  fields={[
                    { icon: 'profile', label: t('trips.receiverName'), value: pod.receiver_name },
                    { icon: 'notes', label: t('common.notes'), value: pod.notes, wide: true },
                  ]}
                />
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <section className="mz-card mz-section">
        <div className="mz-card__body">
          <SectionTitle icon="calendar" title={t('trips.scheduleSection')} />
          <InfoGrid
            fields={[
              ...(!LIVE_TRACKING_ENABLED
                ? [{ icon: 'clock' as const, label: t('common.eta'), value: trip.eta_at ? formatDateTime(trip.eta_at) : null }]
                : []),
              { icon: 'dispatch', label: t('trips.assignedAt'), value: trip.assigned_at ? formatDateTime(trip.assigned_at) : null },
              { icon: 'pickup', label: t('trips.arrivedPickupAt'), value: trip.arrived_pickup_at ? formatDateTime(trip.arrived_pickup_at) : null },
              { icon: 'shipments', label: t('trips.loadedAt'), value: trip.loaded_at ? formatDateTime(trip.loaded_at) : null },
              { icon: 'trips', label: t('trips.inTransitAt'), value: trip.in_transit_at ? formatDateTime(trip.in_transit_at) : null },
              { icon: 'tracking', label: t('trips.arrivedAt'), value: trip.arrived_at ? formatDateTime(trip.arrived_at) : null },
              { icon: 'delivery', label: t('trips.deliveredAt'), value: trip.delivered_at ? formatDateTime(trip.delivered_at) : null },
              { icon: 'verify', label: t('trips.completedAt'), value: trip.completed_at ? formatDateTime(trip.completed_at) : null },
              { icon: 'calendar', label: t('common.createdAt'), value: trip.created_at ? formatDateTime(trip.created_at) : null },
            ]}
          />
        </div>
      </section>

      <section className="mz-card mz-section">
        <div className="mz-card__body">
          <SectionTitle icon="trips" title={t('shipments.routeSection')} />
          <div className="mz-grid-2 mz-grid-2--equal">
            <LocationMap
              icon="pickup"
              label={t('common.pickup')}
              address={trip.pickup_address}
              city={trip.pickup_city}
              lat={trip.pickup_lat}
              lng={trip.pickup_lng}
            />
            <LocationMap
              icon="delivery"
              label={t('common.delivery')}
              address={trip.delivery_address}
              city={trip.delivery_city}
              lat={trip.delivery_lat}
              lng={trip.delivery_lng}
            />
          </div>
          {LIVE_TRACKING_ENABLED ? (
            <div className="mz-section">
              <LocationMap icon="tracking" label={t('common.location')} lat={trip.current_lat} lng={trip.current_lng} />
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}
