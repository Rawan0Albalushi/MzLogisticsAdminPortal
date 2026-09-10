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
import { DetailList } from '@/shared/components/DetailList.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { displayValue, formatDateTime, formatMoney, formatPercent, organizationName } from '@/shared/utils/format.ts'

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
  const progress = job.progress_percent ?? 0

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
      />
      <section className="mz-card">
        <div className="mz-card__body">
          <DetailList
            items={[
              { label: t('common.status'), value: <StatusBadge status={job.status} /> },
              { label: t('common.customer'), value: organizationName(job.customer) },
              { label: t('common.provider'), value: organizationName(job.provider) },
              {
                label: t('common.shipment'),
                value: job.shipment ? (
                  <Link className="mz-link" to={`/shipments/${job.shipment.id}`}>
                    {job.shipment.reference}
                  </Link>
                ) : (
                  t('common.noValue')
                ),
              },
              { label: t('quotations.price'), value: formatMoney(job.total_price, job.currency ?? undefined) },
              { label: t('jobs.totalQuantity'), value: displayValue(job.total_quantity) },
              { label: t('jobs.deliveredQuantity'), value: displayValue(job.delivered_quantity) },
              { label: t('jobs.startedAt'), value: formatDateTime(job.started_at) },
              { label: t('jobs.completedAt'), value: formatDateTime(job.completed_at) },
            ]}
          />
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <strong>{t('jobs.progress')}</strong>
              <span>{formatPercent(progress)}</span>
            </div>
            <div className="mz-progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
            </div>
          </div>
        </div>
      </section>
      <section className="mz-section">
        <h2 className="mz-card__title">{t('jobs.nestedTrips')}</h2>
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
