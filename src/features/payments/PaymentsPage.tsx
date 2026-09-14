import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchPayments } from '@/core/api/services.ts'
import type { Payment } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { useCatalog } from '@/shared/hooks/useCatalog.ts'
import { PAYMENT_METHODS } from '@/core/constants/statuses.ts'
import { displayValue, formatDateTime, formatMoney } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

export function PaymentsPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const catalog = useCatalog()
  const statuses = catalog.data?.payment_statuses ?? ['pending', 'processing', 'completed', 'failed', 'refunded']
  const query = useQuery({
    queryKey: ['payments', list.search, list.status, list.method, list.dateFrom, list.dateTo, list.page],
    queryFn: () =>
      fetchPayments({
        search: list.search,
        status: list.status,
        method: list.method,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page: list.page,
      }),
  })

  const columns: Column<Payment>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    { id: 'amount', header: t('common.amount'), cell: (row) => formatMoney(row.amount, row.currency ?? undefined) },
    { id: 'commission', header: t('common.commission'), cell: (row) => formatMoney(row.commission_amount, row.currency ?? undefined) },
    { id: 'provider', header: t('payments.providerAmount'), cell: (row) => formatMoney(row.provider_amount, row.currency ?? undefined) },
    { id: 'method', header: t('payments.method'), cell: (row) => displayValue(row.method) },
    { id: 'gateway', header: t('payments.gateway'), cell: (row) => displayValue(row.gateway) },
    { id: 'paid', header: t('payments.paidAt'), cell: (row) => formatDateTime(row.paid_at) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <>
      <PageHeader
        title={t('payments.title')}
        subtitle={t('payments.subtitle')}
        actions={
          <DownloadReportButton
            build={async () => {
              const items = await fetchAllPages((page, perPage) =>
                fetchPayments({
                  search: list.search,
                  status: list.status,
                  method: list.method,
                  date_from: list.dateFrom,
                  date_to: list.dateTo,
                  page,
                  per_page: perPage,
                }),
              )
              return createListReport({
                title: t('payments.title'),
                subtitle: t('payments.subtitle'),
                filters: listReportFilters(t, list),
                columns: [
                  t('common.reference'),
                  t('common.amount'),
                  t('common.commission'),
                  t('payments.providerAmount'),
                  t('payments.method'),
                  t('payments.gateway'),
                  t('payments.paidAt'),
                  t('common.status'),
                ],
                rows: items.map((row) => [
                  row.reference,
                  formatMoney(row.amount, row.currency ?? undefined),
                  formatMoney(row.commission_amount, row.currency ?? undefined),
                  formatMoney(row.provider_amount, row.currency ?? undefined),
                  displayValue(row.method),
                  displayValue(row.gateway),
                  formatDateTime(row.paid_at),
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
        <StatusFilter
          value={list.method}
          options={[...PAYMENT_METHODS]}
          onChange={(value) => list.setFilter('method', value)}
          allLabel={t('common.allMethods')}
          label={(method) => t(`status.${method}`, { defaultValue: method })}
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
      />
    </>
  )
}
