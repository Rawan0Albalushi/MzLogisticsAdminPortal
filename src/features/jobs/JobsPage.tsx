import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchJobs } from '@/core/api/services.ts'
import type { TransportJob } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { useCatalog } from '@/shared/hooks/useCatalog.ts'
import { formatMoney, formatPercent, organizationName } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

export function JobsPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const catalog = useCatalog()
  const statuses = catalog.data?.job_statuses ?? ['pending_dispatch', 'in_progress', 'completed', 'cancelled']
  const query = useQuery({
    queryKey: ['jobs', list.search, list.status, list.dateFrom, list.dateTo, list.page],
    queryFn: () =>
      fetchJobs({
        search: list.search,
        status: list.status,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page: list.page,
      }),
  })

  const columns: Column<TransportJob>[] = [
    {
      id: 'ref',
      header: t('common.reference'),
      cell: (row) => (
        <Link className="mz-link" to={`/jobs/${row.id}`}>
          {row.reference}
        </Link>
      ),
    },
    { id: 'customer', header: t('common.customer'), cell: (row) => organizationName(row.customer) },
    { id: 'provider', header: t('common.provider'), cell: (row) => organizationName(row.provider) },
    { id: 'price', header: t('quotations.price'), cell: (row) => formatMoney(row.total_price, row.currency ?? undefined) },
    { id: 'progress', header: t('common.progress'), cell: (row) => formatPercent(row.progress_percent) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <Link className="mz-link" to={`/jobs/${row.id}`}>
          {t('common.view')}
        </Link>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={t('jobs.title')}
        subtitle={t('jobs.subtitle')}
        actions={
          <DownloadReportButton
            build={async () => {
              const items = await fetchAllPages((page, perPage) =>
                fetchJobs({
                  search: list.search,
                  status: list.status,
                  date_from: list.dateFrom,
                  date_to: list.dateTo,
                  page,
                  per_page: perPage,
                }),
              )
              return createListReport({
                title: t('jobs.title'),
                subtitle: t('jobs.subtitle'),
                filters: listReportFilters(t, list),
                columns: [
                  t('common.reference'),
                  t('common.customer'),
                  t('common.provider'),
                  t('quotations.price'),
                  t('common.progress'),
                  t('common.status'),
                ],
                rows: items.map((row) => [
                  row.reference,
                  organizationName(row.customer),
                  organizationName(row.provider),
                  formatMoney(row.total_price, row.currency ?? undefined),
                  formatPercent(row.progress_percent),
                  reportStatus(t, row.status),
                ]),
              })
            }}
          />
        }
      />
      <FilterBar>
        <SearchInput
          value={list.search}
          onChange={(value) => list.setFilter('search', value)}
          placeholder={t('common.searchReference')}
        />
        <StatusFilter
          value={list.status}
          options={statuses}
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
        rowTo={(row) => `/jobs/${row.id}`}
      />
    </>
  )
}
