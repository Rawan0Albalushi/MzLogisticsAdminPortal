import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchQuotations } from '@/core/api/services.ts'
import type { Quotation } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { useCatalog } from '@/shared/hooks/useCatalog.ts'
import { displayValue, formatMoney, organizationName } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

export function QuotationsPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const catalog = useCatalog()
  const statuses = catalog.data?.quotation_statuses ?? ['submitted', 'withdrawn', 'accepted', 'rejected', 'expired']
  const query = useQuery({
    queryKey: ['quotations', list.search, list.status, list.dateFrom, list.dateTo, list.page],
    queryFn: () =>
      fetchQuotations({
        search: list.search,
        status: list.status,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page: list.page,
      }),
  })

  const columns: Column<Quotation>[] = [
    {
      id: 'ref',
      header: t('common.reference'),
      cell: (row) => (
        <Link className="mz-link" to={`/quotations/${row.id}`}>
          {row.reference}
        </Link>
      ),
    },
    { id: 'provider', header: t('common.provider'), cell: (row) => organizationName(row.provider) },
    { id: 'price', header: t('quotations.price'), cell: (row) => formatMoney(row.total_price, row.currency ?? undefined) },
    { id: 'trucks', header: t('quotations.truckCount'), cell: (row) => displayValue(row.truck_count) },
    { id: 'trips', header: t('quotations.tripCount'), cell: (row) => displayValue(row.trip_count) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <Link className="mz-link" to={`/quotations/${row.id}`}>
          {t('common.view')}
        </Link>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={t('quotations.title')}
        subtitle={t('quotations.subtitle')}
        actions={
          <DownloadReportButton
            build={async () => {
              const items = await fetchAllPages((page, perPage) =>
                fetchQuotations({
                  search: list.search,
                  status: list.status,
                  date_from: list.dateFrom,
                  date_to: list.dateTo,
                  page,
                  per_page: perPage,
                }),
              )
              return createListReport({
                title: t('quotations.title'),
                subtitle: t('quotations.subtitle'),
                filters: listReportFilters(t, list),
                columns: [
                  t('common.reference'),
                  t('common.provider'),
                  t('quotations.price'),
                  t('quotations.truckCount'),
                  t('quotations.tripCount'),
                  t('common.status'),
                ],
                rows: items.map((row) => [
                  row.reference,
                  organizationName(row.provider),
                  formatMoney(row.total_price, row.currency ?? undefined),
                  displayValue(row.truck_count),
                  displayValue(row.trip_count),
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
        rowTo={(row) => `/quotations/${row.id}`}
      />
    </>
  )
}
