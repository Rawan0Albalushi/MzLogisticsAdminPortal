import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchTrips } from '@/core/api/services.ts'
import type { Trip } from '@/core/api/types.ts'
import { TRIP_TIMELINE } from '@/core/constants/statuses.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue } from '@/shared/utils/format.ts'

const STATUSES = [...TRIP_TIMELINE, 'cancelled']

export function TripsPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const query = useQuery({
    queryKey: ['trips', list.status, list.page],
    queryFn: () => fetchTrips({ status: list.status, page: list.page }),
  })

  const columns: Column<Trip>[] = [
    {
      id: 'ref',
      header: t('common.reference'),
      cell: (row) => (
        <Link className="mz-link" to={`/trips/${row.id}`}>
          {row.reference}
        </Link>
      ),
    },
    { id: 'job', header: t('common.job'), cell: (row) => displayValue(row.job?.reference) },
    { id: 'route', header: t('common.pickup'), cell: (row) => `${displayValue(row.pickup_city)} → ${displayValue(row.delivery_city)}` },
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
      <PageHeader title={t('trips.title')} subtitle={t('trips.subtitle')} />
      <FilterBar>
        <StatusFilter
          value={list.status}
          options={STATUSES}
          onChange={(value) => list.setFilter('status', value)}
          allLabel={t('common.allStatuses')}
          label={(status) => t(`status.${status}`)}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        meta={query.data?.meta}
        onPageChange={list.setPage}
        rowTo={(row) => `/trips/${row.id}`}
      />
    </>
  )
}
