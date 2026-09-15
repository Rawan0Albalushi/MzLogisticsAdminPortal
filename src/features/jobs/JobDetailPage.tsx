import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchJob } from '@/core/api/services.ts'
import type { Trip } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { EmptyState } from '@/shared/components/EmptyState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { InfoGrid } from '@/shared/components/InfoGrid.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { LocationMap } from '@/shared/components/LocationMap.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import { displayValue, formatDateTime, formatMoney, formatNumber, formatPaymentTerms, formatPercent, organizationName } from '@/shared/utils/format.ts'

function numericValue(value?: string | number | null) {
  if (value == null || value === '') {
    return null
  }
  return formatNumber(value)
}

export function JobDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const query = useQuery({ queryKey: ['job', id], queryFn: () => fetchJob(id), enabled: Boolean(id) })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const job = query.data
  const trips = job.trips ?? []
  const shipment = job.shipment
  const quotation = job.quotation
  const progress = job.progress_percent ?? 0
  const customerName = organizationName(job.customer)
  const providerName = organizationName(job.provider)
  const currency = job.currency ?? undefined
  const routeLabel =
    shipment?.pickup_city || shipment?.delivery_city
      ? `${displayValue(shipment?.pickup_city)} → ${displayValue(shipment?.delivery_city)}`
      : null

  const customerLink = job.customer ? (
    <Link className="mz-link" to={`/customers/${job.customer.id}`}>
      {customerName}
    </Link>
  ) : null

  const providerLink = job.provider ? (
    <Link className="mz-link" to={`/providers/${job.provider.id}`}>
      {providerName}
    </Link>
  ) : null

  const shipmentLink = shipment ? (
    <Link className="mz-link" to={`/shipments/${shipment.id}`}>
      {shipment.reference}
    </Link>
  ) : null

  const quotationLink = quotation ? (
    <Link className="mz-link" to={`/quotations/${quotation.id}`}>
      {quotation.reference}
    </Link>
  ) : null

  const columns: Column<Trip>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    { id: 'seq', header: t('trips.sequence'), cell: (row) => displayValue(row.sequence) },
    { id: 'driver', header: t('common.driver'), cell: (row) => displayValue(row.driver?.name) },
    { id: 'truck', header: t('common.truck'), cell: (row) => displayValue(row.truck?.plate_number) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <Link className="mz-link" to={`/trips/${row.id}`}>
          {t('common.view')}
        </Link>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={job.reference}
        subtitle={t('jobs.detailTitle')}
        crumbs={[{ label: t('jobs.title'), to: '/jobs' }, { label: job.reference }]}
        actions={<StatusBadge status={job.status} />}
      />

      <div className="mz-grid-2">
        <section className="mz-card">
          <div className="mz-card__body">
            <div className="mz-profile">
              <IconWell name="jobs" size="lg" />
              <div className="mz-profile__body">
                <h2 className="mz-profile__name">{job.reference}</h2>
                <p className="mz-profile__aka">{formatMoney(job.total_price, currency)}</p>
                <div className="mz-profile__contacts">
                  <StatusBadge status={job.status} />
                  {job.customer ? (
                    <Link className="mz-profile__chip" to={`/customers/${job.customer.id}`}>
                      <AppIcon name="customers" />
                      {customerName}
                    </Link>
                  ) : null}
                  {job.provider ? (
                    <Link className="mz-profile__chip" to={`/providers/${job.provider.id}`}>
                      <AppIcon name="providers" />
                      {providerName}
                    </Link>
                  ) : null}
                  {routeLabel ? (
                    <span className="mz-profile__chip">
                      <AppIcon name="trips" />
                      {routeLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <SectionTitle icon="users" title={t('jobs.partiesSection')} />
            <InfoGrid
              fields={[
                { icon: 'payments', label: t('quotations.price'), value: formatMoney(job.total_price, currency) },
                { icon: 'customers', label: t('common.customer'), value: customerLink },
                { icon: 'providers', label: t('common.provider'), value: providerLink },
                { icon: 'shipments', label: t('common.shipment'), value: shipmentLink },
                { icon: 'quotations', label: t('common.quotation'), value: quotationLink },
                ...(shipment
                  ? [
                      {
                        icon: 'payments' as const,
                        label: t('paymentContract.title'),
                        value: formatPaymentTerms(
                          shipment.payment_terms?.billing_trigger,
                          shipment.payment_terms?.due_days,
                          shipment.payment_terms?.billing_unit,
                        ),
                      },
                    ]
                  : []),
              ]}
            />
            <div className="mz-section">
              <SectionTitle icon="reports" title={t('jobs.progress')} extra={formatPercent(progress)} />
              <div className="mz-progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
              </div>
            </div>
          </div>
        </section>

        <div className="mz-stack">
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="quantity" title={t('jobs.quantitiesSection')} />
              <InfoGrid
                fields={[
                  { icon: 'quantity', label: t('jobs.totalQuantity'), value: numericValue(job.total_quantity) },
                  { icon: 'delivery', label: t('jobs.deliveredQuantity'), value: numericValue(job.delivered_quantity) },
                ]}
              />
            </div>
          </section>
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="calendar" title={t('jobs.scheduleSection')} />
              <InfoGrid
                fields={[
                  { icon: 'clock', label: t('jobs.startedAt'), value: job.started_at ? formatDateTime(job.started_at) : null },
                  { icon: 'verify', label: t('jobs.completedAt'), value: job.completed_at ? formatDateTime(job.completed_at) : null },
                  { icon: 'calendar', label: t('common.createdAt'), value: job.created_at ? formatDateTime(job.created_at) : null },
                  { icon: 'roles', label: t('common.status'), value: <StatusBadge status={job.status} /> },
                ]}
              />
            </div>
          </section>
        </div>
      </div>

      {shipment ? (
        <section className="mz-card mz-section">
          <div className="mz-card__body">
            <SectionTitle icon="trips" title={t('shipments.routeSection')} />
            <div className="mz-grid-2 mz-grid-2--equal">
              <LocationMap
                icon="pickup"
                label={t('common.pickup')}
                address={shipment.pickup_address}
                city={shipment.pickup_city}
                lat={shipment.pickup_lat}
                lng={shipment.pickup_lng}
              />
              <LocationMap
                icon="delivery"
                label={t('common.delivery')}
                address={shipment.delivery_address}
                city={shipment.delivery_city}
                lat={shipment.delivery_lat}
                lng={shipment.delivery_lng}
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="mz-section">
        <SectionTitle icon="trips" title={t('jobs.nestedTrips')} />
        {trips.length === 0 ? (
          <div className="mz-card">
            <EmptyState title={t('jobs.noTrips')} />
          </div>
        ) : (
          <DataTable columns={columns} rows={trips} rowKey={(row) => row.id} rowTo={(row) => `/trips/${row.id}`} />
        )}
      </section>
    </>
  )
}
