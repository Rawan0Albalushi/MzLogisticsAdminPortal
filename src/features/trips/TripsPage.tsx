import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchJob, fetchTrips } from '@/core/api/services.ts'
import type { Trip } from '@/core/api/types.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { TRIP_TIMELINE } from '@/core/constants/statuses.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { JobFilter } from '@/shared/components/JobFilter.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { TableIconButton } from '@/shared/components/TableIconButton.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { RouteLabel } from '@/shared/components/RouteLabel.tsx'
import { displayValue } from '@/shared/utils/format.ts'
import { buildTripLogWorkbook } from '@/features/trips/tripLogExcel.ts'
import { createTripLogReport } from '@/features/trips/tripLogReport.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { listReportFilters } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

const STATUSES = [...TRIP_TIMELINE, 'cancelled']

export function TripsPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const canFilterByJob = hasPermission(PERMISSIONS.JOBS_VIEW)
  const list = useListQuery()
  const selectedJob = useQuery({
    queryKey: ['job', list.jobId],
    queryFn: () => fetchJob(list.jobId),
    enabled: canFilterByJob && Boolean(list.jobId),
  })
  const query = useQuery({
    queryKey: ['trips', list.search, list.status, list.city, list.jobId, list.dateFrom, list.dateTo, list.page],
    queryFn: () =>
      fetchTrips({
        search: list.search,
        status: list.status,
        city: list.city,
        job_id: list.jobId,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page: list.page,
      }),
  })

  function reportFilters() {
    return listReportFilters(t, {
      ...list,
      job: selectedJob.data?.reference || list.jobId,
    })
  }

  async function loadTrips() {
    return fetchAllPages((page, perPage) =>
      fetchTrips({
        search: list.search,
        status: list.status,
        city: list.city,
        job_id: list.jobId,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page,
        per_page: perPage,
      }),
    )
  }

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
    { id: 'route', header: t('common.pickup'), cell: (row) => <RouteLabel from={displayValue(row.pickup_city)} to={displayValue(row.delivery_city)} /> },
    { id: 'driver', header: t('common.driver'), cell: (row) => displayValue(row.driver?.name) },
    { id: 'truck', header: t('common.truck'), cell: (row) => displayValue(row.truck?.plate_number) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => <TableIconButton icon="view" label={t('common.view')} to={`/trips/${row.id}`} />,
    },
  ]

  return (
    <>
      <PageHeader
        title={t('trips.title')}
        subtitle={t('trips.subtitle')}
        actions={
          <DownloadReportButton
            excelTitle={t('trips.title')}
            buildExcel={async () => {
              const items = await loadTrips()
              return buildTripLogWorkbook(t, items, reportFilters())
            }}
            build={async () => createTripLogReport(t, await loadTrips(), reportFilters())}
          />
        }
      />
      <FilterBar>
        <SearchInput
          value={list.search}
          onChange={(value) => list.setFilter('search', value)}
          placeholder={t('common.searchReference')}
        />
        <SearchInput value={list.city} onChange={(value) => list.setFilter('city', value)} placeholder={t('common.cityPlaceholder')} />
        {canFilterByJob ? (
          <JobFilter
            value={list.jobId}
            label={selectedJob.data?.reference}
            onChange={(value) => list.setFilter('job_id', value)}
          />
        ) : null}
        <StatusFilter
          value={list.status}
          options={STATUSES}
          onChange={(value) => list.setFilter('status', value)}
          allLabel={t('common.allStatuses')}
          label={(status) => t(`status.${status}`)}
        />
        <DateRangeFilter
          from={list.dateFrom}
          to={list.dateTo}
          onChange={(nextFrom, nextTo) => list.setFilters({ date_from: nextFrom, date_to: nextTo })}
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
